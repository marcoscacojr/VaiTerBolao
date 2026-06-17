# VaiTerBolão ⚽

A private World Cup 2026 betting pool web app. Users join groups via invite code, submit score predictions for every match, and compete on a live leaderboard — fully automated by a daily Python agent that fetches official results and calculates points.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Authentication | Manual JWT — bcryptjs + jsonwebtoken |
| Automation | Python 3.11 + GitHub Actions (daily cron) |
| Results API | [football-data.org](https://www.football-data.org/) |
| Deploy | Vercel |

---

## Features

### Pages

| Page | Description |
|---|---|
| **Home** | Personalized greeting, your ranking position and points, next upcoming matches with countdown, and a mini leaderboard (top 3 + your position) |
| **Palpites** | Submit or update score predictions for any open match. Betting closes 30 minutes before kickoff. Collapsible scoring rules guide. |
| **Resultados** | View finished matches with color-coded result badges: exact score, correct winner, correct draw, or miss |
| **Ranking** | Full group leaderboard with medal icons (🥇🥈🥉) and your row highlighted |
| **Grupo** | Join a group by 6-character invite code. Admins can also create new groups. |

### Scoring system

| Result | Points |
|---|---|
| Exact score | 10 pts |
| Correct winner (wrong score) | 5 pts |
| Correct draw (wrong score) | 3 pts |
| Wrong result | 0 pts |

### Dark mode

Full light/dark theme support with system preference detection and manual toggle. Persisted via localStorage.

---

## Architecture

```
app/
├── (auth)/          # Login and registration pages
├── (app)/           # Protected app shell (home, predictions, results, ranking, group)
└── api/             # REST API routes (Next.js Route Handlers)
    ├── auth/        # login, cadastro, logout
    ├── groups/      # create group, join by code
    ├── matches/     # list matches with user predictions
    ├── predictions/ # submit/update prediction
    ├── ranking/     # group leaderboard
    ├── home/        # aggregated home data
    └── me/          # current user info
lib/
├── supabase.ts      # Supabase client (server-side only, service key)
├── auth.ts          # hashSenha, verificarSenha, gerarToken, verificarToken
├── session.ts       # getSession() reads JWT from httpOnly cookie
└── cookie.ts        # setAuthCookie, clearAuthCookie helpers
agent/
├── update_results.py   # Daily agent: fetch results, update DB, calculate points
└── popular_partidas.py # One-time script to seed World Cup matches
```

### Key design decisions

- **No Supabase Auth** — authentication is handled manually with JWT stored in a `httpOnly` cookie (`sameSite: lax`, `secure` in production).
- **Frontend never touches Supabase directly** — all database access goes through Next.js API Routes using the service key.
- **Deadline enforcement is backend-only** — the API rejects any prediction where `match.data_hora - 30 min ≤ now`.
- **Admin-only group creation** — determined by comparing `session.email` to the `ADMIN_EMAIL` environment variable.
- **Cryptographically secure invite codes** — generated with `crypto.randomBytes(3).toString('hex').toUpperCase()` (6 characters).

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/cadastro` | Register (nome, email, senha) |
| POST | `/api/auth/login` | Login, returns JWT cookie + `temGrupo` flag |
| POST | `/api/auth/logout` | Clear auth cookie |
| GET | `/api/me` | Current user info + `is_admin` flag |
| POST | `/api/groups` | Create group (admin only) |
| POST | `/api/groups/join` | Join group by invite code |
| GET | `/api/matches` | All matches with user's predictions embedded |
| POST | `/api/predictions` | Submit or update a prediction |
| GET | `/api/ranking` | Group leaderboard (aggregated points per user) |
| GET | `/api/home` | Aggregated home data (stats, next matches, mini ranking) |

---

## Automation Agent

A Python script (`agent/update_results.py`) runs every day at **08:00 BRT** via GitHub Actions.

It:
1. Calls the football-data.org API for finished World Cup matches
2. Matches teams by name to records in the database
3. Updates `matches` table with final scores and marks as `encerrado`
4. Recalculates points for every prediction on those matches using the scoring rules

```yaml
# .github/workflows/daily_agent.yml
on:
  schedule:
    - cron: '0 11 * * *'  # 08:00 Brasília (UTC-3)
  workflow_dispatch:
```

Required secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `FOOTBALL_DATA_API_KEY`

---

## Database Schema

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

## Running locally

**Prerequisites:** Node.js 20+, Python 3.11+, a Supabase project

```bash
git clone https://github.com/your-username/VaiTerBolao
cd VaiTerBolao
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=your-secret-key
ADMIN_EMAIL=you@example.com
```

```bash
npm run dev
```

To seed World Cup matches (one-time):

```bash
cd agent
pip install -r requirements.txt
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... FOOTBALL_DATA_API_KEY=... python popular_partidas.py
```

---

## License

MIT
