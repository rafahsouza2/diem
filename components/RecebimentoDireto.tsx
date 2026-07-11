'use client'

import { useState, useEffect, useMemo } from 'react'

/* ── Tipos ──────────────────────────────────────────────────── */
interface ItemGuia { seq: string; dt: string; tabela: string; cod: string; proc: string; val_inf: number; qtd: number; val_proc: number; val_lib: number; val_glosa: number }
interface Guia { operadora: string; guia_prestador?: string; paciente: string; dt_faturamento: string; situacao?: string; val_informado: number; val_liberado: number; val_glosa: number; itens: ItemGuia[] }
interface Lote { fatura: string; lote: string; dt_envio: string; informado: number; processado: number; liberado: number; glosa: number }
interface Pagamento { operadora: string; demonstrativo?: string; emissao?: string; dt_pagamento: string; banco?: string; agencia?: string; conta?: string; val_informado: number; val_liberado: number; val_glosa: number; ret_iss?: number; ret_fed?: number; val_liquido: number; lotes: Lote[] }
interface PorOp { qtd: number; val_informado: number; val_liberado: number; val_glosa: number; val_liquido?: number }
interface RDData {
  resumo: {
    total_guias: number; total_pagamentos: number
    val_informado: number; val_liberado: number; val_glosa: number
    pag_val_informado: number; pag_val_liberado: number; pag_val_glosa: number
    pag_ret_iss: number; pag_ret_fed: number; pag_val_liquido: number
    por_operadora_analise: Record<string, PorOp>
    por_operadora_pagamento: Record<string, PorOp>
  }
  guias: Guia[]
  pagamentos: Pagamento[]
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
  if (d.includes('/')) return d
  const [y, m, day] = d.split('-')
  if (!day) return d
  return `${day}/${m}/${y}`
}

const PER_PAGE = 50

