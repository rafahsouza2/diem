'use client'

import { useState, useEffect, useMemo } from 'react'

/* ── Tipos ─────────────────────────────────────────────────── */
interface Resumo {
  total: number; valTotal: number
  amhp:      { qtd: number; val: number }
  particular:{ qtd: number; val: number }
  outraOp:   { qtd: number; val: number }
}
interface MesItem { mes: string; qtdAMHP: number; valAMHP: number; qtdPart: number; valPart: number; qtdOther: number; valOther: number }
interface ConvItem { conv: string; qtd: number; val: number; cat: string }
interface ProcItem { proc: string; qtd: number; val: number }
interface Particular { dt: string; pac: string; proc: string; val: number }
interface NAData {
  resumo:       Resumo
  mensal:       MesItem[]
  topConvenios: ConvItem[]
  topProcsAMHP: ProcItem[]
  topParticular:ProcItem[]
  topOutraOp:   ProcItem[]
  particulares: Particular[]
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
function fmtMes(m: string) {
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const [y, mo] = m.split('-')
  return `${meses[+mo - 1]}/${y.slice(2)}`
}
function btnStyle(disabled: boolean, active = false): React.CSSProperties {
  return { padding: '5px 10px', borderRadius: 6, border: '1.5px solid var(--cinza-borda)', background: active ? 'var(--azul)' : '#fff', color: active ? '#fff' : disabled ? 'var(--cinza-borda)' : 'var(--grafite)', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13 }
}

const CAT_COR: Record<string, string> = { AMHP: 'var(--azul)', Particular: 'var(--verde)', OutraOp: 'var(--laranja)' }
const CAT_LABEL: Record<string, string> = { AMHP: 'Via AMHP', Particular: 'Particular', OutraOp: 'Outras operadoras' }
const PER_PAGE = 50

/* ── ABA ANÁLISE ─────────────────────────────────────────────── */
function AbaAnalise({ data }: { data: NAData }) {
  const { resumo, mensal, topConvenios } = data
  const totalVal = resumo.valTotal

  const pctAMHP  = Math.round(resumo.amhp.qtd      / resumo.total * 100)
  const pctPart  = Math.round(resumo.particular.qtd / resumo.total * 100)
  const pctOther = 100 - pctAMHP - pctPart

  /* Apenas meses com dados do período principal (Jan/2025–Abr/2026) */
  const mesalFiltrado = mensal.filter(m => m.mes >= '2025-01' && m.mes <= '2026-04')
  const maxQtdMes = Math.max(...mesalFiltrado.map(m => m.qtdAMHP + m.qtdPart + m.qtdOther), 1)
  const CHART_H = 130

  return (
    <div>
      {/* KPI row */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card azul"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Total Quitado</span>
          <span className="kpi-value">{fmtM(totalVal)}</span>
          <span className="kpi-badge up">▲ {resumo.total.toLocaleString('pt-BR')} registros · Jan/25–Abr/26</span>
        </div>
        <div className="kpi-card azul"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Via AMHP</span>
          <span className="kpi-value">{fmtM(resumo.amhp.val)}</span>
          <span className="kpi-badge up">▲ {resumo.amhp.qtd.toLocaleString('pt-BR')} registros · {pctAMHP}%</span>
        </div>
        <div className="kpi-card verde"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Particular</span>
          <span className="kpi-value">{fmtM(resumo.particular.val)}</span>
          <span className="kpi-badge up">▲ {resumo.particular.qtd.toLocaleString('pt-BR')} registros · {pctPart}%</span>
        </div>
        <div className="kpi-card laranja"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Outras operadoras</span>
          <span className="kpi-value">{fmtM(resumo.outraOp.val)}</span>
          <span className="kpi-badge up">▲ {resumo.outraOp.qtd.toLocaleString('pt-BR')} registros · {pctOther}%</span>
        </div>
      </div>

      {/* Distribuição visual */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Distribuição por Categoria</div>
        {[
          { label: 'Via AMHP', qtd: resumo.amhp.qtd, val: resumo.amhp.val, cor: 'var(--azul)', pct: pctAMHP },
          { label: 'Particular', qtd: resumo.particular.qtd, val: resumo.particular.val, cor: 'var(--verde)', pct: pctPart },
          { label: 'Outras operadoras', qtd: resumo.outraOp.qtd, val: resumo.outraOp.val, cor: 'var(--laranja)', pct: pctOther },
        ].map(c => (
          <div key={c.label} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</span>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <span style={{ color: 'var(--cinza-texto)' }}>{c.qtd.toLocaleString('pt-BR')} registros</span>
                <strong style={{ color: c.cor }}>{fmtM(c.val)}</strong>
                <span style={{ color: 'var(--cinza-texto)', width: 36, textAlign: 'right' }}>{c.pct}%</span>
              </div>
            </div>
            <div style={{ height: 10, background: 'var(--cinza-bg)', borderRadius: 6 }}>
              <div style={{ height: '100%', width: `${c.pct}%`, background: c.cor, borderRadius: 6 }}/>
            </div>
          </div>
        ))}
        <p style={{ fontSize: 11, color: 'var(--cinza-texto)', marginTop: 6 }}>
          <strong>Critério:</strong> Via AMHP = convênios AMH | Particular = pacientes sem convênio | Outras operadoras = GDF, ASSEFAZ, SIS Senado, BRB Saúde, etc.
        </p>
      </div>

      {/* Gráfico mensal empilhado */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div className="section-title">Evolução Mensal por Categoria</div>
          <div className="chart-legend">
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: 'var(--azul)' }}/>AMHP</div>
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: 'var(--verde)' }}/>Particular</div>
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: 'var(--laranja)' }}/>Outras op.</div>
          </div>
        </div>
        <div className="card-subtitle">Registros quitados por mês · Jan/2025–Abr/2026</div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: CHART_H + 30, minWidth: 600, paddingBottom: 24, position: 'relative' }}>
            {mesalFiltrado.map(m => {
              const tot = m.qtdAMHP + m.qtdPart + m.qtdOther
              const hA  = Math.round(m.qtdAMHP  / maxQtdMes * CHART_H)
              const hP  = Math.round(m.qtdPart  / maxQtdMes * CHART_H)
              const hO  = Math.round(m.qtdOther / maxQtdMes * CHART_H)
              return (
                <div key={m.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 28 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%', height: CHART_H }}
                    title={`${fmtMes(m.mes)}: ${tot.toLocaleString('pt-BR')} | AMHP ${m.qtdAMHP} | Part ${m.qtdPart} | Outras ${m.qtdOther}`}>
                    <div style={{ height: `${hO}px`, background: 'var(--laranja)', borderRadius: '2px 2px 0 0', opacity: 0.85 }}/>
                    <div style={{ height: `${hP}px`, background: 'var(--verde)', opacity: 0.85 }}/>
                    <div style={{ height: `${hA}px`, background: 'var(--azul)', borderRadius: '0 0 2px 2px', opacity: 0.85 }}/>
                  </div>
                  <span style={{ fontSize: 8, color: 'var(--cinza-texto)', marginTop: 3, textAlign: 'center' }}>{fmtMes(m.mes)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top convênios */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">Top Convênios por Registros Quitados</div>
          <span className="section-badge">excluindo particular</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Convênio</th>
                <th>Categoria</th>
                <th style={{ textAlign: 'right' }}>Qtd</th>
                <th style={{ textAlign: 'right' }}>Valor quitado</th>
              </tr>
            </thead>
            <tbody>
              {topConvenios.slice(0, 15).map((c, i) => (
                <tr key={c.conv}>
                  <td style={{ fontSize: 11, color: 'var(--cinza-texto)', width: 28 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, fontSize: 12 }}>{c.conv}</td>
                  <td>
                    <span className={`status-badge ${c.cat === 'AMHP' ? 's-andamento' : 's-pendente'}`}>
                      {CAT_LABEL[c.cat] ?? c.cat}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontSize: 12 }}>{c.qtd.toLocaleString('pt-BR')}</td>
                  <td style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--azul)' }}>{fmtM(c.val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ── ABA AMHP ───────────────────────────────────────────────── */
function AbaAMHP({ data }: { data: NAData }) {
  const { resumo, topProcsAMHP, topConvenios } = data
  const convAMHP = topConvenios.filter(c => c.cat === 'AMHP')
  const maxProc  = topProcsAMHP[0]?.val ?? 1
  const maxConv  = convAMHP[0]?.val ?? 1

  return (
    <div>
      <div style={{ background: 'rgba(42,171,187,0.06)', border: '1px solid rgba(42,171,187,0.25)', borderRadius: 10, padding: '14px 20px', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--azul)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Registros via plataforma AMHP</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--grafite)', marginTop: 2 }}>{resumo.amhp.qtd.toLocaleString('pt-BR')} registros · {fmtM(resumo.amhp.val)}</div>
        <p style={{ fontSize: 12, color: 'var(--cinza-texto)', marginTop: 6, lineHeight: 1.6 }}>
          Atendimentos quitados cujo convênio utiliza a plataforma <strong>AMHP</strong> (Saúde Caixa, Pró-Saúde TJDFT, Pró-Saúde Câmara, BACEN, Pró-Social, OMINT…).
          Estes registros foram faturados via AMHP e o pagamento foi confirmado no Smart.
        </p>
      </div>

      <div className="fat-row" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-header">
            <div className="section-title">Top Convênios AMHP</div>
            <span className="section-badge">por valor quitado</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {convAMHP.slice(0, 10).map((c, i) => {
              const pct = maxConv > 0 ? (c.val / maxConv) * 100 : 0
              return (
                <div key={c.conv} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 18, fontSize: 11, color: 'var(--cinza-texto)', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{c.conv}</span>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--azul)' }}>{fmtM(c.val)}</span>
                        <span style={{ fontSize: 10, color: 'var(--cinza-texto)', marginLeft: 6 }}>{c.qtd.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'var(--cinza-bg)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--azul)', borderRadius: 3, opacity: 0.8 }}/>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <div className="section-title">Top Procedimentos AMHP</div>
            <span className="section-badge">por valor</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {topProcsAMHP.map((p, i) => {
              const pct = maxProc > 0 ? (p.val / maxProc) * 100 : 0
              return (
                <div key={p.proc} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 18, fontSize: 11, color: 'var(--cinza-texto)', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 600 }} title={p.proc}>{p.proc.length > 35 ? p.proc.slice(0, 35) + '…' : p.proc}</span>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--azul)' }}>{fmtM(p.val)}</span>
                        <span style={{ fontSize: 10, color: 'var(--cinza-texto)', marginLeft: 6 }}>{p.qtd}</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'var(--cinza-bg)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--azul)', borderRadius: 3, opacity: 0.8 }}/>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── ABA PARTICULARES ────────────────────────────────────────── */
function AbaParticular({ data }: { data: NAData }) {
  const { resumo, particulares, topParticular } = data
  const [busca,    setBusca]    = useState('')
  const [filtroAno,setFiltroAno]= useState('Todos')
  const [pagina,   setPagina]   = useState(1)

  const anos = useMemo(() => {
    const s = new Set<string>()
    particulares.forEach(r => { if (r.dt) s.add(r.dt.slice(0, 4)) })
    return ['Todos', ...Array.from(s).sort()]
  }, [particulares])

  const filtrados = useMemo(() => {
    const b = busca.toLowerCase()
    return particulares.filter(r => {
      if (filtroAno !== 'Todos' && !r.dt.startsWith(filtroAno)) return false
      if (b && !r.pac.toLowerCase().includes(b) && !r.proc.toLowerCase().includes(b)) return false
      return true
    })
  }, [particulares, busca, filtroAno])

  const totalPag = Math.ceil(filtrados.length / PER_PAGE)
  const pag_     = Math.min(pagina, totalPag || 1)
  const paginados= filtrados.slice((pag_ - 1) * PER_PAGE, pag_ * PER_PAGE)
  const valFilt  = filtrados.reduce((s, r) => s + r.val, 0)
  const maxProc  = topParticular[0]?.val ?? 1
  function go(p: number) { setPagina(Math.max(1, Math.min(p, totalPag))) }

  return (
    <div>
      {/* Alerta */}
      <div style={{ background: 'rgba(125,154,58,0.08)', border: '1px solid rgba(125,154,58,0.3)', borderRadius: 10, padding: '14px 20px', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--verde)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Atendimentos Particulares Quitados</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--grafite)', marginTop: 2 }}>{resumo.particular.qtd.toLocaleString('pt-BR')} registros · {fmtM(resumo.particular.val)}</div>
        <p style={{ fontSize: 12, color: 'var(--cinza-texto)', marginTop: 6, lineHeight: 1.6 }}>
          Atendimentos sem código de convênio — pagamento direto pelo paciente. Não passam pela plataforma AMHP e não geram faturamento de plano de saúde.
        </p>
      </div>

      {/* Top procedimentos */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div className="section-title">Top Procedimentos Particulares</div>
          <span className="section-badge">por valor total recebido</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {topParticular.slice(0, 12).map((p, i) => {
            const pct = maxProc > 0 ? (p.val / maxProc) * 100 : 0
            return (
              <div key={p.proc} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 22, fontSize: 11, color: 'var(--cinza-texto)', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }} title={p.proc}>{p.proc.length > 40 ? p.proc.slice(0, 40) + '…' : p.proc}</span>
                    <div style={{ flexShrink: 0, marginLeft: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--verde)' }}>{fmtM(p.val)}</span>
                      <span style={{ fontSize: 10, color: 'var(--cinza-texto)', marginLeft: 6 }}>{p.qtd} atend.</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: 'var(--cinza-bg)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--verde)', borderRadius: 3, opacity: 0.85 }}/>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabela completa */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="header-search" style={{ maxWidth: 320, margin: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="search" placeholder="Paciente ou procedimento..." value={busca} onChange={e => { setBusca(e.target.value); setPagina(1) }}/>
            </div>
            <div className="period-tabs">
              {anos.map(a => (
                <button key={a} className={`period-tab${filtroAno === a ? ' active' : ''}`} onClick={() => { setFiltroAno(a); setPagina(1) }}>{a}</button>
              ))}
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--cinza-texto)' }}>
              <strong style={{ color: 'var(--grafite)' }}>{filtrados.length.toLocaleString('pt-BR')}</strong> registros · <strong style={{ color: 'var(--verde)' }}>{fmtM(valFilt)}</strong>
            </span>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Paciente</th>
                <th>Procedimento</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map((r, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{fmtDate(r.dt)}</td>
                  <td style={{ fontSize: 12, fontWeight: 600 }}>{r.pac}</td>
                  <td style={{ fontSize: 11, color: 'var(--cinza-texto)' }}>{r.proc || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 12, color: 'var(--verde)' }}>R$ {fmt(r.val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPag > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderTop: '1px solid var(--cinza-borda)', fontSize: 13 }}>
            <span style={{ color: 'var(--cinza-texto)' }}>Página <strong>{pag_}</strong> de <strong>{totalPag}</strong></span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => go(1)}       disabled={pag_ === 1}        style={btnStyle(pag_ === 1)}>«</button>
              <button onClick={() => go(pag_ - 1)}disabled={pag_ === 1}        style={btnStyle(pag_ === 1)}>‹</button>
              {Array.from({ length: Math.min(5, totalPag) }, (_, i) => { const start = Math.max(1, Math.min(pag_ - 2, totalPag - 4)); const p = start + i; return <button key={p} onClick={() => go(p)} style={btnStyle(false, p === pag_)}>{p}</button> })}
              <button onClick={() => go(pag_ + 1)}disabled={pag_ === totalPag} style={btnStyle(pag_ === totalPag)}>›</button>
              <button onClick={() => go(totalPag)} disabled={pag_ === totalPag} style={btnStyle(pag_ === totalPag)}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── ABA OUTRAS OPERADORAS ───────────────────────────────────── */
function AbaOutraOp({ data }: { data: NAData }) {
  const { resumo, topConvenios, topOutraOp } = data
  const convOther = topConvenios.filter(c => c.cat === 'OutraOp')
  const maxConv   = convOther[0]?.val ?? 1
  const maxProc   = topOutraOp[0]?.val ?? 1

  return (
    <div>
      <div style={{ background: 'rgba(232,114,42,0.07)', border: '1px solid rgba(232,114,42,0.3)', borderRadius: 10, padding: '14px 20px', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--laranja)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Outras operadoras — não utilizam AMHP</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--grafite)', marginTop: 2 }}>{resumo.outraOp.qtd.toLocaleString('pt-BR')} registros · {fmtM(resumo.outraOp.val)}</div>
        <p style={{ fontSize: 12, color: 'var(--cinza-texto)', marginTop: 6, lineHeight: 1.6 }}>
          Convênios que <strong>não usam a plataforma AMHP</strong> — GDF/DF Legal, ASSEFAZ, SIS Senado, BRB Saúde, Planassiste MPU, etc.
          O faturamento desses convênios ocorre diretamente, sem passar pelo sistema AMHP.
        </p>
      </div>

      <div className="fat-row">
        <div className="card">
          <div className="section-header">
            <div className="section-title">Top Convênios</div>
            <span className="section-badge">por valor quitado</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {convOther.slice(0, 12).map((c, i) => {
              const pct = maxConv > 0 ? (c.val / maxConv) * 100 : 0
              return (
                <div key={c.conv} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 18, fontSize: 11, color: 'var(--cinza-texto)', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{c.conv}</span>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--laranja)' }}>{fmtM(c.val)}</span>
                        <span style={{ fontSize: 10, color: 'var(--cinza-texto)', marginLeft: 6 }}>{c.qtd.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'var(--cinza-bg)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--laranja)', borderRadius: 3, opacity: 0.8 }}/>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <div className="section-title">Top Procedimentos</div>
            <span className="section-badge">por valor</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {topOutraOp.slice(0, 12).map((p, i) => {
              const pct = maxProc > 0 ? (p.val / maxProc) * 100 : 0
              return (
                <div key={p.proc} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 18, fontSize: 11, color: 'var(--cinza-texto)', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 600 }} title={p.proc}>{p.proc.length > 35 ? p.proc.slice(0, 35) + '…' : p.proc}</span>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--laranja)' }}>{fmtM(p.val)}</span>
                        <span style={{ fontSize: 10, color: 'var(--cinza-texto)', marginLeft: 6 }}>{p.qtd.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'var(--cinza-bg)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--laranja)', borderRadius: 3, opacity: 0.8 }}/>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── COMPONENTE PRINCIPAL ────────────────────────────────────── */
export default function NovaAnalise() {
  const [data,    setData]    = useState<NAData | null>(null)
  const [loading, setLoading] = useState(true)
  const [aba,     setAba]     = useState<'analise' | 'amhp' | 'particular' | 'outraop'>('analise')

  useEffect(() => {
    fetch('/data/nova_analise.json')
      .then(r => r.json())
      .then((d: NAData) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <main className="main-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 14, color: 'var(--cinza-texto)' }}>
        <div className="spinner" style={{ borderColor: 'rgba(42,171,187,0.2)', borderTopColor: 'var(--azul)' }}/>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--grafite)' }}>Carregando análise...</div>
          <div style={{ fontSize: 12, marginTop: 2 }}>52.841 registros de quitação Smart</div>
        </div>
      </div>
    </main>
  )
  if (!data) return <main className="main-content"><p style={{ color: 'var(--vermelho)' }}>Erro ao carregar dados.</p></main>

  const abas = [
    { id: 'analise',   label: 'Análise Geral',                                             iconPath: 'M18 20 L18 10 M12 20 L12 4 M6 20 L6 14' },
    { id: 'amhp',      label: `Via AMHP (${data.resumo.amhp.qtd.toLocaleString('pt-BR')})`, iconPath: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 L12 14.01 9 11.01' },
    { id: 'particular',label: `Particular (${data.resumo.particular.qtd.toLocaleString('pt-BR')})`, iconPath: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7 a4 4 0 1 0 0-8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
    { id: 'outraop',   label: `Outras op. (${data.resumo.outraOp.qtd.toLocaleString('pt-BR')})`, iconPath: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' },
  ] as const

  return (
    <main className="main-content">
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--grafite)' }}>
              Análise <span style={{ color: 'var(--azul)' }}>/ Nova Análise</span>
            </h1>
            <p style={{ fontSize: 13, color: 'var(--cinza-texto)', marginTop: 2 }}>
              Relatório de Quitação Smart · Jan/2025 – Abr/2026 · <strong>{data.resumo.total.toLocaleString('pt-BR')} registros</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--cinza-bg)', padding: 4, borderRadius: 10, flexWrap: 'wrap' }}>
            {abas.map(a => (
              <button key={a.id}
                className={`period-tab${aba === a.id ? ' active' : ''}`}
                onClick={() => setAba(a.id as typeof aba)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={a.iconPath}/>
                </svg>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {aba === 'analise'    && <AbaAnalise    data={data} />}
      {aba === 'amhp'       && <AbaAMHP       data={data} />}
      {aba === 'particular' && <AbaParticular data={data} />}
      {aba === 'outraop'    && <AbaOutraOp    data={data} />}
    </main>
  )
}
