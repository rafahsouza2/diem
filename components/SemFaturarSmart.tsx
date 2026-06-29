'use client'

import { useState, useEffect, useMemo } from 'react'

/* ── TIPOS ──────────────────────────────────────────────── */
interface PorTipo { tipo: string; qtd: number; val: number }
interface MensSF  { mes: string; qtd: number; match: number; nao: number; val: number }
interface ProcNao { proc: string; qtd: number; val: number }
interface RegNao  { dt: string; pac: string; cod: string; proc: string; val: number }
interface RegMatch{ dt: string; pac: string; cod: string; proc: string; val: number; tipo: string; a_dt: string; a_pac: string; a_conv: string; a_vc: number; amhptiss: string }
interface Resumo  {
  total: number; aberto: number; particular: number
  abertoMatch: number; abertoNao: number; abertoSemCod: number
  pctMatch: number
  valorAberto: number; valorMatch: number; valorNao: number; valorParticular: number
}
interface SFData {
  resumo: Resumo
  porTipo: PorTipo[]
  mensal: MensSF[]
  abertoNao: RegNao[]
  abertoMatch: RegMatch[]
  procNao: ProcNao[]
}

/* ── HELPERS ────────────────────────────────────────────── */
const PER_PAGE = 50
function fmt(v: number) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtM(v: number) { if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(2).replace('.', ',')}M`; if (v >= 1000) return `R$ ${(v / 1000).toFixed(1).replace('.', ',')}K`; return `R$ ${fmt(v)}` }
function fmtDate(dt: string) { if (!dt) return '—'; const [y, m, d] = dt.split('-'); return `${d}/${m}/${y}` }
function btnStyle(disabled: boolean, active = false): React.CSSProperties {
  return { padding: '5px 10px', borderRadius: 6, border: '1.5px solid var(--cinza-borda)', background: active ? 'var(--azul)' : '#fff', color: active ? '#fff' : disabled ? 'var(--cinza-borda)' : 'var(--grafite)', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }
}

const TIPO_LABEL: Record<string, string> = { T1: 'Exato', T2: '±7 dias', T4: '±30 dias', Nao: 'Não encontrado', SemCod: 'Particular' }
const TIPO_COLOR: Record<string, string> = { T1: '#059669', T2: '#2563EB', T4: '#D97706', Nao: '#DC2626', SemCod: '#7D9A3A' }
const TIPO_CLASS: Record<string, string> = { T1: 's-concluido', T2: 's-andamento', T4: 's-pendente', Nao: 's-atrasado', SemCod: 's-concluido' }

/* ── ABA ANÁLISE ────────────────────────────────────────── */
function AbaAnalise({ data }: { data: SFData }) {
  const { resumo, porTipo, mensal, procNao } = data
  const abertoSemMatchPct = Math.round(resumo.abertoNao / resumo.aberto * 100)

  return (
    <div>
      {/* Alert */}
      <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '14px 20px', marginBottom: 24, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--vermelho)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Atenção — registros não faturados</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--vermelho)' }}>{resumo.abertoNao.toLocaleString('pt-BR')} atendimentos Aberto</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>sem correspondente na AMHP · {fmtM(resumo.valorNao)} em valor</div>
        </div>
        <div style={{ flex: 1, fontSize: 12, color: 'var(--grafite)', lineHeight: 1.7 }}>
          Estes atendimentos estão marcados como <strong>"Aberto"</strong> no Smart e <strong>não foram encontrados</strong> na plataforma AMHP. Diferente dos registros <em>Particular</em> — identificados por não possuírem código TISS — estes deveriam ter sido faturados ao convênio mas não constam no sistema de cobrança.
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card verm"><div className="kpi-icon-bg" />
          <span className="kpi-label">Aberto sem AMHP</span>
          <span className="kpi-value">{fmtM(resumo.valorNao)}</span>
          <span className="kpi-badge down">▼ {resumo.abertoNao.toLocaleString('pt-BR')} registros · {abertoSemMatchPct}% do Aberto</span>
        </div>
        <div className="kpi-card verde"><div className="kpi-icon-bg" />
          <span className="kpi-label">Aberto encontrado AMHP</span>
          <span className="kpi-value">{fmtM(resumo.valorMatch)}</span>
          <span className="kpi-badge up">▲ {resumo.abertoMatch.toLocaleString('pt-BR')} registros · {resumo.pctMatch}% match</span>
        </div>
        <div className="kpi-card azul"><div className="kpi-icon-bg" />
          <span className="kpi-label">Particular (correto)</span>
          <span className="kpi-value">{fmtM(resumo.valorParticular)}</span>
          <span className="kpi-badge">{resumo.particular.toLocaleString('pt-BR')} reg · não passa pela AMHP</span>
        </div>
        <div className="kpi-card laranja"><div className="kpi-icon-bg" />
          <span className="kpi-label">Total analisado</span>
          <span className="kpi-value">{resumo.total.toLocaleString('pt-BR')}</span>
          <span className="kpi-badge">{resumo.aberto.toLocaleString('pt-BR')} Aberto + {resumo.particular.toLocaleString('pt-BR')} P</span>
        </div>
      </div>

      {/* Distribuição Aberto */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Breakdown status */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Situação dos Registros Aberto</div>
          {[
            { label: 'Com match AMHP (T1+T2+T4)', qtd: resumo.abertoMatch, val: resumo.valorMatch, cor: 'var(--verde)', pct: Math.round(resumo.abertoMatch / resumo.aberto * 100) },
            { label: 'Sem match — não faturados', qtd: resumo.abertoNao, val: resumo.valorNao, cor: 'var(--vermelho)', pct: abertoSemMatchPct },
            { label: 'Particular (sem código TISS)', qtd: resumo.abertoSemCod, val: 0, cor: 'var(--verde)', pct: Math.round(resumo.abertoSemCod / resumo.aberto * 100) },
          ].map(s => (
            <div key={s.label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{s.label}</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: s.cor }}>{s.qtd.toLocaleString('pt-BR')}</span>
                  {s.val > 0 && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>{fmtM(s.val)}</span>}
                </div>
              </div>
              <div style={{ height: 7, background: 'var(--muted)', borderRadius: 4 }}>
                <div style={{ height: '100%', width: `${s.pct}%`, background: s.cor, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Técnicas de match */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>Técnicas de Cruzamento (todos os registros)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {porTipo.filter(t => t.tipo !== 'SemCod').map(t => {
              const pct = Math.round(t.qtd / data.resumo.total * 100)
              return (
                <div key={t.tipo} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 28, borderRadius: 3, background: TIPO_COLOR[t.tipo], flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{TIPO_LABEL[t.tipo] || t.tipo}</span>
                      <span style={{ fontSize: 11, color: TIPO_COLOR[t.tipo], fontWeight: 700 }}>{t.qtd.toLocaleString('pt-BR')} · {pct}%</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--muted)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: TIPO_COLOR[t.tipo], borderRadius: 3 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 64, textAlign: 'right' }}>{fmtM(t.val)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mensal */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Evolução Mensal — Registros Aberto</div>
        {mensal.length > 0 && (() => {
          const maxQtd = Math.max(...mensal.map(m => m.qtd), 1)
          return (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', minWidth: 480, height: 120 }}>
                {mensal.map(m => (
                  <div key={m.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 90 }}>
                      <div style={{ width: '100%', background: 'var(--vermelho)', borderRadius: '2px 2px 0 0', opacity: 0.9, height: `${Math.round(m.nao / maxQtd * 90)}px` }} title={`Sem match: ${m.nao}`} />
                      <div style={{ width: '100%', background: 'var(--accent)', borderRadius: '2px 2px 0 0', height: `${Math.round(m.match / maxQtd * 90)}px` }} title={`Com match: ${m.match}`} />
                    </div>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>{m.mes.replace('/','\n')}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: 'var(--accent)', borderRadius: 2, display: 'inline-block' }} /> Com match AMHP</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: 'var(--vermelho)', borderRadius: 2, display: 'inline-block' }} /> Sem match (não faturado)</span>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Top procedimentos sem faturar */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">Procedimentos sem faturamento AMHP (Aberto)</div>
          <span className="section-badge">{procNao.length} procedimentos</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Procedimento</th>
                <th style={{ textAlign: 'right' }}>Qtd</th>
                <th style={{ textAlign: 'right' }}>Valor total</th>
              </tr>
            </thead>
            <tbody>
              {procNao.map((p, i) => (
                <tr key={p.proc}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 11, width: 28 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, fontSize: 12 }}>{p.proc || '(sem descrição)'}</td>
                  <td style={{ textAlign: 'right', fontSize: 12 }}>{p.qtd.toLocaleString('pt-BR')}</td>
                  <td style={{ textAlign: 'right', fontSize: 12, fontWeight: p.val > 0 ? 700 : 400, color: p.val > 0 ? 'var(--vermelho)' : 'var(--text-muted)' }}>{p.val > 0 ? fmtM(p.val) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ── ABA SEM FATURAR (Aberto sem AMHP) ──────────────────── */
function AbaSemFaturar({ registros }: { registros: RegNao[] }) {
  const [busca, setBusca]   = useState('')
  const [pagina, setPagina] = useState(1)

  const filtrados = useMemo(() => {
    if (!busca.trim()) return registros
    const b = busca.toLowerCase()
    return registros.filter(r => r.pac.toLowerCase().includes(b) || r.proc.toLowerCase().includes(b))
  }, [registros, busca])

  const totalPag = Math.ceil(filtrados.length / PER_PAGE)
  const pagAtual = filtrados.slice((pagina - 1) * PER_PAGE, pagina * PER_PAGE)
  const valorFiltrado = filtrados.reduce((s, r) => s + r.val, 0)

  return (
    <div>
      <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '14px 20px', marginBottom: 18, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--vermelho)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total não faturados</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--vermelho)' }}>{fmtM(valorFiltrado)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registros Aberto</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--grafite)' }}>{filtrados.length.toLocaleString('pt-BR')}</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Atendimentos marcados como <strong>Aberto</strong> no Smart que não possuem correspondente na AMHP e <strong>possuem código TISS</strong> (convênio). Estes deveriam ter sido faturados ao convênio — verifique se houve falha de lançamento. Atendimentos sem código TISS já são tratados como Particular.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <div className="header-search" style={{ maxWidth: 320, margin: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="search" placeholder="Paciente ou procedimento..."
            value={busca} onChange={e => { setBusca(e.target.value); setPagina(1) }} />
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          <strong style={{ color: 'var(--grafite)' }}>{filtrados.length.toLocaleString('pt-BR')}</strong> registros
        </span>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Paciente</th>
                <th>Cód. TISS</th>
                <th>Procedimento</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {pagAtual.map((r, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{fmtDate(r.dt)}</td>
                  <td style={{ fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.pac}>{r.pac}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{r.cod || '—'}</td>
                  <td style={{ fontSize: 11, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.proc}>{r.proc || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 12, color: r.val > 0 ? 'var(--vermelho)' : 'var(--text-muted)' }}>{r.val > 0 ? `R$ ${fmt(r.val)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPag > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderTop: '1px solid var(--cinza-borda)', fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>Página <strong>{pagina}</strong> de <strong>{totalPag}</strong></span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setPagina(1)} disabled={pagina === 1} style={btnStyle(pagina === 1)}>«</button>
              <button onClick={() => setPagina(p => p - 1)} disabled={pagina === 1} style={btnStyle(pagina === 1)}>‹</button>
              {Array.from({ length: Math.min(5, totalPag) }, (_, i) => { const start = Math.max(1, Math.min(pagina - 2, totalPag - 4)); const p = start + i; return <button key={p} onClick={() => setPagina(p)} style={btnStyle(false, p === pagina)}>{p}</button> })}
              <button onClick={() => setPagina(p => p + 1)} disabled={pagina === totalPag} style={btnStyle(pagina === totalPag)}>›</button>
              <button onClick={() => setPagina(totalPag)} disabled={pagina === totalPag} style={btnStyle(pagina === totalPag)}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── ABA ENCONTRADOS NA AMHP ────────────────────────────── */
