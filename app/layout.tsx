import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
})

export const metadata: Metadata = {
    title: 'AeonRFP — AI-Powered RFP Intelligence',
    description:
        'Enterprise AI platform for intelligent RFP response generation, clause matching, and proposal analytics.',
    keywords: ['RFP', 'AI', 'proposal', 'enterprise', 'intelligence', 'SaaS'],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.variable} font-sans antialiased`}>
                {children}
            </body>
        </html>
    )
}
