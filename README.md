# DNA ReproBull

Sistema interno de gestão do time de vendas da ReproBull — Programa DNA ReproBull.

## Como publicar (sem usar terminal nem Claude Code)

### 1. Suba este código pro GitHub
No repositório vazio que você já criou (`dnareprobull`), abra a página no site do
GitHub, clique em **"Add file" > "Upload files"**, arraste TODOS os arquivos e
pastas deste projeto (exceto a pasta `node_modules`, se existir) e clique em
**"Commit changes"**.

### 2. Importe o projeto na Vercel
No site da Vercel, clique em **"Add New" > "Project"**, selecione o repositório
`dnareprobull` que você acabou de subir, e clique em **"Import"**.

### 3. Crie o banco de dados
Ainda na Vercel, antes de finalizar o deploy (ou depois, em **Storage**), clique
em **"Create Database" > "Postgres"**. A Vercel conecta automaticamente a
variável `DATABASE_URL` ao projeto — você não precisa copiar nada manualmente.

### 4. Configure as outras variáveis de ambiente
Em **Project Settings > Environment Variables**, adicione:

| Nome | Valor |
|---|---|
| `NEXTAUTH_SECRET` | Gere um valor em https://generate-secret.vercel.app/32 e cole aqui |
| `NEXTAUTH_URL` | A URL do seu projeto, ex: `https://dna-reprobull.vercel.app` |
| `SETUP_KEY` | Uma senha que você escolhe, só pra você (ex: `reprobull-setup-2026`) |

### 5. Clique em Deploy
A Vercel instala tudo, prepara o banco de dados e publica o site automaticamente.

### 6. Crie os 5 usuários (só na primeira vez)
Depois que o deploy terminar, abra no navegador:

```
https://SEU-DOMINIO.vercel.app/api/setup?key=SUA_SETUP_KEY
```

(troque `SEU-DOMINIO` pela URL real do seu projeto e `SUA_SETUP_KEY` pelo valor
que você colocou no passo 4). Isso cria os 5 logins:

| Nome | E-mail | Senha inicial |
|---|---|---|
| Marcos Guerra (admin) | marcosguerra@reprobull.com | reprobull2026 |
| Ludimila Cardoso | ludimila@reprobull.com | reprobull2026 |
| Aline Marques | aline@reprobull.com | reprobull2026 |
| Julia Fausto | julia@reprobull.com | reprobull2026 |
| Igor Costa | igor@reprobull.com | reprobull2026 |

**Importante**: essa senha é a mesma pra todo mundo no começo. Ainda não existe
uma tela de "trocar senha" nesta primeira versão — se quiser, é só pedir que eu
adiciono numa próxima etapa.

### 7. Pronto
Acesse a URL do seu projeto, faça login com um dos e-mails acima, e o sistema já
está funcionando com banco de dados real — nada se perde de uma sessão pra outra.

## O que já está implementado

- Login por e-mail/senha para os 5 usuários, com Marcos Guerra como único admin
- Cadastro completo de cliente (todos os campos da ficha de inscrição ReproBull)
- Botão de excluir cliente
- Registro de venda com comissão calculada automaticamente (nunca digitada à mão)
- Botão de cancelar venda (recalcula comissão, total e DNA automaticamente)
- Sistema de DNA ReproBull completo (8 níveis) com progresso visual
- Aba "Visão geral": ranking do time, trilha de DNA, contadores de vagas
  (Dominando de setembro e Imersão de novembro), indicador de meta dupla
- Painel do admin: configurar preço/comissão de cada curso, zerar histórico
  de vendas de todo o time (mantendo os clientes cadastrados)

## O que ainda não está implementado (próximos passos possíveis)

- Tela de troca de senha
- Dashboard semanal de prospecção/conversão
- Preço e comissão de Power Vet, Transferência de Embriões e Imersão ainda
  estão zerados — configure em **Admin > Cursos** antes de vender esses cursos
- Requisitos não-financeiros do DNA 7 (palestrar na Imersão, criar infoproduto,
  mentorar) e o percentual do DNA 8 (Sócio ReproBull) são apenas texto — não há
  fluxo de aprovação manual desses marcos ainda