function AbaEncontrados({ registros }: { registros: RegMatch[] }) {
  const [busca, setBusca]   = useState('')
  const [pagina, setPagina] = useState(1)

  const filtrados = useMemo(() => {
    if (!busca.trim()) return registros
    const b = busca.toLowerCase()
    return registros.filter(r => r.pac.toLowerCase().includes(b) || r.a_conv.toLowerCase().includes(b))
  }, [registros, busca])

  const totalPag = Math.ceil(filtrados.length / PER_PAGE)
  const pagAtual = filtrados.slice((pagina - 1) * PER_PAGE, pagina * PER_PAGE)

  return (
    <div>
      <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-ring)', borderRadius: 10, padding: '14px 20px', marginBottom: 18, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Encontrados na AMHP (T1)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--grafite)' }}>{filtrados.length.toLocaleString('pt-BR')} registros</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Registros marcados como "Sem Faturar" no Smart que possuem correspondente exato (T1: paciente + data + código) na AMHP. Estes <strong>foram faturados</strong> — a marcação do Smart pode estar desatualizada.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <div className="header-search" style={{ maxWidth: 320, margin: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="search" placeholder="Paciente ou convênio AMHP..."
            value={busca} onChange={e => { setBusca(e.target.value); setPagina(1) }} />
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          <strong style={{ color: 'var(--grafite)' }}>{filtrados.length.toLocaleString('pt-BR')}</strong> registros T1
        </span>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data Smart</th>
                <th>Paciente Smart</th>
                <th>Cód. TISS</th>
                <th>Procedimento</th>
                <th>Data AMHP</th>
                <th>Nº AMHPTISS</th>
                <th>Convênio AMHP</th>
                <th style={{ textAlign: 'right' }}>Val. Smart</th>
                <th style={{ textAlign: 'right' }}>Val. AMHP</th>
              </tr>
            </thead>
            <tbody>
              {pagAtual.map((r, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{fmtDate(r.dt)}</td>
                  <td style={{ fontSize: 11, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.pac}>{r.pac}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{r.cod}</td>
                  <td style={{ fontSize: 10, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.proc}>{r.proc}</td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 11, color: 'var(--accent)' }}>{fmtDate(r.a_dt)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--azul)', fontWeight: 600 }}>{r.amhptiss || '—'}</td>
                  <td style={{ fontSize: 10, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.a_conv}</td>
                  <td style={{ textAlign: 'right', fontSize: 12, fontWeight: 600 }}>{r.val > 0 ? `R$ ${fmt(r.val)}` : '—'}</td>
                  <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{r.a_vc > 0 ? `R$ ${fmt(r.a_vc)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPag > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderTop: '1px solid var(--cinza-borda)', fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>Página <strong>{pagina}</strong> de <strong>{totalPag}</strong></span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setPagina(1)} disabled={pagina === 1} style={btnStyle(pagina === 1)}>«</button>
              <button onClick={() => setPagina(p => p - 1)} disabled={pagina === 1} style={btnStyle(pagina === 1)}>‹</button>
              {Array.from({ length: Math.min(5, totalPag) }, (_, i) => { const start = Math.max(1, Math.min(pagina - 2, totalPag - 4)); const p = start + i; return <button key={p} onClick={() => setPagina(p)} style={btnStyle(false, p === pagina)}>{p}</button> })}
              <button onClick={() => setPagina(p => p + 1)} disabled={pagina === totalPag} style={btnStyle(pagina === totalPag)}>›</button>
              <button onClick={() => setPagina(totalPag)} disabled={pagina === totalPag} style={btnStyle(pagina === totalPag)}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── COMPONENTE PRINCIPAL ───────────────────────────────── */
export default function SemFaturarSmart() {
  const [data, setData]       = useState<SFData | null>(null)
  const [loading, setLoading] = useState(true)
  const [aba, setAba]         = useState<'analise' | 'semfaturar' | 'encontrados'>('analise')

  useEffect(() => {
    fetch('/data/sem_faturar.json')
      .then(r => r.json())
      .then((d: SFData) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <main className="main-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 14, color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ borderColor: 'rgba(220,38,38,0.2)', borderTopColor: 'var(--vermelho)' }} />
        <div>
          <div style={{ fontWeight: 600, color: 'var(--grafite)' }}>Carregando análise...</div>
          <div style={{ fontSize: 12, marginTop: 2 }}>Processando 13.753 registros Smart</div>
        </div>
      </div>
    </main>
  )

  if (!data) return <main className="main-content"><p style={{ color: 'var(--vermelho)' }}>Erro ao carregar dados.</p></main>

  const abas = [
    { id: 'analise',     label: 'Análise',                                                    icon: 'M18 20 L18 10 M12 20 L12 4 M6 20 L6 14' },
    { id: 'semfaturar',  label: `Não encontrados (${data.resumo.abertoNao.toLocaleString('pt-BR')})`, icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9 L12 13 M12 17 L12.01 17' },
    { id: 'encontrados', label: `Encontrados AMHP (${data.resumo.abertoMatch.toLocaleString('pt-BR')})`, icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 L12 14.01 9 11.01' },
  ] as const

  return (
    <main className="main-content">
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--grafite)' }}>
              Faturamento <span style={{ color: 'var(--vermelho)' }}>/ Sem Faturar Smart</span>
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              13.753 registros Smart marcados como sem faturar · cruzamento com AMHP
            </p>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--cinza-bg)', padding: 4, borderRadius: 10 }}>
            {abas.map(a => (
              <button key={a.id}
                className={`period-tab${aba === a.id ? ' active' : ''}`}
                onClick={() => setAba(a.id as typeof aba)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={a.icon} />
                </svg>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {aba === 'analise'     && <AbaAnalise data={data} />}
      {aba === 'semfaturar'  && <AbaSemFaturar registros={data.abertoNao} />}
      {aba === 'encontrados' && <AbaEncontrados registros={data.abertoMatch} />}
    </main>
  )
}
