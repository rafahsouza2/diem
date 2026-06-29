'use client'

import { useState, useEffect, useMemo } from 'react'

/* ── Tipos ─────────────────────────────────────────────── */
interface MesItem  { mes:string; qtd:number; val:number; fat:number; pen:number; ab:number }
interface ProcItem { cod:string; proc:string; qtd:number; val:number }
interface StItem   { st:string; qtd:number; val:number }
interface Registro { dt:string; pac:string; cod:string; proc:string; val:number; st:string }
interface SSAData  {
  resumo: { total:number; valor:number; ticketMedio:number }
  mensal: MesItem[]
  procedimentos: ProcItem[]
  status: StItem[]
  registros: Registro[]
}

/* ── Helpers ────────────────────────────────────────────── */
function fmtM(v: number) {
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtData(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function topProcs(regs: Registro[], n = 20): ProcItem[] {
  const map: Record<string, ProcItem> = {}
  for (const r of regs) {
    const k = `${r.cod}|${r.proc}`
    if (!map[k]) map[k] = { cod: r.cod, proc: r.proc, qtd: 0, val: 0 }
    map[k].qtd += 1
    map[k].val += r.val
  }
  return Object.values(map).sort((a, b) => b.val - a.val).slice(0, n)
}

function agruparMes(regs: Registro[]): Array<{ mes: string; qtd: number; val: number }> {
  const map: Record<string, { qtd: number; val: number }> = {}
  for (const r of regs) {
    if (!r.dt) continue
    const mes = r.dt.slice(5, 7) + '/' + r.dt.slice(0, 4)
    if (!map[mes]) map[mes] = { qtd: 0, val: 0 }
    map[mes].qtd += 1
    map[mes].val += r.val
  }
  return Object.entries(map)
    .sort(([a], [b]) => {
      const [ma, ya] = a.split('/'); const [mb, yb] = b.split('/')
      return new Date(+ya, +ma - 1).getTime() - new Date(+yb, +mb - 1).getTime()
    })
    .map(([mes, v]) => ({ mes, ...v }))
}

/* ── Componente principal ───────────────────────────────── */
export default function SmartSemAMHP() {
  const [data,    setData]    = useState<SSAData | null>(null)
  const [loading, setLoading] = useState(true)
  const [aba,     setAba]     = useState<'analise' | 'atendimentos' | 'particular'>('analise')

  useEffect(() => {
    fetch('/data/smart_sem_amhp.json')
      .then(r => r.json())
      .then((d: SSAData) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  /* Sem código = Particular */
  const semPart  = useMemo(() => data?.registros.filter(r => r.cod && r.cod.trim() !== '') ?? [], [data])
  const sooPart  = useMemo(() => data?.registros.filter(r => !r.cod || r.cod.trim() === '') ?? [], [data])

  const totalSP  = useMemo(() => semPart.reduce((s, r) => s + r.val, 0), [semPart])
  const totalPart= useMemo(() => sooPart.reduce((s, r) => s + r.val, 0), [sooPart])

  if (loading) return (
    <div className="page-loading"><div className="spinner"/><span>Carregando dados...</span></div>
  )
  if (!data) return <div className="page-loading"><span>Erro ao carregar dados.</span></div>

  return (
    <div className="fat-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Smart — Fora da AMHP</h1>
          <p className="page-subtitle">Atendimentos registrados no Smart sem correspondência na plataforma AMHP</p>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--cinza-texto)' }}>
            <div>Faturado/Aberto: <strong style={{ color: 'var(--grafite)' }}>{semPart.length.toLocaleString('pt-BR')} reg. · {fmtM(totalSP)}</strong></div>
            <div>Particular: <strong style={{ color: 'var(--verde)' }}>{sooPart.length.toLocaleString('pt-BR')} reg. · {fmtM(totalPart)}</strong></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab${aba === 'analise'      ? ' active' : ''}`} onClick={() => setAba('analise')}>Análise</button>
        <button className={`tab${aba === 'atendimentos' ? ' active' : ''}`} onClick={() => setAba('atendimentos')}>
          Atendimentos ({semPart.length.toLocaleString('pt-BR')})
        </button>
        <button className={`tab${aba === 'particular'   ? ' active' : ''}`} onClick={() => setAba('particular')}>
          Particular ({sooPart.length.toLocaleString('pt-BR')})
        </button>
      </div>

      {aba === 'analise'      && <AbaAnalise      regs={semPart} total={totalSP} mensal={data.mensal} />}
      {aba === 'atendimentos' && <AbaAtendimentos regs={semPart} titulo="Faturados/Em Aberto fora da AMHP" />}
      {aba === 'particular'   && <AbaParticular   regs={sooPart} total={totalPart} />}
    </div>
  )
}

/* ── ABA ANÁLISE (excluindo particulares) ────────────────── */
function AbaAnalise({ regs, total, mensal }: { regs: Registro[]; total: number; mensal: MesItem[] }) {
  const qtd    = regs.length
  const ticket = qtd > 0 ? total / qtd : 0
  const qtdAb  = useMemo(() => regs.filter(r => r.st === 'Aberto').length, [regs])
  const valAb  = useMemo(() => regs.filter(r => r.st === 'Aberto').reduce((s, r) => s + r.val, 0), [regs])
  const procs  = useMemo(() => topProcs(regs), [regs])
  const maxProc= procs[0]?.val ?? 1

  /* Mensal sem particulares: fat + ab */
  const mesalSP = useMemo(() =>
    mensal.map(m => ({ mes: m.mes, qtd: m.fat + m.ab, val: 0 }))
      .map((m, i) => ({ ...m, val: mensal[i].val * ((mensal[i].fat + mensal[i].ab) / (mensal[i].qtd || 1)) }))
  , [mensal])
  /* Usando agregação direto dos registros para valores exatos */
  const mesalExato = useMemo(() => agruparMes(regs), [regs])
  const CHART_H = 140
  const maxQtd  = Math.max(...mesalExato.map(m => m.qtd), 1)

  return (
    <div>
      {/* Alerta explicativo */}
      <div style={{
        background: '#fff8e1', border: '1.5px solid #f5c842', borderRadius: 10,
        padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 14, alignItems: 'flex-start'
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b8a020" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div style={{ fontSize: 13, lineHeight: 1.7 }}>
          <strong style={{ display: 'block', marginBottom: 2 }}>Faturados e Em Aberto fora da AMHP</strong>
          Esta análise mostra apenas atendimentos com status <strong>Faturado</strong> ou <strong>Em Aberto</strong> que não aparecem na AMHP.
          São {qtd.toLocaleString('pt-BR')} registros no valor de <strong>{fmtM(total)}</strong> — possivelmente faturados por convênios que não usam a plataforma AMHP (Unimed, Bradesco Saúde, etc.).
          Os atendimentos <strong>Particulares</strong> estão na aba dedicada ao lado.
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card azul"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Total fora da AMHP</span>
          <span className="kpi-value">{fmtM(total)}</span>
          <span className="kpi-badge up">▲ {qtd.toLocaleString('pt-BR')} atendimentos</span>
        </div>
        <div className="kpi-card verde"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Faturado</span>
          <span className="kpi-value">{fmtM(total - valAb)}</span>
          <span className="kpi-badge up">▲ {(qtd - qtdAb).toLocaleString('pt-BR')} atend.</span>
        </div>
        <div className="kpi-card laranja"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Em Aberto</span>
          <span className="kpi-value">{fmtM(valAb)}</span>
          <span className="kpi-badge down">▼ {qtdAb.toLocaleString('pt-BR')} atend. sem faturamento</span>
        </div>
        <div className="kpi-card azul"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Ticket Médio</span>
          <span className="kpi-value">{fmtM(ticket)}</span>
          <span className="kpi-badge up">▲ por atendimento</span>
        </div>
      </div>

      <div className="fat-row" style={{ marginBottom: 24 }}>
        {/* Gráfico mensal */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Evolução Mensal</div>
            <div className="chart-legend">
              <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: '#2AABBB' }}/>Faturado/Aberto</div>
            </div>
          </div>
          <div className="card-subtitle">Atendimentos não-particulares sem AMHP por mês</div>
          <div className="bar-chart-full" style={{ overflowX: 'auto' }}>
            {mesalExato.map(m => {
              const h = maxQtd > 0 ? Math.round((m.qtd / maxQtd) * CHART_H) : 1
              return (
                <div className="bar-group-full" key={m.mes} style={{ minWidth: 38 }}>
                  <div className="bar-full b2025" style={{ height: `${h}px` }}
                    title={`${m.mes}: ${m.qtd.toLocaleString('pt-BR')} · ${fmtM(m.val)}`}/>
                  <span className="bar-label-full" style={{ fontSize: 8 }}>{m.mes}</span>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4, borderTop: '1px dashed var(--cinza-borda)', paddingTop: 6 }}>
            {mesalExato.map(m => (
              <div key={m.mes} style={{ flex: 1, textAlign: 'center', minWidth: 38 }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--azul)' }}>{m.qtd.toLocaleString('pt-BR')}</div>
                <div style={{ fontSize: 7, color: 'var(--cinza-texto)' }}>{fmtM(m.val).replace('R$ ', '')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerta Em Aberto */}
        {valAb > 0 && (
          <div className="card" style={{ minWidth: 260, maxWidth: 320 }}>
            <div className="section-title" style={{ marginBottom: 16 }}>Atenção: Em Aberto</div>
            <div style={{
              background: '#fff3e0', border: '1.5px solid #E8722A', borderRadius: 10,
              padding: '18px', textAlign: 'center', marginBottom: 16
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--laranja)' }}>{fmtM(valAb)}</div>
              <div style={{ fontSize: 13, color: 'var(--cinza-texto)', marginTop: 4 }}>
                {qtdAb.toLocaleString('pt-BR')} atendimentos sem faturamento registrado
              </div>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--cinza-texto)' }}>
              Estes atendimentos foram realizados mas <strong style={{ color: 'var(--grafite)' }}>ainda não têm faturamento</strong> no Smart.
              Podem representar receita não cobrada ou lançamentos pendentes.
            </div>
            <div style={{ marginTop: 14, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--cinza-borda)' }}>
                <span style={{ color: 'var(--cinza-texto)' }}>% do total fora AMHP</span>
                <strong>{qtd > 0 ? Math.round(qtdAb / qtd * 100) : 0}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: 'var(--cinza-texto)' }}>Ticket médio em aberto</span>
                <strong>{qtdAb > 0 ? fmtM(valAb / qtdAb) : '—'}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top procedimentos */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">Top 20 Procedimentos fora da AMHP</div>
          <span className="section-badge">excluindo particulares · por valor total</span>
        </div>
        <div className="card-subtitle" style={{ marginBottom: 16 }}>Procedimentos com maior volume financeiro faturados fora da AMHP</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {procs.map((p, i) => {
            const pct = maxProc > 0 ? (p.val / maxProc) * 100 : 0
            return (
              <div key={`${p.cod}|${p.proc}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 20, fontSize: 11, color: 'var(--cinza-texto)', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }} title={p.proc}>
                      {p.proc.length > 42 ? p.proc.slice(0, 42) + '…' : p.proc}
                      {p.cod && <span style={{ fontSize: 10, color: 'var(--cinza-texto)', marginLeft: 6 }}>· {p.cod}</span>}
                    </span>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--azul)' }}>{fmtM(p.val)}</span>
                      <span style={{ fontSize: 10, color: 'var(--cinza-texto)', marginLeft: 6 }}>{p.qtd.toLocaleString('pt-BR')} atend.</span>
                    </div>
                  </div>
                  <div style={{ height: 7, background: 'var(--cinza-bg)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--azul)', borderRadius: 3, opacity: 0.8 }}/>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── ABA PARTICULAR ─────────────────────────────────────── */
function AbaParticular({ regs, total }: { regs: Registro[]; total: number }) {
  const qtd    = regs.length
  const ticket = qtd > 0 ? total / qtd : 0
  const procs  = useMemo(() => topProcs(regs), [regs])
  const maxProc= procs[0]?.val ?? 1
  const mesalExato = useMemo(() => agruparMes(regs), [regs])
  const distProcs  = useMemo(() => {
    const s = new Set<string>()
    regs.forEach(r => s.add(`${r.cod}|${r.proc}`))
    return s.size
  }, [regs])
  const CHART_H = 140
  const maxQtd  = Math.max(...mesalExato.map(m => m.qtd), 1)

  const [busca,    setBusca]    = useState('')
  const [filtroAno,setFiltroAno]= useState('Todos')
  const [pagina,   setPagina]   = useState(1)
  const POR_PAG = 50

  const anos = useMemo(() => {
    const s = new Set<string>()
    regs.forEach(r => { if (r.dt) s.add(r.dt.slice(0, 4)) })
    return ['Todos', ...Array.from(s).sort()]
  }, [regs])

  const filtrados = useMemo(() => {
    const b = busca.toLowerCase()
    return regs.filter(r => {
      if (filtroAno !== 'Todos' && !r.dt.startsWith(filtroAno)) return false
      if (b && !r.pac.toLowerCase().includes(b) &&
               !r.proc.toLowerCase().includes(b) &&
               !r.cod.toLowerCase().includes(b)) return false
      return true
    })
  }, [regs, busca, filtroAno])

  const totalPag = Math.ceil(filtrados.length / POR_PAG)
  const pagina_  = Math.min(pagina, totalPag || 1)
  const paginados= filtrados.slice((pagina_ - 1) * POR_PAG, pagina_ * POR_PAG)
  function go(p: number) { setPagina(Math.max(1, Math.min(p, totalPag))) }

  return (
    <div>
      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card verde"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Total Particular</span>
          <span className="kpi-value">{fmtM(total)}</span>
          <span className="kpi-badge up">▲ {qtd.toLocaleString('pt-BR')} atendimentos</span>
        </div>
        <div className="kpi-card verde"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Ticket Médio</span>
          <span className="kpi-value">{fmtM(ticket)}</span>
          <span className="kpi-badge up">▲ por atendimento particular</span>
        </div>
        <div className="kpi-card azul"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Procedimentos distintos</span>
          <span className="kpi-value">{distProcs.toLocaleString('pt-BR')}</span>
          <span className="kpi-badge up">▲ tipos de procedimento</span>
        </div>
        <div className="kpi-card azul"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Período</span>
          <span className="kpi-value" style={{ fontSize: 16 }}>
            {mesalExato[0]?.mes ?? '—'} – {mesalExato[mesalExato.length - 1]?.mes ?? '—'}
          </span>
          <span className="kpi-badge up">▲ {mesalExato.length} meses</span>
        </div>
      </div>

      <div className="fat-row" style={{ marginBottom: 24 }}>
        {/* Gráfico mensal */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Evolução Mensal — Particular</div>
          </div>
          <div className="card-subtitle">Atendimentos particulares por mês</div>
          <div className="bar-chart-full" style={{ overflowX: 'auto' }}>
            {mesalExato.map(m => {
              const h = maxQtd > 0 ? Math.round((m.qtd / maxQtd) * CHART_H) : 1
              return (
                <div className="bar-group-full" key={m.mes} style={{ minWidth: 38 }}>
                  <div className="bar-full" style={{ height: `${h}px`, background: 'var(--verde)' }}
                    title={`${m.mes}: ${m.qtd.toLocaleString('pt-BR')} · ${fmtM(m.val)}`}/>
                  <span className="bar-label-full" style={{ fontSize: 8 }}>{m.mes}</span>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4, borderTop: '1px dashed var(--cinza-borda)', paddingTop: 6 }}>
            {mesalExato.map(m => (
              <div key={m.mes} style={{ flex: 1, textAlign: 'center', minWidth: 38 }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--verde)' }}>{m.qtd}</div>
                <div style={{ fontSize: 7, color: 'var(--cinza-texto)' }}>{fmtM(m.val).replace('R$ ', '')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top procedimentos */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>Top 10 Procedimentos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {procs.slice(0, 10).map((p, i) => {
              const pct = maxProc > 0 ? (p.val / maxProc) * 100 : 0
              return (
                <div key={`${p.cod}|${p.proc}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 18, fontSize: 11, color: 'var(--cinza-texto)', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, alignItems: 'baseline' }}>
                      <span style={{ fontSize: 11, fontWeight: 600 }} title={p.proc}>
                        {p.proc.length > 30 ? p.proc.slice(0, 30) + '…' : p.proc}
                      </span>
                      <div style={{ flexShrink: 0, marginLeft: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--verde)' }}>{fmtM(p.val)}</span>
                        <span style={{ fontSize: 10, color: 'var(--cinza-texto)', marginLeft: 4 }}>{p.qtd} atend.</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'var(--cinza-bg)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--verde)', borderRadius: 3, opacity: 0.8 }}/>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card">
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="search-input" placeholder="Buscar por paciente, procedimento ou código..."
            value={busca} onChange={e => { setBusca(e.target.value); setPagina(1) }} style={{ flex: 1, minWidth: 260 }}/>
          <select className="filter-select" value={filtroAno} onChange={e => { setFiltroAno(e.target.value); setPagina(1) }}>
            {anos.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 12, color: 'var(--cinza-texto)', marginBottom: 10 }}>
          {filtrados.length.toLocaleString('pt-BR')} registros · {fmtM(filtrados.reduce((s, r) => s + r.val, 0))}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th><th>Paciente</th><th>Código</th><th>Procedimento</th><th style={{ textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map((r, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{fmtData(r.dt)}</td>
                  <td style={{ fontSize: 12, fontWeight: 600 }}>{r.pac}</td>
                  <td style={{ fontSize: 11, color: 'var(--cinza-texto)' }}>{r.cod}</td>
                  <td style={{ fontSize: 12 }}>{r.proc}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 12 }}>{fmtM(r.val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPag > 1 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => go(1)} disabled={pagina_ === 1}>«</button>
            <button className="page-btn" onClick={() => go(pagina_ - 1)} disabled={pagina_ === 1}>‹</button>
            {Array.from({ length: Math.min(7, totalPag) }, (_, idx) => {
              let p: number
              if (totalPag <= 7)              p = idx + 1
              else if (pagina_ <= 4)          p = idx + 1
              else if (pagina_ >= totalPag-3) p = totalPag - 6 + idx
              else                            p = pagina_ - 3 + idx
              return <button key={p} className={`page-btn${pagina_ === p ? ' active' : ''}`} onClick={() => go(p)}>{p}</button>
            })}
            <button className="page-btn" onClick={() => go(pagina_ + 1)} disabled={pagina_ === totalPag}>›</button>
            <button className="page-btn" onClick={() => go(totalPag)}   disabled={pagina_ === totalPag}>»</button>
            <span style={{ fontSize: 12, color: 'var(--cinza-texto)', marginLeft: 8 }}>
              pág. {pagina_} de {totalPag.toLocaleString('pt-BR')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── ABA ATENDIMENTOS ─────────────────────────────────────── */
function AbaAtendimentos({ regs, titulo }: { regs: Registro[]; titulo: string }) {
  const [busca,    setBusca]    = useState('')
  const [filtroSt, setFiltroSt] = useState('Todos')
  const [filtroAno,setFiltroAno]= useState('Todos')
  const [pagina,   setPagina]   = useState(1)
  const POR_PAG = 50

  const anos = useMemo(() => {
    const s = new Set<string>()
    regs.forEach(r => { if (r.dt) s.add(r.dt.slice(0, 4)) })
    return ['Todos', ...Array.from(s).sort()]
  }, [regs])

  const filtrados = useMemo(() => {
    const b = busca.toLowerCase()
    return regs.filter(r => {
      if (filtroSt  !== 'Todos' && r.st !== filtroSt)           return false
      if (filtroAno !== 'Todos' && !r.dt.startsWith(filtroAno)) return false
      if (b && !r.pac.toLowerCase().includes(b) &&
               !r.proc.toLowerCase().includes(b) &&
               !r.cod.toLowerCase().includes(b))                return false
      return true
    })
  }, [regs, busca, filtroSt, filtroAno])

  const totalPag = Math.ceil(filtrados.length / POR_PAG)
  const pagina_  = Math.min(pagina, totalPag || 1)
  const paginados= filtrados.slice((pagina_ - 1) * POR_PAG, pagina_ * POR_PAG)
  function go(p: number) { setPagina(Math.max(1, Math.min(p, totalPag))) }

  const ST_LABEL_AT: Record<string, string> = { Faturado: 'Faturado', Aberto: 'Em Aberto', P: 'Particular' }
  const ST_CLASS_AT: Record<string, string> = { Faturado: 's-andamento', Aberto: 's-pendente', P: 's-concluido' }

  return (
    <div className="card">
      <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 600, color: 'var(--grafite)' }}>{titulo}</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="search-input" placeholder="Buscar por paciente, procedimento ou código..."
          value={busca} onChange={e => { setBusca(e.target.value); setPagina(1) }} style={{ flex: 1, minWidth: 260 }}/>
        <select className="filter-select" value={filtroSt} onChange={e => { setFiltroSt(e.target.value); setPagina(1) }}>
          <option value="Todos">Todos os status</option>
          <option value="Faturado">Faturado</option>
          <option value="Aberto">Em Aberto</option>
        </select>
        <select className="filter-select" value={filtroAno} onChange={e => { setFiltroAno(e.target.value); setPagina(1) }}>
          {anos.map(a => <option key={a}>{a}</option>)}
        </select>
      </div>
      <div style={{ fontSize: 12, color: 'var(--cinza-texto)', marginBottom: 10 }}>
        {filtrados.length.toLocaleString('pt-BR')} registros · {fmtM(filtrados.reduce((s, r) => s + r.val, 0))}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th><th>Paciente</th><th>Código</th><th>Procedimento</th>
              <th style={{ textAlign: 'right' }}>Valor</th><th>Status</th><th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {paginados.map((r, i) => {
              const isParticular = !r.cod || r.cod.trim() === ''
              return (
              <tr key={i}>
                <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{fmtData(r.dt)}</td>
                <td style={{ fontSize: 12, fontWeight: 600 }}>{r.pac}</td>
                <td style={{ fontSize: 11, color: 'var(--cinza-texto)', fontFamily: 'monospace' }}>{r.cod || '—'}</td>
                <td style={{ fontSize: 12 }}>{r.proc}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 12 }}>{fmtM(r.val)}</td>
                <td><span className={`status-badge ${ST_CLASS_AT[r.st] ?? 's-pendente'}`}>{ST_LABEL_AT[r.st] ?? r.st}</span></td>
                <td>{isParticular && <span className="status-badge s-concluido">Particular</span>}</td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {totalPag > 1 && (
        <div className="pagination">
          <button className="page-btn" onClick={() => go(1)} disabled={pagina_ === 1}>«</button>
          <button className="page-btn" onClick={() => go(pagina_ - 1)} disabled={pagina_ === 1}>‹</button>
          {Array.from({ length: Math.min(7, totalPag) }, (_, idx) => {
            let p: number
            if (totalPag <= 7)              p = idx + 1
            else if (pagina_ <= 4)          p = idx + 1
            else if (pagina_ >= totalPag-3) p = totalPag - 6 + idx
            else                            p = pagina_ - 3 + idx
            return <button key={p} className={`page-btn${pagina_ === p ? ' active' : ''}`} onClick={() => go(p)}>{p}</button>
          })}
          <button className="page-btn" onClick={() => go(pagina_ + 1)} disabled={pagina_ === totalPag}>›</button>
          <button className="page-btn" onClick={() => go(totalPag)}    disabled={pagina_ === totalPag}>»</button>
          <span style={{ fontSize: 12, color: 'var(--cinza-texto)', marginLeft: 8 }}>
            pág. {pagina_} de {totalPag.toLocaleString('pt-BR')} · {filtrados.length.toLocaleString('pt-BR')} reg.
          </span>
        </div>
      )}
    </div>
  )
}
