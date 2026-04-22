// Test Supabase connection using environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
} else {
  console.log('✅ Supabase URL:', supabaseUrl)
  console.log('✅ Testing connection...')
  
  fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`)
    .then(res => res.json())
    .then(data => console.log('✅ Connection successful:', JSON.stringify(data, null, 2)))
    .catch(err => console.error('❌ Connection failed:', err))
}
