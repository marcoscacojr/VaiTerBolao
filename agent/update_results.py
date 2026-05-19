"""
Agente diário: busca resultados da Copa 2026 na football-data.org
e atualiza partidas + pontuação dos palpites no Supabase.

Variáveis de ambiente necessárias:
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  FOOTBALL_DATA_API_KEY
  COMPETITION_CODE  (opcional, padrão: WC)
"""

import os
import sys
import requests
from supabase import create_client

# ---------------------------------------------------------------------------
# Configuração
# ---------------------------------------------------------------------------

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
FOOTBALL_API_KEY = os.environ["FOOTBALL_DATA_API_KEY"]
COMPETITION_CODE = os.environ.get("COMPETITION_CODE", "WC")

FOOTBALL_BASE_URL = "https://api.football-data.org/v4"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


# ---------------------------------------------------------------------------
# Pontuação
# ---------------------------------------------------------------------------

def calcular_pontos(palpite_casa: int, palpite_fora: int,
                    placar_casa: int, placar_fora: int) -> int:
    """Retorna pontos conforme as regras do bolão."""
    if palpite_casa == placar_casa and palpite_fora == placar_fora:
        return 10  # Placar exato

    def resultado(c, f):
        if c > f:
            return "casa"
        if f > c:
            return "fora"
        return "empate"

    palpite_res = resultado(palpite_casa, palpite_fora)
    real_res = resultado(placar_casa, placar_fora)

    if palpite_res == real_res:
        return 3 if real_res == "empate" else 5  # Empate certo ou vencedor certo

    return 0  # Errou


# ---------------------------------------------------------------------------
# Matching de times
# ---------------------------------------------------------------------------

def times_batem(nome_db: str, nome_api: str) -> bool:
    """Verifica se o nome do time no banco bate com o retornado pela API."""
    a = nome_db.lower().strip()
    b = nome_api.lower().strip()
    return a in b or b in a or a == b


# ---------------------------------------------------------------------------
# Lógica principal
# ---------------------------------------------------------------------------

def buscar_partidas_api() -> list[dict]:
    """Busca partidas FINISHED da competição na football-data.org."""
    headers = {"X-Auth-Token": FOOTBALL_API_KEY}
    url = f"{FOOTBALL_BASE_URL}/competitions/{COMPETITION_CODE}/matches"
    resp = requests.get(url, headers=headers, params={"status": "FINISHED"}, timeout=15)

    if resp.status_code == 403:
        print("Erro 403: verifique se sua chave tem acesso à Copa do Mundo (tier pago).")
        sys.exit(1)

    resp.raise_for_status()
    return resp.json().get("matches", [])


def atualizar_partidas():
    # Busca partidas não encerradas no banco
    resultado = supabase.from_("matches").select("*").eq("encerrado", False).execute()
    partidas_db = resultado.data

    if not partidas_db:
        print("Nenhuma partida pendente no banco.")
        return

    print(f"{len(partidas_db)} partida(s) pendente(s) no banco.")

    # Busca resultados na API
    partidas_api = buscar_partidas_api()
    print(f"{len(partidas_api)} partida(s) FINISHED na API.")

    atualizadas = 0

    for partida_db in partidas_db:
        for partida_api in partidas_api:
            home_api = partida_api["homeTeam"]["name"]
            away_api = partida_api["awayTeam"]["name"]

            if not (times_batem(partida_db["time_casa"], home_api) and
                    times_batem(partida_db["time_fora"], away_api)):
                continue

            placar_casa = partida_api["score"]["fullTime"]["home"]
            placar_fora = partida_api["score"]["fullTime"]["away"]

            if placar_casa is None or placar_fora is None:
                print(f"  Placar nulo para {home_api} x {away_api}, pulando.")
                continue

            # Atualiza a partida no banco
            supabase.from_("matches").update({
                "placar_casa": placar_casa,
                "placar_fora": placar_fora,
                "encerrado": True,
            }).eq("id", partida_db["id"]).execute()

            print(f"  ✓ {partida_db['time_casa']} {placar_casa}x{placar_fora} "
                  f"{partida_db['time_fora']}")

            # Calcula pontos para cada palpite dessa partida
            palpites = supabase.from_("predictions") \
                .select("id, palpite_casa, palpite_fora") \
                .eq("match_id", partida_db["id"]) \
                .execute().data

            for palpite in palpites:
                pontos = calcular_pontos(
                    palpite["palpite_casa"], palpite["palpite_fora"],
                    placar_casa, placar_fora,
                )
                supabase.from_("predictions") \
                    .update({"pontos": pontos}) \
                    .eq("id", palpite["id"]) \
                    .execute()

            print(f"    {len(palpites)} palpite(s) pontuado(s).")
            atualizadas += 1
            break  # Partida encontrada, vai para a próxima do banco

    print(f"\nConcluído: {atualizadas} partida(s) atualizada(s).")


if __name__ == "__main__":
    atualizar_partidas()
