import { createClient } from '@supabase/supabase-js';

// Use environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://teca-admin-supabase.ly7t0m.easypanel.host';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'gestao-hc' }
});

async function test() {
  console.log('Testing connection to:', supabaseUrl);
  const { data, error } = await supabase.from('hc_config').upsert({ id: 2, config_data: { test: true } }, { onConflict: 'id' }).select();
  console.log("Upserted:", data, "Error:", error);
}
test();
