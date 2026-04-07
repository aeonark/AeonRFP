const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
    console.log('--- RFP DOCUMENTS ---');
    const { data: docs, error: docErr } = await supabase.from('rfp_documents').select('*').order('created_at', { ascending: false }).limit(3);
    if (docErr) console.error(docErr);
    else console.log(docs);

    console.log('\n--- CLAUSES ---');
    const { data: clauses, error: clErr } = await supabase.from('clauses').select('id, rfp_id, clause_index').order('created_at', { ascending: false }).limit(3);
    if (clErr) console.error(clErr);
    else console.log(clauses);
}

checkDb();
