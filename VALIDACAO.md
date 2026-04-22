# ✅ Validação Pré-Deploy - Gestão HC

## 🔍 Checklist de Validação

### ✅ Variáveis de Ambiente Vercel
- `VITE_SUPABASE_URL` = https://teca-admin-supabase.ly7t0m.easypanel.host
- `VITE_SUPABASE_ANON_KEY` = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- `VITE_SUPABASE_SCHEMA` = gestao-hc

### ✅ Arquivo .env.local
```env
VITE_SUPABASE_URL=https://teca-admin-supabase.ly7t0m.easypanel.host
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SCHEMA=gestao-hc
```

### ✅ src/lib/supabase.ts
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'public'
```

### ✅ Arquivos Corrigidos
- ✅ `src/lib/checkSupabase.ts` - Atualizado para usar variáveis de ambiente
- ✅ `test_db.ts` - Atualizado para usar variáveis de ambiente
- ✅ Todas as referências ao Supabase oficial removidas

## 🚀 Próximos Passos

1. **Commit e Push:**
   ```bash
   git add .
   git commit -m "fix: configurar Supabase self-hosted no Vite"
   git push
   ```

2. **Deploy Automático:** A Vercel vai detectar o push e fazer o deploy

3. **Verificar Deploy:** Abrir o console do navegador (F12) após o deploy

## 🔧 Se Ainda Houver Problemas

### CORS no Easypanel
Se o app ainda não conectar, configure CORS no Supabase:
1. Acesse o Easypanel
2. Vá no serviço Supabase
3. Adicione nas variáveis de ambiente:
   ```
   CORS_ALLOWED_ORIGINS=https://gestao-em2q7f1jv-corpteca-s-projects.vercel.app,http://localhost:3000
   ```

### Verificar Schema
Confirme que as tabelas estão no schema correto:
```sql
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'gestao-hc';
```
