'use client'

import { useState, useEffect, useMemo } from 'react'

/* ── TIPOS ─────────────────────────────────────────────── */
interface Resumo {
  totalSmart: number; totalAMHP: number
  matchTotal: number; pctMatch:  number
  T1: number; T2: number; T3: number; T4: number; T5: number
  semMatch: number
  smartSemAMHPQtd: number; smartSemAMHPValor: number
}
interface MesRec {
  mes: string; match: number; Nao: number
  T1:number; T2:number; T4:number; T5:number
  vc: number; vrMatch: number
}
interface ConvRec {
  conv: string; match: number; Nao: number; vc: number; vcNao: number
  T1:number; T2:number; T4:number; T5:number
}
interface AMHPRec {
  dt: string; pac: string; conv: string; med: string
  cod: string; proc: string; vc: number; vr: number; vg: number; sit: string
  tipo: string; amhptiss: string
  s_dt: string; s_proc: string; s_val: number; s_st: string
}
interface SmartRec {
  dt: string; pac: string; cod: string; proc: string; val: number; st: string
}
interface RecoData {
  resumo: Resumo
  mensal: MesRec[]
  porConvenio: ConvRec[]
  amhp: AMHPRec[]
  smartSemAMHP: SmartRec[]
}

/* ── HELPERS ────────────────────────────────────────────── */
const PER_PAGE = 50
const TIPO_LABEL: Record<string,string> = {
  T1:'Exato',T2:'±7 dias',T4:'±30 dias',T5:'Fuzzy',Nao:'Não encontrado'
}
const TIPO_COLOR: Record<string,string> = {
  T1:'#7D9A3A',T2:'#2AABBB',T4:'#b8a020',T5:'#E8722A',Nao:'#E05252'
}
const TIPO_CLASS: Record<string,string> = {
  T1:'s-concluido',T2:'s-andamento',T4:'s-pendente',T5:'s-pendente',Nao:'s-atrasado'
}

function fmt(v:number){ return v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}) }
function fmtM(v:number){ if(v>=1e6)return `R$ ${(v/1e6).toFixed(2).replace('.',',')}M`; if(v>=1000)return `R$ ${(v/1000).toFixed(1).replace('.',',')}K`; return `R$ ${fmt(v)}` }
function fmtDate(dt:string){ if(!dt)return '—'; const[y,m,d]=dt.split('-'); return `${d}/${m}/${y}` }
function btnStyle(disabled:boolean,active=false):React.CSSProperties{
  return{padding:'5px 10px',borderRadius:6,border:'1.5px solid var(--cinza-borda)',background:active?'var(--azul)':'#fff',color:active?'#fff':disabled?'var(--cinza-borda)':'var(--grafite)',cursor:disabled?'not-allowed':'pointer',fontWeight:600,fontSize:13,fontFamily:'inherit'}
}

