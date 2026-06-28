import { createClient } from '@/lib/supabase/server'

function getSaudacao(): string {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getDataFormatada(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Dados reais das análises realizadas ──────────────────────────────────────

const mensal = [
  { mes: 'Nov/25', vc: 188266.96, vr: 69246.84  },
  { mes: 'Dez/25', vc: 161331.22, vr: 52862.65  },
  { mes: 'Jan/26', vc: 196589.45, vr: 125596.42 },
  { mes: 'Fev/26', vc: 86905.94,  vr: 54809.88  },
  { mes: 'Mar/26', vc: 141751.07, vr: 78420.39  },
  { mes: 'Abr/26', vc: 6878.09,   vr: 2020.47   },
]
const maxVc = Math.max(...mensal.map(m => m.vc))

const topConv = [
  { conv: 'Saúde Caixa',        match: 4018, nao: 2485, vc: 923472.92, vcNao: 365033.49 },
  { conv: 'Pró-Saúde (TJDFT)',  match: 2323, nao: 1591, vc: 913537.18, vcNao: 562429.54 },
  { conv: 'Pró-Saúde (Câmara)',  match: 1027, nao:  921, vc: 797850.64, vcNao: 654527.11 },
  { conv: 'BACEN',              match:  310, nao:  848, vc: 535762.74, vcNao: 457347.47 },
  { conv: 'Pró-Social (TRF)',   match:  537, nao:  330, vc: 165188.28, vcNao:  96332.75 },
  { conv: 'SERPRO',             match:  584, nao:  285, vc: 155953.81, vcNao:  51297.19 },
]
const maxConvVc = Math.max(...topConv.map(c => c.vc + c.vcNao))

const aReceberBreakdown = [
  { label: 'Aguardando pagamento', valor: 270425.84, qtd: 1536, cor: '#2AABBB', pct: 73.5 },
  { label: 'Previsto (a liberar)',  valor: 82934.54,  qtd: 426,  cor: '#7D9A3A', pct: 22.6 },
  { label: 'Glosas em recurso',     valor: 1836.26,   qtd: 50,   cor: '#E8722A', pct: 0.5  },
  { label: 'Ajuizados',             valor: 13751.89,  qtd: 74,   cor: '#C0392B', pct: 3.7  },
]

// ────────────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const nomeCompleto = user?.user_metadata?.full_name ?? ''
  const primeiroNome = nomeCompleto.split(' ')[0] || 'Rafael'

  return (
    <main className="main-content">

      {/* Saudação */}
      <div className="greeting">
        <h1>{getSaudacao()}, {primeiroNome}! 👋</h1>
        <p style={{ textTransform: 'capitalize' }}>{getDataFormatada()}</p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="kpi-grid">

        <div className="kpi-card verde">
          <div className="kpi-icon-bg" />
          <span className="kpi-label">A Receber Total</span>
          <span className="kpi-value">R$ {fmt(367887.79)}</span>
          <span className="kpi-badge up">2.012 cobranças pendentes na AMHP</span>
        </div>

        <div className="kpi-card azul">
          <div className="kpi-icon-bg" />
          <span className="kpi-label">Sem Faturar (real)</span>
          <span className="kpi-value">R$ {fmt(132940.65)}</span>
          <span className="kpi-badge down">496 atendimentos sem guia AMHP</span>
        </div>

        <div className="kpi-card laranja">
          <div className="kpi-icon-bg" />
          <span className="kpi-label">Taxa de Match Smart × AMHP</span>
          <span className="kpi-value">56,2%</span>
          <span className="kpi-badge up">11.257 de 20.033 registros AMHP</span>
        </div>

        <div className="kpi-card verm">
          <div className="kpi-icon-bg" />
          <span className="kpi-label">Ajuizados</span>
          <span className="kpi-value">R$ {fmt(13751.89)}</span>
          <span className="kpi-badge down">74 processos em cobrança judicial</span>
        </div>

      </div>

      {/* ── Gráficos ── */}
      <div className="charts-row">

        {/* Faturamento AMHP Mensal */}
        <div className="card">
          <div className="card-title">Faturamento AMHP — Últimos 6 meses</div>
          <div className="card-subtitle">Valor cobrado (azul) vs valor recebido (verde) em R$</div>
          <div className="bar-chart" style={{ alignItems: 'flex-end', gap: 10 }}>
            {mensal.map((m, i) => {
              const hVc = Math.round((m.vc / maxVc) * 140)
              const hVr = Math.round((m.vr / maxVc) * 140)
              const isLast = i === mensal.length - 1
              return (
                <div key={m.mes} className="bar-group" style={{ gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 140 }}>
                    <div
                      className={`bar${isLast ? '' : ''}`}
                      style={{ height: hVc, width: 18, background: 'var(--azul)', opacity: isLast ? 0.5 : 1, borderRadius: '3px 3px 0 0' }}
                      title={`Cobrado: R$ ${fmt(m.vc)}`}
                    />
                    <div
                      style={{ height: hVr, width: 14, background: 'var(--verde)', borderRadius: '3px 3px 0 0', opacity: 0.85 }}
                      title={`Recebido: R$ ${fmt(m.vr)}`}
                    />
                  </div>
                  <span className="bar-label">{m.mes}</span>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: 'var(--cinza-texto)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--azul)', display: 'inline-block' }} /> Cobrado
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--verde)', display: 'inline-block' }} /> Recebido
            </span>
            <span style={{ marginLeft: 'auto', color: 'var(--cinza-texto)', fontSize: 10 }}>Abr/26 parcial</span>
          </div>
        </div>

        {/* A Receber Breakdown */}
        <div className="card">
          <div className="card-title">A Receber — R$ {fmt(367887.79)}</div>
          <div className="card-subtitle">Distribuição por status das 2.012 cobranças pendentes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            {aReceberBreakdown.map(b => (
              <div key={b.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                  <span style={{ color: 'var(--grafite)', fontWeight: 500 }}>{b.label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--grafite)' }}>
                    R$ {fmt(b.valor)} <span style={{ color: 'var(--cinza-texto)', fontWeight: 400 }}>({b.qtd})</span>
                  </span>
                </div>
                <div style={{ height: 7, background: 'var(--cinza-bg)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${b.pct}%`, background: b.cor, borderRadius: 4, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(200,82,82,0.07)', borderRadius: 8, border: '1px solid rgba(200,82,82,0.2)', fontSize: 12 }}>
            <strong style={{ color: '#C0392B' }}>⚠ Glosas AMHP:</strong>
            <span style={{ color: 'var(--cinza-texto)', marginLeft: 6 }}>R$ 572,98 em recurso (18 glosas) · R$ 1.836,26 no A Receber</span>
          </div>
        </div>

      </div>

      {/* ── Linha inferior ── */}
      <div className="bottom-row">

        {/* Top Convênios */}
        <div className="card">
          <div className="card-title">Top Convênios — Faturamento AMHP</div>
          <div className="card-subtitle">Valor cobrado total (match + sem match) por convênio</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            {topConv.map(c => {
              const total = c.vc + c.vcNao
              const pct   = Math.round((total / maxConvVc) * 100)
              const taxa  = Math.round(c.match / (c.match + c.nao) * 100)
              return (
                <div key={c.conv}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--grafite)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.conv}</span>
                    <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ color: 'var(--cinza-texto)', fontSize: 11 }}>Match: <strong style={{ color: taxa >= 60 ? 'var(--verde)' : 'var(--vermelho)' }}>{taxa}%</strong></span>
                      <span style={{ fontWeight: 700, color: 'var(--grafite)' }}>R$ {fmt(total / 1000)}k</span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--cinza-bg)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${pct * (c.vc / total)}%`, background: 'var(--azul)', height: '100%' }} />
                    <div style={{ width: `${pct * (c.vcNao / total)}%`, background: 'rgba(200,82,82,0.4)', height: '100%' }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 11, color: 'var(--cinza-texto)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 6, borderRadius: 2, background: 'var(--azul)', display: 'inline-block' }} /> Com match Smart
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 6, borderRadius: 2, background: 'rgba(200,82,82,0.4)', display: 'inline-block' }} /> Sem match Smart
            </span>
          </div>
        </div>

        {/* Sem Faturar */}
        <div className="card">
          <div className="card-title">Sem Faturar Smart — Análise</div>
          <div className="card-subtitle">13.753 atendimentos marcados como "sem faturar" no Smart</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>

            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, padding: '10px 12px', background: 'rgba(42,171,187,0.08)', border: '1px solid rgba(42,171,187,0.2)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--cinza-texto)', marginBottom: 2 }}>Particular (excluído)</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--azul)' }}>8.386</div>
                <div style={{ fontSize: 11, color: 'var(--cinza-texto)' }}>R$ {fmt(323047.47)}</div>
              </div>
              <div style={{ flex: 1, padding: '10px 12px', background: 'rgba(125,154,58,0.08)', border: '1px solid rgba(125,154,58,0.2)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--cinza-texto)', marginBottom: 2 }}>Encontrados AMHP</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--verde)' }}>3.328</div>
                <div style={{ fontSize: 11, color: 'var(--cinza-texto)' }}>R$ {fmt(117384.27)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, padding: '10px 12px', background: 'rgba(200,82,82,0.08)', border: '1px solid rgba(200,82,82,0.25)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--cinza-texto)', marginBottom: 2 }}>Não encontrados ⚠</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--vermelho)' }}>496</div>
                <div style={{ fontSize: 11, color: 'var(--cinza-texto)' }}>R$ {fmt(132940.65)}</div>
              </div>
              <div style={{ flex: 1, padding: '10px 12px', background: 'rgba(230,200,50,0.08)', border: '1px solid rgba(230,200,50,0.3)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--cinza-texto)', marginBottom: 2 }}>Sem código TISS</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#B8860B' }}>1.543</div>
                <div style={{ fontSize: 11, color: 'var(--cinza-texto)' }}>R$ {fmt(123988.69)}</div>
              </div>
            </div>

            <div style={{ padding: '10px 12px', background: 'rgba(200,82,82,0.06)', borderRadius: 8, border: '1px solid rgba(200,82,82,0.18)', fontSize: 12 }}>
              <strong style={{ color: 'var(--vermelho)' }}>Potencial não faturado:</strong>
              <span style={{ color: 'var(--grafite)', marginLeft: 6, fontWeight: 600 }}>R$ {fmt(132940.65)}</span>
              <span style={{ color: 'var(--cinza-texto)', marginLeft: 4 }}> em atendimentos sem guia AMHP identificada</span>
            </div>

          </div>
        </div>

      </div>
    </main>
  )
}
