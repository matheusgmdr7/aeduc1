# Configuração do Supabase Storage

## Problema
O bucket `user-documents` não existe no Supabase Storage, causando erro 404 ao tentar acessar os arquivos.

## Solução

### Opção 1: Via Interface do Supabase (Recomendado)

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **Storage** no menu lateral
4. Clique em **New bucket**
5. Configure o bucket:
   - **Name**: `user-documents`
   - **Public bucket**: ✅ Marque como público (para permitir URLs públicas)
   - **File size limit**: 50 MB (ou o valor desejado)
   - **Allowed MIME types**: 
     - `image/png`
     - `image/jpeg`
     - `image/jpg`
     - `application/pdf`
6. Clique em **Create bucket**

### Opção 2: Via SQL (Usando a Migration)

1. Acesse o [SQL Editor do Supabase](https://app.supabase.com/project/_/sql)
2. Execute o arquivo `supabase/migrations/20250115000004_create_storage_buckets.sql`
3. Ou copie e cole o conteúdo do arquivo no SQL Editor e execute

### Configuração de Políticas (RLS)

Após criar o bucket, você precisa configurar as políticas de acesso. O arquivo de migration já inclui as políticas necessárias, mas você pode ajustá-las conforme necessário:

#### Políticas Incluídas:

1. **Upload de documentos**: Usuários autenticados podem fazer upload de documentos
2. **Leitura de documentos**: Usuários podem ler seus próprios documentos
3. **Atualização de documentos**: Usuários podem atualizar seus próprios documentos
4. **Exclusão de documentos**: Usuários podem excluir seus próprios documentos
5. **Acesso de admins**: Admins podem gerenciar todos os documentos
6. **Leitura pública**: Arquivos podem ser lidos publicamente (necessário para URLs públicas funcionarem)

### Verificação

Após criar o bucket, teste:

1. Faça upload de um arquivo através da aplicação
2. Verifique se o arquivo aparece no Storage do Supabase
3. Tente acessar a URL pública do arquivo

### Estrutura de Pastas

O bucket `user-documents` usa a seguinte estrutura:

```
user-documents/
├── documents/
│   ├── {timestamp}-id-document.{ext}
│   └── {timestamp}-address-document.{ext}
└── membership-forms/
    ├── membership-form-signature-{timestamp}.png
    └── ficha-cadastral-{user_id}-{timestamp}.pdf
```

### Troubleshooting

#### Erro 404 "Bucket not found"
- Verifique se o bucket foi criado corretamente
- Verifique se o nome do bucket está exatamente como `user-documents` (sem espaços, case-sensitive)

#### Erro 403 "Forbidden"
- Verifique se as políticas RLS estão configuradas corretamente
- Verifique se o bucket está marcado como público (se você quiser URLs públicas)

#### Erro ao fazer upload
- Verifique se o tamanho do arquivo está dentro do limite
- Verifique se o tipo MIME do arquivo está permitido
- Verifique se as políticas de INSERT estão configuradas

### Notas Importantes

- O bucket precisa ser **público** para que as URLs públicas funcionem
- As políticas RLS controlam quem pode acessar, fazer upload, atualizar e excluir arquivos
- Os arquivos são organizados em pastas (`documents/` e `membership-forms/`) para facilitar a organização

