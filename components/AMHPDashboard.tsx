'use client'

import { useState, useEffect, useMemo } from 'react'

/* ── TIPOS ─────────────────────────────────────────────── */
interface Atendimento {
  dt:   string
  conv: string
  med:  string
  cod:  string
  proc: string
  pac:  string
  vc:   number
  vr:   number
  vg:   number
  sit:  string
}

/* ── DADOS ESTÁTICOS ────────────────────────────────────── */
const dadosMensais = [
  { mes:'Nov/24', vc:377166.78, vr:325152.83, qtd:1617 },
  { mes:'Dez/24', vc:230738.72, vr:204748.95, qtd:1175 },
  { mes:'Jan/25', vc:344319.60, vr:315931.82, qtd:1731 },
  { mes:'Fev/25', vc:393169.60, vr:344858.22, qtd:1795 },
  { mes:'Mar/25', vc:320686.69, vr:271278.44, qtd:1381 },
  { mes:'Abr/25', vc:227382.94, vr:218048.51, qtd:1263 },
  { mes:'Mai/25', vc:159433.85, vr:155765.24, qtd:1106 },
  { mes:'Jun/25', vc:258035.46, vr:238402.41, qtd:998  },
  { mes:'Jul/25', vc:404556.47, vr:369846.39, qtd:1108 },
  { mes:'Ago/25', vc:196149.82, vr:190221.94, qtd:935  },
  { mes:'Set/25', vc:188380.44, vr:180745.66, qtd:1154 },
  { mes:'Out/25', vc:215135.71, vr:201226.50, qtd:1101 },
  { mes:'Nov/25', vc:188266.96, vr:185349.73, qtd:641  },
  { mes:'Dez/25', vc:161331.22, vr:86387.10,  qtd:488  },
  { mes:'Jan/26', vc:196589.45, vr:181807.33, qtd:1151 },
  { mes:'Fev/26', vc:86905.94,  vr:81976.00,  qtd:480  },
  { mes:'Mar/26', vc:141751.07, vr:130511.03, qtd:802  },
  { mes:'Abr/26', vc:6878.09,   vr:6648.18,   qtd:58, parcial:true },
]

const convenios = [
  { nome:'SAÚDE CAIXA',                       vc:923472.92, vr:851028.06, qtd:6503 },
  { nome:'PRÓ-SAÚDE (TJDFT)',                 vc:913537.18, vr:890709.03, qtd:3914 },
  { nome:'PRÓ-SAÚDE (CÂMARA)',                vc:797850.64, vr:670656.59, qtd:1948 },
  { nome:'BACEN',                             vc:535762.74, vr:408207.39, qtd:1158 },
  { nome:'PRÓ-SOCIAL (TRF)',                  vc:165188.28, vr:144308.44, qtd:867  },
  { nome:'SERPRO',                            vc:155953.81, vr:146305.97, qtd:869  },
  { nome:'PRÓ-SER (STJ)',                     vc:148462.19, vr:124584.95, qtd:451  },
  { nome:'FASCAL',                            vc:88393.76,  vr:68396.49,  qtd:655  },
  { nome:'TRT SAÚDE',                         vc:79047.41,  vr:73613.12,  qtd:371  },
  { nome:'GEAP',                              vc:71900.42,  vr:71627.33,  qtd:730  },
]

const medicos = [
  { nome:'MATHEUS MACHADO MELO',              vc:1411807.90, qtd:334  },
  { nome:'CAIO CÉSAR DE LIMA CARVALHO',       vc:1117445.63, qtd:5767 },
  { nome:'ANDERSON VITORINO DE MORAIS',       vc:383914.25,  qtd:1317 },
  { nome:'CYRO MARQUES DE MELO',              vc:358277.54,  qtd:3423 },
  { nome:'MARCELO DO NASCIMENTO MOREIRA',     vc:336191.34,  qtd:1670 },
  { nome:'CAMILA FERNANDA BRINA',             vc:174500.61,  qtd:1490 },
  { nome:'ALINE SENA DA COSTA MENEZES',       vc:146152.49,  qtd:384  },
  { nome:'LUIS OTÁVIO MANES PEREIRA',         vc:88624.72,   qtd:921  },
  { nome:'JÉSSICA DE SOUZA COSTA',            vc:83369.72,   qtd:2154 },
  { nome:'FERNANDA PASCOAL T. ZORZIN',        vc:74020.54,   qtd:864  },
]

