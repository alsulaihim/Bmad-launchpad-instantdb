/**
 * Script to create profiles for existing users
 * Run with: node fix-existing-users.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixExistingUsers() {
  console.log('Checking for users without profiles...\n');

  try {
    // Get all users from auth
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    console.log(`Found ${users.length} total users\n`);

    // Get all existing profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }

    const existingProfileIds = new Set(profiles.map(p => p.id));

    // Find users without profiles
    const usersWithoutProfiles = users.filter(user => !existingProfileIds.has(user.id));

    console.log(`Found ${usersWithoutProfiles.length} users without profiles:\n`);

    if (usersWithoutProfiles.length === 0) {
      console.log('✅ All users have profiles!');
      return;
    }

    // Create profiles for users without them
    for (const user of usersWithoutProfiles) {
      console.log(`Creating profile for: ${user.email} (${user.id})`);

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error(`  ❌ Error creating profile: ${insertError.message}`);
      } else {
        console.log(`  ✅ Profile created successfully`);
      }
    }

    console.log('\n✅ All done!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixExistingUsers();