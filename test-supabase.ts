import { createAdminClient } from './utils/supabase/admin';

async function testQuery() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('users').select('*').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}

testQuery();