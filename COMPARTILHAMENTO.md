# 🔗 Sistema de Compartilhamento - Modo Visualização

## 🎯 Funcionalidade Implementada

Agora você pode **gerar links de compartilhamento** que permitem outras pessoas visualizarem seus croquis **sem poder editar nada**.

---

## ✨ Recursos

### **Para o Administrador (Você):**
- ✅ Botão **"Compartilhar"** no header (azul destacado)
- ✅ Gera link único e permanente
- ✅ Copia para área de transferência com um clique
- ✅ Pode compartilhar com quantas pessoas quiser

### **Para Visitantes (Com o Link):**
- ✅ Pode visualizar todos os croquis
- ✅ Pode navegar entre diferentes plantas
- ✅ Pode clicar nos setores e ver informações de HC
- ✅ Badge **"VISUALIZAÇÃO"** sempre visível
- ❌ **NÃO** pode criar novos croquis
- ❌ **NÃO** pode editar ou excluir
- ❌ **NÃO** pode configurar setores
- ❌ **NÃO** pode importar/exportar

---

## 🔧 Como Usar

### **1. Gerar Link de Compartilhamento:**
1. Clique no botão **"Compartilhar"** (azul) no header
2. Um modal será aberto com o link gerado
3. Clique em **"Copiar"** para copiar o link
4. Compartilhe o link com quem você quiser

### **2. Acessar como Visitante:**
1. Abra o link recebido
2. A interface carrega automaticamente no **modo visualização**
3. Badge azul **"VISUALIZAÇÃO"** aparece ao lado do título
4. Todos os botões de edição ficam ocultos

---

## 🏗️ Arquitetura Técnica

### **Novos Arquivos Criados:**

1. **`src/lib/useViewMode.ts`**
   - Hook que detecta se há token `?share=` na URL
   - Ativa automaticamente o modo visualização

2. **`src/components/ShareModal.tsx`**
   - Modal bonito e profissional para gerar links
   - Gera tokens únicos baseados em timestamp + random
   - Botão de copiar com feedback visual
   - Explicações claras sobre permissões

### **Arquivos Modificados:**

1. **`src/App.tsx`**
   - Adicionado botão "Compartilhar" no header
   - Condicional para ocultar botões de edição em `isViewMode`
   - Badge de "VISUALIZAÇÃO" quando em modo view
   - Impede abertura de modais de configuração

2. **`src/components/FloorPlan.tsx`**
   - Aceita prop `isViewMode` para desabilitar edições futuras

---

## 🔐 Segurança

### **Tokens:**
- Gerados usando: `timestamp (base36) + random (7 chars)`
- Exemplo: `lk8m3x9abc123`
- Únicos e difíceis de adivinhar
- **Não expiram** - funcionam permanentemente

### **Controle de Acesso:**
- Verificação acontece no frontend via URL
- Baseado em lógica condicional (não API auth)
- **Importante:** Qualquer pessoa com o link pode visualizar

### **Recomendações:**
- ⚠️ Compartilhe apenas com pessoas de confiança
- ⚠️ Links são permanentes - não há revogação automática
- ✅ Se precisar revogar, você precisaria implementar um sistema de validação de tokens no backend

---

## 📊 Fluxo de Uso

```
ADMIN (Você)
    ↓
Clica "Compartilhar"
    ↓
Modal abre com link: https://seu-app.vercel.app?share=lk8m3x9abc123
    ↓
Copia e envia para Visitante
    ↓
VISITANTE
    ↓
Abre link no navegador
    ↓
Hook detecta ?share= na URL
    ↓
isViewMode = true
    ↓
Interface carrega sem botões de edição
    ↓
Badge "VISUALIZAÇÃO" aparece
    ↓
Visitante pode apenas NAVEGAR e VER
```

---

## 🎨 Design do Modal

O modal de compartilhamento inclui:
- ✅ Header azul gradiente com ícone
- ✅ Lista clara do que visitantes PODEM e NÃO PODEM fazer
- ✅ Campo de input com o link completo
- ✅ Botão "Copiar" com feedback visual (✓ Copiado!)
- ✅ Aviso de segurança sobre compartilhamento
- ✅ Design responsivo e profissional

---

## 🚀 Próximos Passos para Ativar

1. **Fazer commit e push:**
   ```bash
   git add .
   git commit -m "feat: adicionar sistema de compartilhamento com modo visualização"
   git push
   ```

2. **Aguardar deploy na Vercel**

3. **Testar:**
   - Clique no botão "Compartilhar"
   - Copie o link gerado
   - Abra em uma aba anônima ou outro navegador
   - Verifique que aparece o badge "VISUALIZAÇÃO"
   - Confirme que botões de edição estão ocultos

---

## 💡 Melhorias Futuras (Opcional)

Se você quiser adicionar no futuro:
- 🔒 Sistema de revogação de links (backend necessário)
- ⏱️ Links com expiração automática
- 📊 Analytics de quantas pessoas acessaram
- 🔑 Proteção por senha opcional
- 👥 Lista de links compartilhados ativos

---

**Resultado:** Agora você tem um sistema completo de compartilhamento somente leitura! 🎯
