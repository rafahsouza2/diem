'use client'

import { useState, useEffect, useMemo } from 'react'

/* ── Tipos ─────────────────────────────────────────────────────── */
interface Mensal  { mes: string; qtd: number; val: number }
interface TopConv { conv: string; qtd: number; val: number }
interface TopProc { proc: string; qtd: number; val: number }
interface TopPac  { pac: string;  qtd: number; val: number }
interface Registro { dt: string; cod: string; pac: string; proc: string; val: number; cid: string }
interface Grupo {
  mensal:    Mensal[]
  topConv:   TopConv[]
  topProc:   TopProc[]
  topPac:    TopPac[]
  registros: Registro[]
}
interface GapData {
  resumo: {
    total: number; valTotal: number
    aberto:     { qtd: number; val: number }
    pStatus:    { qtd: number; val: number }
    fatNaoQuit: { qtd: number; val: number }
  }
  aberto:  Grupo
  pStatus: Grupo
}

/* ── Helpers ────────────────────────────────────────────────────── */
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

const PER_PAGE = 50

/* ── Sub-componente: Gráfico Mensal ─────────────────────────────── */
function ChartMensal({ mensal, cor }: { mensal: Mensal[]; cor: string }) {
  const CHART_H = 100
  const max = Math.max(...mensal.map(m => m.qtd), 1)
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: CHART_H + 24, minWidth: 400 }}>
        {mensal.map(m => {
          const h = Math.round(m.qtd / max * CHART_H)
          return (
            <div key={m.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 28 }}>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: CHART_H }}
                title={`${fmtMes(m.mes)}: ${m.qtd} | ${fmtM(m.val)}`}>
                <div style={{ height: `${h}px`, background: cor, borderRadius: '3px 3px 0 0', opacity: 0.85 }}/>
              </div>
              <span style={{ fontSize: 8, color: 'var(--cinza-texto)', marginTop: 3 }}>{fmtMes(m.mes)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Sub-componente: Tabela com busca + paginação ───────────────── */
function TabelaRegistros({ registros, cor }: { registros: Registro[]; cor: string }) {
  const [busca,  setBusca]  = useState('')
  const [pagina, setPagina] = useState(1)

  const filtrados = useMemo(() => {
    const b = busca.trim().toLowerCase()
    if (!b) return registros
    return registros.filter(r =>
      r.pac.toLowerCase().includes(b) ||
      r.proc.toLowerCase().includes(b) ||
      (r.cod ?? '').toLowerCase().includes(b) ||
      (r.cid ?? '').toLowerCase().includes(b)
    )
  }, [registros, busca])

  const totalPag = Math.ceil(filtrados.length / PER_PAGE)
  const pag_     = Math.min(pagina, totalPag || 1)
  const paginados= filtrados.slice((pag_ - 1) * PER_PAGE, pag_ * PER_PAGE)
  const valFilt  = filtrados.reduce((s, r) => s + r.val, 0)
  function go(p: number) { setPagina(Math.max(1, Math.min(p, totalPag))) }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="header-search" style={{ maxWidth: 360, margin: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="search" placeholder="Paciente, proc., convênio, CID..." value={busca} onChange={e => { setBusca(e.target.value); setPagina(1) }}/>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--cinza-texto)' }}>
          <strong style={{ color: 'var(--grafite)' }}>{filtrados.length.toLocaleString('pt-BR')}</strong> registros ·{' '}
          <strong style={{ color: cor }}>{fmtM(valFilt)}</strong>
        </span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Paciente</th>
              <th>Convênio</th>
              <th>Procedimento</th>
              <th>CID</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {paginados.map((r, i) => (
              <tr key={i}>
                <td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{fmtDate(r.dt)}</td>
                <td style={{ fontSize: 12, fontWeight: 600 }}>{r.pac}</td>
                <td style={{ fontSize: 11, color: 'var(--cinza-texto)' }}>{r.cod || '—'}</td>
                <td style={{ fontSize: 11, color: 'var(--cinza-texto)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.proc}>{r.proc || '—'}</td>
                <td style={{ fontSize: 11, color: 'var(--cinza-texto)' }}>{r.cid || '—'}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 12, color: cor }}>R$ {fmt(r.val)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPag > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', fontSize: 12 }}>
          <span style={{ color: 'var(--cinza-texto)' }}>Pág. <strong>{pag_}</strong> / <strong>{totalPag}</strong></span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => go(1)}       disabled={pag_===1}        style={btnStyle(pag_===1)}>«</button>
            <button onClick={() => go(pag_-1)}  disabled={pag_===1}        style={btnStyle(pag_===1)}>‹</button>
            {Array.from({length:Math.min(5,totalPag)},(_,i)=>{const s=Math.max(1,Math.min(pag_-2,totalPag-4));const p=s+i;return<button key={p} onClick={()=>go(p)} style={btnStyle(false,p===pag_)}>{p}</button>})}
            <button onClick={() => go(pag_+1)}  disabled={pag_===totalPag} style={btnStyle(pag_===totalPag)}>›</button>
            <button onClick={() => go(totalPag)} disabled={pag_===totalPag} style={btnStyle(pag_===totalPag)}>»</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Sub-componente: Painel de Grupo (Aberto ou P) ──────────────── */
function PainelGrupo({ grupo, cor, label }: { grupo: Grupo; cor: string; label: string }) {
  const [subAba, setSubAba] = useState<'visao'|'registros'>('visao')
  const maxConv = grupo.topConv[0]?.val ?? 1
  const maxProc = grupo.topProc[0]?.val ?? 1
  const maxPac  = grupo.topPac[0]?.val  ?? 1

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['visao','registros'] as const).map(s => (
          <button key={s} onClick={() => setSubAba(s)}
            style={{ padding: '6px 16px', borderRadius: 8, border: `1.5px solid ${s===subAba ? cor : 'var(--cinza-borda)'}`, background: s===subAba ? cor : '#fff', color: s===subAba ? '#fff' : 'var(--grafite)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            {s==='visao' ? 'Análise' : `Registros (${grupo.registros.length.toLocaleString('pt-BR')})`}
          </button>
        ))}
      </div>

      {subAba === 'visao' && (
        <div>
          {/* Gráfico mensal */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="section-header">
              <div className="section-title">Evolução Mensal — {label}</div>
              <span className="section-badge">por qtd de atendimentos</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <ChartMensal mensal={grupo.mensal} cor={cor} />
            </div>
            {/* tabela mensal */}
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th style={{ textAlign: 'right' }}>Qtd</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                    <th style={{ textAlign: 'right' }}>Ticket médio</th>
                  </tr>
                </thead>
                <tbody>
                  {grupo.mensal.map(m => (
                    <tr key={m.mes}>
                      <td style={{ fontWeight: 600 }}>{fmtMes(m.mes)}</td>
                      <td style={{ textAlign: 'right' }}>{m.qtd.toLocaleString('pt-BR')}</td>
                      <td style={{ textAlign: 'right', color: cor, fontWeight: 700 }}>{fmtM(m.val)}</td>
                      <td style={{ textAlign: 'right', fontSize: 11, color: 'var(--cinza-texto)' }}>{fmtM(m.val / m.qtd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top convênios + procedimentos */}
          <div className="fat-row" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="section-title" style={{ marginBottom: 12 }}>Top Convênios</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {grupo.topConv.map((c, i) => {
                  const pct = maxConv > 0 ? (c.val / maxConv) * 100 : 0
                  return (
                    <div key={c.conv} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 18, fontSize: 11, color: 'var(--cinza-texto)', textAlign: 'right', flexShrink: 0 }}>{i+1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 600 }}>{c.conv}</span>
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 800, color: cor }}>{fmtM(c.val)}</span>
                            <span style={{ fontSize: 10, color: 'var(--cinza-texto)', marginLeft: 6 }}>{c.qtd}</span>
                          </div>
                        </div>
                        <div style={{ height: 5, background: 'var(--cinza-bg)', borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: cor, borderRadius: 3, opacity: 0.8 }}/>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card">
              <div className="section-title" style={{ marginBottom: 12 }}>Top Procedimentos</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {grupo.topProc.map((p, i) => {
                  const pct = maxProc > 0 ? (p.val / maxProc) * 100 : 0
                  return (
                    <div key={p.proc} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 18, fontSize: 11, color: 'var(--cinza-texto)', textAlign: 'right', flexShrink: 0 }}>{i+1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 600 }} title={p.proc}>{p.proc.length > 35 ? p.proc.slice(0,35)+'…' : p.proc}</span>
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 800, color: cor }}>{fmtM(p.val)}</span>
                            <span style={{ fontSize: 10, color: 'var(--cinza-texto)', marginLeft: 6 }}>{p.qtd}</span>
                          </div>
                        </div>
                        <div style={{ height: 5, background: 'var(--cinza-bg)', borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: cor, borderRadius: 3, opacity: 0.8 }}/>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Top pacientes */}
          <div className="card">
            <div className="section-title" style={{ marginBottom: 12 }}>Top Pacientes por Valor Pendente</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Paciente</th>
                    <th style={{ textAlign: 'right' }}>Atend.</th>
                    <th style={{ textAlign: 'right' }}>Valor total</th>
                    <th style={{ textAlign: 'right' }}>Ticket médio</th>
                  </tr>
                </thead>
                <tbody>
                  {grupo.topPac.map((p, i) => (
                    <tr key={p.pac}>
                      <td style={{ fontSize: 11, color: 'var(--cinza-texto)', width: 28 }}>{i+1}</td>
                      <td style={{ fontWeight: 600, fontSize: 12 }}>{p.pac}</td>
                      <td style={{ textAlign: 'right' }}>{p.qtd}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: cor }}>{fmtM(p.val)}</td>
                      <td style={{ textAlign: 'right', fontSize: 11, color: 'var(--cinza-texto)' }}>{fmtM(p.val / p.qtd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subAba === 'registros' && (
        <div className="card">
          <TabelaRegistros registros={grupo.registros} cor={cor} />
        </div>
      )}
    </div>
  )
}

/* ── COMPONENTE PRINCIPAL ────────────────────────────────────────── */
export default function GapAnalitico() {
  const [data,    setData]    = useState<GapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [aba,     setAba]     = useState<'geral'|'aberto'|'pstatus'|'fatnao'>('geral')

  useEffect(() => {
    fetch('/data/gap_analitico.json')
      .then(r => r.json())
      .then((d: GapData) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <main className="main-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 14, color: 'var(--cinza-texto)' }}>
        <div className="spinner" style={{ borderColor: 'rgba(232,114,42,0.2)', borderTopColor: 'var(--laranja)' }}/>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--grafite)' }}>Carregando analítico...</div>
          <div style={{ fontSize: 12, marginTop: 2 }}>8.497 registros do gap Smart × Quitação</div>
        </div>
      </div>
    </main>
  )
  if (!data) return <main className="main-content"><p style={{ color: 'var(--vermelho)' }}>Erro ao carregar dados.</p></main>

  const { resumo } = data

  const abas = [
    { id: 'geral',    label: 'Visão Geral',                         cor: 'var(--laranja)' },
    { id: 'aberto',   label: `Em Aberto (${resumo.aberto.qtd.toLocaleString('pt-BR')})`,   cor: 'var(--laranja)' },
    { id: 'pstatus',  label: `Particular-P (${resumo.pStatus.qtd.toLocaleString('pt-BR')})`, cor: 'var(--verde)' },
    { id: 'fatnao',   label: `Fat. sem quitação (${resumo.fatNaoQuit.qtd.toLocaleString('pt-BR')})`, cor: 'var(--azul)' },
  ] as const

  return (
    <main className="main-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--grafite)' }}>
          Análise Final <span style={{ color: 'var(--laranja)' }}>/ 8.497 Registros</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--cinza-texto)', marginTop: 2 }}>
          Atendimentos presentes no Smart mas não confirmados na quitação · Jan/2025–Abr/2026
        </p>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card laranja"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Total do gap</span>
          <span className="kpi-value">{fmtM(resumo.valTotal)}</span>
          <span className="kpi-badge">{resumo.total.toLocaleString('pt-BR')} registros</span>
        </div>
        <div className="kpi-card laranja"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Em Aberto</span>
          <span className="kpi-value">{fmtM(resumo.aberto.val)}</span>
          <span className="kpi-badge down">▼ {resumo.aberto.qtd.toLocaleString('pt-BR')} atend. · faturados pendentes</span>
        </div>
        <div className="kpi-card verde"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Particular (P)</span>
          <span className="kpi-value">{fmtM(resumo.pStatus.val)}</span>
          <span className="kpi-badge">{resumo.pStatus.qtd.toLocaleString('pt-BR')} atend. · marcados como P</span>
        </div>
        <div className="kpi-card azul"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Fat. sem quitação</span>
          <span className="kpi-value">{fmtM(resumo.fatNaoQuit.val)}</span>
          <span className="kpi-badge down">▼ {resumo.fatNaoQuit.qtd.toLocaleString('pt-BR')} atend. · faturados não confirmados</span>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--cinza-bg)', padding: 4, borderRadius: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id as typeof aba)}
            className={`period-tab${aba === a.id ? ' active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Visão Geral */}
      {aba === 'geral' && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="section-title" style={{ marginBottom: 16 }}>Composição do Gap (8.497 registros)</div>
            {[
              { label: 'Faturado sem quitação', val: resumo.fatNaoQuit.val, qtd: resumo.fatNaoQuit.qtd, cor: 'var(--azul)',    desc: 'Faturados no Smart dentro do período Jan/25–Abr/26 mas sem confirmação de recebimento' },
              { label: 'Particular (status P)', val: resumo.pStatus.val,    qtd: resumo.pStatus.qtd,    cor: 'var(--verde)',   desc: 'Atendimentos marcados como Particular no Smart — podem estar em processo de cobrança' },
              { label: 'Em Aberto',             val: resumo.aberto.val,     qtd: resumo.aberto.qtd,     cor: 'var(--laranja)', desc: 'Faturamentos emitidos com pagamento ainda pendente de confirmação' },
            ].map(c => (
              <div key={c.label} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{c.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--cinza-texto)', marginLeft: 8 }}>{c.desc}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, flexShrink: 0 }}>
                    <span style={{ color: 'var(--cinza-texto)' }}>{c.qtd.toLocaleString('pt-BR')} registros</span>
                    <strong style={{ color: c.cor }}>{fmtM(c.val)}</strong>
                    <span style={{ color: 'var(--cinza-texto)', width: 36, textAlign: 'right' }}>{Math.round(c.val / resumo.valTotal * 100)}%</span>
                  </div>
                </div>
                <div style={{ height: 10, background: 'var(--cinza-bg)', borderRadius: 6 }}>
                  <div style={{ height: '100%', width: `${Math.round(c.val / resumo.valTotal * 100)}%`, background: c.cor, borderRadius: 6 }}/>
                </div>
              </div>
            ))}
          </div>

          <div className="fat-row">
            <div className="card">
              <div className="section-title" style={{ marginBottom: 12 }}>Em Aberto — Evolução Mensal</div>
              <ChartMensal mensal={data.aberto.mensal} cor="var(--laranja)" />
            </div>
            <div className="card">
              <div className="section-title" style={{ marginBottom: 12 }}>Particular-P — Evolução Mensal</div>
              <ChartMensal mensal={data.pStatus.mensal} cor="var(--verde)" />
            </div>
          </div>
        </div>
      )}

      {aba === 'aberto'  && <PainelGrupo grupo={data.aberto}  cor="var(--laranja)" label="Em Aberto" />}
      {aba === 'pstatus' && <PainelGrupo grupo={data.pStatus} cor="var(--verde)"   label="Particular-P" />}

      {aba === 'fatnao' && (
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--azul)', marginBottom: 8 }}>Faturados sem confirmação de quitação</div>
          <p style={{ fontSize: 13, color: 'var(--cinza-texto)', lineHeight: 1.7, marginBottom: 20 }}>
            Estes <strong>{resumo.fatNaoQuit.qtd.toLocaleString('pt-BR')} registros</strong> ({fmtM(resumo.fatNaoQuit.val)}) estão com status <strong>Faturado</strong> no Smart
            dentro do período Jan/2025–Abr/2026, mas não aparecem no relatório de quitação.
            Isso pode indicar: pagamentos ainda não processados, atrasos no repasse, ou divergência entre os sistemas de faturamento e recebimento.
          </p>
          <div style={{ background: 'rgba(42,171,187,0.06)', border: '1px solid rgba(42,171,187,0.2)', borderRadius: 10, padding: '14px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--azul)', marginBottom: 8 }}>Como identificar esses registros</div>
            <p style={{ fontSize: 12, color: 'var(--cinza-texto)', lineHeight: 1.7 }}>
              Para mapear individualmente os 4.801 faturados sem quitação, é necessário cruzar o relatório de atendimentos Smart
              (filtrado por status Faturado) com o relatório de quitação registro a registro por paciente + data + valor.
              Use a aba <strong>Cruzamento AMHP</strong> na Nova Análise para os convênios AMHP, ou solicite
              a exportação completa dos relatórios para cruzamento detalhado.
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
