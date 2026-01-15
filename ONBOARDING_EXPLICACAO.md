# 📋 Explicação do Fluxo de Onboarding de Cadastro de Associado

## 🎯 Visão Geral

O onboarding é o processo completo de cadastro de um novo associado na AEDUC, desde o registro inicial até a ativação completa da conta com acesso a todos os benefícios.

## 🔄 Fluxo Completo (4 Etapas)

### **Etapa 1: Registro Inicial (`/register`)**

**O que acontece:**
1. Usuário preenche formulário com:
   - Nome completo
   - CPF
   - Email
   - Telefone
   - Data de nascimento
   - Profissão
   - Senha

2. Sistema cria:
   - ✅ Usuário em `auth.users` (autenticação do Supabase)
   - ✅ Perfil em `profiles` com:
     - `payment_complete: false` (inicialmente pendente)
     - `registration_date` (data de registro)
     - `display_id` (ID curto para exibição, ex: "AE-12345")

3. Redireciona para `/onboarding`

---

### **Etapa 2: Upload de Documentos (`/onboarding` - etapa "documents")**

**O que acontece:**
1. Usuário faz upload de:
   - 📄 Documento de identificação (RG, CNH, etc.)
   - 🏠 Comprovante de residência

2. Sistema salva:
   - URLs dos documentos na tabela `onboarding`
   - `id_document_url`
   - `address_document_url`

3. Avança automaticamente para etapa de pagamento

---

### **Etapa 3: Pagamento (`/onboarding` - etapa "payment")**

**O que acontece:**
1. Usuário escolhe forma de pagamento:
   - 💳 Cartão de crédito
   - 📱 PIX
   - 🧾 Boleto

2. Sistema processa pagamento:
   - Integração com Asaas (gateway de pagamento)
   - Salva `payment_id` na tabela `onboarding`
   - Para PIX/Boleto: verifica status periodicamente até confirmação

3. Após confirmação do pagamento, avança para assinatura

---

### **Etapa 4: Assinatura Digital (`/onboarding` - etapa "signature")**

**O que acontece:**
1. Usuário assina digitalmente a ficha de adesão

2. Sistema salva:
   - `signature_url` na tabela `onboarding`
   - `completed_at` (data de conclusão)

3. **ATIVAÇÃO FINAL:**
   - ✅ Atualiza `profiles.payment_complete = true`
   - ✅ Define `profiles.activation_date`
   - ✅ Atualiza contexto de autenticação

4. Redireciona para `/dashboard` com acesso completo

---

## 📊 Estrutura de Dados

### Tabela `profiles`
- Armazena dados do associado
- `payment_complete`: controla acesso ao dashboard
- `display_id`: ID curto para exibição

### Tabela `onboarding`
- Armazena progresso do onboarding
- `user_id`: referência ao associado
- `id_document_url`: documento de identificação
- `address_document_url`: comprovante de residência
- `payment_id`: ID do pagamento processado
- `signature_url`: assinatura digital
- `completed_at`: data de conclusão

---

## 🔐 Controle de Acesso

### Antes do Onboarding Completo:
- ❌ Não pode acessar `/dashboard` completo
- ✅ Pode acessar `/onboarding` para completar cadastro
- ⚠️ Dashboard redireciona para onboarding se `payment_complete = false`

### Após Onboarding Completo:
- ✅ Acesso completo ao `/dashboard`
- ✅ Visualiza carteirinha digital
- ✅ Acessa benefícios
- ✅ Visualiza documentos enviados

---

## 🛠️ Funcionalidades Administrativas

### Na aba "Associados" do Admin:
- Ver todos os associados cadastrados
- Editar dados de associados
- Ativar/desativar associados
- Exportar lista de associados

### Na aba "Usuários Órfãos":
- Identificar usuários sem perfil
- Corrigir usuários órfãos criando perfis faltantes

---

## ⚠️ Observações Importantes

1. **Registro vs Onboarding:**
   - Registro cria a conta básica
   - Onboarding completa o cadastro e ativa a associação

2. **Estado do Associado:**
   - `payment_complete = false`: Cadastro incompleto
   - `payment_complete = true`: Associado ativo

3. **Retomada de Onboarding:**
   - Sistema detecta em qual etapa o usuário parou
   - Permite continuar de onde parou

4. **Bypass Administrativo:**
   - Admin pode criar associados pulando onboarding
   - Define `skipOnboarding = true` no registro

