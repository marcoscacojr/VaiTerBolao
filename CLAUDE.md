# Bolão Copa 2026 — contexto do projeto

## O que é
Web app de bolão para a Copa do Mundo 2026. Grupos privados por código de convite, sem monetização. Desenvolvido em português.

## Stack definida
- **Frontend/Backend:** Next.js 16 (App Router) + Tailwind CSS
- **Banco:** Supabase (PostgreSQL) — projeto já criado na região São Paulo
- **Auth:** JWT manual com bcryptjs + jsonwebtoken — **NÃO usar Supabase Auth**
- **Agente:** Script Python rodando via GitHub Actions todo dia às 23h (horário de Brasília)
- **API de resultados:** football-data.org
- **Deploy:** Vercel

> **Atenção Next.js 16:** APIs, convenções e estrutura de arquivos mudaram em relação a versões anteriores. Consulte `node_modules/next/dist/docs/` antes de escrever código. Fique atento a deprecation notices.

## Decisões importantes já tomadas
- Sem Supabase Auth (trava em desenvolvimento) — auth feito manualmente
- Sem monetização no MVP
- Só Copa do Mundo 2026 (sem outros campeonatos por enquanto)
- Só grupos privados (código de convite)
- Idioma: português apenas
- O frontend NUNCA acessa o Supabase diretamente — sempre via API Routes do Next.js
- A service key do Supabase fica só no servidor
- Usuário participa de apenas 1 grupo (uso interno — pessoal do trabalho)
- Fechamento de palpites validado **só no backend**: rejeita palpite se `data_hora do jogo - 30min <= agora` (comparação simples de datas, sem lógica no frontend)
- `SUPABASE_SERVICE_KEY` precisa ser registrada como secret no GitHub Actions para o agente Python funcionar

## Banco de dados — tabelas já criadas no Supabase

```sql
users (id, nome, email, senha_hash, created_at)
groups (id, nome, codigo, admin_id, created_at)
group_members (group_id, user_id, joined_at)
matches (id, fase, grupo, time_casa, time_fora, data_hora, placar_casa, placar_fora, encerrado)
predictions (id, user_id, match_id, group_id, palpite_casa, palpite_fora, pontos, created_at)
```

### Observações sobre o schema
- `matches.grupo` (ex: "A", "B"…) é relevante só na fase de grupos; fica nulo na fase eliminatória. `matches.fase` controla em qual etapa o jogo está (`grupos`, `oitavas`, `quartas`, `semi`, `final`).
- `predictions.group_id` existe por design: mantém o palpite vinculado ao grupo. Como cada usuário está em apenas 1 grupo, não há ambiguidade.

## Variáveis de ambiente (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=...
```

## Estrutura de arquivos planejada
```
bolao-copa/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── cadastro/page.tsx
│   ├── (app)/
│   │   ├── palpites/page.tsx
│   │   ├── ranking/page.tsx
│   │   ├── resultados/page.tsx
│   │   └── grupo/page.tsx
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   └── cadastro/route.ts
│       ├── groups/route.ts
│       ├── predictions/route.ts
│       └── matches/route.ts
├── lib/
│   ├── supabase.ts      ← cliente Supabase com service key
│   └── auth.ts          ← hashSenha, verificarSenha, gerarToken, verificarToken
├── middleware.ts         ← protege rotas, redireciona para /login se sem token
├── agent/
│   └── update_results.py
└── .github/
    └── workflows/
        └── daily_agent.yml
```

## Sistema de pontuação
| Situação | Pontos |
|---|---|
| Acerto exato | 10 pts |
| Acertou o vencedor | 5 pts |
| Acertou empate (placar errado) | 3 pts |
| Errou tudo | 0 pts |

## MVP — o que entra
- Cadastro e login com email/senha
- Criar grupo e entrar por código
- Fazer palpites (fecha 30 min antes do jogo)
- Ver resultados com feedback de pontuação
- Ranking do grupo

## MVP — o que fica para depois
- Notificações (email/WhatsApp)
- Avatar/foto de perfil
- Chat do grupo
- Fase eliminatória com palpite de classificado
- Múltiplos grupos por usuário

## Status de implementação
- [x] Banco criado no Supabase
- [x] Projeto Next.js 16 inicializado
- [ ] Auth (cadastro/login)
- [ ] Grupos (criar/entrar por código)
- [ ] Palpites
- [ ] Resultados + pontuação
- [ ] Ranking
- [ ] Agente Python + GitHub Actions
