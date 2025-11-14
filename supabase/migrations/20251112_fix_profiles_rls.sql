-- Fix profiles table RLS policies to allow service role to insert/update

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can update profiles" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Allow service role to insert profiles (for auto-creation)
CREATE POLICY "Service role can insert profiles"
ON profiles FOR INSERT
WITH CHECK (true);

-- Allow service role to update profiles
CREATE POLICY "Service role can update profiles"
ON profiles FOR UPDATE
USING (true);
