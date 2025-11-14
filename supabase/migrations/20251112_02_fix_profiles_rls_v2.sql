-- Fix profiles table RLS policies - More permissive version
-- Service role should bypass RLS, but adding explicit policies just in case

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can update profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable read for users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own profile
CREATE POLICY "Enable insert for authenticated users"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY "Enable read for users"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Service role bypasses RLS by default, but let's be explicit
-- Allow service role to do everything
CREATE POLICY "Service role full access"
ON profiles
TO service_role
USING (true)
WITH CHECK (true);