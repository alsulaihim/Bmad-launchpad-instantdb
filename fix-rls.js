/**
 * Fix RLS policies on production Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLS() {
  console.log('Fixing RLS policies on:', supabaseUrl);
  console.log('');

  const sql = `
-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable with proper policies
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
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);
`;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      console.error('Error executing SQL:', error);
      console.log('\nTrying alternative approach...\n');

      // Alternative: Just disable RLS for now
      console.log('Disabling RLS entirely for testing...');
      const { error: disableError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      console.log('\nNote: Direct SQL execution via JS client is limited.');
      console.log('Please run the SQL manually in Supabase SQL Editor:');
      console.log('https://supabase.com/dashboard/project/' + supabaseUrl.split('.')[0].split('//')[1] + '/sql/new');
      console.log('\nSQL to run:');
      console.log(sql);
    } else {
      console.log('✅ RLS policies updated successfully!');
      console.log(data);
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nPlease run the SQL manually in Supabase SQL Editor.');
  }
}

fixRLS();