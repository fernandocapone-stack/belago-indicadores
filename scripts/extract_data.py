"""
Extrai e normaliza os dados da planilha Belago em JSON.
V1: contempla apenas o xlsx da Belago.
Saída: src/lib/data/measurements.json
"""
import sys, json, re
from pathlib import Path
from datetime import datetime
from openpyxl import load_workbook

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).parent.parent
BELAGO_XLSX = 'C:/Users/Fernando/Desktop/2026 03 - Indicadores Base Belago.xlsx'

# normalização de label (acentos / espaços / case)
def norm(s):
    if s is None:
        return ''
    s = str(s).strip()
    s = re.sub(r'\s+', ' ', s)
    return s


def time_to_seconds(v):
    if v is None:
        return None
    if hasattr(v, 'hour'):
        return v.hour * 3600 + v.minute * 60 + v.second
    s = str(v).strip()
    m = re.match(r'^(\d+):(\d{2}):(\d{2})$', s)
    if m:
        return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(m.group(3))
    m = re.match(r'^(\d+):(\d{2})$', s)
    if m:
        return int(m.group(1)) * 60 + int(m.group(2))
    return None


def to_number(v):
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().replace(',', '.')
    if s.endswith('%'):
        try:
            return float(s[:-1]) / 100
        except ValueError:
            return None
    try:
        return float(s)
    except ValueError:
        return None


# Cada entry: (label_normalizado, indicator_id, label_amigável, kind, category)
INDICATORS = [
    ('Tempo Médio Atendimento', 'tma', 'Tempo Médio de Atendimento', 'time', 'atendimento'),
    ('Tempo Médio Espera', 'tme', 'Tempo Médio de Espera', 'time', 'atendimento'),
    ('Disponibilidade Central de Serviços', 'disponibilidade_central', 'Disponibilidade da Central', 'percent', 'atendimento'),
    ('Volume de Chamadas Telefone - Central Serviços', 'volume_chamadas', 'Volume de Chamadas', 'integer', 'atendimento'),
    ('Taxa Abandono Chamadas', 'taxa_abandono', 'Taxa de Abandono', 'percent', 'atendimento'),

    ('Volume Tickets Período', 'volume_tickets', 'Volume de Tickets', 'integer', 'tickets'),
    ('Volume de tickets Resolvidos por período', 'volume_tickets_resolvidos', 'Tickets Resolvidos', 'integer', 'tickets'),
    ('% Tickets encerrados dentro periodo', 'pct_tickets_sla', '% Tickets dentro do prazo', 'percent', 'tickets'),

    ('Volumetria Encerrados 1N', 'encerrados_n1', 'Encerrados N1', 'integer', 'niveis'),
    ('Volumetria Encerrados 2N', 'encerrados_n2', 'Encerrados N2', 'integer', 'niveis'),
    ('Volumetria Encerrados 3N', 'encerrados_n3', 'Encerrados N3', 'integer', 'niveis'),
    ('Volumetria Encerrados Área Negócio', 'encerrados_area_negocio', 'Encerrados Área Negócio', 'integer', 'niveis'),
    ('% Encerrados 1N', 'pct_encerrados_n1', '% Encerrados N1', 'percent', 'niveis'),
    ('% Encerrados 2N', 'pct_encerrados_n2', '% Encerrados N2', 'percent', 'niveis'),
    ('% Encerrados 3N', 'pct_encerrados_n3', '% Encerrados N3', 'percent', 'niveis'),
    ('% Encerrados Área Negócio', 'pct_encerrados_area_negocio', '% Encerrados Área Negócio', 'percent', 'niveis'),

    ('Aging Resolução - 1 dia', 'aging_1d', 'Aging 1 dia', 'integer', 'aging'),
    ('Aging Resolução - 2 dias', 'aging_2d', 'Aging 2 dias', 'integer', 'aging'),
    ('Aging Resolução - 3 dias', 'aging_3d', 'Aging 3 dias', 'integer', 'aging'),
    ('Aging Resolução - 4 dias', 'aging_4d', 'Aging 4 dias', 'integer', 'aging'),
    ('Aging Resolução - 5 dias', 'aging_5d', 'Aging 5 dias', 'integer', 'aging'),
    ('% Aging Resolução - 1 dia', 'pct_aging_1d', '% Aging 1 dia', 'percent', 'aging'),
    ('% Aging Resolução -2 dias', 'pct_aging_2d', '% Aging 2 dias', 'percent', 'aging'),
    ('% Aging Resolução -3 dias', 'pct_aging_3d', '% Aging 3 dias', 'percent', 'aging'),
    ('% Aging Resolução -4 dias', 'pct_aging_4d', '% Aging 4 dias', 'percent', 'aging'),
    ('% Aging Resolução -5 dias', 'pct_aging_5d', '% Aging 5 dias', 'percent', 'aging'),
]
LABEL_TO_IND = {norm(label): (iid, friendly, kind, cat) for label, iid, friendly, kind, cat in INDICATORS}
AGING_MAIS_PREFIX = norm('Aging Resolução - mais')
PCT_AGING_MAIS_PREFIX = norm('% Aging Resolução - mais')


