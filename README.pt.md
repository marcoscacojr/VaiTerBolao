# VaiTerBolão ⚽

Um bolão privado para a Copa do Mundo 2026. Os usuários entram em grupos pelo código de convite, fazem palpites de placar para cada partida e disputam um ranking ao vivo — tudo atualizado automaticamente por um agente Python diário que busca os resultados oficiais e calcula os pontos.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend + Backend | Next.js 16 (App Router) |
| Estilização | Tailwind CSS v4 |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | JWT manual — bcryptjs + jsonwebtoken |
| Automação | Python 3.11 + GitHub Actions (cron diário) |
| API de resultados | [football-data.org](https://www.football-data.org/) |
| Deploy | Vercel |

---

## Funcionalidades

### Páginas

| Página | Descrição |
|---|---|
| **Home** | Saudação personalizada, sua posição e pontuação no ranking, próximos jogos com contagem regressiva e mini ranking (top 3 + sua posição) |
| **Palpites** | Faça ou atualize palpites de placar. Fecha 30 minutos antes do jogo. Tabela de pontuação recolhível. |
| **Resultados** | Jogos encerrados com badges coloridos: placar exato, vencedor certo, empate certo ou erro |
| **Ranking** | Tabela completa do grupo com medalhas 🥇🥈🥉 e sua linha destacada |
| **Grupo** | Entre em um grupo pelo código de convite de 6 caracteres. Admins também podem criar grupos. |

### Sistema de pontuação

| Resultado | Pontos |
|---|---|
| Placar exato | 10 pts |
| Acertou o vencedor (placar errado) | 5 pts |
| Acertou o empate (placar errado) | 3 pts |
| Errou o resultado | 0 pts |

### Dark mode

Suporte completo a tema claro/escuro com detecção da preferência do sistema e alternância manual. Persiste via localStorage.

---

## Arquitetura

```
app/
├── (auth)/          # Páginas de login e cadastro
├── (app)/           # Shell protegido (home, palpites, resultados, ranking, grupo)
└── api/             # API Routes do Next.js
    ├── auth/        # login, cadastro, logout
    ├── groups/      # criar grupo, entrar por código
    ├── matches/     # listar partidas com palpites do usuário
    ├── predictions/ # salvar/atualizar palpite
    ├── ranking/     # ranking do grupo
    ├── home/        # dados agregados da home
    └── me/          # dados do usuário atual
lib/
├── supabase.ts      # Cliente Supabase (só no servidor, com service key)
├── auth.ts          # hashSenha, verificarSenha, gerarToken, verificarToken
├── session.ts       # getSession() lê o JWT do cookie httpOnly
└── cookie.ts        # helpers setAuthCookie e clearAuthCookie
agent/
├── update_results.py   # Agente diário: busca resultados, atualiza banco, calcula pontos
└── popular_partidas.py # Script único para popular as partidas da Copa
```

### Decisões de arquitetura

- **Sem Supabase Auth** — autenticação feita manualmente com JWT em cookie `httpOnly` (`sameSite: lax`, `secure` em produção).
- **Frontend nunca acessa o Supabase diretamente** — todo acesso ao banco passa pelas API Routes do Next.js, que ficam no servidor com a service key.
- **Validação do prazo só no backend** — a API rejeita qualquer palpite onde `data_hora do jogo - 30 min ≤ agora`.
- **Criação de grupo restrita ao admin** — verificado comparando `session.email` com a variável de ambiente `ADMIN_EMAIL`.
- **Códigos de convite seguros** — gerados com `crypto.randomBytes(3).toString('hex').toUpperCase()` (6 caracteres).

---

## Referência da API

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/cadastro` | Cadastro (nome, email, senha) |
| POST | `/api/auth/login` | Login — retorna cookie JWT + flag `temGrupo` |
| POST | `/api/auth/logout` | Limpa o cookie de autenticação |
| GET | `/api/me` | Dados do usuário atual + flag `is_admin` |
| POST | `/api/groups` | Cria grupo (somente admin) |
| POST | `/api/groups/join` | Entra no grupo pelo código |
| GET | `/api/matches` | Lista partidas com os palpites do usuário |
| POST | `/api/predictions` | Salva ou atualiza um palpite |
| GET | `/api/ranking` | Ranking do grupo (pontos agregados por usuário) |
| GET | `/api/home` | Dados agregados da home (stats, próximos jogos, mini ranking) |

---

## Agente de automação

Um script Python (`agent/update_results.py`) roda todo dia às **08:00 (horário de Brasília)** via GitHub Actions.

O que ele faz:
1. Consulta a API do football-data.org buscando partidas encerradas da Copa
2. Cruza os times por nome com os registros no banco
3. Atualiza a tabela `matches` com os placares finais e marca como `encerrado`
4. Recalcula os pontos de cada palpite usando as regras de pontuação

```yaml
# .github/workflows/daily_agent.yml
on:
  schedule:
    - cron: '0 11 * * *'  # 08:00 Brasília (UTC-3)
  workflow_dispatch:
```

Secrets necessários: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `FOOTBALL_DATA_API_KEY`

---

## Schema do banco

```sql
users         (id, nome, email, senha_hash, created_at)
groups        (id, nome, codigo, admin_id, created_at)
group_members (group_id, user_id, joined_at)
matches       (id, fase, grupo, time_casa, time_fora, data_hora,
               placar_casa, placar_fora, encerrado)
predictions   (id, user_id, match_id, group_id,
               palpite_casa, palpite_fora, pontos, created_at)
```

---

## Rodando localmente

**Pré-requisitos:** Node.js 20+, Python 3.11+, um projeto no Supabase

```bash
git clone https://github.com/seu-usuario/VaiTerBolao
cd VaiTerBolao
npm install
```

Crie o arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=sua-chave-secreta
ADMIN_EMAIL=voce@exemplo.com
```

```bash
npm run dev
```

Para popular as partidas da Copa (executar uma vez):

```bash
cd agent
pip install -r requirements.txt
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... FOOTBALL_DATA_API_KEY=... python popular_partidas.py
```

---

## Licença

MIT
