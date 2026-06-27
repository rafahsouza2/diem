'use client'

import { useState, useEffect, useMemo } from 'react'

/* ── TIPOS ─────────────────────────────────────────────── */
interface Atendimento {
  dt: string
  cod: string
  proc: string
  st: string
  val: number
  pac: string
  cid: string
}

/* ── DADOS ESTÁTICOS (KPIs / Gráficos) ─────────────────── */
const dadosMensais = [
  { mes: 'Jan/25', ano: 2025, fat: 892855.94,  atend: 4828, ticket: 184.93 },
  { mes: 'Fev/25', ano: 2025, fat: 1041941.83, atend: 5300, ticket: 196.59 },
  { mes: 'Mar/25', ano: 2025, fat: 840364.89,  atend: 3905, ticket: 215.20 },
  { mes: 'Abr/25', ano: 2025, fat: 721122.68,  atend: 4430, ticket: 162.78 },
  { mes: 'Mai/25', ano: 2025, fat: 568403.49,  atend: 4142, ticket: 137.23 },
  { mes: 'Jun/25', ano: 2025, fat: 790697.91,  atend: 3593, ticket: 220.07 },
  { mes: 'Jul/25', ano: 2025, fat: 919323.00,  atend: 3733, ticket: 246.27 },
  { mes: 'Ago/25', ano: 2025, fat: 976153.18,  atend: 4348, ticket: 224.51 },
  { mes: 'Set/25', ano: 2025, fat: 1071384.95, atend: 4299, ticket: 249.22 },
  { mes: 'Out/25', ano: 2025, fat: 878642.17,  atend: 4185, ticket: 209.95 },
  { mes: 'Nov/25', ano: 2025, fat: 663181.49,  atend: 3288, ticket: 201.70 },
  { mes: 'Dez/25', ano: 2025, fat: 658354.79,  atend: 3390, ticket: 194.20 },
  { mes: 'Jan/26', ano: 2026, fat: 869464.87,  atend: 3650, ticket: 238.21 },
  { mes: 'Fev/26', ano: 2026, fat: 868262.61,  atend: 3659, ticket: 237.30 },
  { mes: 'Mar/26', ano: 2026, fat: 907967.02,  atend: 4232, ticket: 214.55 },
  { mes: 'Abr/26', ano: 2026, fat: 89565.62,   atend: 356,  ticket: 251.59, parcial: true },
]

const procedimentos = [
  { nome: 'Ácido Hialurônico',      cod: '102219346', atend: 121,  fat: 2223396.20 },
  { nome: 'PRO EMAG',               cod: '2037010',   atend: 55,   fat: 814150.07  },
  { nome: 'Doppler Órgão ISO',       cod: '40901386',  atend: 4303, fat: 632319.08  },
  { nome: 'Doppler Venoso MMII',     cod: '40901483',  atend: 2212, fat: 508588.19  },
  { nome: 'Cons. Clínica Médica',    cod: '10101012',  atend: 4367, fat: 504880.65  },
  { nome: 'Doppler Art. MMII',       cod: '40901475',  atend: 2236, fat: 491836.00  },
  { nome: 'Protocolo Tirzepatida',   cod: '0000082749',atend: 59,   fat: 469265.52  },
  { nome: 'Cons. Endocrinologista',  cod: '40901467',  atend: 3701, fat: 425547.23  },
  { nome: 'Doppler Venoso MMSS',     cod: '40901459',  atend: 1719, fat: 390366.22  },
  { nome: 'Doppler Art. MMSS',       cod: '40103528',  atend: 1730, fat: 372107.12  },
]

const statusFat = [
  { label: 'Faturado', valor: 11922003.79, qtd: 57642, cor: '#7D9A3A', pct: 93.5 },
  { label: 'Pendente', valor: 425437.84,   qtd: 2607,  cor: '#E8722A', pct: 3.3  },
  { label: 'Aberto',   valor: 410244.81,   qtd: 1089,  cor: '#2AABBB', pct: 3.2  },
]

const comparativo = [
  { mes: 'Jan', fat2025: 892855.94,  fat2026: 869464.87 },
  { mes: 'Fev', fat2025: 1041941.83, fat2026: 868262.61 },
  { mes: 'Mar', fat2025: 840364.89,  fat2026: 907967.02 },
]

