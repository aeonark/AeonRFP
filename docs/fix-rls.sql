-- ============================================================
-- AeonRFP — RLS Fix Script
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Disable RLS entirely on tenants & users (simplest fix for dev)
--    These tables don't need row-level security since the server
--    always uses the service role or anon key with no user-specific isolation.

ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. If you'd rather KEEP RLS on and add policies, use these instead:
--    (Comment out the DISABLE lines above and uncomment these)

-- Allow anyone to insert a tenant (server does this during signup/oauth)
-- CREATE POLICY "tenants_insert" ON tenants
--   FOR INSERT WITH CHECK (true);

-- Allow users to insert/upsert their own profile row
-- CREATE POLICY "users_insert_own" ON users
--   FOR INSERT WITH CHECK (true);

-- Allow users to read their own profile
-- CREATE POLICY "users_select_own" ON users
--   FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
-- CREATE POLICY "users_update_own" ON users
--   FOR UPDATE USING (auth.uid() = id);

-- 3. Also make sure the auth callback redirect URL is allowed.
--    You can't do this in SQL — go to:
--    Authentication → URL Configuration → Redirect URLs
--    Add: http://localhost:3000/auth/callback

-- 4. (Optional but recommended for dev) Turn off email confirmation:
--    Authentication → Providers → Email → toggle off "Confirm email"

SELECT 'RLS fix applied successfully' AS status;
