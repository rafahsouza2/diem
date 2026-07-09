'use client'

import { useState, useEffect, useMemo } from 'react'

/* ── Tipos ──────────────────────────────────────────────────── */
interface Rec { dt: string; cod: string; proc: string; st: string; val: number; cid: string }
interface PacGap { pac: string; qtd: number; val: number; ab: number; pp: number; recs: Rec[] }
interface RecFlat extends Rec { pac: string }
interface GAData {
  resumo: {
    pacientes: number; totalIdent: number; valIdent: number
    aberto:     { qtd: number; val: number }
    pStatus:    { qtd: number; val: number }
    fatNaoQuit: { qtd: number; val: number }
    gapTotal:   { qtd: number; val: number }
  }
  pacientes: PacGap[]
}

/* ── Helpers ────────────────────────────────────────────────── */
function fmt(v: number) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtM(v: number) {
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(2).replace('.', ',')}M`
  if (v >= 1e3) return `R$ ${(v / 1e3).toFixed(1).replace('.', ',')}K`
  return `R$ ${fmt(v)}`
}
function fmtDate(d: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const PER_PAGE = 50

/* ── COMPONENTE PRINCIPAL ───────────────────────────────────── */
export default function GapAnalitico() {
  const [data,    setData]    = useState<GAData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busca,   setBusca]   = useState('')
  const [filtroSt,setFiltroSt]= useState('Todos')
  const [pagina,  setPagina]  = useState(1)

  useEffect(() => {
    fetch('/data/gap_analitico.json')
      .then(r => r.json())
      .then((d: GAData) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  /* Achata todos os registros numa lista plana */
  const todos: RecFlat[] = useMemo(() => {
    if (!data) return []
    const arr: RecFlat[] = []
    data.pacientes.forEach(p => p.recs.forEach(r => arr.push({ ...r, pac: p.pac })))
    arr.sort((a, b) => b.val - a.val)
    return arr
  }, [data])

  const filtrados = useMemo(() => {
    let r = todos
    if (filtroSt === 'Aberto')    r = r.filter(x => x.st === 'Aberto')
    if (filtroSt === 'Particular')r = r.filter(x => x.st === 'P')
    const b = busca.trim().toLowerCase()
    if (b) r = r.filter(x =>
      x.pac.toLowerCase().includes(b) ||
      x.proc.toLowerCase().includes(b) ||
      (x.cod ?? '').toLowerCase().includes(b) ||
      (x.cid ?? '').toLowerCase().includes(b)
    )
    return r
  }, [todos, busca, filtroSt])

  const totalPag = Math.ceil(filtrados.length / PER_PAGE)
  const pag_     = Math.min(pagina, totalPag || 1)
  const paginados= filtrados.slice((pag_ - 1) * PER_PAGE, pag_ * PER_PAGE)
  function go(n: number) { setPagina(Math.max(1, Math.min(n, totalPag))) }

  const totalVal = useMemo(() => filtrados.reduce((s, r) => s + r.val, 0), [filtrados])

  if (loading) return (
    <main className="main-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 14, color: 'var(--cinza-texto)' }}>
        <div className="spinner" style={{ borderColor: 'rgba(232,114,42,0.2)', borderTopColor: 'var(--laranja)' }}/>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--grafite)' }}>Carregando analítico do gap...</div>
          <div style={{ fontSize: 12, marginTop: 2 }}>8.497 registros · R$ 2,13M</div>
        </div>
      </div>
    </main>
  )
  if (!data) return <main className="main-content"><p style={{ color: 'var(--vermelho)' }}>Erro ao carregar dados.</p></main>

  const { resumo } = data

  return (
    <main className="main-content">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--grafite)' }}>
          8.497 Registros <span style={{ color: 'var(--laranja)' }}>/ Gap R$ 2,13M</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--cinza-texto)', marginTop: 2 }}>
          Atendimentos Smart não confirmados na quitação · {resumo.pacientes.toLocaleString('pt-BR')} pacientes identificados · Jan/2025–Abr/2026
        </p>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card laranja"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Gap total</span>
          <span className="kpi-value">{fmtM(resumo.gapTotal.val)}</span>
          <span className="kpi-badge down">▼ {resumo.gapTotal.qtd.toLocaleString('pt-BR')} registros</span>
        </div>
        <div className="kpi-card laranja"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Em Aberto</span>
          <span className="kpi-value">{fmtM(resumo.aberto.val)}</span>
          <span className="kpi-badge down">▼ {resumo.aberto.qtd.toLocaleString('pt-BR')} registros</span>
        </div>
        <div className="kpi-card verde"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Particular (P)</span>
          <span className="kpi-value">{fmtM(resumo.pStatus.val)}</span>
          <span className="kpi-badge">{resumo.pStatus.qtd.toLocaleString('pt-BR')} registros</span>
        </div>
        <div className="kpi-card azul"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Fat. sem quitação</span>
          <span className="kpi-value">{fmtM(resumo.fatNaoQuit.val)}</span>
          <span className="kpi-badge down">▼ {resumo.fatNaoQuit.qtd.toLocaleString('pt-BR')} registros</span>
        </div>
      </div>

      {/* Nota */}
      <div style={{ background: 'rgba(42,171,187,0.06)', border: '1px solid rgba(42,171,187,0.2)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--azul)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style={{ fontSize: 12, color: 'var(--cinza-texto)', margin: 0, lineHeight: 1.6 }}>
          Os <strong style={{ color: 'var(--azul)' }}>3.696 registros identificados</strong> (Em Aberto + Particular) estão listados abaixo.
          Os demais <strong style={{ color: 'var(--azul)' }}>4.801 Faturados sem quitação</strong> ({fmtM(resumo.fatNaoQuit.val)}) requerem cruzamento registro a registro para identificação individual.
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="header-search" style={{ maxWidth: 400, margin: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="search" placeholder="Buscar paciente, procedimento, CID..." value={busca} onChange={e=>{setBusca(e.target.value);setPagina(1)}}/>
        </div>
        <div className="period-tabs">
          {['Todos','Aberto','Particular'].map(s => (
            <button key={s} className={`period-tab${filtroSt===s?' active':''}`} onClick={()=>{setFiltroSt(s);setPagina(1)}}>{s}</button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--cinza-texto)' }}>
          <strong style={{ color: 'var(--grafite)' }}>{filtrados.length.toLocaleString('pt-BR')}</strong> registros ·{' '}
          <strong style={{ color: 'var(--laranja)' }}>{fmtM(totalVal)}</strong>
        </span>
      </div>

      {/* Tabela flat */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Data</th>
                <th>Paciente</th>
                <th>Cód. Proc.</th>
                <th>Procedimento</th>
                <th>CID</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 11, color: 'var(--cinza-texto)', width: 36 }}>
                    {((pag_ - 1) * PER_PAGE) + i + 1}
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{fmtDate(r.dt)}</td>
                  <td style={{ fontWeight: 700, fontSize: 12 }}>{r.pac}</td>
                  <td style={{ fontSize: 11, color: 'var(--cinza-texto)', fontFamily: 'monospace' }}>{r.cod || '—'}</td>
                  <td style={{ fontSize: 11, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.proc}>{r.proc || '—'}</td>
                  <td style={{ fontSize: 11, color: 'var(--cinza-texto)' }}>{r.cid || '—'}</td>
                  <td>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                      background: r.st === 'Aberto' ? 'rgba(232,114,42,0.12)' : 'rgba(76,175,80,0.12)',
                      color: r.st === 'Aberto' ? 'var(--laranja)' : 'var(--verde)' }}>
                      {r.st === 'P' ? 'Particular' : r.st}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 13, color: r.st === 'Aberto' ? 'var(--laranja)' : 'var(--verde)' }}>
                    R$ {fmt(r.val)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderTop: '1px solid var(--cinza-borda)', fontSize: 13 }}>
          <span style={{ color: 'var(--cinza-texto)' }}>
            Pág. <strong>{pag_}</strong> de <strong>{totalPag}</strong>
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={()=>go(1)}        disabled={pag_===1}        style={{ padding:'5px 10px',borderRadius:6,border:'1.5px solid var(--cinza-borda)',background:pag_===1?'var(--cinza-bg)':'#fff',cursor:pag_===1?'not-allowed':'pointer',fontWeight:600,fontSize:13 }}>«</button>
            <button onClick={()=>go(pag_-1)}   disabled={pag_===1}        style={{ padding:'5px 10px',borderRadius:6,border:'1.5px solid var(--cinza-borda)',background:pag_===1?'var(--cinza-bg)':'#fff',cursor:pag_===1?'not-allowed':'pointer',fontWeight:600,fontSize:13 }}>‹</button>
            {Array.from({length:Math.min(5,totalPag)},(_,k)=>{const s=Math.max(1,Math.min(pag_-2,totalPag-4));const pg=s+k;return<button key={pg} onClick={()=>go(pg)} style={{padding:'5px 10px',borderRadius:6,border:`1.5px solid ${pg===pag_?'var(--laranja)':'var(--cinza-borda)'}`,background:pg===pag_?'var(--laranja)':'#fff',color:pg===pag_?'#fff':'var(--grafite)',cursor:'pointer',fontWeight:600,fontSize:13}}>{pg}</button>})}
            <button onClick={()=>go(pag_+1)}   disabled={pag_===totalPag} style={{ padding:'5px 10px',borderRadius:6,border:'1.5px solid var(--cinza-borda)',background:pag_===totalPag?'var(--cinza-bg)':'#fff',cursor:pag_===totalPag?'not-allowed':'pointer',fontWeight:600,fontSize:13 }}>›</button>
            <button onClick={()=>go(totalPag)} disabled={pag_===totalPag} style={{ padding:'5px 10px',borderRadius:6,border:'1.5px solid var(--cinza-borda)',background:pag_===totalPag?'var(--cinza-bg)':'#fff',cursor:pag_===totalPag?'not-allowed':'pointer',fontWeight:600,fontSize:13 }}>»</button>
          </div>
        </div>
      </div>
    </main>
  )
}