/* ── COMPONENTE ─────────────────────────────────────────────── */
export default function RecebimentoDireto() {
  const [data,    setData]    = useState<RDData | null>(null)
  const [loading, setLoading] = useState(true)
  const [aba,     setAba]     = useState<'analise'|'pagamentos'>('analise')
  const [busca,   setBusca]   = useState('')
  const [pagina,  setPagina]  = useState(1)

  useEffect(() => {
    fetch('/data/recebimento_direto.json')
      .then(r => r.json())
      .then((d: RDData) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const guiasFiltradas = useMemo(() => {
    if (!data) return []
    const b = busca.trim().toLowerCase()
    return b
      ? data.guias.filter(g => g.paciente?.toLowerCase().includes(b) || g.guia_prestador?.includes(b))
      : data.guias
  }, [data, busca])

  const totalPag = Math.ceil(guiasFiltradas.length / PER_PAGE)
  const pag_     = Math.min(pagina, totalPag || 1)
  const paginados = guiasFiltradas.slice((pag_ - 1) * PER_PAGE, pag_ * PER_PAGE)

  function go(n: number) { setPagina(Math.max(1, Math.min(n, totalPag))) }

  if (loading) return (
    <main className="main-content">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, gap:14, color:'var(--cinza-texto)' }}>
        <div className="spinner" style={{ borderColor:'rgba(42,171,187,0.2)', borderTopColor:'var(--azul)' }}/>
        <div>
          <div style={{ fontWeight:600, color:'var(--grafite)' }}>Carregando recebimentos...</div>
          <div style={{ fontSize:12, marginTop:2 }}>Demonstrativos CASEMBRAPA e TST-SAÚDE</div>
        </div>
      </div>
    </main>
  )
  if (!data) return <main className="main-content"><p style={{ color:'var(--vermelho)' }}>Erro ao carregar dados.</p></main>

  const { resumo } = data
  const totalInf  = resumo.val_informado + resumo.pag_val_informado
  const totalLib  = resumo.val_liberado  + resumo.pag_val_liberado
  const totalGlosa= resumo.val_glosa     + resumo.pag_val_glosa
  const totalDesc = resumo.pag_ret_iss   + resumo.pag_ret_fed

  return (
    <main className="main-content">
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'var(--grafite)' }}>
          Recebimento Direto <span style={{ color:'var(--azul)' }}>/ Demonstrativos de Pagamento</span>
        </h1>
        <p style={{ fontSize:13, color:'var(--cinza-texto)', marginTop:2 }}>
          CASEMBRAPA ({resumo.total_guias} guias) · TST-SAÚDE ({resumo.total_pagamentos} demonstrativos)
        </p>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom:20 }}>
        <div className="kpi-card azul"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Total Informado</span>
          <span className="kpi-value">{fmtM(totalInf)}</span>
          <span className="kpi-badge">Valor faturado bruto</span>
        </div>
        <div className="kpi-card verde"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Total Liberado</span>
          <span className="kpi-value">{fmtM(totalLib)}</span>
          <span className="kpi-badge">Após glosas</span>
        </div>
        <div className="kpi-card laranja"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Total Glosas</span>
          <span className="kpi-value">{fmtM(totalGlosa)}</span>
          <span className="kpi-badge down">▼ {((totalGlosa / totalInf) * 100).toFixed(1).replace('.', ',')}% do informado</span>
        </div>
        <div className="kpi-card azul"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Líquido TST-SAÚDE</span>
          <span className="kpi-value">{fmtM(resumo.pag_val_liquido)}</span>
          <span className="kpi-badge down">▼ ISS+Fed: {fmtM(totalDesc)}</span>
        </div>
      </div>

      {/* Por Operadora */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        {/* CASEMBRAPA */}
        <div className="card" style={{ padding:'16px 20px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--grafite)', marginBottom:10 }}>CASEMBRAPA — Análise de Conta</div>
          {Object.entries(resumo.por_operadora_analise).map(([op, v]) => (
            <div key={op} style={{ fontSize:12, color:'var(--cinza-texto)', borderTop:'1px solid var(--cinza-borda)', paddingTop:8, marginTop:8 }}>
              <div style={{ fontWeight:600, color:'var(--grafite)', marginBottom:4 }}>{op}</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:4 }}>
                <div><span style={{ display:'block', fontSize:10 }}>Informado</span><strong style={{ color:'var(--grafite)' }}>{fmtM(v.val_informado)}</strong></div>
                <div><span style={{ display:'block', fontSize:10 }}>Liberado</span><strong style={{ color:'var(--verde)' }}>{fmtM(v.val_liberado)}</strong></div>
                <div><span style={{ display:'block', fontSize:10 }}>Glosa</span><strong style={{ color:'var(--laranja)' }}>{fmtM(v.val_glosa)}</strong></div>
              </div>
            </div>
          ))}
        </div>
        {/* TST-SAÚDE */}
        <div className="card" style={{ padding:'16px 20px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--grafite)', marginBottom:10 }}>TST-SAÚDE — Demonstrativos de Pagamento</div>
          {Object.entries(resumo.por_operadora_pagamento).map(([op, v]) => (
            <div key={op} style={{ fontSize:12, color:'var(--cinza-texto)', borderTop:'1px solid var(--cinza-borda)', paddingTop:8, marginTop:8 }}>
              <div style={{ fontWeight:600, color:'var(--grafite)', marginBottom:4 }}>{op}</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4 }}>
                <div><span style={{ display:'block', fontSize:10 }}>Informado</span><strong style={{ color:'var(--grafite)' }}>{fmtM(v.val_informado)}</strong></div>
                <div><span style={{ display:'block', fontSize:10 }}>Liberado</span><strong style={{ color:'var(--verde)' }}>{fmtM(v.val_liberado)}</strong></div>
                <div><span style={{ display:'block', fontSize:10 }}>Glosa</span><strong style={{ color:'var(--laranja)' }}>{fmtM(v.val_glosa)}</strong></div>
                <div><span style={{ display:'block', fontSize:10 }}>Líquido</span><strong style={{ color:'var(--azul)' }}>{fmtM(v.val_liquido ?? 0)}</strong></div>
              </div>
              <div style={{ marginTop:8, fontSize:11, color:'var(--cinza-texto)' }}>
                ISS: R$ {fmt(resumo.pag_ret_iss)} · Impostos Fed.: R$ {fmt(resumo.pag_ret_fed)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sobreposição com Fat. sem quitação */}
      <div className="card" style={{ padding:'16px 20px', marginBottom:20, borderLeft:'4px solid var(--verde)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
          <div style={{ flexShrink:0, marginTop:2 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--verde)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:13, color:'var(--grafite)', marginBottom:8 }}>
              Estes pagamentos <strong style={{ color:'var(--verde)' }}>não fazem parte</strong> do gap de R$ 1,43M (Fat. sem quitação)
            </div>
            <div style={{ fontSize:12, color:'var(--cinza-texto)', lineHeight:1.7 }}>
              O cruzamento com os 9.234 registros do Fat. sem quitação mostrou sobreposição mínima:
              apenas <strong>6 pacientes</strong> da CASEMBRAPA aparecem nos dois datasets, somando <strong>R$ 3.326</strong> — menos de 0,2% do gap.
              Os OSMs destes demonstrativos já constam no sistema de quitação, portanto estão <strong>reconciliados</strong>.
              O R$ 1,43M restante vem de outros convênios ainda pendentes de quitação.
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:12 }}>
              <div style={{ background:'var(--cinza-bg)', borderRadius:8, padding:'8px 12px', fontSize:11 }}>
                <div style={{ color:'var(--cinza-texto)', marginBottom:2 }}>Pacientes CASEMBRAPA</div>
                <strong style={{ fontSize:14, color:'var(--grafite)' }}>69</strong>
              </div>
              <div style={{ background:'var(--cinza-bg)', borderRadius:8, padding:'8px 12px', fontSize:11 }}>
                <div style={{ color:'var(--cinza-texto)', marginBottom:2 }}>Em ambos os datasets</div>
                <strong style={{ fontSize:14, color:'var(--laranja)' }}>6 pacientes</strong>
              </div>
              <div style={{ background:'var(--cinza-bg)', borderRadius:8, padding:'8px 12px', fontSize:11 }}>
                <div style={{ color:'var(--cinza-texto)', marginBottom:2 }}>Valor sobreposição</div>
                <strong style={{ fontSize:14, color:'var(--laranja)' }}>R$ 3.326</strong>
                <span style={{ fontSize:10, color:'var(--cinza-texto)', display:'block' }}>de R$ 1,43M (0,2%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="period-tabs" style={{ marginBottom:16 }}>
        <button className={`period-tab${aba==='analise'?' active':''}`} onClick={()=>{setAba('analise');setPagina(1);setBusca('')}}>
          Análise CASEMBRAPA ({resumo.total_guias} guias)
        </button>
        <button className={`period-tab${aba==='pagamentos'?' active':''}`} onClick={()=>{setAba('pagamentos');setPagina(1);setBusca('')}}>
          Pagamentos TST-SAÚDE ({resumo.total_pagamentos} demonstrativos)
        </button>
      </div>

      {/* ── ANÁLISE CASEMBRAPA ─────────────────────────────── */}
      {aba === 'analise' && (
        <>
          <div style={{ display:'flex', gap:10, marginBottom:12, alignItems:'center' }}>
            <div className="header-search" style={{ maxWidth:380, margin:0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="search" placeholder="Buscar paciente ou nº guia..." value={busca} onChange={e=>{setBusca(e.target.value);setPagina(1)}}/>
            </div>
            <span style={{ marginLeft:'auto', fontSize:13, color:'var(--cinza-texto)' }}>
              <strong style={{ color:'var(--grafite)' }}>{guiasFiltradas.length}</strong> guias
            </span>
          </div>
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Paciente</th>
                    <th>Nº Guia</th>
                    <th>Data Faturamento</th>
                    <th style={{ textAlign:'right' }}>Informado</th>
                    <th style={{ textAlign:'right' }}>Liberado</th>
                    <th style={{ textAlign:'right' }}>Glosa</th>
                    <th>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.map((g, i) => {
                    const pct = g.val_informado > 0 ? (g.val_glosa / g.val_informado) * 100 : 0
                    return (
                      <tr key={i}>
                        <td style={{ fontSize:11, color:'var(--cinza-texto)', width:36 }}>{(pag_-1)*PER_PAGE+i+1}</td>
                        <td style={{ fontWeight:700, fontSize:12 }}>{g.paciente || '—'}</td>
                        <td style={{ fontSize:11, fontFamily:'monospace', color:'var(--cinza-texto)' }}>{g.guia_prestador || '—'}</td>
                        <td style={{ fontSize:11, whiteSpace:'nowrap' }}>{fmtDate(g.dt_faturamento)}</td>
                        <td style={{ textAlign:'right', fontSize:12 }}>R$ {fmt(g.val_informado)}</td>
                        <td style={{ textAlign:'right', fontSize:12, color:'var(--verde)', fontWeight:700 }}>R$ {fmt(g.val_liberado)}</td>
                        <td style={{ textAlign:'right', fontSize:12 }}>
                          {g.val_glosa > 0
                            ? <span style={{ color:'var(--laranja)', fontWeight:700 }}>R$ {fmt(g.val_glosa)}</span>
                            : <span style={{ color:'var(--cinza-texto)' }}>—</span>}
                        </td>
                        <td>
                          {g.val_glosa > 0
                            ? <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:12, background:'rgba(232,114,42,0.12)', color:'var(--laranja)' }}>
                                Glosa {pct.toFixed(0)}%
                              </span>
                            : <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:12, background:'rgba(76,175,80,0.12)', color:'var(--verde)' }}>
                                Liberado
                              </span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* Paginação */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 24px', borderTop:'1px solid var(--cinza-borda)', fontSize:13 }}>
              <span style={{ color:'var(--cinza-texto)' }}>Pág. <strong>{pag_}</strong> de <strong>{totalPag}</strong></span>
              <div style={{ display:'flex', gap:4 }}>
                <button onClick={()=>go(1)} disabled={pag_===1} style={{ padding:'5px 10px',borderRadius:6,border:'1.5px solid var(--cinza-borda)',background:pag_===1?'var(--cinza-bg)':'#fff',cursor:pag_===1?'not-allowed':'pointer',fontWeight:600,fontSize:13 }}>«</button>
                <button onClick={()=>go(pag_-1)} disabled={pag_===1} style={{ padding:'5px 10px',borderRadius:6,border:'1.5px solid var(--cinza-borda)',background:pag_===1?'var(--cinza-bg)':'#fff',cursor:pag_===1?'not-allowed':'pointer',fontWeight:600,fontSize:13 }}>‹</button>
                {Array.from({length:Math.min(5,totalPag)},(_,k)=>{const s=Math.max(1,Math.min(pag_-2,totalPag-4));const pg=s+k;return<button key={pg} onClick={()=>go(pg)} style={{padding:'5px 10px',borderRadius:6,border:`1.5px solid ${pg===pag_?'var(--azul)':'var(--cinza-borda)'}`,background:pg===pag_?'var(--azul)':'#fff',color:pg===pag_?'#fff':'var(--grafite)',cursor:'pointer',fontWeight:600,fontSize:13}}>{pg}</button>})}
                <button onClick={()=>go(pag_+1)} disabled={pag_===totalPag} style={{ padding:'5px 10px',borderRadius:6,border:'1.5px solid var(--cinza-borda)',background:pag_===totalPag?'var(--cinza-bg)':'#fff',cursor:pag_===totalPag?'not-allowed':'pointer',fontWeight:600,fontSize:13 }}>›</button>
                <button onClick={()=>go(totalPag)} disabled={pag_===totalPag} style={{ padding:'5px 10px',borderRadius:6,border:'1.5px solid var(--cinza-borda)',background:pag_===totalPag?'var(--cinza-bg)':'#fff',cursor:pag_===totalPag?'not-allowed':'pointer',fontWeight:600,fontSize:13 }}>»</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── PAGAMENTOS TST-SAÚDE ───────────────────────────── */}
      {aba === 'pagamentos' && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Demonstrativo</th>
                  <th>Emissão</th>
                  <th>Dt. Pagamento</th>
                  <th>Banco / Conta</th>
                  <th style={{ textAlign:'right' }}>Informado</th>
                  <th style={{ textAlign:'right' }}>Liberado</th>
                  <th style={{ textAlign:'right' }}>Glosa</th>
                  <th style={{ textAlign:'right' }}>ISS</th>
                  <th style={{ textAlign:'right' }}>Imp. Fed.</th>
                  <th style={{ textAlign:'right' }}>Líquido</th>
                  <th>Lotes</th>
                </tr>
              </thead>
              <tbody>
                {data.pagamentos.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily:'monospace', fontSize:11 }}>{p.demonstrativo || '—'}</td>
                    <td style={{ fontSize:11, whiteSpace:'nowrap' }}>{fmtDate(p.emissao || '')}</td>
                    <td style={{ fontSize:11, whiteSpace:'nowrap', fontWeight:700 }}>{fmtDate(p.dt_pagamento)}</td>
                    <td style={{ fontSize:11, color:'var(--cinza-texto)' }}>{p.banco} / {p.conta}</td>
                    <td style={{ textAlign:'right', fontSize:12 }}>R$ {fmt(p.val_informado)}</td>
                    <td style={{ textAlign:'right', fontSize:12, color:'var(--verde)', fontWeight:700 }}>R$ {fmt(p.val_liberado)}</td>
                    <td style={{ textAlign:'right', fontSize:12, color: p.val_glosa > 0 ? 'var(--laranja)' : 'var(--cinza-texto)' }}>{p.val_glosa > 0 ? `R$ ${fmt(p.val_glosa)}` : '—'}</td>
                    <td style={{ textAlign:'right', fontSize:11, color:'var(--cinza-texto)' }}>{p.ret_iss ? `R$ ${fmt(p.ret_iss)}` : '—'}</td>
                    <td style={{ textAlign:'right', fontSize:11, color:'var(--cinza-texto)' }}>{p.ret_fed ? `R$ ${fmt(p.ret_fed)}` : '—'}</td>
                    <td style={{ textAlign:'right', fontWeight:800, fontSize:13, color:'var(--azul)' }}>R$ {fmt(p.val_liquido)}</td>
                    <td style={{ fontSize:11, color:'var(--cinza-texto)', textAlign:'center' }}>{p.lotes.length}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background:'var(--cinza-bg)', fontWeight:800 }}>
                  <td colSpan={4} style={{ fontSize:12, padding:'10px 16px' }}>TOTAL</td>
                  <td style={{ textAlign:'right', fontSize:12 }}>R$ {fmt(resumo.pag_val_informado)}</td>
                  <td style={{ textAlign:'right', fontSize:12, color:'var(--verde)' }}>R$ {fmt(resumo.pag_val_liberado)}</td>
                  <td style={{ textAlign:'right', fontSize:12, color:'var(--laranja)' }}>R$ {fmt(resumo.pag_val_glosa)}</td>
                  <td style={{ textAlign:'right', fontSize:11 }}>R$ {fmt(resumo.pag_ret_iss)}</td>
                  <td style={{ textAlign:'right', fontSize:11 }}>R$ {fmt(resumo.pag_ret_fed)}</td>
                  <td style={{ textAlign:'right', fontSize:13, color:'var(--azul)' }}>R$ {fmt(resumo.pag_val_liquido)}</td>
                  <td/>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}
