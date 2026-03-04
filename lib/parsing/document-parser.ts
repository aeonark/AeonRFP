/**
 * Document Parser — Real Text Extraction
 * Supports PDF, DOCX, and XLSX file formats.
 *
 * PDF  → pdf-parse
 * DOCX → mammoth
 * XLSX → xlsx (SheetJS)
 */

import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

// ============================================
// Types
// ============================================

export type SupportedFileType = 'pdf' | 'docx' | 'xlsx'

export interface ParseResult {
    text: string
    pageCount?: number
    metadata?: Record<string, unknown>
}

export interface ClauseBlock {
    text: string
    index: number
    source: 'heading' | 'numbered' | 'bullet' | 'paragraph'
}

// ============================================
// File Type Detection
// ============================================

/**
 * Detect file type from the file URL or name.
 * Falls back to extension-based detection.
 */
export function detectFileType(fileUrl: string): SupportedFileType | null {
    const url = fileUrl.toLowerCase()

    if (url.endsWith('.pdf')) return 'pdf'
    if (url.endsWith('.docx')) return 'docx'
    if (url.endsWith('.xlsx') || url.endsWith('.xls')) return 'xlsx'

    // Check MIME-style hints in URLs
    if (url.includes('application/pdf')) return 'pdf'
    if (url.includes('wordprocessingml')) return 'docx'
    if (url.includes('spreadsheetml')) return 'xlsx'

    return null
}

// ============================================
// Text Extraction
// ============================================

/**
 * Extract text from a file buffer based on its type.
 */
export async function extractTextFromBuffer(
    buffer: Buffer,
    fileType: SupportedFileType
): Promise<ParseResult> {
    switch (fileType) {
        case 'pdf':
            return extractFromPDF(buffer)
        case 'docx':
            return extractFromDOCX(buffer)
        case 'xlsx':
            return extractFromXLSX(buffer)
        default:
            throw new Error(`Unsupported file type: ${fileType}`)
    }
}

/**
 * PDF extraction via pdf-parse v2 (PDFParse class).
 */
async function extractFromPDF(buffer: Buffer): Promise<ParseResult> {
    const parser = new PDFParse({ data: new Uint8Array(buffer) })

    try {
        const textResult = await parser.getText()
        const info = await parser.getInfo()

        return {
            text: textResult.text || '',
            pageCount: info.total,
            metadata: {
                title: info.info?.Title,
                author: info.info?.Author,
            },
        }
    } finally {
        await parser.destroy()
    }
}

/**
 * DOCX extraction via mammoth.
 * Extracts raw text (no HTML formatting).
 */
async function extractFromDOCX(buffer: Buffer): Promise<ParseResult> {
    const result = await mammoth.extractRawText({ buffer })

    return {
        text: result.value || '',
        metadata: {
            messages: result.messages,
        },
    }
}

/**
 * XLSX extraction via SheetJS.
 * Reads all sheets and concatenates cell values as text.
 */
async function extractFromXLSX(buffer: Buffer): Promise<ParseResult> {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const textParts: string[] = []

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName]
        if (!sheet) continue

        textParts.push(`--- Sheet: ${sheetName} ---`)

        // Convert sheet to array of arrays for row-by-row reading
        const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })

        for (const row of rows) {
            const rowText = (row as unknown[])
                .filter((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
                .map((cell) => String(cell).trim())
                .join(' | ')

            if (rowText.length > 0) {
                textParts.push(rowText)
            }
        }

        textParts.push('') // blank line between sheets
    }

    return {
        text: textParts.join('\n'),
        metadata: {
            sheetCount: workbook.SheetNames.length,
            sheetNames: workbook.SheetNames,
        },
    }
}

// ============================================
// Clause Splitting
// ============================================

/**
 * Minimum character threshold for a valid clause.
 * Anything shorter is likely a heading or fragment.
 */
const MIN_CLAUSE_LENGTH = 30

/**
 * Maximum character threshold — overly long blocks get split at paragraphs.
 */
const MAX_CLAUSE_LENGTH = 3000

/**
 * Split extracted text into logical clause blocks.
 *
 * Strategy (in priority order):
 *   1. Numbered section headings (1., 1.1, 2.3.1, etc.)
 *   2. Lettered/roman subsections (a), b), i., ii.)
 *   3. Bullet points (-, *, •)
 *   4. Paragraph blocks separated by blank lines
 *   5. Fallback: split on double-newlines
 *
 * Short fragments that follow a heading are merged into the heading clause.
 */
