'use client'

import { useState, useEffect, useMemo } from 'react'

/* ── Tipos ──────────────────────────────────────────────────── */
interface Rec {
  dt: string; cod: string; proc: string; st: string; val: number; cid: string
}
interface Paciente {
  pac: string; qtd: number; val: number
  fat: number; ab: number; pp: number
  recs: Rec[]
}
interface PAData { pacientes: Paciente[] }

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
function fmtMes(m: string) {
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const [y, mo] = m.split('-')
  return `${meses[+mo - 1]}/${y.slice(2)}`
}

const ST_CLASS: Record<string, string> = {
  Faturado: 's-concluido', Aberto: 's-pendente', P: 's-andamento'
}
const ST_LABEL: Record<string, string> = {
  Faturado: 'Faturado', Aberto: 'Aberto', P: 'Particular'
}

const PER_PAGE_PAC = 50
const PER_PAGE_REC = 30

/* ── Detalhe do Paciente ────────────────────────────────────── */
function DetalhePaciente({ p, onClose }: { p: Paciente; onClose: () => void }) {
  const [busca,  setBusca]  = useState('')
  const [pagina, setPagina] = useState(1)
  const [filtroSt, setFiltroSt] = useState('Todos')

  /* Mensal */
  const mensal = useMemo(() => {
    const h: Record<string, { qtd: number; val: number }> = {}
    p.recs.forEach(r => {
      const m = r.dt.slice(0, 7)
      if (!h[m]) h[m] = { qtd: 0, val: 0 }
      h[m].qtd++; h[m].val += r.val
    })
    return Object.keys(h).sort().map(mes => ({ mes, ...h[mes] }))
  }, [p])

  /* Top proc */
  const topProc = useMemo(() => {
    const h: Record<string, { qtd: number; val: number }> = {}
    p.recs.forEach(r => {
      const k = r.proc || 'Sem proc'
      if (!h[k]) h[k] = { qtd: 0, val: 0 }
      h[k].qtd++; h[k].val += r.val
    })
    return Object.entries(h).map(([proc, s]) => ({ proc, ...s })).sort((a, b) => b.val - a.val).slice(0, 8)
  }, [p])

  const filtrados = useMemo(() => {
    let r = p.recs
    if (filtroSt !== 'Todos') r = r.filter(x => x.st === filtroSt)
    const b = busca.trim().toLowerCase()
    if (b) r = r.filter(x =>
      x.proc.toLowerCase().includes(b) ||
      (x.cod ?? '').toLowerCase().includes(b) ||
      (x.cid ?? '').toLowerCase().includes(b)
    )
    return r
  }, [p, busca, filtroSt])

  const totalPag = Math.ceil(filtrados.length / PER_PAGE_REC)
  const pag_     = Math.min(pagina, totalPag || 1)
  const paginados= filtrados.slice((pag_ - 1) * PER_PAGE_REC, pag_ * PER_PAGE_REC)
  function go(n: number) { setPagina(Math.max(1, Math.min(n, totalPag))) }

  const CHART_H = 70
  const maxMes = Math.max(...mensal.map(m => m.qtd), 1)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
      <div style={{ background: 'var(--fundo)', borderRadius: 16, width: '100%', maxWidth: 900, boxShadow: 'var(--sombra-lg)', padding: 28 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cinza-texto)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Analítico do Paciente</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--grafite)', marginTop: 2 }}>{p.pac}</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--cinza-bg)', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: 'var(--cinza-texto)' }}>✕ Fechar</button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total faturado', val: fmtM(p.val), sub: `${p.qtd} atendimentos`, cor: 'var(--azul)' },
            { label: 'Faturado', val: p.fat.toString(), sub: fmtM(p.recs.filter(r=>r.st==='Faturado').reduce((s,r)=>s+r.val,0)), cor: 'var(--verde)' },
            { label: 'Em Aberto', val: p.ab.toString(), sub: fmtM(p.recs.filter(r=>r.st==='Aberto').reduce((s,r)=>s+r.val,0)), cor: 'var(--laranja)' },
            { label: 'Particular (P)', val: p.pp.toString(), sub: fmtM(p.recs.filter(r=>r.st==='P').reduce((s,r)=>s+r.val,0)), cor: 'var(--verde)' },
          ].map(k => (
            <div key={k.label} style={{ background: 'var(--cinza-bg)', borderRadius: 10, padding: '12px 14px', borderTop: `3px solid ${k.cor}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cinza-texto)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: k.cor, marginTop: 2 }}>{k.val}</div>
              <div style={{ fontSize: 11, color: 'var(--cinza-texto)', marginTop: 1 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Gráfico mensal + top procedimentos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ background: 'var(--cinza-bg)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Evolução Mensal (atendimentos)</div>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: CHART_H + 18 }}>
              {mensal.map(m => {
                const h = Math.round(m.qtd / maxMes * CHART_H)
                return (
                  <div key={m.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: CHART_H }}
                      title={`${fmtMes(m.mes)}: ${m.qtd} atend | ${fmtM(m.val)}`}>
                      <div style={{ height: `${h}px`, background: 'var(--azul)', borderRadius: '2px 2px 0 0', opacity: 0.85 }}/>
                    </div>
                    <span style={{ fontSize: 7, color: 'var(--cinza-texto)', marginTop: 2, textAlign: 'center' }}>{fmtMes(m.mes)}</span>
                  </div>
                )
              })}
            </div>
            {/* tabela mensal resumida */}
            <div style={{ marginTop: 8, fontSize: 11 }}>
              {mensal.slice(-4).map(m => (
                <div key={m.mes} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid var(--cinza-borda)' }}>
                  <span style={{ color: 'var(--cinza-texto)' }}>{fmtMes(m.mes)}</span>
                  <span>{m.qtd} atend.</span>
                  <strong style={{ color: 'var(--azul)' }}>{fmtM(m.val)}</strong>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--cinza-bg)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Top Procedimentos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {topProc.map((pr, i) => {
                const pct = topProc[0].val > 0 ? (pr.val / topProc[0].val) * 100 : 0
                return (
                  <div key={pr.proc} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ width: 14, fontSize: 10, color: 'var(--cinza-texto)', flexShrink: 0 }}>{i+1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 600 }} title={pr.proc}>{pr.proc.length > 28 ? pr.proc.slice(0,28)+'…' : pr.proc}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--azul)' }}>{fmtM(pr.val)}</span>
                          <span style={{ fontSize: 10, color: 'var(--cinza-texto)' }}>×{pr.qtd}</span>
                        </div>
                      </div>
                      <div style={{ height: 4, background: 'rgba(42,171,187,0.15)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--azul)', borderRadius: 2, opacity: 0.7 }}/>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tabela de registros */}
        <div style={{ background: 'var(--cinza-bg)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>Todos os Registros</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['Todos','Faturado','Aberto','P'].map(s => (
                <button key={s} onClick={() => { setFiltroSt(s); setPagina(1) }}
                  style={{ padding: '3px 10px', borderRadius: 6, border: `1.5px solid ${s===filtroSt ? 'var(--azul)':'var(--cinza-borda)'}`, background: s===filtroSt ? 'var(--azul)' : '#fff', color: s===filtroSt ? '#fff':'var(--grafite)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {s === 'P' ? 'Particular' : s}
                </button>
              ))}
            </div>
            <div className="header-search" style={{ maxWidth: 220, margin: 0, marginLeft: 'auto' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="search" placeholder="Proc., código, CID..." value={busca} onChange={e=>{setBusca(e.target.value);setPagina(1)}} style={{ fontSize: 12 }}/>
            </div>
          </div>
          <div className="table-wrap" style={{ maxHeight: 320, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
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
                    <td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{fmtDate(r.dt)}</td>
                    <td style={{ fontSize: 11, color: 'var(--cinza-texto)', fontFamily: 'monospace' }}>{r.cod || '—'}</td>
                    <td style={{ fontSize: 11, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.proc}>{r.proc || '—'}</td>
                    <td style={{ fontSize: 11, color: 'var(--cinza-texto)' }}>{r.cid || '—'}</td>
                    <td><span className={`status-badge ${ST_CLASS[r.st] ?? 's-pendente'}`}>{ST_LABEL[r.st] ?? r.st}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 12, color: r.st==='Aberto'?'var(--laranja)':'var(--azul)' }}>R$ {fmt(r.val)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPag > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, fontSize: 11 }}>
              <span style={{ color: 'var(--cinza-texto)' }}>Pág. {pag_} / {totalPag} · {filtrados.length} reg.</span>
              <div style={{ display: 'flex', gap: 3 }}>
                <button onClick={()=>go(1)}       disabled={pag_===1}        style={{ padding:'3px 8px',borderRadius:4,border:'1px solid var(--cinza-borda)',background:pag_===1?'var(--cinza-bg)':'#fff',cursor:pag_===1?'not-allowed':'pointer' }}>«</button>
                <button onClick={()=>go(pag_-1)}  disabled={pag_===1}        style={{ padding:'3px 8px',borderRadius:4,border:'1px solid var(--cinza-borda)',background:pag_===1?'var(--cinza-bg)':'#fff',cursor:pag_===1?'not-allowed':'pointer' }}>‹</button>
                <button onClick={()=>go(pag_+1)}  disabled={pag_===totalPag} style={{ padding:'3px 8px',borderRadius:4,border:'1px solid var(--cinza-borda)',background:pag_===totalPag?'var(--cinza-bg)':'#fff',cursor:pag_===totalPag?'not-allowed':'pointer' }}>›</button>
                <button onClick={()=>go(totalPag)} disabled={pag_===totalPag} style={{ padding:'3px 8px',borderRadius:4,border:'1px solid var(--cinza-borda)',background:pag_===totalPag?'var(--cinza-bg)':'#fff',cursor:pag_===totalPag?'not-allowed':'pointer' }}>»</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── COMPONENTE PRINCIPAL ───────────────────────────────────── */
export default function PacientesAnalitico() {
  const [data,    setData]    = useState<PAData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busca,   setBusca]   = useState('')
  const [filtroSt,setFiltroSt]= useState('Todos')
  const [pagina,  setPagina]  = useState(1)
  const [detalhe, setDetalhe] = useState<Paciente | null>(null)

  useEffect(() => {
    fetch('/data/pacientes_analitico.json')
      .then(r => r.json())
      .then((d: PAData) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtrados = useMemo(() => {
    if (!data) return []
    let r = data.pacientes
    if (filtroSt === 'Aberto')    r = r.filter(p => p.ab > 0)
    if (filtroSt === 'Faturado')  r = r.filter(p => p.fat > 0)
    if (filtroSt === 'Particular')r = r.filter(p => p.pp > 0)
    const b = busca.trim().toLowerCase()
    if (b) r = r.filter(p => p.pac.toLowerCase().includes(b))
    return r
  }, [data, busca, filtroSt])

  const totalPag = Math.ceil(filtrados.length / PER_PAGE_PAC)
  const pag_     = Math.min(pagina, totalPag || 1)
  const paginados= filtrados.slice((pag_ - 1) * PER_PAGE_PAC, pag_ * PER_PAGE_PAC)
  function go(n: number) { setPagina(Math.max(1, Math.min(n, totalPag))) }

  const totalVal  = useMemo(() => filtrados.reduce((s, p) => s + p.val, 0), [filtrados])
  const totalQtd  = useMemo(() => filtrados.reduce((s, p) => s + p.qtd, 0), [filtrados])

  if (loading) return (
    <main className="main-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 14, color: 'var(--cinza-texto)' }}>
        <div className="spinner" style={{ borderColor: 'rgba(42,171,187,0.2)', borderTopColor: 'var(--azul)' }}/>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--grafite)' }}>Carregando analítico de pacientes...</div>
          <div style={{ fontSize: 12, marginTop: 2 }}>7.440 pacientes · 61.338 atendimentos</div>
        </div>
      </div>
    </main>
  )
  if (!data) return <main className="main-content"><p style={{ color: 'var(--vermelho)' }}>Erro ao carregar dados.</p></main>

  return (
    <main className="main-content">
      {detalhe && <DetalhePaciente p={detalhe} onClose={() => setDetalhe(null)} />}

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--grafite)' }}>
          Análise <span style={{ color: 'var(--azul)' }}>/ Pacientes</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--cinza-texto)', marginTop: 2 }}>
          {data.pacientes.length.toLocaleString('pt-BR')} pacientes únicos · 61.338 atendimentos Smart · Jan/2025–Abr/2026
        </p>
      </div>

      {/* KPIs globais */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card azul"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Pacientes únicos</span>
          <span className="kpi-value">{data.pacientes.length.toLocaleString('pt-BR')}</span>
          <span className="kpi-badge up">▲ todos os status</span>
        </div>
        <div className="kpi-card azul"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Total faturado</span>
          <span className="kpi-value">{fmtM(data.pacientes.reduce((s,p)=>s+p.val,0))}</span>
          <span className="kpi-badge up">▲ {data.pacientes.reduce((s,p)=>s+p.qtd,0).toLocaleString('pt-BR')} atendimentos</span>
        </div>
        <div className="kpi-card laranja"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Com pendências (Aberto)</span>
          <span className="kpi-value">{data.pacientes.filter(p=>p.ab>0).length.toLocaleString('pt-BR')}</span>
          <span className="kpi-badge down">▼ pacientes com at. em aberto</span>
        </div>
        <div className="kpi-card verde"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Ticket médio / paciente</span>
          <span className="kpi-value">{fmtM(data.pacientes.reduce((s,p)=>s+p.val,0)/data.pacientes.length)}</span>
          <span className="kpi-badge up">▲ valor médio por paciente</span>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="header-search" style={{ maxWidth: 360, margin: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="search" placeholder="Buscar paciente..." value={busca} onChange={e=>{setBusca(e.target.value);setPagina(1)}}/>
        </div>
        <div className="period-tabs">
          {['Todos','Faturado','Aberto','Particular'].map(s => (
            <button key={s} className={`period-tab${filtroSt===s?' active':''}`} onClick={()=>{setFiltroSt(s);setPagina(1)}}>{s}</button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--cinza-texto)' }}>
          <strong style={{ color: 'var(--grafite)' }}>{filtrados.length.toLocaleString('pt-BR')}</strong> pacientes ·{' '}
          <strong style={{ color: 'var(--azul)' }}>{fmtM(totalVal)}</strong> ·{' '}
          {totalQtd.toLocaleString('pt-BR')} atend.
        </span>
      </div>

      {/* Tabela de pacientes */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Paciente</th>
                <th style={{ textAlign: 'right' }}>Atend.</th>
                <th style={{ textAlign: 'right' }}>Faturado</th>
                <th style={{ textAlign: 'right' }}>Em Aberto</th>
                <th style={{ textAlign: 'right' }}>Particular</th>
                <th style={{ textAlign: 'right' }}>Valor Total</th>
                <th style={{ textAlign: 'right' }}>Ticket Médio</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginados.map((p, i) => (
                <tr key={p.pac} style={{ cursor: 'pointer' }} onClick={() => setDetalhe(p)}>
                  <td style={{ fontSize: 11, color: 'var(--cinza-texto)', width: 36 }}>
                    {((pag_ - 1) * PER_PAGE_PAC) + i + 1}
                  </td>
                  <td style={{ fontWeight: 700, fontSize: 13 }}>{p.pac}</td>
                  <td style={{ textAlign: 'right', fontSize: 12 }}>{p.qtd}</td>
                  <td style={{ textAlign: 'right' }}>
                    {p.fat > 0 && <span className="status-badge s-concluido">{p.fat}</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {p.ab > 0 && <span className="status-badge s-pendente">{p.ab}</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {p.pp > 0 && <span className="status-badge s-andamento">{p.pp}</span>}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 13, color: 'var(--azul)' }}>{fmtM(p.val)}</td>
                  <td style={{ textAlign: 'right', fontSize: 11, color: 'var(--cinza-texto)' }}>{fmtM(p.val / p.qtd)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={e=>{e.stopPropagation();setDetalhe(p)}}
                      style={{ padding:'3px 10px', borderRadius:6, border:'1.5px solid var(--azul)', background:'transparent', color:'var(--azul)', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                      Ver
                    </button>
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
            <button onClick={()=>go(1)}       disabled={pag_===1}        style={{ padding:'5px 10px',borderRadius:6,border:'1.5px solid var(--cinza-borda)',background:pag_===1?'var(--cinza-bg)':'#fff',cursor:pag_===1?'not-allowed':'pointer',fontWeight:600,fontSize:13 }}>«</button>
            <button onClick={()=>go(pag_-1)}  disabled={pag_===1}        style={{ padding:'5px 10px',borderRadius:6,border:'1.5px solid var(--cinza-borda)',background:pag_===1?'var(--cinza-bg)':'#fff',cursor:pag_===1?'not-allowed':'pointer',fontWeight:600,fontSize:13 }}>‹</button>
            {Array.from({length:Math.min(5,totalPag)},(_,i)=>{const s=Math.max(1,Math.min(pag_-2,totalPag-4));const p2=s+i;return<button key={p2} onClick={()=>go(p2)} style={{padding:'5px 10px',borderRadius:6,border:`1.5px solid ${p2===pag_?'var(--azul)':'var(--cinza-borda)'}`,background:p2===pag_?'var(--azul)':'#fff',color:p2===pag_?'#fff':'var(--grafite)',cursor:'pointer',fontWeight:600,fontSize:13}}>{p2}</button>})}
            <button onClick={()=>go(pag_+1)}  disabled={pag_===totalPag} style={{ padding:'5px 10px',borderRadius:6,border:'1.5px solid var(--cinza-borda)',background:pag_===totalPag?'var(--cinza-bg)':'#fff',cursor:pag_===totalPag?'not-allowed':'pointer',fontWeight:600,fontSize:13 }}>›</button>
            <button onClick={()=>go(totalPag)} disabled={pag_===totalPag} style={{ padding:'5px 10px',borderRadius:6,border:'1.5px solid var(--cinza-borda)',background:pag_===totalPag?'var(--cinza-bg)':'#fff',cursor:pag_===totalPag?'not-allowed':'pointer',fontWeight:600,fontSize:13 }}>»</button>
          </div>
        </div>
      </div>
    </main>
  )
}
