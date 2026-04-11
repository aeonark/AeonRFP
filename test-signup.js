const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
    const email = 'test_signup_' + Date.now() + '@example.com';
    const password = 'Password123!';
    
    console.log('Attempting signup with', email);
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });
    
    if (error) {
        console.error('Signup error:', error.message);
    } else {
        console.log('Signup success');
        console.log('Session is null?', data.session === null);
        console.log('User:', data.user ? data.user.id : 'null');
    }
}

testSignup();
