-- Run this in Supabase SQL Editor to fix RLS policies
-- https://supabase.com/dashboard/project/nlxhueovycvmfwxsxrev/sql/new

-- First, disable RLS temporarily to see if that's the issue
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Then re-enable with proper policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can update profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable read for users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON profiles;

-- Create simple, permissive policies
-- Allow users to select their own profile
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Verify the service role bypasses RLS (it should by default)
-- Run this to test:
-- SELECT * FROM profiles WHERE id = 'some-user-id';
-- (when run as service role, should return results regardless of RLS)