const procedimentos = [
  { cod:'82749',    desc:'Reviscon Mono 48mg (Ác. Hialurônico)',  vc:899938.70, qtd:50  },
  { cod:'87955',    desc:'Monovisc Sol. Intra-articular (Apsen)', vc:195683.88, qtd:17  },
  { cod:'73842',    desc:'Monovisc Cx. 5ml (Commed)',             vc:189405.00, qtd:45  },
  { cod:'40901386', desc:'Doppler Colorido Órgão/Estrutura',      vc:285050.37, qtd:1158},
  { cod:'40901483', desc:'Doppler Venoso MMII Unilateral',        vc:150617.86, qtd:491 },
  { cod:'10101012', desc:'Consulta em Consultório',               vc:140524.06, qtd:1117},
  { cod:'40901475', desc:'Doppler Arterial MMII Unilateral',      vc:133534.60, qtd:486 },
  { cod:'40901467', desc:'Doppler Venoso MMSS Unilateral',        vc:116446.45, qtd:386 },
  { cod:'40901459', desc:'Doppler Arterial MMSS Unilateral',      vc:106299.80, qtd:390 },
  { cod:'343660',   desc:'Monovisc Sol. Intra-articular 4ml',     vc:92274.96,  qtd:14  },
]

const glosaStatus = [
  { label:'Sem Glosa', cod:'-', qtd:17405, val:0,          pct:86.9, cor:'#7D9A3A' },
  { label:'Recursal',  cod:'R', qtd:1042,  val:298159.54,  pct:5.2,  cor:'#E8722A' },
  { label:'Mantida',   cod:'M', qtd:1504,  val:141602.66,  pct:7.5,  cor:'#E05252' },
  { label:'Pendente',  cod:'P', qtd:23,    val:38362.59,   pct:0.1,  cor:'#7A8A99' },
  { label:'Aceita',    cod:'A', qtd:59,    val:2089.14,    pct:0.3,  cor:'#2AABBB' },
]

const TOTAL_COB     = 4305036.06
const TOTAL_REP     = 3824822.13
const TOTAL_GLOSA   = 480213.93
const TOTAL_ATEND   = 20033
const PCT_GLOSA     = 11.15
const TICKET_MEDIO  = TOTAL_COB / TOTAL_ATEND

const COLORS  = ['#2AABBB','#1D8A99','#7D9A3A','#E8722A','#5a7a1a','#c95c1c','#155F6B','#b8a020','#40766e','#3B3B3B']
const MAX_VC  = 410000
const MAX_MED = medicos[0].vc
const MAX_CON = convenios[0].vc
const CHART_H = 160
const PER_PAGE = 50

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtM(v: number) {
  if (v >= 1_000_000) return `R$ ${(v/1_000_000).toFixed(2).replace('.',',')}M`
  if (v >= 1_000)     return `R$ ${(v/1_000).toFixed(1).replace('.',',')}K`
  return `R$ ${fmt(v)}`
}
function fmtDate(dt: string) {
  if (!dt) return '—'
  const [y, m, d] = dt.split('-')
  return `${d}/${m}/${y}`
}
function sitLabel(s: string) {
  if (s === '-') return 'Sem Glosa'
  if (s === 'R') return 'Recursal'
  if (s === 'M') return 'Mantida'
  if (s === 'P') return 'Pendente'
  if (s === 'A') return 'Aceita'
  return s
}
function sitClass(s: string) {
  if (s === '-') return 's-concluido'
  if (s === 'R') return 's-andamento'
  if (s === 'M') return 's-atrasado'
  if (s === 'P') return 's-pendente'
  return 's-andamento'
}

