"""
Script único: busca todos os jogos da Copa 2026 na football-data.org
e insere na tabela matches do Supabase.

Uso:
  SUPABASE_URL=... SUPABASE_SERVICE_KEY=... FOOTBALL_DATA_API_KEY=... python agent/popular_partidas.py

Flags opcionais:
  --dry-run   Mostra o que seria inserido sem gravar no banco
  --limpar    Remove todas as partidas existentes antes de inserir (cuidado!)
"""

import os
import sys
import uuid
import argparse
import requests
from supabase import create_client

# ---------------------------------------------------------------------------
# Configuração
# ---------------------------------------------------------------------------

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
FOOTBALL_API_KEY = os.environ["FOOTBALL_DATA_API_KEY"]
COMPETITION_CODE = os.environ.get("COMPETITION_CODE", "WC")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Mapeamento stage da API → fase no banco
STAGE_MAP = {
    "GROUP_STAGE":    "grupos",
    "LAST_16":        "oitavas",
    "QUARTER_FINALS": "quartas",
    "SEMI_FINALS":    "semi",
    "FINAL":          "final",
    "THIRD_PLACE":    "terceiro",  # jogo do 3º lugar
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def buscar_partidas_api() -> list[dict]:
    headers = {"X-Auth-Token": FOOTBALL_API_KEY}
    url = f"https://api.football-data.org/v4/competitions/{COMPETITION_CODE}/matches"
    resp = requests.get(url, headers=headers, timeout=15)

    if resp.status_code == 403:
        print("Erro 403: sua chave não tem acesso a esta competição.")
        print("Verifique o tier da sua conta em football-data.org.")
        sys.exit(1)

    if resp.status_code == 404:
        print(f"Erro 404: competição '{COMPETITION_CODE}' não encontrada.")
        sys.exit(1)

    resp.raise_for_status()
    return resp.json().get("matches", [])


PLACEHOLDERS = {"tbd", "to be defined", "winner", "loser", "runner-up"}

def time_definido(nome: str | None) -> bool:
    """Retorna False se o time ainda não está definido (TBD, Winner Group X, etc.)."""
    if not nome:
        return False
    nome_lower = nome.lower().strip()
    return not any(p in nome_lower for p in PLACEHOLDERS)


def converter_partida(match: dict) -> dict | None:
    """Converte um objeto da API para o formato do banco."""
    stage = match.get("stage", "")
    fase = STAGE_MAP.get(stage)

    if fase is None:
        return None  # Estágio desconhecido, pula

    time_casa = match["homeTeam"].get("name")
    time_fora = match["awayTeam"].get("name")

    # Pula jogos onde os times ainda não estão definidos (fase eliminatória pendente)
    if not time_definido(time_casa) or not time_definido(time_fora):
        return None

    # Grupo: "GROUP_A" → "A", None na fase eliminatória
    grupo_raw = match.get("group")
    grupo = grupo_raw.replace("GROUP_", "") if grupo_raw else None

    return {
        "fase":        fase,
        "grupo":       grupo,
        "time_casa":   time_casa,
        "time_fora":   time_fora,
        "data_hora":   match["utcDate"],  # ISO 8601 UTC — o Supabase aceita direto
        "placar_casa": None,
        "placar_fora": None,
        "encerrado":   False,
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Popula partidas da Copa no Supabase")
    parser.add_argument("--dry-run", action="store_true", help="Mostra sem gravar")
    parser.add_argument("--limpar", action="store_true", help="Remove partidas existentes antes de inserir")
    args = parser.parse_args()

    print(f"Buscando partidas de '{COMPETITION_CODE}' na API...")
    partidas_api = buscar_partidas_api()
    print(f"{len(partidas_api)} partida(s) encontrada(s) na API.\n")

    partidas = []
    ignoradas = []

    for match in partidas_api:
        partida = converter_partida(match)
        if partida:
            partidas.append(partida)
        else:
            ignoradas.append(match.get("stage", "?"))

    print(f"✓ {len(partidas)} partida(s) para inserir")
    if ignoradas:
        print(f"  {len(ignoradas)} ignorada(s) (estágios: {set(ignoradas)})\n")

    # Preview
    for p in partidas:
        grupo_str = f" [Grupo {p['grupo']}]" if p["grupo"] else ""
        print(f"  {p['fase']}{grupo_str}: {p['time_casa']} x {p['time_fora']} — {p['data_hora']}")

    if args.dry_run:
        print("\n[dry-run] Nenhum dado gravado.")
        return

    print()

    if args.limpar:
        confirm = input("⚠️  Isso vai apagar todas as partidas existentes. Confirma? (s/N): ")
        if confirm.strip().lower() != "s":
            print("Cancelado.")
            return
        supabase.from_("matches").delete().neq("id", 0).execute()
        print("Partidas existentes removidas.\n")

    # Inserção em lotes
    LOTE = 50
    inseridas = 0
    for i in range(0, len(partidas), LOTE):
        lote = partidas[i:i + LOTE]
        resultado = supabase.from_("matches").insert(lote).execute()
        inseridas += len(lote)
        print(f"  Inseridas {inseridas}/{len(partidas)}...")

    print(f"\n✅ Concluído: {inseridas} partida(s) inserida(s) no Supabase.")


if __name__ == "__main__":
    main()