def main():
    wb = load_workbook(BELAGO_XLSX, data_only=True)
    ws = wb['Indicadores Base']
    rows = list(ws.iter_rows(values_only=True))

    # Procura linha de cabeçalho (a que tem datetime na col 2)
    header_row_idx = None
    for i, r in enumerate(rows):
        if r and len(r) > 2 and isinstance(r[2], datetime):
            header_row_idx = i
            break
    if header_row_idx is None:
        raise RuntimeError('Não encontrou linha de cabeçalho de períodos')
    header_row = rows[header_row_idx]
    print(f'Header row idx: {header_row_idx}')
    # Construir mapa col_idx -> period 'YYYY-MM' ou 'meta'
    col_period = {}
    meta_col = None
    for ci, c in enumerate(header_row):
        if c is None:
            continue
        if isinstance(c, datetime):
            col_period[ci] = f'{c.year}-{c.month:02d}'
        else:
            s = str(c).strip().lower()
            if s == 'meta':
                meta_col = ci

    print(f'Períodos detectados: {len(col_period)} | meta col: {meta_col}')
    print(f'  primeiros: {list(col_period.items())[:3]}, últimos: {list(col_period.items())[-3:]}')

    by_ind = {}      # indicator_id -> {period: value}
    metas = {}       # indicator_id -> meta value
    catalog = []     # ordered list of indicator dicts
    seen_ids = set()

    for r in rows:
        if not r or len(r) < 2 or r[1] is None:
            continue
        label = norm(r[1])

        ind_id = friendly = kind = cat = None
        if label in LABEL_TO_IND:
            ind_id, friendly, kind, cat = LABEL_TO_IND[label]
        elif label.startswith(AGING_MAIS_PREFIX):
            ind_id, friendly, kind, cat = 'aging_mais_5d', 'Aging > 5 dias', 'integer', 'aging'
        elif label.startswith(PCT_AGING_MAIS_PREFIX):
            ind_id, friendly, kind, cat = 'pct_aging_mais_5d', '% Aging > 5 dias', 'percent', 'aging'
        else:
            continue

        if ind_id not in seen_ids:
            seen_ids.add(ind_id)
            catalog.append({'id': ind_id, 'label': friendly, 'kind': kind, 'category': cat})

        # extract values
        d = by_ind.setdefault(ind_id, {})
        for ci, period in col_period.items():
            if ci >= len(r):
                continue
            v = r[ci]
            val = time_to_seconds(v) if kind == 'time' else to_number(v)
            if val is not None:
                d[period] = val

        # meta
        if meta_col is not None and meta_col < len(r):
            mv = r[meta_col]
            if mv is not None and ind_id not in metas:
                metas[ind_id] = time_to_seconds(mv) if kind == 'time' else to_number(mv)

    # ordenar períodos
    for k in by_ind:
        by_ind[k] = dict(sorted(by_ind[k].items()))

    # PBI sheet (registrados / SLA 2 dias)
    pbi = []
    if 'Calculo PBI' in wb.sheetnames:
        ws2 = wb['Calculo PBI']
        rows2 = list(ws2.iter_rows(values_only=True))
        # row 1 = header; demais = mês -> registrados, total_sla, atendidos_2d, %
        PT_MONTHS = {'janeiro':1,'fevereiro':2,'março':3,'abril':4,'maio':5,'junho':6,
                     'julho':7,'agosto':8,'setembro':9,'outubro':10,'novembro':11,'dezembro':12}
        for r in rows2[1:]:
            if not r or r[0] is None:
                continue
            mname = str(r[0]).strip().lower()
            mn = PT_MONTHS.get(mname)
            if not mn:
                continue
            # Suposição: ano = 2026 (planilha é "Mar 2026")
            period = f'2026-{mn:02d}'
            pbi.append({
                'period': period,
                'registrados': to_number(r[1]),
                'total_sla': to_number(r[2]),
                'atendidos_2d': to_number(r[3]),
                'pct_atendidos_2d': to_number(r[4]),
            })

    out_dir = ROOT / 'src' / 'lib' / 'data'
    out_dir.mkdir(parents=True, exist_ok=True)

    out = {
        'generated_at': datetime.now().isoformat(),
        'source': BELAGO_XLSX,
        'catalog': catalog,
        'metas': metas,
        'measurements': by_ind,
        'pbi': pbi,
    }

    with open(out_dir / 'measurements.json', 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f'\n{len(catalog)} indicadores extraídos:')
    for ind in catalog:
        periods = by_ind.get(ind['id'], {})
        ps = sorted(periods.keys())
        meta_str = f'meta={metas.get(ind["id"])}' if ind['id'] in metas else ''
        print(f'  {ind["id"]:30s} {ind["kind"]:8s} {len(periods):3d}p ({ps[0] if ps else "-"} → {ps[-1] if ps else "-"}) {meta_str}')

    print(f'\nPBI: {len(pbi)} entradas')
    print(f'Salvo em: {out_dir / "measurements.json"}')


if __name__ == '__main__':
    main()