/* ── ABA ANÁLISE ────────────────────────────────────────── */
function AbaAnalise({ data }: { data: RecoData }) {
  const { resumo, porConvenio } = data

  /* Valores monetários por técnica — calculados dos registros AMHP */
  const dinheiro = useMemo(() => {
    const vc: Record<string,number> = {T1:0,T2:0,T3:0,T4:0,T5:0,Nao:0}
    const vr: Record<string,number> = {T1:0,T2:0,T3:0,T4:0,T5:0,Nao:0}
    const vg: Record<string,number> = {T1:0,T2:0,T3:0,T4:0,T5:0,Nao:0}
    for (const r of data.amhp) {
      const t = r.tipo in vc ? r.tipo : 'Nao'
      vc[t] += r.vc; vr[t] += r.vr; vg[t] += r.vg
    }
    const vcMatch = vc.T1+vc.T2+vc.T3+vc.T4+vc.T5
    const vrMatch = vr.T1+vr.T2+vr.T3+vr.T4+vr.T5
    const vcNao   = vc.Nao
    const vrNao   = vr.Nao
    return { vc, vr, vg, vcMatch, vrMatch, vcNao, vrNao }
  }, [data.amhp])

  /* Funil com valores */
  const funnelSteps = [
    { label:'Atendimentos Smart',     val:resumo.totalSmart,  valor:12757686.44, pct:100,  cor:'#2AABBB' },
    { label:'Smart "Faturado"',       val:57642,              valor:11922003.79, pct:93.9, cor:'#1D8A99' },
    { label:'Registros AMHP',         val:resumo.totalAMHP,   valor:4305036.06,  pct:32.6, cor:'#7D9A3A' },
    { label:'Cruzados com Smart',     val:resumo.matchTotal,  valor:dinheiro.vcMatch, pct:20.7, cor:'#b8a020' },
    { label:'Cruzados sem glosa',     val:Math.round(resumo.matchTotal*0.869), valor:dinheiro.vrMatch*0.869, pct:18.0, cor:'#5a7a1a' },
  ]

  return (
    <div>
      {/* Insights */}
      <div className="insight-strip">
        <div className="insight-card">
          <div className="insight-label">Cruzamentos confirmados</div>
          <div className="insight-value">{resumo.pctMatch}% · {fmtM(dinheiro.vcMatch)}</div>
          <div className="insight-sub">{resumo.matchTotal.toLocaleString('pt-BR')} registros · repasse {fmtM(dinheiro.vrMatch)}</div>
        </div>
        <div className="insight-card laranja-g">
          <div className="insight-label">AMHP sem Smart — gap admin.</div>
          <div className="insight-value">{fmtM(dinheiro.vcNao)}</div>
          <div className="insight-sub">{resumo.semMatch.toLocaleString('pt-BR')} registros · {Math.round(resumo.semMatch/resumo.totalAMHP*100)}% do total AMHP</div>
        </div>
        <div className="insight-card verde-g">
          <div className="insight-label">Smart Faturado fora da AMHP</div>
          <div className="insight-value">{fmtM(resumo.smartSemAMHPValor)}</div>
          <div className="insight-sub">{resumo.smartSemAMHPQtd.toLocaleString('pt-BR')} atend. · particular ou outro plano</div>
        </div>
      </div>

      {/* KPIs com valor e contagem */}
      <div className="kpi-grid" style={{marginBottom:24}}>
        <div className="kpi-card verde"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Match Exato (T1)</span>
          <span className="kpi-value">{fmtM(dinheiro.vc.T1)}</span>
          <span className="kpi-badge up">▲ {resumo.T1.toLocaleString('pt-BR')} registros · rep. {fmtM(dinheiro.vr.T1)}</span>
        </div>
        <div className="kpi-card azul"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Match Aprox. (T2–T5)</span>
          <span className="kpi-value">{fmtM(dinheiro.vc.T2+dinheiro.vc.T3+dinheiro.vc.T4+dinheiro.vc.T5)}</span>
          <span className="kpi-badge up">▲ {(resumo.T2+resumo.T3+resumo.T4+resumo.T5).toLocaleString('pt-BR')} reg. · rep. {fmtM(dinheiro.vr.T2+dinheiro.vr.T3+dinheiro.vr.T4+dinheiro.vr.T5)}</span>
        </div>
        <div className="kpi-card laranja"><div className="kpi-icon-bg"/>
          <span className="kpi-label">AMHP sem Smart</span>
          <span className="kpi-value">{fmtM(dinheiro.vcNao)}</span>
          <span className="kpi-badge down">▼ {resumo.semMatch.toLocaleString('pt-BR')} registros AMHP</span>
        </div>
        <div className="kpi-card verm"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Smart Faturado s/ AMHP</span>
          <span className="kpi-value">{fmtM(resumo.smartSemAMHPValor)}</span>
          <span className="kpi-badge down">▼ {resumo.smartSemAMHPQtd.toLocaleString('pt-BR')} atend. Smart</span>
        </div>
      </div>

      {/* Funil */}
      <div className="card" style={{marginBottom:24}}>
          <div className="section-title" style={{marginBottom:4}}>Funil de Receita</div>
          <div className="card-subtitle" style={{marginBottom:20}}>Da produção ao recebimento AMHP</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {funnelSteps.map((s,i)=>(
              <div key={s.label} style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:24,height:24,borderRadius:'50%',background:s.cor,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3,alignItems:'baseline'}}>
                    <span style={{fontSize:12,fontWeight:600}}>{s.label}</span>
                    <div style={{textAlign:'right'}}>
                      <span style={{fontSize:13,fontWeight:800,color:s.cor}}>{fmtM(s.valor)}</span>
                      <span style={{fontSize:10,color:'var(--cinza-texto)',marginLeft:6}}>{s.val.toLocaleString('pt-BR')} reg.</span>
                    </div>
                  </div>
                  <div style={{height:8,background:'var(--cinza-bg)',borderRadius:4,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${s.pct}%`,background:s.cor,borderRadius:4}}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:14,padding:'10px 12px',background:'var(--cinza-bg)',borderRadius:8,fontSize:11.5,color:'var(--cinza-texto)',lineHeight:1.6}}>
            <strong style={{color:'var(--grafite)',display:'block',marginBottom:2}}>Como interpretar</strong>
            Dos R$ 12,75M produzidos, R$ 4,30M passaram pela AMHP. Destes, <strong style={{color:'var(--verde)'}}>{fmtM(dinheiro.vcMatch)} (63,3%) foram cruzados</strong> com Smart, confirmando a produção e habilitando o repasse.
          </div>
      </div>

      {/* Técnicas de match — com valor */}
      <div className="card" style={{marginBottom:24}}>
        <div className="section-header">
          <div className="section-title">Detalhamento das Técnicas de Cruzamento</div>
          <span className="section-badge">4 algoritmos · mesmo código obrigatório</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginTop:4}}>
          {(['T1','T2','T4','T5'] as const).map(t=>{
            const qtd  = resumo[t as keyof Resumo] as number
            const pctQ = resumo.matchTotal > 0 ? Math.round(qtd/resumo.matchTotal*100) : 0
            const vcT  = dinheiro.vc[t] ?? 0
            const vrT  = dinheiro.vr[t] ?? 0
            return (
              <div key={t} style={{background:'var(--cinza-bg)',borderRadius:10,padding:'16px 14px',textAlign:'center',borderTop:`3px solid ${TIPO_COLOR[t]}`}}>
                <div style={{fontSize:11,fontWeight:700,color:TIPO_COLOR[t],marginBottom:4}}>{TIPO_LABEL[t]}</div>
                <div style={{fontSize:18,fontWeight:800,color:'var(--grafite)'}}>{fmtM(vcT)}</div>
                <div style={{fontSize:10,color:'var(--cinza-texto)',marginTop:1}}>repasse {fmtM(vrT)}</div>
                <div style={{fontSize:11,color:'var(--grafite)',marginTop:6,fontWeight:600}}>{qtd.toLocaleString('pt-BR')} reg. · {pctQ}%</div>
                <div style={{fontSize:9.5,color:'var(--cinza-texto)',marginTop:4,lineHeight:1.4}}>
                  {t==='T1'&&'paciente + data + código TISS idênticos'}
                  {t==='T2'&&'mesmo código · data dentro de ±7 dias'}
                  {t==='T4'&&'mesmo código · janela ampla de ±30 dias'}
                  {t==='T5'&&'mesmo código · score nome+período+valor'}
                </div>
              </div>
            )
          })}
        </div>
        {/* Totalizador */}
        <div style={{marginTop:14,display:'flex',gap:24,padding:'12px 16px',background:'var(--cinza-bg)',borderRadius:8,flexWrap:'wrap'}}>
          <div style={{fontSize:12}}>
            <span style={{color:'var(--cinza-texto)'}}>Total cobrado com match: </span>
            <strong style={{color:'var(--verde)'}}>{fmtM(dinheiro.vcMatch)}</strong>
          </div>
          <div style={{fontSize:12}}>
            <span style={{color:'var(--cinza-texto)'}}>Total repassado (matched): </span>
            <strong style={{color:'var(--azul)'}}>{fmtM(dinheiro.vrMatch)}</strong>
          </div>
          <div style={{fontSize:12}}>
            <span style={{color:'var(--cinza-texto)'}}>Sem cruzamento (AMHP): </span>
            <strong style={{color:'var(--vermelho)'}}>{fmtM(dinheiro.vcNao)}</strong>
          </div>
          <div style={{fontSize:12}}>
            <span style={{color:'var(--cinza-texto)'}}>Diferença cobrado−repasse: </span>
            <strong style={{color:'var(--laranja)'}}>{fmtM(dinheiro.vcMatch - dinheiro.vrMatch)}</strong>
          </div>
        </div>
      </div>

      {/* Por convênio — TODOS, valor sem match real */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">Taxa e Valores por Convênio</div>
          <span className="section-badge">{porConvenio.length} convênios · completo</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Convênio</th>
                <th style={{textAlign:'right'}}>Registros</th>
                <th style={{textAlign:'right'}}>Valor Cobrado</th>
                <th style={{textAlign:'right'}}>Com Match</th>
                <th style={{textAlign:'right'}}>Sem Match</th>
                <th style={{textAlign:'right'}}>Val. sem Match</th>
                <th style={{textAlign:'right'}}>Taxa</th>
              </tr>
            </thead>
            <tbody>
              {porConvenio.map((c,i)=>{
                const total = c.match + c.Nao
                const taxa  = total > 0 ? Math.round(c.match/total*100) : 0
                return(
                  <tr key={c.conv}>
                    <td style={{color:'var(--cinza-texto)',fontSize:11,width:28}}>{i+1}</td>
                    <td style={{fontWeight:600,fontSize:12}}>{c.conv}</td>
                    <td style={{textAlign:'right',fontSize:12}}>{total.toLocaleString('pt-BR')}</td>
                    <td style={{textAlign:'right',fontSize:12,fontWeight:700}}>{fmtM(c.vc)}</td>
                    <td style={{textAlign:'right',color:'var(--verde)',fontWeight:700,fontSize:12}}>{c.match.toLocaleString('pt-BR')}</td>
                    <td style={{textAlign:'right',color:c.Nao>0?'var(--vermelho)':'var(--cinza-texto)',fontWeight:c.Nao>0?700:400,fontSize:12}}>{c.Nao.toLocaleString('pt-BR')}</td>
                    <td style={{textAlign:'right',color:c.vcNao>0?'var(--vermelho)':'var(--cinza-texto)',fontSize:12,fontWeight:c.vcNao>0?600:400}}>{c.vcNao>0?fmtM(c.vcNao):'—'}</td>
                    <td style={{textAlign:'right'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'flex-end'}}>
                        <div style={{width:44,height:6,background:'var(--cinza-bg)',borderRadius:3}}>
                          <div style={{height:'100%',width:`${taxa}%`,background:taxa>=80?'var(--verde)':taxa>=50?'var(--laranja)':'var(--vermelho)',borderRadius:3}}/>
                        </div>
                        <span style={{fontSize:12,fontWeight:700,color:taxa>=80?'var(--verde)':taxa>=50?'var(--laranja)':'var(--vermelho)',minWidth:32}}>{taxa}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ── ABA CRUZAMENTOS ────────────────────────────────────── */
function AbaCruzamentos({ amhp }: { amhp: AMHPRec[] }) {
  const [busca, setBusca]         = useState('')
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [pagina, setPagina]       = useState(1)

  const filtrados = useMemo(()=>{
    let r = amhp
    if(filtroTipo!=='Todos') r=r.filter(x=>x.tipo===filtroTipo)
    if(busca.trim()){
      const b=busca.toLowerCase()
      r=r.filter(x=>x.pac.toLowerCase().includes(b)||x.proc.toLowerCase().includes(b)||x.conv.toLowerCase().includes(b))
    }
    return r
  },[amhp,busca,filtroTipo])

  const totalPag = Math.ceil(filtrados.length/PER_PAGE)
  const pagAtual = filtrados.slice((pagina-1)*PER_PAGE, pagina*PER_PAGE)

  const contagem = useMemo(()=>{
    const c:Record<string,number>={T1:0,T2:0,T3:0,T4:0,T5:0,Nao:0}
    amhp.forEach(x=>{if(c[x.tipo]!==undefined)c[x.tipo]++})
    return c
  },[amhp])

  return(
    <div>
      <div style={{display:'flex',gap:10,marginBottom:18,flexWrap:'wrap',alignItems:'center'}}>
        <div className="header-search" style={{maxWidth:280,margin:0}}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="search" placeholder="Paciente, procedimento, convênio..."
            value={busca} onChange={e=>{setBusca(e.target.value);setPagina(1)}}/>
        </div>

        <div className="period-tabs">
          {['Todos','T1','T2','T4','T5','Nao'].map(t=>(
            <button key={t} className={`period-tab${filtroTipo===t?' active':''}`}
              onClick={()=>{setFiltroTipo(t);setPagina(1)}}
              title={TIPO_LABEL[t]||'Todos'}>
              {t==='Todos'?'Todos':t==='Nao'?'Sem match':`${TIPO_LABEL[t]} (${contagem[t]?.toLocaleString('pt-BR')||0})`}
            </button>
          ))}
        </div>
        <div style={{marginLeft:'auto',fontSize:13,color:'var(--cinza-texto)'}}>
          <strong style={{color:'var(--grafite)'}}>{filtrados.length.toLocaleString('pt-BR')}</strong> registros
        </div>
      </div>

      {/* Legenda */}
      <div style={{display:'flex',gap:20,flexWrap:'wrap',padding:'10px 14px',background:'var(--muted)',borderRadius:8,marginBottom:14,fontSize:11.5,alignItems:'center'}}>
        <span style={{fontWeight:700,color:'var(--grafite)',fontSize:12}}>Legenda:</span>
        <span style={{display:'flex',alignItems:'center',gap:6}}><span className="status-badge s-concluido" style={{fontSize:10}}>Exato</span> Encontrado no Smart — mesmo paciente, data e código</span>
        <span style={{display:'flex',alignItems:'center',gap:6}}><span className="status-badge s-andamento" style={{fontSize:10}}>±7 / ±30 dias</span> Encontrado no Smart com janela de data</span>
        <span style={{display:'flex',alignItems:'center',gap:6}}><span className="status-badge s-atrasado" style={{fontSize:10}}>Não encontrado</span> <strong style={{color:'var(--vermelho)'}}>Consta na AMHP mas não foi localizado no Smart</strong> — o Nº AMHPTISS confirma que a guia existe na plataforma</span>
      </div>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data AMHP</th>
                <th>Paciente</th>
                <th>Convênio</th>
                <th>Procedimento</th>
                <th>Nº AMHPTISS</th>
                <th>Match</th>
                <th>Data Smart</th>
                <th>Proc. Smart</th>
                <th style={{textAlign:'right'}}>Cobrado</th>
              </tr>
            </thead>
            <tbody>
              {pagAtual.map((r,i)=>(
                <tr key={i} style={{background:r.tipo==='Nao'?'rgba(224,82,82,0.04)':''}}>
                  <td style={{whiteSpace:'nowrap',fontSize:11}}>{fmtDate(r.dt)}</td>
                  <td style={{fontSize:11,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={r.pac}>{r.pac}</td>
                  <td style={{fontSize:10,maxWidth:110,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={r.conv}>{r.conv}</td>
                  <td style={{fontSize:10,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={r.proc}>{r.proc}</td>
                  <td style={{fontFamily:'monospace',fontSize:11,color:'var(--azul)',fontWeight:600,whiteSpace:'nowrap'}}>{r.amhptiss||'—'}</td>
                  <td><span className={`status-badge ${TIPO_CLASS[r.tipo]}`}>{TIPO_LABEL[r.tipo]||r.tipo}</span></td>
                  <td style={{fontSize:11,whiteSpace:'nowrap',color:r.s_dt?'var(--grafite)':'var(--cinza-borda)'}}>{r.s_dt?fmtDate(r.s_dt):'—'}</td>
                  <td style={{fontSize:10,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--cinza-texto)'}} title={r.s_proc}>{r.s_proc||'—'}</td>
                  <td style={{textAlign:'right',fontSize:12,fontWeight:700}}>R$ {fmt(r.vc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPag>1&&(
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 24px',borderTop:'1px solid var(--cinza-borda)',fontSize:13}}>
            <span style={{color:'var(--cinza-texto)'}}>Página <strong>{pagina}</strong> de <strong>{totalPag.toLocaleString('pt-BR')}</strong></span>
            <div style={{display:'flex',gap:4}}>
              <button onClick={()=>{setPagina(1)}}            disabled={pagina===1}        style={btnStyle(pagina===1)}>«</button>
              <button onClick={()=>{setPagina(p=>p-1)}}       disabled={pagina===1}        style={btnStyle(pagina===1)}>‹</button>
              {Array.from({length:Math.min(5,totalPag)},(_,i)=>{const start=Math.max(1,Math.min(pagina-2,totalPag-4));const p=start+i;return<button key={p} onClick={()=>setPagina(p)} style={btnStyle(false,p===pagina)}>{p}</button>})}
              <button onClick={()=>{setPagina(p=>p+1)}}       disabled={pagina===totalPag} style={btnStyle(pagina===totalPag)}>›</button>
              <button onClick={()=>{setPagina(totalPag)}}     disabled={pagina===totalPag} style={btnStyle(pagina===totalPag)}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── ABA GAP (Smart sem AMHP) ───────────────────────────── */
function AbaGap({ smart, total, valor }: { smart: SmartRec[]; total:number; valor:number }) {
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)

  const filtrados = useMemo(()=>{
    if(!busca.trim()) return smart
    const b=busca.toLowerCase()
    return smart.filter(x=>x.pac.toLowerCase().includes(b)||x.proc.toLowerCase().includes(b))
  },[smart,busca])

  const totalPag = Math.ceil(filtrados.length/PER_PAGE)
  const pagAtual = filtrados.slice((pagina-1)*PER_PAGE,pagina*PER_PAGE)

  return(
    <div>
      <div style={{background:'rgba(232,114,42,0.08)',border:'1px solid rgba(232,114,42,0.25)',borderRadius:10,padding:'14px 18px',marginBottom:18,display:'flex',gap:24,flexWrap:'wrap'}}>
        <div>
          <div style={{fontSize:11,color:'var(--cinza-texto)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.6px'}}>Smart "Faturado" sem AMHP</div>
          <div style={{fontSize:22,fontWeight:800,color:'var(--laranja)'}}>{total.toLocaleString('pt-BR')} registros</div>
        </div>
        <div>
          <div style={{fontSize:11,color:'var(--cinza-texto)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.6px'}}>Valor acumulado</div>
          <div style={{fontSize:22,fontWeight:800,color:'var(--laranja)'}}>{fmtM(valor)}</div>
        </div>
        <div style={{flex:1,display:'flex',alignItems:'center'}}>
          <p style={{fontSize:12,color:'var(--cinza-texto)',lineHeight:1.6}}>
            Estes atendimentos estão marcados como <strong>"Faturado"</strong> no Smart mas não possuem correspondente na plataforma AMHP. Podem ser: (1) <strong>pacientes particulares</strong> ou de outros planos; (2) <strong>faturamento direto</strong> sem intermediação AMHP; (3) <strong>divergência de cadastro</strong> — nome ou data diferentes entre sistemas.
          </p>
        </div>
      </div>

      <div style={{display:'flex',gap:10,marginBottom:14,alignItems:'center'}}>
        <div className="header-search" style={{maxWidth:320,margin:0}}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="search" placeholder="Paciente, procedimento..."
            value={busca} onChange={e=>{setBusca(e.target.value);setPagina(1)}}/>
        </div>
        <span style={{fontSize:13,color:'var(--cinza-texto)'}}>Exibindo <strong style={{color:'var(--grafite)'}}>{Math.min(2000,total).toLocaleString('pt-BR')}</strong> de {total.toLocaleString('pt-BR')} (amostra)</span>
      </div>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Paciente</th>
                <th>Cód. TISS</th>
                <th>Procedimento</th>
                <th>Status Smart</th>
                <th style={{textAlign:'right'}}>Valor Smart</th>
              </tr>
            </thead>
            <tbody>
              {pagAtual.map((r,i)=>(
                <tr key={i}>
                  <td style={{whiteSpace:'nowrap',fontSize:12}}>{fmtDate(r.dt)}</td>
                  <td style={{fontSize:11,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={r.pac}>{r.pac}</td>
                  <td style={{fontFamily:'monospace',fontSize:11,color:'var(--cinza-texto)'}}>{r.cod}</td>
                  <td style={{fontSize:11,maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={r.proc}>{r.proc}</td>
                  <td><span className="status-badge s-concluido">{r.st}</span></td>
                  <td style={{textAlign:'right',fontWeight:700,fontSize:12}}>R$ {fmt(r.val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPag>1&&(
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 24px',borderTop:'1px solid var(--cinza-borda)',fontSize:13}}>
            <span style={{color:'var(--cinza-texto)'}}>Página <strong>{pagina}</strong> de <strong>{totalPag}</strong></span>
            <div style={{display:'flex',gap:4}}>
              <button onClick={()=>setPagina(1)} disabled={pagina===1} style={btnStyle(pagina===1)}>«</button>
              <button onClick={()=>setPagina(p=>p-1)} disabled={pagina===1} style={btnStyle(pagina===1)}>‹</button>
              {Array.from({length:Math.min(5,totalPag)},(_,i)=>{const start=Math.max(1,Math.min(pagina-2,totalPag-4));const p=start+i;return<button key={p} onClick={()=>setPagina(p)} style={btnStyle(false,p===pagina)}>{p}</button>})}
              <button onClick={()=>setPagina(p=>p+1)} disabled={pagina===totalPag} style={btnStyle(pagina===totalPag)}>›</button>
              <button onClick={()=>setPagina(totalPag)} disabled={pagina===totalPag} style={btnStyle(pagina===totalPag)}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── TIPOS A RECEBER ────────────────────────────────────── */
interface ARecebReg {
  dt: string; pac: string; conv: string; med: string; proc: string
  vc: number; vr: number; vg: number; st: string
}
interface AjuizReg {
  dt: string; pac: string; conv: string; med: string; proc: string; vc: number
}
interface GlosaReg2 {
  dt: string; pac: string; conv: string; med: string; proc: string
  vc: number; vr: number; vg: number; sit: string; descGlosa: string
}
interface ConvAR { conv: string; qtd: number; vc: number; vr: number; vg: number }
interface ResumoAR {
  totalAReceber: number; qtdAReceber: number
  qtdPrevisto: number; valPrevisto: number
  qtdAguardando: number; valAguardando: number
  qtdGlosaAR: number; valGlosaAR: number
  totalAjuizados: number; qtdAjuizados: number
  totalGlosas: number; qtdGlosas: number
  totalGeral: number
}
interface ARecebData {
  resumo: ResumoAR
  aReceber: { porConvenio: ConvAR[]; registros: ARecebReg[] }
  ajuizados: { registros: AjuizReg[] }
  glosas: { porConvenio: Array<{conv:string;qtd:number;vg:number}>; registros: GlosaReg2[] }
}

/* ── ABA A RECEBER ──────────────────────────────────────── */
function AbaAReceber() {
  const [data, setData]     = useState<ARecebData|null>(null)
  const [loading, setLoad]  = useState(true)
  const [busca, setBusca]   = useState('')
  const [filtroSt, setFiltroSt] = useState<'todos'|'previsto'|'aguardando'|'glosa'>('todos')
  const [pagina, setPagina] = useState(1)

  useEffect(()=>{
    fetch('/data/a_receber.json')
      .then(r=>r.json())
      .then((d:ARecebData)=>{ setData(d); setLoad(false) })
      .catch(()=>setLoad(false))
  },[])

  const filtrados = useMemo(()=>{
    if(!data) return [] as ARecebReg[]
    let r = data.aReceber.registros
    if(filtroSt!=='todos') r=r.filter(x=>x.st===filtroSt)
    if(busca.trim()){
      const b=busca.toLowerCase()
      r=r.filter(x=>x.pac.toLowerCase().includes(b)||x.conv.toLowerCase().includes(b))
    }
    return r
  },[data,busca,filtroSt])

  const totalPag = Math.ceil(filtrados.length/PER_PAGE)
  const pagAtual = filtrados.slice((pagina-1)*PER_PAGE, pagina*PER_PAGE)

  if(loading) return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:240,gap:14,color:'var(--text-muted)'}}>
      <div className="spinner" style={{borderColor:'rgba(5,150,105,0.2)',borderTopColor:'var(--accent)'}}/>
      <span style={{fontWeight:600}}>Carregando dados de recebimento...</span>
    </div>
  )
  if(!data) return <p style={{color:'var(--vermelho)'}}>Erro ao carregar dados.</p>

  const { resumo } = data
  const glosaRec = data.glosas.registros.filter(r=>r.sit==='R')

  return(
    <div>
      {/* Summary strip */}
      <div className="insight-strip" style={{marginBottom:24}}>
        <div className="insight-card verde-g">
          <div className="insight-label">Total Geral a Receber</div>
          <div className="insight-value">{fmtM(resumo.totalGeral)}</div>
          <div className="insight-sub">3 fontes · {(resumo.qtdAReceber+resumo.qtdAjuizados).toLocaleString('pt-BR')} guias pendentes</div>
        </div>
        <div className="insight-card">
          <div className="insight-label">Em Processo AMHP</div>
          <div className="insight-value">{fmtM(resumo.totalAReceber)}</div>
          <div className="insight-sub">{resumo.qtdAReceber.toLocaleString('pt-BR')} guias · {resumo.qtdPrevisto} com repasse previsto</div>
        </div>
        <div className="insight-card laranja-g">
          <div className="insight-label">Em Litígio — Ajuizados</div>
          <div className="insight-value">{fmtM(resumo.totalAjuizados)}</div>
          <div className="insight-sub">{resumo.qtdAjuizados} guias · GAMA SAÚDE · desde 2024</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{marginBottom:24}}>
        <div className="kpi-card verde"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Repasse Previsto</span>
          <span className="kpi-value">{fmtM(resumo.valPrevisto)}</span>
          <span className="kpi-badge up">▲ {resumo.qtdPrevisto.toLocaleString('pt-BR')} guias · agendado</span>
        </div>
        <div className="kpi-card azul"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Aguardando Convênio</span>
          <span className="kpi-value">{fmtM(resumo.valAguardando)}</span>
          <span className="kpi-badge">↻ {resumo.qtdAguardando.toLocaleString('pt-BR')} guias · em análise</span>
        </div>
        <div className="kpi-card laranja"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Com Glosa (A Receber)</span>
          <span className="kpi-value">{fmtM(resumo.valGlosaAR)}</span>
          <span className="kpi-badge down">▼ {resumo.qtdGlosaAR} guias · contestação</span>
        </div>
        <div className="kpi-card verm"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Glosas em Recurso</span>
          <span className="kpi-value">{fmtM(resumo.totalGlosas)}</span>
          <span className="kpi-badge down">▼ {resumo.qtdGlosas} guias · recursal</span>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="card" style={{marginBottom:24}}>
        <div className="section-header">
          <div className="section-title">Situação do Repasse — A Receber AMHP</div>
          <span className="section-badge">{resumo.qtdAReceber.toLocaleString('pt-BR')} guias · {fmtM(resumo.totalAReceber)}</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
          <div style={{background:'var(--accent-light)',border:'1px solid var(--accent-ring)',borderRadius:10,padding:'16px 18px',borderLeft:'4px solid var(--accent)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--accent)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Repasse Previsto</div>
            <div style={{fontSize:22,fontWeight:800,color:'var(--grafite)'}}>{fmtM(resumo.valPrevisto)}</div>
            <div style={{fontSize:11,color:'var(--text-muted)',marginTop:3}}>{resumo.qtdPrevisto.toLocaleString('pt-BR')} guias · convênio agendou pagamento</div>
          </div>
          <div style={{background:'rgba(37,99,235,0.07)',border:'1px solid rgba(37,99,235,0.2)',borderRadius:10,padding:'16px 18px',borderLeft:'4px solid var(--azul)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--azul)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Aguardando Entrega</div>
            <div style={{fontSize:22,fontWeight:800,color:'var(--grafite)'}}>{fmtM(resumo.valAguardando)}</div>
            <div style={{fontSize:11,color:'var(--text-muted)',marginTop:3}}>{resumo.qtdAguardando.toLocaleString('pt-BR')} guias · aguardando aceite do convênio</div>
          </div>
          <div style={{background:'rgba(220,38,38,0.06)',border:'1px solid rgba(220,38,38,0.2)',borderRadius:10,padding:'16px 18px',borderLeft:'4px solid var(--vermelho)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--vermelho)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Com Glosa Pendente</div>
            <div style={{fontSize:22,fontWeight:800,color:'var(--grafite)'}}>{fmtM(resumo.valGlosaAR)}</div>
            <div style={{fontSize:11,color:'var(--text-muted)',marginTop:3}}>{resumo.qtdGlosaAR} guias · glosa em contestação (BACEN)</div>
          </div>
        </div>

        {/* Por convênio */}
        <div className="section-title" style={{fontSize:13,marginBottom:10}}>Por Convênio</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Convênio</th>
                <th style={{textAlign:'right'}}>Guias</th>
                <th style={{textAlign:'right'}}>Valor Cobrado</th>
                <th style={{textAlign:'right'}}>Valor Repasse</th>
                <th style={{textAlign:'right'}}>Glosa</th>
              </tr>
            </thead>
            <tbody>
              {data.aReceber.porConvenio.map((c,i)=>(
                <tr key={c.conv}>
                  <td style={{color:'var(--text-muted)',fontSize:11,width:28}}>{i+1}</td>
                  <td style={{fontWeight:600,fontSize:12}}>{c.conv}</td>
                  <td style={{textAlign:'right',fontSize:12}}>{c.qtd.toLocaleString('pt-BR')}</td>
                  <td style={{textAlign:'right',fontSize:12,fontWeight:700}}>{fmtM(c.vc)}</td>
                  <td style={{textAlign:'right',fontSize:12,color:'var(--verde)',fontWeight:700}}>{fmtM(c.vr)}</td>
                  <td style={{textAlign:'right',fontSize:12,color:c.vg>0?'var(--vermelho)':'var(--text-muted)',fontWeight:c.vg>0?600:400}}>{c.vg>0?fmtM(c.vg):'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ajuizados */}
      <div className="card" style={{marginBottom:24}}>
        <div className="section-header">
          <div className="section-title">Ajuizados — GAMA SAÚDE</div>
          <span className="section-badge" style={{background:'rgba(217,119,6,0.12)',color:'var(--laranja)',borderColor:'rgba(217,119,6,0.3)'}}>{resumo.qtdAjuizados} guias · {fmtM(resumo.totalAjuizados)}</span>
        </div>
        <div style={{background:'rgba(217,119,6,0.07)',border:'1px solid rgba(217,119,6,0.2)',borderRadius:8,padding:'12px 16px',marginBottom:16,fontSize:12,color:'var(--grafite)',lineHeight:1.7}}>
          Estas guias foram encaminhadas a <strong>processo judicial</strong> contra a GAMA SAÚDE. Atendimentos de Mai–Jul 2024 não pagos pelo convênio. O valor de <strong style={{color:'var(--laranja)'}}>{fmtM(resumo.totalAjuizados)}</strong> está pendente de decisão judicial.
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data Atend.</th>
                <th>Paciente</th>
                <th>Médico</th>
                <th style={{textAlign:'right'}}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {data.ajuizados.registros.map((r,i)=>(
                <tr key={i}>
                  <td style={{whiteSpace:'nowrap',fontSize:11}}>{fmtDate(r.dt)}</td>
                  <td style={{fontSize:11,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={r.pac}>{r.pac}</td>
                  <td style={{fontSize:10,color:'var(--text-muted)',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.med||'—'}</td>
                  <td style={{textAlign:'right',fontWeight:700,fontSize:12,color:'var(--laranja)'}}>R$ {fmt(r.vc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Glosas em recurso */}
      <div className="card" style={{marginBottom:24}}>
        <div className="section-header">
          <div className="section-title">Glosas em Recurso (Recursal)</div>
          <span className="section-badge" style={{background:'rgba(220,38,38,0.08)',color:'var(--vermelho)',borderColor:'rgba(220,38,38,0.25)'}}>{resumo.qtdGlosas} guias · {fmtM(resumo.totalGlosas)}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Paciente</th>
                <th>Convênio</th>
                <th style={{textAlign:'right'}}>Cobrado</th>
                <th style={{textAlign:'right'}}>Glosa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {glosaRec.map((r,i)=>(
                <tr key={i}>
                  <td style={{whiteSpace:'nowrap',fontSize:11}}>{fmtDate(r.dt)}</td>
                  <td style={{fontSize:11,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={r.pac}>{r.pac}</td>
                  <td style={{fontSize:11}}>{r.conv}</td>
                  <td style={{textAlign:'right',fontSize:12,fontWeight:600}}>R$ {fmt(r.vc)}</td>
                  <td style={{textAlign:'right',fontSize:12,fontWeight:700,color:'var(--vermelho)'}}>R$ {fmt(r.vg)}</td>
                  <td><span className="status-badge s-pendente">Recursal</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registros A Receber — pesquisável */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">Registros A Receber — Pesquisa</div>
          <span className="section-badge">{filtrados.length.toLocaleString('pt-BR')} de {resumo.qtdAReceber.toLocaleString('pt-BR')}</span>
        </div>
        <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
          <div className="header-search" style={{maxWidth:320,margin:0}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="search" placeholder="Paciente ou convênio..."
              value={busca} onChange={e=>{setBusca(e.target.value);setPagina(1)}}/>
          </div>
          <div className="period-tabs">
            {(['todos','previsto','aguardando','glosa'] as const).map(s=>(
              <button key={s}
                className={`period-tab${filtroSt===s?' active':''}`}
                onClick={()=>{ setFiltroSt(s); setPagina(1) }}>
                {s==='todos'?'Todos':s==='previsto'?`Previsto (${resumo.qtdPrevisto})`:s==='aguardando'?`Aguardando (${resumo.qtdAguardando})`:`Glosa (${resumo.qtdGlosaAR})`}
              </button>
            ))}
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data Atend.</th>
                <th>Paciente</th>
                <th>Convênio</th>
                <th>Médico</th>
                <th style={{textAlign:'right'}}>Cobrado</th>
                <th style={{textAlign:'right'}}>Repasse</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {pagAtual.map((r,i)=>(
                <tr key={i}>
                  <td style={{whiteSpace:'nowrap',fontSize:11}}>{fmtDate(r.dt)}</td>
                  <td style={{fontSize:11,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={r.pac}>{r.pac}</td>
                  <td style={{fontSize:10,maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={r.conv}>{r.conv}</td>
                  <td style={{fontSize:10,maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--text-muted)'}}>{r.med||'—'}</td>
                  <td style={{textAlign:'right',fontSize:12,fontWeight:700}}>R$ {fmt(r.vc)}</td>
                  <td style={{textAlign:'right',fontSize:12,color:'var(--verde)',fontWeight:600}}>R$ {fmt(r.vr)}</td>
                  <td>
                    <span className={`status-badge ${r.st==='previsto'?'s-concluido':r.st==='glosa'?'s-atrasado':'s-andamento'}`}>
                      {r.st==='previsto'?'Previsto':r.st==='glosa'?'Com glosa':'Aguardando'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPag>1&&(
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 24px',borderTop:'1px solid var(--cinza-borda)',fontSize:13}}>
            <span style={{color:'var(--text-muted)'}}>Página <strong>{pagina}</strong> de <strong>{totalPag.toLocaleString('pt-BR')}</strong></span>
            <div style={{display:'flex',gap:4}}>
              <button onClick={()=>setPagina(1)} disabled={pagina===1} style={btnStyle(pagina===1)}>«</button>
              <button onClick={()=>setPagina(p=>p-1)} disabled={pagina===1} style={btnStyle(pagina===1)}>‹</button>
              {Array.from({length:Math.min(5,totalPag)},(_,i)=>{const start=Math.max(1,Math.min(pagina-2,totalPag-4));const p=start+i;return<button key={p} onClick={()=>setPagina(p)} style={btnStyle(false,p===pagina)}>{p}</button>})}
              <button onClick={()=>setPagina(p=>p+1)} disabled={pagina===totalPag} style={btnStyle(pagina===totalPag)}>›</button>
              <button onClick={()=>setPagina(totalPag)} disabled={pagina===totalPag} style={btnStyle(pagina===totalPag)}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── COMPONENTE PRINCIPAL ───────────────────────────────── */
export default function AnaliseRecebimento() {
  const [aba, setAba]           = useState<'analise'|'cruzamentos'|'gap'|'areceber'>('analise')
  const [data, setData]         = useState<RecoData|null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(()=>{
    fetch('/data/reconciliacao.json')
      .then(r=>r.json())
      .then((d:RecoData)=>{ setData(d); setCarregando(false) })
      .catch(()=>setCarregando(false))
  },[])

  if(carregando){
    return(
      <main className="main-content">
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,gap:14,color:'var(--cinza-texto)'}}>
          <div className="spinner" style={{borderColor:'rgba(42,171,187,0.3)',borderTopColor:'var(--azul)'}}/>
          <div>
            <div style={{fontWeight:600,color:'var(--grafite)'}}>Carregando análise de recebimento...</div>
            <div style={{fontSize:12,marginTop:2}}>Processando 81.371 registros + reconciliação</div>
          </div>
        </div>
      </main>
    )
  }

  if(!data){
    return <main className="main-content"><p style={{color:'var(--vermelho)'}}>Erro ao carregar dados de reconciliação.</p></main>
  }

  const abas = [
    { id:'analise',    label:'Análise',                                                          icon:'M18 20 L18 10 M12 20 L12 4 M6 20 L6 14' },
    { id:'cruzamentos',label:`Cruzamentos (${data.resumo.matchTotal.toLocaleString('pt-BR')})`, icon:'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' },
    { id:'gap',        label:`Gap Smart→AMHP (${data.resumo.semMatch.toLocaleString('pt-BR')})`,icon:'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9 L12 13 M12 17 L12.01 17' },
    { id:'areceber',   label:'A Receber',                                                        icon:'M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  ] as const

  return(
    <main className="main-content">
      <div style={{marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:'var(--grafite)'}}>
              Faturamento <span style={{color:'var(--azul)'}}>/ Análise de Recebimento</span>
            </h1>
            <p style={{fontSize:13,color:'var(--cinza-texto)',marginTop:2}}>
              Cruzamento Smart × AMHP · {data.resumo.pctMatch}% de match · 5 técnicas de reconciliação
            </p>
          </div>
          <div style={{display:'flex',gap:4,background:'var(--cinza-bg)',padding:4,borderRadius:10}}>
            {abas.map(a=>(
              <button key={a.id}
                className={`period-tab${aba===a.id?' active':''}`}
                onClick={()=>setAba(a.id as typeof aba)}
                style={{display:'flex',alignItems:'center',gap:6}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={a.icon}/>
                </svg>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {aba==='analise'     && <AbaAnalise data={data}/>}
      {aba==='cruzamentos' && <AbaCruzamentos amhp={data.amhp}/>}
      {aba==='gap'         && <AbaGap smart={data.smartSemAMHP} total={data.resumo.smartSemAMHPQtd} valor={data.resumo.smartSemAMHPValor}/>}
      {aba==='areceber'    && <AbaAReceber/>}
    </main>
  )
}
