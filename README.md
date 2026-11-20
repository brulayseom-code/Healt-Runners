# 🌿 Health Runners — Nutrição, Movimento e Bem-Estar

Aplicativo completo de estilo de vida saudável com foco em nutrição qualitativa, hidratação, sono, atividade física e gamificação colaborativa (sem foco em perda de peso ou contagem calórica restritiva).

Desenvolvido para apresentação acadêmica e acompanhamento prático de hábitos.

---

## 🚀 Como colocar o aplicativo no ar com link permanente (Grátis por meses ou anos)

Para que todo o grupo acesse o aplicativo pelo celular e notebook com um link fixo (exemplo: `https://healthrunners.vercel.app`):

### Passo 1: Criar um banco de dados PostgreSQL gratuito (2 minutos)
1. Acesse **[neon.tech](https://neon.tech)** ou **[supabase.com](https://supabase.com)** e crie uma conta gratuita.
2. Crie um projeto chamado `health-runners`.
3. Copie a **Connection String** (URL do banco). Ela terá o formato:
   `postgresql://usuario:senha@ep-xyz.neon.tech/neondb?sslmode=require`

### Passo 2: Subir o código para o GitHub (2 minutos)
1. Acesse **[github.com](https://github.com)** e crie uma conta (caso não tenha).
2. Crie um novo repositório chamado `health-runners`.
3. Suba os arquivos desta pasta para o repositório.

### Passo 3: Publicar na Vercel (1 minuto)
1. Acesse **[vercel.com](https://vercel.com)** e entre com a sua conta do GitHub.
2. Clique em **"Add New Project"** e selecione o repositório `health-runners`.
3. Na seção **Environment Variables**, adicione (opcional se quiser sincronizar com PostgreSQL):
   - **Name:** `DATABASE_URL`
   - **Value:** (cole a URL que você copiou no Passo 1)
   *(Nota: mesmo se não configurar o banco agora, o app funciona perfeitamente com os dados de demonstração salvos no navegador!)*
4. Clique em **Deploy**.
5. Em menos de 2 minutos, a Vercel gera um link público gratuito (ex: `https://health-runners.vercel.app`) que **fica no ar pelo tempo que vocês precisarem** (1 mês, 1 ano, etc.), sem custo e sem nenhum bloqueio para abrir no celular de qualquer pessoa.

---

## 🖼️ Arquivos da Logo incluídos no projeto

A logo oficial do Health Runners já está incluída em alta resolução e pronta para uso:
- **`logo.png`** (na raiz deste projeto): imagem oficial em 512×512 com cantos transparentes, perfeita para slides, banners e relatórios do TCC.
- **`public/images/health-runners-logo.png`**: usada dentro do aplicativo.
- **`public/logo.png`**: link direto `/logo.png`.
- **`src/app/icon.png`**: ícone do aplicativo / favicon oficial para abas do navegador e atalhos de celular.

---

## 💻 Como rodar o projeto localmente no computador

Se preferir rodar no notebook para apresentar o trabalho:

1. Instale o [Node.js](https://nodejs.org/) (versão 18 ou superior).
2. Abra o terminal na pasta do projeto e execute:
   ```bash
   npm install
   ```
3. Configure a variável `DATABASE_URL` no arquivo `.env` com seu banco PostgreSQL.
4. Aplique as tabelas no banco de dados:
   ```bash
   npx drizzle-kit push
   ```
5. Inicie o servidor:
   ```bash
   npm run dev
   ```
6. Abra `http://localhost:3000` no navegador.

---

## ✨ Funcionalidades incluídas

1. **🏠 Meu dia:** Visão geral do equilíbrio diário com percentual de progresso, missão do dia e 6 pilares integrados.
2. **🥗 Nutrição de Qualidade:** Diário alimentar qualitativo (proteínas, frutas, vegetais, carboidratos, gorduras boas) e o Desafio do Prato Colorido (5 grupos de cores).
3. **💧 Hidratação:** Copo interativo, registros rápidos (250 ml, 500 ml), acompanhamento de metas e sequência em dias.
4. **🏋️ Movimento:** Registros de atividades físicas com tempo em minutos, apoio ao descanso e cálculo automático de pontos.
5. **😴 Sono & Bem-Estar:** Duração e qualidade do sono em estrelas, humor diário, bateria de energia e nível de estresse.
6. **🎯 Desafios pré-definidos e personalizados:** Além dos desafios sugeridos, qualquer participante pode criar desafios próprios com metas customizadas.
7. **👥 Grupos e Ranking:** Crie grupos entre amigas ou turma, compartilhe código de convite e acompanhe o ranking de HealthPoints com opção de sair do grupo quando quiser.
8. **📷 Foto de perfil:** Envio e corte de foto com prévia e suporte a arquivos de até 15 MB.
9. **👤 Contas com E-mail e Senha:** Sincronização automática entre celular e computador, mantendo modo visitante para quem quiser testar sem cadastro.
