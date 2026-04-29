"""
Faz o seed do Supabase com:
1. Catálogo de indicadores (a partir de src/lib/data/measurements.json + lib/indicators.ts)
2. Medições históricas

Pré-requisitos:
- Rodar antes a migration em supabase/migration.sql via Dashboard.
- Definir NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente
  (ou em .env.local — esse script lê automaticamente).

Uso:
  python scripts/seed_supabase.py
"""
import json
import os
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).parent.parent

# Carrega .env.local manualmente (sem dependência extra)
env_file = ROOT / '.env.local'
if env_file.exists():
    for line in env_file.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        os.environ.setdefault(k.strip(), v.strip())

URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '').rstrip('/')
SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

if not URL or not SERVICE_KEY:
    print('ERRO: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos.')
    print('Defina em .env.local ou exporte no shell.')
    sys.exit(1)

try:
    import requests
except ImportError:
    print('Instale o módulo requests: pip install requests')
    sys.exit(1)

HEADERS = {
    'apikey': SERVICE_KEY,
    'Authorization': f'Bearer {SERVICE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=minimal',
}

# Mesmo mapeamento de direção/descrição/bandas do TS (META_OVERRIDES em src/lib/indicators.ts).
META_OVERRIDES = {
    'tma': {'direction': 'down', 'description': 'Tempo médio que o atendente leva por chamada (segundos).'},
    'tme': {'direction': 'down', 'description': 'Tempo médio que o cliente espera antes de ser atendido (segundos).'},
    'disponibilidade_central': {'direction': 'up', 'description': 'Disponibilidade da central de serviços (%).'},
    'volume_chamadas': {'direction': 'up', 'description': 'Volume de chamadas telefônicas atendidas no mês.'},
    'taxa_abandono': {'direction': 'down', 'description': '% de chamadas abandonadas antes do atendimento.', 'band_good': 0.02, 'band_warn': 0.05},
    'volume_tickets': {'direction': 'up', 'description': 'Total de tickets abertos no período.'},
    'volume_tickets_resolvidos': {'direction': 'up', 'description': 'Total de tickets resolvidos no período.'},
    'pct_tickets_sla': {'direction': 'up', 'description': '% de tickets encerrados dentro do prazo.'},
    'encerrados_n1': {'direction': 'up', 'description': 'Tickets resolvidos pelo Nível 1 de atendimento.'},
    'encerrados_n2': {'direction': 'up', 'description': 'Tickets resolvidos pelo Nível 2.'},
    'encerrados_n3': {'direction': 'up', 'description': 'Tickets escalados ao Nível 3.'},
    'encerrados_area_negocio': {'direction': 'down', 'description': 'Tickets encerrados pela área de negócio (idealmente baixo).'},
    'pct_encerrados_n1': {'direction': 'up', 'description': '% encerrados em N1 (FCR — quanto maior, melhor).'},
    'pct_encerrados_n2': {'direction': 'up', 'description': '% encerrados em N2.'},
    'pct_encerrados_n3': {'direction': 'down', 'description': '% encerrados em N3 (escalado — idealmente baixo).'},
    'pct_encerrados_area_negocio': {'direction': 'down', 'description': '% encerrados pela área de negócio (idealmente baixo).'},
    'aging_1d': {'direction': 'up', 'description': 'Quantidade de tickets resolvidos em até 1 dia.'},
    'aging_2d': {'direction': 'down', 'description': 'Tickets resolvidos em 2 dias.'},
    'aging_3d': {'direction': 'down', 'description': 'Tickets resolvidos em 3 dias.'},
    'aging_4d': {'direction': 'down', 'description': 'Tickets resolvidos em 4 dias.'},
    'aging_5d': {'direction': 'down', 'description': 'Tickets resolvidos em 5 dias.'},
    'aging_mais_5d': {'direction': 'down', 'description': 'Tickets que levaram mais de 5 dias.'},
    'pct_aging_1d': {'direction': 'up', 'description': '% de tickets resolvidos em até 1 dia.'},
    'pct_aging_2d': {'direction': 'down'},
    'pct_aging_3d': {'direction': 'down'},
    'pct_aging_4d': {'direction': 'down'},
    'pct_aging_5d': {'direction': 'down'},
    'pct_aging_mais_5d': {'direction': 'down', 'description': '% que levaram mais de 5 dias (idealmente baixo).'},
}


def main():
    data_path = ROOT / 'src' / 'lib' / 'data' / 'measurements.json'
    if not data_path.exists():
        print(f'ERRO: {data_path} não existe. Rode antes: python scripts/extract_data.py')
        sys.exit(1)

    payload = json.loads(data_path.read_text(encoding='utf-8'))

    # 1) Indicadores
    indicators = []
    for i, c in enumerate(payload['catalog']):
        ov = META_OVERRIDES.get(c['id'], {})
        indicators.append({
            'id': c['id'],
            'label': c['label'],
            'kind': c['kind'],
            'category': c['category'],
            'direction': ov.get('direction', 'up'),
            'meta': payload.get('metas', {}).get(c['id']),
            'description': ov.get('description'),
            'band_good': ov.get('band_good'),
            'band_warn': ov.get('band_warn'),
            'ordem': i,
        })

    print(f'Inserindo {len(indicators)} indicadores...')
    r = requests.post(
        f'{URL}/rest/v1/indicadores',
        headers={**HEADERS, 'Prefer': 'resolution=merge-duplicates,return=minimal'},
        data=json.dumps(indicators),
    )
    if not r.ok:
        print(f'ERRO ao inserir indicadores: {r.status_code} {r.text}')
        sys.exit(1)

    # 2) Medições
    rows = []
    for indicator_id, periods in payload['measurements'].items():
        for period, value in periods.items():
            rows.append({
                'indicator_id': indicator_id,
                'period': period,
                'value': value,
            })

    print(f'Inserindo {len(rows)} medições...')
    # Em lotes de 500 para não estourar payload
    BATCH = 500
    for i in range(0, len(rows), BATCH):
        batch = rows[i:i + BATCH]
        r = requests.post(
            f'{URL}/rest/v1/medicoes',
            headers={**HEADERS, 'Prefer': 'resolution=merge-duplicates,return=minimal'},
            data=json.dumps(batch),
        )
        if not r.ok:
            print(f'ERRO ao inserir medições (lote {i}): {r.status_code} {r.text}')
            sys.exit(1)
        print(f'  {i + len(batch)}/{len(rows)}')

    print('\nSeed concluído com sucesso.')


if __name__ == '__main__':
    main()