/* ── ABA ANÁLISE ────────────────────────────────────────── */
function AbaAnalise() {
  const taxaRep = (TOTAL_REP / TOTAL_COB * 100).toFixed(1)

  return (
    <div>
      {/* Insights topo */}
      <div className="insight-strip">
        <div className="insight-card">
          <div className="insight-label">Total Cobrado AMHP</div>
          <div className="insight-value">R$ 4,30M</div>
          <div className="insight-sub">Nov/2024 – Abr/2026 · 20.033 registros</div>
        </div>
        <div className="insight-card laranja-g">
          <div className="insight-label">Total Glosa</div>
          <div className="insight-value">R$ 480K</div>
          <div className="insight-sub">{PCT_GLOSA}% do cobrado · R$298K em recurso</div>
        </div>
        <div className="insight-card verde-g">
          <div className="insight-label">Total Repassado</div>
          <div className="insight-value">R$ 3,82M</div>
          <div className="insight-sub">{taxaRep}% taxa de repasse efetiva</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card verde"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Valor Cobrado</span>
          <span className="kpi-value">R$ 4,30M</span>
          <span className="kpi-badge up">▲ período completo</span>
        </div>
        <div className="kpi-card azul"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Valor Repassado</span>
          <span className="kpi-value">R$ 3,82M</span>
          <span className="kpi-badge up">▲ {taxaRep}% do cobrado</span>
        </div>
        <div className="kpi-card laranja"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Total Glosa</span>
          <span className="kpi-value">R$ 480K</span>
          <span className="kpi-badge down">▼ {PCT_GLOSA}% do cobrado</span>
        </div>
        <div className="kpi-card verm"><div className="kpi-icon-bg"/>
          <span className="kpi-label">Ticket Médio</span>
          <span className="kpi-value">R$ {fmt(Math.round(TICKET_MEDIO))}</span>
          <span className="kpi-badge up">▲ {TOTAL_ATEND.toLocaleString('pt-BR')} atend.</span>
        </div>
      </div>

      {/* Gráfico mensal */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div className="section-title">Evolução Mensal — Cobrado vs Repassado</div>
          <div className="chart-legend">
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background:'#2AABBB' }}/>Cobrado</div>
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background:'#7D9A3A' }}/>Repassado</div>
          </div>
        </div>
        <div className="card-subtitle">Nov/2024 – Abr/2026 · valores em R$</div>

        {/* Barras cobrado */}
        <div className="bar-chart-full">
          {dadosMensais.map((d) => {
            const hc = Math.max(Math.round((d.vc / MAX_VC) * CHART_H), 3)
            const hr = Math.max(Math.round((d.vr / MAX_VC) * CHART_H), 2)
            const isPico = d.vc === 404556.47
            return (
              <div className="bar-group-full" key={d.mes} style={{ position:'relative' }}>
                {/* barra repasse (por baixo) */}
                <div style={{ position:'absolute', bottom:22, left:'20%', right:'20%',
                  height:`${hr}px`, background:'rgba(125,154,58,0.35)', borderRadius:'3px 3px 0 0', zIndex:1 }}
                  title={`Repasse ${d.mes}: ${fmtM(d.vr)}`}/>
                {/* barra cobrado (por cima) */}
                <div className={`bar-full ${isPico?'b-pico':'b2025'}`}
                  style={{ height:`${hc}px`, position:'relative', zIndex:2 }}
                  title={`Cobrado ${d.mes}: ${fmtM(d.vc)} | ${d.qtd.toLocaleString('pt-BR')} atend${d.parcial?' (parcial)':''}`}/>
                <span className="bar-label-full">{d.mes}</span>
              </div>
            )
          })}
        </div>
        <div style={{ display:'flex', gap:4, marginTop:4 }}>
          {dadosMensais.map((d) => (
            <div key={d.mes} style={{ flex:1, textAlign:'center', fontSize:8.5, color:'var(--cinza-texto)' }}>
              {fmtM(d.vc)}
            </div>
          ))}
        </div>
      </div>

      {/* Convênios + Glosa */}
      <div className="fat-row" style={{ marginBottom:24 }}>
        <div className="card">
          <div className="section-header">
            <div className="section-title">Top 10 Convênios</div>
            <span className="section-badge">por valor cobrado</span>
          </div>
          <div className="hbar-list">
            {convenios.map((c, i) => (
              <div className="hbar-item" key={c.nome}>
                <span className="hbar-rank">{i+1}º</span>
                <span className="hbar-name" title={c.nome}>{c.nome}</span>
                <div className="hbar-track">
                  <div className="hbar-fill" style={{ width:`${(c.vc/MAX_CON)*100}%`, background:COLORS[i] }}>
                    <span>{fmtM(c.vc)}</span>
                  </div>
                </div>
                <span className="hbar-qtd">{c.qtd.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          {/* Glosa donut */}
          <div className="card">
            <div className="section-title" style={{ marginBottom:16 }}>Situação das Glosas</div>
            <div className="donut-wrap">
              <svg className="donut-svg" viewBox="0 0 150 150">
                <circle cx="75" cy="75" r="58" fill="none" stroke="#f0f3f6" strokeWidth="22"/>
                {/* Sem glosa 86.9% */}
                <circle cx="75" cy="75" r="58" fill="none" stroke="#7D9A3A" strokeWidth="22"
                  strokeDasharray="317.1 47.2" strokeDashoffset="91" transform="rotate(-90 75 75)"/>
                {/* Recursal 5.2% */}
                <circle cx="75" cy="75" r="58" fill="none" stroke="#E8722A" strokeWidth="22"
                  strokeDasharray="18.9 345.4" strokeDashoffset="-226.1" transform="rotate(-90 75 75)"/>
                {/* Mantida 7.5% */}
                <circle cx="75" cy="75" r="58" fill="none" stroke="#E05252" strokeWidth="22"
                  strokeDasharray="27.4 336.9" strokeDashoffset="-245.0" transform="rotate(-90 75 75)"/>
                {/* Pendente + Aceita */}
                <circle cx="75" cy="75" r="58" fill="none" stroke="#7A8A99" strokeWidth="22"
                  strokeDasharray="1.5 362.8" strokeDashoffset="-272.4" transform="rotate(-90 75 75)"/>
                <text x="75" y="70" textAnchor="middle" fontSize="15" fontWeight="800" fill="#3B3B3B">86,9%</text>
                <text x="75" y="85" textAnchor="middle" fontSize="9" fill="#7A8A99">sem glosa</text>
              </svg>
              <div className="donut-legend">
                {glosaStatus.map((g) => (
                  <div className="legend-item" key={g.cod}>
                    <div className="legend-dot" style={{ background:g.cor }}/>
                    <span>{g.label} {g.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:5 }}>
              {glosaStatus.filter(g => g.val > 0).map((g) => (
                <div key={g.cod} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                  <span style={{ color:'var(--cinza-texto)' }}>{g.label} ({g.qtd.toLocaleString('pt-BR')})</span>
                  <strong style={{ color:g.cor }}>R$ {fmt(g.val)}</strong>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, paddingTop:6, borderTop:'1px solid var(--cinza-borda)', marginTop:4 }}>
                <span style={{ fontWeight:700 }}>Total Glosado</span>
                <strong style={{ color:'var(--vermelho)' }}>R$ {fmt(TOTAL_GLOSA)}</strong>
              </div>
            </div>
          </div>

          {/* Mini insight glosa */}
          <div className="card" style={{ background:'rgba(224,82,82,0.04)', border:'1px solid rgba(224,82,82,0.15)' }}>
            <div style={{ fontSize:12, lineHeight:1.7, color:'var(--grafite)' }}>
              <strong style={{ color:'#c0392b', display:'block', marginBottom:4 }}>⚠ Alerta de Glosa</strong>
              <span style={{ color:'var(--cinza-texto)' }}>R$ 298.159 em glosas <strong>recursais</strong> aguardando contestação. Priorize a análise de 1.042 guias com código R para recuperação de receita.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Médicos + Procedimentos */}
      <div className="fat-row">
        <div className="card">
          <div className="section-header">
            <div className="section-title">Produção por Médico</div>
            <span className="section-badge">top 10 por cobrado</span>
          </div>
          <div className="hbar-list">
            {medicos.map((m, i) => (
              <div className="hbar-item" key={m.nome}>
                <span className="hbar-rank">{i+1}º</span>
                <span className="hbar-name" title={m.nome}>{m.nome.split(' ').slice(0,2).join(' ')}</span>
                <div className="hbar-track">
                  <div className="hbar-fill" style={{ width:`${(m.vc/MAX_MED)*100}%`, background:COLORS[i] }}>
                    <span>{fmtM(m.vc)}</span>
                  </div>
                </div>
                <span className="hbar-qtd">{m.qtd.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <div className="section-title">Top 10 Procedimentos</div>
            <span className="section-badge">por cobrado</span>
          </div>
          <div className="hbar-list">
            {procedimentos.map((p, i) => (
              <div className="hbar-item" key={`${p.cod}-${i}`}>
                <span className="hbar-rank">{i+1}º</span>
                <span className="hbar-name" title={p.desc}>{p.desc}</span>
                <div className="hbar-track">
                  <div className="hbar-fill" style={{ width:`${(p.vc/procedimentos[0].vc)*100}%`, background:COLORS[i] }}>
                    <span>{fmtM(p.vc)}</span>
                  </div>
                </div>
                <span className="hbar-qtd">{p.qtd.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── ABA ATENDIMENTOS ───────────────────────────────────── */
function AbaAtendimentos() {
  const [dados, setDados]           = useState<Atendimento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca]           = useState('')
  const [filtroConv, setFiltroConv] = useState('Todos')
  const [filtroSit, setFiltroSit]   = useState('Todos')
  const [filtroAno, setFiltroAno]   = useState('Todos')
  const [pagina, setPagina]         = useState(1)

  useEffect(() => {
    fetch('/data/amhp.json')
      .then(r => r.json())
      .then((d: Atendimento[]) => { setDados(d); setCarregando(false) })
      .catch(() => setCarregando(false))
  }, [])

  /* Convênios únicos para filtro rápido */
  const convs = useMemo(() => {
    const set = new Set(dados.map(d => d.conv).filter(Boolean))
    const arr = Array.from(set).sort()
    return ['Todos', ...arr.slice(0, 10)]
  }, [dados])

  const filtrados = useMemo(() => {
    let r = dados
    if (filtroConv !== 'Todos') r = r.filter(x => x.conv === filtroConv)
    if (filtroSit  !== 'Todos') r = r.filter(x => x.sit  === filtroSit)
    if (filtroAno  !== 'Todos') r = r.filter(x => x.dt.startsWith(filtroAno))
    if (busca.trim()) {
      const b = busca.toLowerCase()
      r = r.filter(x =>
        x.proc.toLowerCase().includes(b) ||
        x.pac.toLowerCase().includes(b)  ||
        x.med.toLowerCase().includes(b)  ||
        x.conv.toLowerCase().includes(b) ||
        x.cod.includes(b)
      )
    }
    return r
  }, [dados, busca, filtroConv, filtroSit, filtroAno])

  const totalPag   = Math.ceil(filtrados.length / PER_PAGE)
  const pagAtual   = filtrados.slice((pagina-1)*PER_PAGE, pagina*PER_PAGE)
  const totalCob   = filtrados.reduce((s, x) => s + x.vc, 0)
  const totalGlosa = filtrados.reduce((s, x) => s + x.vg, 0)

  function changePage(p: number) { setPagina(p); window.scrollTo({ top: 0, behavior:'smooth' }) }

  return (
    <div>
      {/* Filtros */}
      <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        <div className="header-search" style={{ maxWidth:300, margin:0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="search" placeholder="Proc., paciente, médico, convênio..."
            value={busca} onChange={e => { setBusca(e.target.value); setPagina(1) }}/>
        </div>

        <div className="period-tabs">
          {['Todos','2024','2025','2026'].map(a => (
            <button key={a} className={`period-tab${filtroAno===a?' active':''}`}
              onClick={() => { setFiltroAno(a); setPagina(1) }}>{a}</button>
          ))}
        </div>

        <div className="period-tabs">
          {[{l:'Todos',v:'Todos'},{l:'Sem Glosa',v:'-'},{l:'Recursal',v:'R'},{l:'Mantida',v:'M'},{l:'Pendente',v:'P'}].map(s => (
            <button key={s.v} className={`period-tab${filtroSit===s.v?' active':''}`}
              onClick={() => { setFiltroSit(s.v); setPagina(1) }}>{s.l}</button>
          ))}
        </div>

        <div style={{ marginLeft:'auto', display:'flex', gap:20, fontSize:13 }}>
          <span><strong style={{ color:'var(--azul)' }}>{filtrados.length.toLocaleString('pt-BR')}</strong> <span style={{ color:'var(--cinza-texto)' }}>registros</span></span>
          <span><strong style={{ color:'var(--verde)' }}>{fmtM(totalCob)}</strong> <span style={{ color:'var(--cinza-texto)' }}>cobrado</span></span>
          {totalGlosa > 0 && (
            <span><strong style={{ color:'var(--vermelho)' }}>{fmtM(totalGlosa)}</strong> <span style={{ color:'var(--cinza-texto)' }}>glosa</span></span>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {carregando ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, gap:12, color:'var(--cinza-texto)' }}>
            <div className="spinner" style={{ borderColor:'rgba(42,171,187,0.3)', borderTopColor:'var(--azul)' }}/>
            Carregando 20.033 atendimentos AMHP...
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data Atend.</th>
                  <th>Convênio</th>
                  <th>Médico</th>
                  <th>Procedimento</th>
                  <th>Paciente</th>
                  <th>Glosa</th>
                  <th style={{ textAlign:'right' }}>Cobrado</th>
                  <th style={{ textAlign:'right' }}>Repasse</th>
                </tr>
              </thead>
              <tbody>
                {pagAtual.map((row, i) => (
                  <tr key={i}>
                    <td style={{ whiteSpace:'nowrap', fontSize:12 }}>{fmtDate(row.dt)}</td>
                    <td style={{ fontSize:11, maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={row.conv}>{row.conv}</td>
                    <td style={{ fontSize:11, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={row.med}>{row.med.split(' ').slice(0,2).join(' ')}</td>
                    <td style={{ fontSize:11, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={row.proc}>{row.proc}</td>
                    <td style={{ fontSize:11, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={row.pac}>{row.pac}</td>
                    <td><span className={`status-badge ${sitClass(row.sit)}`}>{sitLabel(row.sit)}</span></td>
                    <td style={{ textAlign:'right', fontWeight:700, whiteSpace:'nowrap', fontSize:12 }}>R$ {fmt(row.vc)}</td>
                    <td style={{ textAlign:'right', color: row.vg>0?'var(--vermelho)':'var(--verde)', whiteSpace:'nowrap', fontSize:12, fontWeight:600 }}>
                      {row.vg > 0 ? `-R$ ${fmt(row.vg)}` : `R$ ${fmt(row.vr)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!carregando && totalPag > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', borderTop:'1px solid var(--cinza-borda)', fontSize:13 }}>
            <span style={{ color:'var(--cinza-texto)' }}>Página <strong>{pagina}</strong> de <strong>{totalPag.toLocaleString('pt-BR')}</strong></span>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={() => changePage(1)} disabled={pagina===1} style={btnStyle(pagina===1)}>«</button>
              <button onClick={() => changePage(pagina-1)} disabled={pagina===1} style={btnStyle(pagina===1)}>‹</button>
              {Array.from({ length: Math.min(5, totalPag) }, (_, i) => {
                const start = Math.max(1, Math.min(pagina-2, totalPag-4))
                const p = start + i
                return <button key={p} onClick={() => changePage(p)} style={btnStyle(false, p===pagina)}>{p}</button>
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
    padding:'5px 10px', borderRadius:6, border:'1.5px solid var(--cinza-borda)',
    background: active?'var(--azul)':'#fff',
    color: active?'#fff':disabled?'var(--cinza-borda)':'var(--grafite)',
    cursor: disabled?'not-allowed':'pointer', fontWeight:600, fontSize:13, fontFamily:'inherit',
  }
}

/* ── COMPONENTE PRINCIPAL ───────────────────────────────── */
export default function AMHPDashboard() {
  const [aba, setAba] = useState<'analise'|'atendimentos'>('analise')

  return (
    <main className="main-content">
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'var(--grafite)' }}>
              Faturamento <span style={{ color:'var(--azul)' }}>/ AMHP</span>
            </h1>
            <p style={{ fontSize:13, color:'var(--cinza-texto)', marginTop:2 }}>
              Pagamentos via Associação Médica · Nov/2024–Abr/2026 · <strong>20.033 registros</strong> · 35 extratos
            </p>
          </div>
          <div style={{ display:'flex', gap:4, background:'var(--cinza-bg)', padding:4, borderRadius:10 }}>
            <button className={`period-tab${aba==='analise'?' active':''}`}
              onClick={() => setAba('analise')}
              style={{ display:'flex', alignItems:'center', gap:6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              Análise
            </button>
            <button className={`period-tab${aba==='atendimentos'?' active':''}`}
              onClick={() => setAba('atendimentos')}
              style={{ display:'flex', alignItems:'center', gap:6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
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