export function splitIntoClauses(rawText: string): ClauseBlock[] {
    if (!rawText || rawText.trim().length === 0) {
        return []
    }

    const text = normalizeExtractedText(rawText)
    const blocks: ClauseBlock[] = []
    let clauseIndex = 0

    // Primary split: numbered sections (1., 1.1, 2.3.1, A.1, etc.)
    const sectionPattern = /\n(?=\s*(?:\d+\.[\d.]*|[A-Z]\.[\d.]*)\s+[A-Z])/g
    const sections = text.split(sectionPattern)

    for (const section of sections) {
        const trimmed = section.trim()
        if (trimmed.length < MIN_CLAUSE_LENGTH) continue

        // Check if this section is too long and needs sub-splitting
        if (trimmed.length > MAX_CLAUSE_LENGTH) {
            const subClauses = splitLargeBlock(trimmed)
            for (const sub of subClauses) {
                if (sub.trim().length >= MIN_CLAUSE_LENGTH) {
                    clauseIndex++
                    blocks.push({
                        text: sub.trim(),
                        index: clauseIndex,
                        source: detectClauseSource(sub),
                    })
                }
            }
        } else {
            clauseIndex++
            blocks.push({
                text: trimmed,
                index: clauseIndex,
                source: detectClauseSource(trimmed),
            })
        }
    }

    // If section splitting produced nothing useful, fall back to paragraph splitting
    if (blocks.length <= 1) {
        return splitByParagraphs(text)
    }

    return blocks
}

/**
 * Fallback: split by paragraph breaks (double newlines).
 */
function splitByParagraphs(text: string): ClauseBlock[] {
    const paragraphs = text.split(/\n\s*\n/)
    const blocks: ClauseBlock[] = []
    let clauseIndex = 0

    for (const para of paragraphs) {
        const trimmed = para.trim()
        if (trimmed.length < MIN_CLAUSE_LENGTH) continue

        if (trimmed.length > MAX_CLAUSE_LENGTH) {
            const subClauses = splitLargeBlock(trimmed)
            for (const sub of subClauses) {
                if (sub.trim().length >= MIN_CLAUSE_LENGTH) {
                    clauseIndex++
                    blocks.push({
                        text: sub.trim(),
                        index: clauseIndex,
                        source: 'paragraph',
                    })
                }
            }
        } else {
            clauseIndex++
            blocks.push({
                text: trimmed,
                index: clauseIndex,
                source: detectClauseSource(trimmed),
            })
        }
    }

    return blocks
}

/**
 * Split an oversized block at sentence boundaries or bullet points.
 */
function splitLargeBlock(text: string): string[] {
    // Try splitting at bullet points first
    const bulletSplit = text.split(/\n\s*(?=[•\-*]\s)/)
    if (bulletSplit.length > 1 && bulletSplit.every((b) => b.length < MAX_CLAUSE_LENGTH)) {
        return bulletSplit
    }

    // Try splitting at sub-section numbers within the block
    const subSectionSplit = text.split(/\n(?=\s*\d+\.\d+\s)/)
    if (subSectionSplit.length > 1) {
        return subSectionSplit
    }

    // Last resort: split at paragraph breaks within the block
    const paraSplit = text.split(/\n\s*\n/)
    if (paraSplit.length > 1) {
        return paraSplit
    }

    // If nothing works, return as-is (will be truncated at normalization)
    return [text]
}

/**
 * Detect the source type of a clause for metadata.
 */
function detectClauseSource(text: string): ClauseBlock['source'] {
    const firstLine = text.split('\n')[0].trim()

    if (/^\d+\.[\d.]*\s/.test(firstLine)) return 'numbered'
    if (/^[A-Z]\.[\d.]*\s/.test(firstLine)) return 'numbered'
    if (/^[a-z]\)\s/.test(firstLine)) return 'numbered'
    if (/^(?:i{1,3}|iv|vi{0,3}|ix|x)[.)]\s/i.test(firstLine)) return 'numbered'
    if (/^[•\-*]\s/.test(firstLine)) return 'bullet'
    if (/^(?:section|article|part|chapter)\s+\d/i.test(firstLine)) return 'heading'

    return 'paragraph'
}

// ============================================
// Text Normalization
// ============================================

/**
 * Clean up raw extracted text before clause splitting.
 * Handles common extraction artifacts.
 */
function normalizeExtractedText(text: string): string {
    let cleaned = text

    // Fix common PDF extraction artifacts
    // Merge hyphenated line breaks (e.g., "compli-\nance" → "compliance")
    cleaned = cleaned.replace(/(\w)-\n(\w)/g, '$1$2')

    // Remove page numbers and headers/footers (common patterns)
    cleaned = cleaned.replace(/\n\s*(?:Page\s+)?\d+\s*(?:of\s+\d+)?\s*\n/gi, '\n')

    // Remove excessive blank lines (more than 2 → 2)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

    // Remove trailing whitespace on each line
    cleaned = cleaned.replace(/[ \t]+$/gm, '')

    // Remove form feed characters
    cleaned = cleaned.replace(/\f/g, '\n\n')

    // Normalize unicode quotes and dashes
    cleaned = cleaned.replace(/[\u2018\u2019]/g, "'")
    cleaned = cleaned.replace(/[\u201C\u201D]/g, '"')
    cleaned = cleaned.replace(/[\u2013\u2014]/g, '-')
    cleaned = cleaned.replace(/\u2026/g, '...')

    return cleaned.trim()
}
