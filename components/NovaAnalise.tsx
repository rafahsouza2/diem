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
interface SemMatch   { dt: string; pac: string; conv: string; proc: string; val: number }
interface CruzMes    { mes: string; qtdT1: number; valT1: number; qtdT2: number; valT2: number; qtdNao: number; valNao: number }
interface CruzConv   { conv: string; qtd: number; qtdT1: number; qtdT2: number; qtdNao: number; val: number }
interface Cruzamento {
  resumo: { total: number; foraPeriodo: number; valTotal: number; pctMatch: number; t1: { qtd: number; val: number }; t2: { qtd: number; val: number }; nao: { qtd: number; val: number } }
  mensal:   CruzMes[]
  porConv:  CruzConv[]
  semMatch: SemMatch[]
}
interface SmartFat {
  total: number; valTotal: number
  faturado:  { qtd: number; val: number }
  aberto:    { qtd: number; val: number }
  particular:{ qtd: number; val: number }
}
interface NAData {
  resumo:          Resumo
  mensal:          MesItem[]
  topConvenios:    ConvItem[]
  topProcsAMHP:    ProcItem[]
  topParticular:   ProcItem[]
  topOutraOp:      ProcItem[]
  particulares:    Particular[]
  cruzamento:      Cruzamento
  smartFaturamento:SmartFat
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

/* ── ABA CRUZAMENTO AMHP ─────────────────────────────────────── */
function AbaCruzamento({ data }: { data: NAData }) {
  const cruzamento = data.cruzamento

  const [busca,  setBusca]  = useState('')
  const [pagina, setPagina] = useState(1)

  const semMatchSrc = cruzamento?.semMatch ?? []
  const filtrados = useMemo(() => {
    if (!busca.trim()) return semMatchSrc
    const b = busca.toLowerCase()
    return semMatchSrc.filter(r => r.pac.toLowerCase().includes(b) || r.conv.toLowerCase().includes(b))
  }, [semMatchSrc, busca])

  if (!cruzamento) return (
    <div style={{ color: 'var(--cinza-texto)', padding: 40, textAlign: 'center' }}>
      Dados de cruzamento não disponíveis.
    </div>
  )

  const { resumo, mensal, porConv, semMatch } = cruzamento

  const totalPag = Math.ceil(filtrados.length / PER_PAGE)
  const pag_     = Math.min(pagina, totalPag || 1)
  const paginados= filtrados.slice((pag_ - 1) * PER_PAGE, pag_ * PER_PAGE)
  function go(p: number) { setPagina(Math.max(1, Math.min(p, totalPag))) }

  const CHART_H  = 120
  const maxQtdMes= Math.max(...mensal.map(m => m.qtdT1 + m.qtdT2 + m.qtdNao), 1)

  return (
    <div>
      {/* Cabeçalho explicativo */}
      <div style={{ background: 'rgba(42,171,187,0.06)', border: '1px solid rgba(42,171,187,0.25)', borderRadius: 10, padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--azul)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Cruzamento Quitação Smart × Extrato AMHP</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--grafite)', marginTop: 2 }}>{resumo.pctMatch}% match</div>
          <div style={{ fontSize: 12, color: 'var(--cinza-texto)', marginTop: 2 }}>{resumo.total.toLocaleString('pt-BR')} registros analisados · {fmtM(resumo.valTotal)} · período Nov/2024–Abr/2026</div>
        </div>
        <div style={{ flex: 1, fontSize: 12, color: 'var(--cinza-texto)', lineHeight: 1.7 }}>
          Cada registro <strong>quitado no Smart</strong> (categoria AMHP) foi buscado no <strong>extrato AMHP</strong> por paciente + data.
          <br/>Registros anteriores a Nov/2024 ({resumo.foraPeriodo.toLocaleString('pt-BR')}) foram excluídos por não estarem no extrato disponível.
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card verde"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Match exato (T1)</span>
          <span className="kpi-value">{resumo.t1.qtd.toLocaleString('pt-BR')}</span>
          <span className="kpi-badge up">▲ {fmtM(resumo.t1.val)} · mesma data</span>
        </div>
        <div className="kpi-card azul"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Match ±7 dias (T2)</span>
          <span className="kpi-value">{resumo.t2.qtd.toLocaleString('pt-BR')}</span>
          <span className="kpi-badge up">▲ {fmtM(resumo.t2.val)} · até 7 dias de diff</span>
        </div>
        <div className="kpi-card verm"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Sem match no AMHP</span>
          <span className="kpi-value">{resumo.nao.qtd.toLocaleString('pt-BR')}</span>
          <span className="kpi-badge down">▼ {fmtM(resumo.nao.val)} · {Math.round(resumo.nao.qtd / resumo.total * 100)}% do total</span>
        </div>
        <div className="kpi-card laranja"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Fora do período</span>
          <span className="kpi-value">{resumo.foraPeriodo.toLocaleString('pt-BR')}</span>
          <span className="kpi-badge">antes de Nov/2024 · sem extrato</span>
        </div>
      </div>

      {/* Gráfico mensal + breakdown convênio */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Mensal */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Evolução Mensal</div>
            <div className="chart-legend">
              <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: 'var(--verde)' }}/>T1 exato</div>
              <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: 'var(--azul)' }}/>T2 ±7d</div>
              <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: 'var(--vermelho)' }}/>Sem match</div>
            </div>
          </div>
          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: CHART_H + 24, minWidth: 340 }}>
              {mensal.map(m => {
                const tot = m.qtdT1 + m.qtdT2 + m.qtdNao
                const hT1  = Math.round(m.qtdT1  / maxQtdMes * CHART_H)
                const hT2  = Math.round(m.qtdT2  / maxQtdMes * CHART_H)
                const hNao = Math.round(m.qtdNao / maxQtdMes * CHART_H)
                const label= fmtMes(m.mes)
                return (
                  <div key={m.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 30 }}>
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: CHART_H }}
                      title={`${label}: ${tot} | T1:${m.qtdT1} T2:${m.qtdT2} Nao:${m.qtdNao}`}>
                      <div style={{ height:`${hNao}px`, background:'var(--vermelho)', opacity:0.8, borderRadius:'2px 2px 0 0' }}/>
                      <div style={{ height:`${hT2}px`,  background:'var(--azul)', opacity:0.8 }}/>
                      <div style={{ height:`${hT1}px`,  background:'var(--verde)', opacity:0.85, borderRadius:'0 0 2px 2px' }}/>
                    </div>
                    <span style={{ fontSize: 8, color: 'var(--cinza-texto)', marginTop: 3, textAlign: 'center' }}>{label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Por convênio */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>Resultado por Convênio</div>
          <div className="table-wrap" style={{ maxHeight: 260, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Convênio</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>T1</th>
                  <th style={{ textAlign: 'right' }}>T2</th>
                  <th style={{ textAlign: 'right', color: 'var(--vermelho)' }}>Sem</th>
                </tr>
              </thead>
              <tbody>
                {porConv.map(c => {
                  const nao = c.qtdNao ?? 0
                  return (
                  <tr key={c.conv}>
                    <td style={{ fontSize: 11, fontWeight: 600 }}>{c.conv}</td>
                    <td style={{ textAlign: 'right', fontSize: 11 }}>{(c.qtd ?? 0).toLocaleString('pt-BR')}</td>
                    <td style={{ textAlign: 'right', fontSize: 11, color: 'var(--verde)', fontWeight: 700 }}>{(c.qtdT1 ?? 0).toLocaleString('pt-BR')}</td>
                    <td style={{ textAlign: 'right', fontSize: 11, color: 'var(--azul)' }}>{(c.qtdT2 ?? 0).toLocaleString('pt-BR')}</td>
                    <td style={{ textAlign: 'right', fontSize: 11, color: 'var(--vermelho)', fontWeight: nao > 0 ? 700 : 400 }}>{nao.toLocaleString('pt-BR')}</td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Registros sem match */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--cinza-borda)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--vermelho)' }}>Registros quitados sem correspondente no extrato AMHP</div>
            <div style={{ fontSize: 11, color: 'var(--cinza-texto)' }}>{resumo.nao.qtd} registros · {fmtM(resumo.nao.val)} — paciente pago no Smart mas não localizado no extrato AMHP</div>
          </div>
          <div className="header-search" style={{ maxWidth: 280, margin: 0, marginLeft: 'auto' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="search" placeholder="Paciente ou convênio..." value={busca} onChange={e => { setBusca(e.target.value); setPagina(1) }}/>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Paciente</th>
                <th>Convênio</th>
                <th>Procedimento</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map((r, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{fmtDate(r.dt)}</td>
                  <td style={{ fontSize: 12, fontWeight: 600 }}>{r.pac}</td>
                  <td style={{ fontSize: 11, color: 'var(--cinza-texto)' }}>{r.conv}</td>
                  <td style={{ fontSize: 11, color: 'var(--cinza-texto)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.proc}>{r.proc || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 12, color: 'var(--vermelho)' }}>R$ {fmt(r.val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPag > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderTop: '1px solid var(--cinza-borda)', fontSize: 12 }}>
            <span style={{ color: 'var(--cinza-texto)' }}>Pág. <strong>{pag_}</strong> / <strong>{totalPag}</strong> · {filtrados.length} reg.</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => go(1)}       disabled={pag_===1}        style={btnStyle(pag_===1)}>«</button>
              <button onClick={() => go(pag_-1)}  disabled={pag_===1}        style={btnStyle(pag_===1)}>‹</button>
              {Array.from({length:Math.min(5,totalPag)},(_,i)=>{const s=Math.max(1,Math.min(pag_-2,totalPag-4));const p=s+i;return <button key={p} onClick={()=>go(p)} style={btnStyle(false,p===pag_)}>{p}</button>})}
              <button onClick={() => go(pag_+1)}  disabled={pag_===totalPag} style={btnStyle(pag_===totalPag)}>›</button>
              <button onClick={() => go(totalPag)} disabled={pag_===totalPag} style={btnStyle(pag_===totalPag)}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── ABA ANÁLISE FINAL ───────────────────────────────────────── */
function AbaFinal({ data }: { data: NAData }) {
  const sf  = data.smartFaturamento
  const quit = data.resumo

  const diff    = sf.valTotal - quit.valTotal
  const diffQtd = sf.total    - quit.total

  /* barras comparativas */
  const maxVal = sf.valTotal

  const linhas = [
    { label: 'Faturado (quitado)',  val: sf.faturado.val,  qtd: sf.faturado.qtd,  cor: 'var(--azul)',    desc: 'Registros no Smart com status Faturado' },
    { label: 'Em Aberto',           val: sf.aberto.val,    qtd: sf.aberto.qtd,    cor: 'var(--laranja)', desc: 'Faturados mas pagamento ainda pendente' },
    { label: 'Particular (P)',      val: sf.particular.val, qtd: sf.particular.qtd,cor: 'var(--verde)',   desc: 'Atendimentos marcados como Particular no Smart' },
  ]

  const quit_linhas = [
    { label: 'Via AMHP',         val: quit.amhp.val,      qtd: quit.amhp.qtd,      cor: 'var(--azul)' },
    { label: 'Particular',       val: quit.particular.val, qtd: quit.particular.qtd,cor: 'var(--verde)' },
    { label: 'Outras operadoras',val: quit.outraOp.val,    qtd: quit.outraOp.qtd,   cor: 'var(--laranja)' },
  ]

  return (
    <div>
      {/* Banner de diferença */}
      <div style={{ background: 'linear-gradient(135deg,rgba(42,171,187,0.08) 0%,rgba(232,114,42,0.06) 100%)', border: '1px solid var(--cinza-borda)', borderRadius: 12, padding: '20px 28px', marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cinza-texto)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 4 }}>Consolidação Smart × Quitação</div>
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--cinza-texto)', marginBottom: 2 }}>Total Smart (sistema)</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--grafite)', lineHeight: 1 }}>{fmtM(sf.valTotal)}</div>
            <div style={{ fontSize: 11, color: 'var(--cinza-texto)', marginTop: 3 }}>{sf.total.toLocaleString('pt-BR')} registros</div>
          </div>
          <div style={{ fontSize: 28, color: 'var(--cinza-borda)', fontWeight: 300, alignSelf: 'center' }}>−</div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--cinza-texto)', marginBottom: 2 }}>Total Quitação (recebido)</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--azul)', lineHeight: 1 }}>{fmtM(quit.valTotal)}</div>
            <div style={{ fontSize: 11, color: 'var(--cinza-texto)', marginTop: 3 }}>{quit.total.toLocaleString('pt-BR')} registros</div>
          </div>
          <div style={{ fontSize: 28, color: 'var(--cinza-borda)', fontWeight: 300, alignSelf: 'center' }}>=</div>
          <div style={{ background: 'var(--laranja)', borderRadius: 10, padding: '10px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', opacity: 0.85, marginBottom: 2 }}>DIFERENÇA</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{fmtM(diff)}</div>
            <div style={{ fontSize: 11, color: '#fff', opacity: 0.85, marginTop: 3 }}>{diffQtd.toLocaleString('pt-BR')} registros a mais no Smart</div>
          </div>
        </div>
      </div>

      {/* Duas colunas: Smart breakdown | Quitação breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Smart breakdown */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Smart — por status</div>
            <span className="section-badge">{fmtM(sf.valTotal)} total</span>
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {linhas.map(l => {
              const pct = Math.round(l.val / maxVal * 100)
              return (
                <div key={l.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{l.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--cinza-texto)', marginLeft: 8 }}>{l.desc}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12, flexShrink: 0 }}>
                      <span style={{ color: 'var(--cinza-texto)' }}>{l.qtd.toLocaleString('pt-BR')}</span>
                      <strong style={{ color: l.cor }}>{fmtM(l.val)}</strong>
                      <span style={{ color: 'var(--cinza-texto)', width: 34, textAlign: 'right' }}>{pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 8, background: 'var(--cinza-bg)', borderRadius: 4 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: l.cor, borderRadius: 4, opacity: 0.85 }}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quitação breakdown */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Quitação — por categoria</div>
            <span className="section-badge">{fmtM(quit.valTotal)} total</span>
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {quit_linhas.map(l => {
              const pct = Math.round(l.val / maxVal * 100)
              return (
                <div key={l.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{l.label}</span>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12, flexShrink: 0 }}>
                      <span style={{ color: 'var(--cinza-texto)' }}>{l.qtd.toLocaleString('pt-BR')}</span>
                      <strong style={{ color: l.cor }}>{fmtM(l.val)}</strong>
                      <span style={{ color: 'var(--cinza-texto)', width: 34, textAlign: 'right' }}>{pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 8, background: 'var(--cinza-bg)', borderRadius: 4 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: l.cor, borderRadius: 4, opacity: 0.85 }}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tabela de reconciliação */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: 16 }}>Reconciliação de Valores</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Origem</th>
                <th style={{ textAlign: 'right' }}>Registros</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th style={{ textAlign: 'right' }}>Situação</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700 }}>Total Smart (sistema)</td>
                <td style={{ fontSize: 11, color: 'var(--cinza-texto)' }}>Smart — todos os status</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{sf.total.toLocaleString('pt-BR')}</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--grafite)' }}>{fmtM(sf.valTotal)}</td>
                <td style={{ textAlign: 'right' }}><span className="status-badge s-andamento">Base</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Quitação (recebido)</td>
                <td style={{ fontSize: 11, color: 'var(--cinza-texto)' }}>Relatório de quitação Smart</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{quit.total.toLocaleString('pt-BR')}</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--azul)' }}>{fmtM(quit.valTotal)}</td>
                <td style={{ textAlign: 'right' }}><span className="status-badge s-concluido">Confirmado</span></td>
              </tr>
              <tr style={{ background: 'rgba(232,114,42,0.06)' }}>
                <td style={{ fontWeight: 700, color: 'var(--laranja)' }}>Em Aberto</td>
                <td style={{ fontSize: 11, color: 'var(--cinza-texto)' }}>Faturados — pagamento pendente</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{sf.aberto.qtd.toLocaleString('pt-BR')}</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--laranja)' }}>{fmtM(sf.aberto.val)}</td>
                <td style={{ textAlign: 'right' }}><span className="status-badge s-pendente">Pendente</span></td>
              </tr>
              <tr style={{ background: 'rgba(125,154,58,0.05)' }}>
                <td style={{ fontWeight: 700, color: 'var(--verde)' }}>Particular (P)</td>
                <td style={{ fontSize: 11, color: 'var(--cinza-texto)' }}>Marcados como particular no Smart</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{sf.particular.qtd.toLocaleString('pt-BR')}</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--verde)' }}>{fmtM(sf.particular.val)}</td>
                <td style={{ textAlign: 'right' }}><span className="status-badge s-concluido">Particular</span></td>
              </tr>
              <tr style={{ borderTop: '2px solid var(--cinza-borda)', background: 'rgba(232,114,42,0.04)' }}>
                <td style={{ fontWeight: 800, fontSize: 14 }}>Diferença total</td>
                <td style={{ fontSize: 11, color: 'var(--cinza-texto)' }}>Smart − Quitação</td>
                <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 14 }}>{diffQtd.toLocaleString('pt-BR')}</td>
                <td style={{ textAlign: 'right', fontWeight: 900, fontSize: 16, color: 'var(--laranja)' }}>{fmtM(diff)}</td>
                <td style={{ textAlign: 'right' }}><span className="status-badge s-atrasado">Gap</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11, color: 'var(--cinza-texto)', marginTop: 12, lineHeight: 1.6 }}>
          <strong>Nota:</strong> O gap de {fmtM(diff)} representa registros presentes no Smart que ainda não foram confirmados na quitação —
          principalmente os {sf.aberto.qtd.toLocaleString('pt-BR')} em aberto ({fmtM(sf.aberto.val)}) e os {sf.particular.qtd.toLocaleString('pt-BR')} particulares ({fmtM(sf.particular.val)}).
          A diferença residual ({fmtM(diff - sf.aberto.val - sf.particular.val)}) pode envolver períodos distintos entre os dois relatórios.
        </p>
      </div>
    </div>
  )
}

/* ── COMPONENTE PRINCIPAL ────────────────────────────────────── */
export default function NovaAnalise() {
  const [data,    setData]    = useState<NAData | null>(null)
  const [loading, setLoading] = useState(true)
  const [aba,     setAba]     = useState<'analise' | 'amhp' | 'particular' | 'outraop' | 'cruzamento' | 'final'>('analise')

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
    { id: 'cruzamento',label: `Cruzamento AMHP (${data.cruzamento?.resumo?.pctMatch ?? '?'}%)`,   iconPath: 'M18 20V10 M12 20V4 M6 20V14 M22 4L12 14.01 9 11.01' },
    { id: 'final',     label: 'Análise Final',                                                     iconPath: 'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
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

      {aba === 'analise'     && <AbaAnalise     data={data} />}
      {aba === 'amhp'        && <AbaAMHP        data={data} />}
      {aba === 'particular'  && <AbaParticular  data={data} />}
      {aba === 'outraop'     && <AbaOutraOp     data={data} />}
      {aba === 'cruzamento'  && <AbaCruzamento  data={data} />}
      {aba === 'final'       && <AbaFinal       data={data} />}
    </main>
  )
}