const COLORS = ['#2AABBB','#1D8A99','#7D9A3A','#E8722A','#5a7a1a','#c95c1c','#155F6B','#b8a020','#40766e','#3B3B3B']
const MAX_FAT  = 1_100_000
const MAX_PROC = procedimentos[0].fat
const MAX_COMP = 1_100_000
const CHART_H  = 160
const PER_PAGE = 50

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtM(v: number) {
  if (v >= 1_000_000) return `R$ ${(v/1_000_000).toFixed(2).replace('.',',')}M`
  if (v >= 1_000)     return `R$ ${(v/1_000).toFixed(1).replace('.',',')}K`
  return `R$ ${fmt(v)}`
}
function statusClass(s: string) {
  if (s === 'Faturado') return 's-concluido'
  if (s === 'P' || s === 'Pendente') return 's-pendente'
  if (s === 'Aberto')  return 's-andamento'
  return 's-pendente'
}
function fmtDate(dt: string) {
  if (!dt) return '—'
  const [y, m, d] = dt.split('-')
  return `${d}/${m}/${y}`
}

/* ── ABA ANÁLISE ────────────────────────────────────────── */
function AbaAnalise() {
  return (
    <div>
      {/* Insights */}
      <div className="insight-strip">
        <div className="insight-card">
          <div className="insight-label">Faturamento Total do Período</div>
          <div className="insight-value">R$ 12,75M</div>
          <div className="insight-sub">Jan/2025 – Abr/2026 · 16 meses</div>
        </div>
        <div className="insight-card laranja-g">
          <div className="insight-label">Pico Mensal — Set/2025</div>
          <div className="insight-value">R$ 1,07M</div>
          <div className="insight-sub">4.299 atendimentos · ticket R$ 249</div>
        </div>
        <div className="insight-card verde-g">
          <div className="insight-label">Faturamento 2025 (12 meses)</div>
          <div className="insight-value">R$ 10,02M</div>
          <div className="insight-sub">49.441 atend · ticket médio crescente</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card verde"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Faturamento Total</span>
          <span className="kpi-value">R$ 12,75M</span>
          <span className="kpi-badge up">▲ período completo</span>
        </div>
        <div className="kpi-card azul"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Total Atendimentos</span>
          <span className="kpi-value">61.338</span>
          <span className="kpi-badge up">▲ com valor registrado</span>
        </div>
        <div className="kpi-card laranja"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Ticket Médio Geral</span>
          <span className="kpi-value">R$ 207,99</span>
          <span className="kpi-badge up">▲ por atendimento</span>
        </div>
        <div className="kpi-card verm"><div className="kpi-icon-bg"/>
          <span className="kpi-label">A Receber</span>
          <span className="kpi-value">R$ 835K</span>
          <span className="kpi-badge down">▼ pendente + aberto</span>
        </div>
      </div>

      {/* Gráfico mensal */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div className="section-title">Evolução Mensal do Faturamento</div>
          <div className="chart-legend">
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background:'#2AABBB' }}/>2025</div>
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background:'#E8722A' }}/>2026</div>
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background:'#7D9A3A' }}/>Pico</div>
          </div>
        </div>
        <div className="card-subtitle">Receita bruta mensal · Jan/25–Abr/26</div>
        <div className="bar-chart-full">
          {dadosMensais.map((d) => {
            const h = Math.max(Math.round((d.fat/MAX_FAT)*CHART_H), 3)
            const cls = d.fat === 1071384.95 ? 'b-pico' : d.ano === 2025 ? 'b2025' : 'b2026'
            return (
              <div className="bar-group-full" key={d.mes}>
                <div className={`bar-full ${cls}`} style={{ height:`${h}px` }}
                  title={`${d.mes}: R$ ${fmt(d.fat)} | ${d.atend.toLocaleString('pt-BR')} atend${(d as {parcial?:boolean}).parcial?' (parcial)':''}`}/>
                <span className="bar-label-full">{d.mes}</span>
              </div>
            )
          })}
        </div>
        <div style={{ display:'flex', gap:6, marginTop:4 }}>
          {dadosMensais.map((d) => (
            <div key={d.mes} style={{ flex:1, textAlign:'center', fontSize:9, color:'var(--cinza-texto)' }}>
              {fmtM(d.fat)}
            </div>
          ))}
        </div>
      </div>

      {/* Procedimentos + Status */}
      <div className="fat-row" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-header">
            <div className="section-title">Top 10 Procedimentos</div>
            <span className="section-badge">por faturamento</span>
          </div>
          <div className="hbar-list">
            {procedimentos.map((p, i) => (
              <div className="hbar-item" key={p.cod}>
                <span className="hbar-rank">{i+1}º</span>
                <span className="hbar-name" title={p.nome}>{p.nome}</span>
                <div className="hbar-track">
                  <div className="hbar-fill" style={{ width:`${(p.fat/MAX_PROC)*100}%`, background: COLORS[i] }}>
                    <span>{fmtM(p.fat)}</span>
                  </div>
                </div>
                <span className="hbar-qtd">{p.atend.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          {/* Donut */}
          <div className="card">
            <div className="section-title" style={{ marginBottom:16 }}>Status de Faturamento</div>
            <div className="donut-wrap">
              <svg className="donut-svg" viewBox="0 0 150 150">
                <circle cx="75" cy="75" r="58" fill="none" stroke="#f0f3f6" strokeWidth="22"/>
                <circle cx="75" cy="75" r="58" fill="none" stroke="#7D9A3A" strokeWidth="22"
                  strokeDasharray="340.4 23.9" strokeDashoffset="91" transform="rotate(-90 75 75)"/>
                <circle cx="75" cy="75" r="58" fill="none" stroke="#E8722A" strokeWidth="22"
                  strokeDasharray="12.0 352.3" strokeDashoffset="-249.4" transform="rotate(-90 75 75)"/>
                <circle cx="75" cy="75" r="58" fill="none" stroke="#2AABBB" strokeWidth="22"
                  strokeDasharray="11.7 352.6" strokeDashoffset="-261.4" transform="rotate(-90 75 75)"/>
                <text x="75" y="70" textAnchor="middle" fontSize="15" fontWeight="800" fill="#3B3B3B">93,5%</text>
                <text x="75" y="85" textAnchor="middle" fontSize="9" fill="#7A8A99">faturado</text>
              </svg>
              <div className="donut-legend">
                {statusFat.map((s) => (
                  <div className="legend-item" key={s.label}>
                    <div className="legend-dot" style={{ background:s.cor }}/>
                    <span>{s.label} {s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:6 }}>
              {statusFat.map((s) => (
                <div key={s.label} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                  <span style={{ color:'var(--cinza-texto)' }}>{s.label} ({s.qtd.toLocaleString('pt-BR')})</span>
                  <strong>R$ {fmt(s.valor)}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Comparativo */}
          <div className="card">
            <div className="section-title" style={{ marginBottom:4 }}>2025 vs 2026</div>
            <div className="card-subtitle">Mesmos meses · crescimento YoY</div>
            <div className="comparativo-grid">
              {comparativo.map((c) => {
                const delta = (c.fat2026 - c.fat2025) / c.fat2025 * 100
                const up = delta >= 0
                return (
                  <div className="comp-row" key={c.mes}>
                    <span className="comp-mes">{c.mes}</span>
                    <div className="comp-bars">
                      <div className="comp-bar-row">
                        <div style={{ width:`${(c.fat2025/MAX_COMP)*100}%`, height:10, background:'#2AABBB', borderRadius:2 }}/>
                        <span className="comp-bar-val">{fmtM(c.fat2025)}</span>
                      </div>
                      <div className="comp-bar-row">
                        <div style={{ width:`${(c.fat2026/MAX_COMP)*100}%`, height:10, background:'#E8722A', borderRadius:2 }}/>
                        <span className="comp-bar-val">{fmtM(c.fat2026)}</span>
                      </div>
                    </div>
                    <span className={`comp-delta ${up?'up':'down'}`}>{up?'▲':'▼'} {Math.abs(delta).toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket médio */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">Ticket Médio por Mês</div>
          <span className="section-badge">R$ por atendimento</span>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'flex-end', height:140, paddingBottom:28, position:'relative' }}>
          <div style={{ position:'absolute', left:0, right:0, bottom:28, borderBottom:'1px dashed var(--cinza-borda)' }}/>
          {dadosMensais.map((d) => {
            const h = Math.round((d.ticket/260)*110)
            return (
              <div key={d.mes} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5, height:'100%', justifyContent:'flex-end' }}>
                <div style={{ width:'100%', height:`${Math.max(h,3)}px`,
                  background: d.ticket>=240?'var(--verde)':d.ano===2026?'var(--laranja)':'var(--azul)',
                  borderRadius:'4px 4px 0 0', cursor:'pointer' }}
                  title={`${d.mes}: R$ ${fmt(d.ticket)}`}/>
                <span style={{ fontSize:9, color:'var(--cinza-texto)', whiteSpace:'nowrap' }}>{d.mes}</span>
              </div>
            )
          })}
        </div>
        <div style={{ display:'flex', gap:6, marginTop:2 }}>
          {dadosMensais.map((d) => (
            <div key={d.mes} style={{ flex:1, textAlign:'center', fontSize:9,
              color:d.ticket>=240?'#5a7a1a':'var(--cinza-texto)', fontWeight:d.ticket>=240?700:400 }}>
              {d.ticket.toFixed(0)}
            </div>
          ))}
        </div>
        <p style={{ marginTop:12, fontSize:12, color:'var(--cinza-texto)', padding:'10px 12px', background:'var(--cinza-bg)', borderRadius:8 }}>
          <strong style={{ color:'var(--grafite)' }}>Insight:</strong> Ticket cresceu de R$ 137 (Mai/25) para R$ 251 (Abr/26), refletindo mix de procedimentos de maior valor agregado ao longo do período.
        </p>
      </div>
    </div>
  )
}

/* ── ABA ATENDIMENTOS ───────────────────────────────────── */
function AbaAtendimentos() {
  const [dados, setDados] = useState<Atendimento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [filtroAno, setFiltroAno] = useState('Todos')
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    fetch('/data/atendimentos.json')
      .then((r) => r.json())
      .then((d: Atendimento[]) => { setDados(d); setCarregando(false) })
      .catch(() => setCarregando(false))
  }, [])

  const filtrados = useMemo(() => {
    let r = dados
    if (filtroStatus !== 'Todos') r = r.filter((x) => x.st === filtroStatus)
    if (filtroAno !== 'Todos')    r = r.filter((x) => x.dt.startsWith(filtroAno))
    if (busca.trim()) {
      const b = busca.toLowerCase()
      r = r.filter((x) =>
        x.proc.toLowerCase().includes(b) ||
        x.pac.toLowerCase().includes(b)  ||
        x.cod.includes(b)                ||
        x.cid.toLowerCase().includes(b)
      )
    }
    return r
  }, [dados, busca, filtroStatus, filtroAno])

  const totalPag  = Math.ceil(filtrados.length / PER_PAGE)
  const pagAtual  = filtrados.slice((pagina-1)*PER_PAGE, pagina*PER_PAGE)
  const totalFilt = filtrados.reduce((s, x) => s + x.val, 0)

  function changePage(p: number) {
    setPagina(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      {/* Barra de filtros */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div className="header-search" style={{ maxWidth:320, margin:0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="search" placeholder="Buscar procedimento, paciente, CID..."
            value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1) }}/>
        </div>

        <div className="period-tabs">
          {['Todos','2025','2026'].map((a) => (
            <button key={a} className={`period-tab${filtroAno===a?' active':''}`}
              onClick={() => { setFiltroAno(a); setPagina(1) }}>{a}</button>
          ))}
        </div>

        <div className="period-tabs">
          {['Todos','Faturado','P','Aberto'].map((s) => (
            <button key={s} className={`period-tab${filtroStatus===s?' active':''}`}
              onClick={() => { setFiltroStatus(s); setPagina(1) }}>
              {s === 'P' ? 'Pendente' : s}
            </button>
          ))}
        </div>

        <div style={{ marginLeft:'auto', display:'flex', gap:20, fontSize:13 }}>
          <span><strong style={{ color:'var(--azul)' }}>{filtrados.length.toLocaleString('pt-BR')}</strong> <span style={{ color:'var(--cinza-texto)' }}>registros</span></span>
          <span><strong style={{ color:'var(--verde)' }}>R$ {(totalFilt/1_000_000).toFixed(2).replace('.',',')}M</strong> <span style={{ color:'var(--cinza-texto)' }}>faturamento</span></span>
        </div>
      </div>

      {/* Tabela */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {carregando ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, gap:12, color:'var(--cinza-texto)' }}>
            <div className="spinner" style={{ borderColor:'rgba(42,171,187,0.3)', borderTopColor:'var(--azul)' }}/>
            Carregando 61.338 atendimentos...
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Cód. Proc.</th>
                  <th>Procedimento</th>
                  <th>Paciente</th>
                  <th>CID</th>
                  <th>Status</th>
                  <th style={{ textAlign:'right' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {pagAtual.map((row, i) => (
                  <tr key={i}>
                    <td style={{ whiteSpace:'nowrap', fontSize:12 }}>{fmtDate(row.dt)}</td>
                    <td style={{ fontFamily:'monospace', fontSize:11, color:'var(--cinza-texto)' }}>{row.cod}</td>
                    <td style={{ fontWeight:500, maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={row.proc}>{row.proc}</td>
                    <td style={{ fontSize:12, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={row.pac}>{row.pac}</td>
                    <td style={{ fontSize:11, color:'var(--cinza-texto)' }}>{row.cid||'—'}</td>
                    <td><span className={`status-badge ${statusClass(row.st)}`}>{row.st==='P'?'Pendente':row.st}</span></td>
                    <td style={{ textAlign:'right', fontWeight:700, whiteSpace:'nowrap' }}>R$ {fmt(row.val)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {!carregando && totalPag > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', borderTop:'1px solid var(--cinza-borda)', fontSize:13 }}>
            <span style={{ color:'var(--cinza-texto)' }}>
              Página <strong>{pagina}</strong> de <strong>{totalPag.toLocaleString('pt-BR')}</strong> · {PER_PAGE} por página
            </span>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={() => changePage(1)} disabled={pagina===1} style={btnStyle(pagina===1)}>«</button>
              <button onClick={() => changePage(pagina-1)} disabled={pagina===1} style={btnStyle(pagina===1)}>‹</button>
              {Array.from({ length: Math.min(5, totalPag) }, (_, i) => {
                const start = Math.max(1, Math.min(pagina-2, totalPag-4))
                const p = start + i
                return (
                  <button key={p} onClick={() => changePage(p)} style={btnStyle(false, p===pagina)}>
                    {p}
                  </button>
                )
              })}
              <button onClick={() => changePage(pagina+1)} disabled={pagina===totalPag} style={btnStyle(pagina===totalPag)}>›</button>
              <button onClick={() => changePage(totalPag)} disabled={pagina===totalPag} style={btnStyle(pagina===totalPag)}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function btnStyle(disabled: boolean, active = false): React.CSSProperties {
  return {
    padding: '5px 10px',
    borderRadius: 6,
    border: '1.5px solid var(--cinza-borda)',
    background: active ? 'var(--azul)' : '#fff',
    color: active ? '#fff' : disabled ? 'var(--cinza-borda)' : 'var(--grafite)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 600,
    fontSize: 13,
    fontFamily: 'inherit',
  }
}

/* ── COMPONENTE PRINCIPAL ───────────────────────────────── */
export default function SmartFaturamento() {
  const [aba, setAba] = useState<'analise' | 'atendimentos'>('analise')

  return (
    <main className="main-content">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'var(--grafite)' }}>
              Faturamento <span style={{ color:'var(--azul)' }}>/ Smart</span>
            </h1>
            <p style={{ fontSize:13, color:'var(--cinza-texto)', marginTop:2 }}>
              Atendimentos Smart · Jan/2025 – Abr/2026 · <strong>61.338 registros</strong> · Fonte: MedicWare
            </p>
          </div>
          <div style={{ display:'flex', gap:4, background:'var(--cinza-bg)', padding:4, borderRadius:10 }}>
            <button
              className={`period-tab${aba==='analise'?' active':''}`}
              onClick={() => setAba('analise')}
              style={{ display:'flex', alignItems:'center', gap:6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              Análise
            </button>
            <button
              className={`period-tab${aba==='atendimentos'?' active':''}`}
              onClick={() => setAba('atendimentos')}
              style={{ display:'flex', alignItems:'center', gap:6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Atendimentos
            </button>
          </div>
        </div>
      </div>

      {aba === 'analise' ? <AbaAnalise /> : <AbaAtendimentos />}
    </main>
  )
}
