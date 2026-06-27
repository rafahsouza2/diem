import { createClient } from '@/lib/supabase/server'

function getSaudacao(): string {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getDataFormatada(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const processos = [
  { nome: 'Renovação de Convênio Unimed', responsavel: 'Dra. Ana Lima', status: 's-andamento', statusLabel: 'Em andamento', data: '25/06/2025' },
  { nome: 'Auditoria Mensal de Faturamento', responsavel: 'Carlos Menezes', status: 's-concluido', statusLabel: 'Concluído', data: '24/06/2025' },
  { nome: 'Treinamento LGPD — Equipe Adm.', responsavel: 'RH Interno', status: 's-pendente', statusLabel: 'Pendente', data: '30/06/2025' },
  { nome: 'Calibração Equipamentos — ECG', responsavel: 'Téc. Roberto S.', status: 's-atrasado', statusLabel: 'Atrasado', data: '20/06/2025' },
  { nome: 'Revisão de Prontuários Eletrônicos', responsavel: 'Dra. Fernanda Costa', status: 's-concluido', statusLabel: 'Concluído', data: '23/06/2025' },
]

const vencimentos = [
  { nome: 'Alvará Sanitário — Asa Norte', data: '30/06/2025', urgencia: 'urgente', dias: '3 dias' },
  { nome: 'Licença de Funcionamento', data: '04/07/2025', urgencia: 'urgente', dias: '7 dias' },
  { nome: 'Contrato Manutenção — Ultrassom', data: '12/07/2025', urgencia: 'atencao', dias: '15 dias' },
  { nome: 'Renovação Seguro Patrimonial', data: '28/07/2025', urgencia: 'ok', dias: '31 dias' },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const nomeCompleto = user?.user_metadata?.full_name ?? ''
  const primeiroNome = nomeCompleto.split(' ')[0] || 'Rafael'

  return (
    <main className="main-content">
      <div className="greeting">
        <h1>{getSaudacao()}, {primeiroNome}! 👋</h1>
        <p style={{ textTransform: 'capitalize' }}>{getDataFormatada()}</p>
      </div>

      {/* KPI CARDS — valores vindos da API financeira */}
      <div className="kpi-grid">
        <div className="kpi-card verde">
          <div className="kpi-icon-bg" />
          <span className="kpi-label">Faturamento do Mês</span>
          <span className="kpi-value">R$ 187.430</span>
          <span className="kpi-badge up">▲ +12,4% vs mês anterior</span>
        </div>

        <div className="kpi-card azul">
          <div className="kpi-icon-bg" />
          <span className="kpi-label">Consultas Realizadas</span>
          <span className="kpi-value">1.248</span>
          <span className="kpi-badge up">▲ +8,1% vs mês anterior</span>
        </div>

        <div className="kpi-card laranja">
          <div className="kpi-icon-bg" />
          <span className="kpi-label">Ticket Médio</span>
          <span className="kpi-value">R$ 150,00</span>
          <span className="kpi-badge down">▼ -2,3% vs mês anterior</span>
        </div>

        <div className="kpi-card verm">
          <div className="kpi-icon-bg" />
          <span className="kpi-label">Processos Pendentes</span>
          <span className="kpi-value">14</span>
          <span className="kpi-badge down">▼ -5 em relação a ontem</span>
        </div>
      </div>

      {/* GRÁFICOS — substituir por Chart.js / Recharts com dados reais da API */}
      <div className="charts-row">

        {/* Gráfico de Barras */}
        <div className="card">
          <div className="card-title">Faturamento Mensal — 2025</div>
          <div className="card-subtitle">Receita bruta mensal em R$ mil</div>
          <div className="bar-chart">
            <div className="bar-group">
              <div className="bar" style={{ height: '98px' }} title="Jan — R$ 122.000" />
              <span className="bar-label">Jan</span>
            </div>
            <div className="bar-group">
              <div className="bar" style={{ height: '108px' }} title="Fev — R$ 135.000" />
              <span className="bar-label">Fev</span>
            </div>
            <div className="bar-group">
              <div className="bar" style={{ height: '118px' }} title="Mar — R$ 148.000" />
              <span className="bar-label">Mar</span>
            </div>
            <div className="bar-group">
              <div className="bar" style={{ height: '113px' }} title="Abr — R$ 141.000" />
              <span className="bar-label">Abr</span>
            </div>
            <div className="bar-group">
              <div className="bar" style={{ height: '128px' }} title="Mai — R$ 160.000" />
              <span className="bar-label">Mai</span>
            </div>
            <div className="bar-group">
              <div className="bar atual" style={{ height: '150px' }} title="Jun — R$ 187.430" />
              <span className="bar-label">Jun</span>
            </div>
          </div>
        </div>

        {/* Gráfico Donut — dados por especialidade */}
        <div className="card">
          <div className="card-title">Distribuição por Especialidade</div>
          <div className="card-subtitle">Consultas realizadas no mês</div>
          <div className="donut-wrap">
            <svg className="donut-svg" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
              <circle cx="75" cy="75" r="58" fill="none" stroke="#f0f3f6" strokeWidth="22" />
              <circle cx="75" cy="75" r="58" fill="none" stroke="#2AABBB" strokeWidth="22"
                strokeDasharray="109.3 255.1" strokeDashoffset="91" transform="rotate(-90 75 75)" />
              <circle cx="75" cy="75" r="58" fill="none" stroke="#7D9A3A" strokeWidth="22"
                strokeDasharray="91.1 273.3" strokeDashoffset="-18.3" transform="rotate(-90 75 75)" />
              <circle cx="75" cy="75" r="58" fill="none" stroke="#E8722A" strokeWidth="22"
                strokeDasharray="72.9 291.5" strokeDashoffset="-109.4" transform="rotate(-90 75 75)" />
              <circle cx="75" cy="75" r="58" fill="none" stroke="#D1D9E0" strokeWidth="22"
                strokeDasharray="91.1 273.3" strokeDashoffset="-182.3" transform="rotate(-90 75 75)" />
              <text x="75" y="70" textAnchor="middle" fontSize="18" fontWeight="700" fill="#3B3B3B">1.248</text>
              <text x="75" y="86" textAnchor="middle" fontSize="10" fill="#7A8A99">consultas</text>
            </svg>
            <div className="donut-legend">
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#2AABBB' }} /> Clínica Médica 30%
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#7D9A3A' }} /> Estética 25%
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#E8722A' }} /> Endocrinologia 20%
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#D1D9E0' }} /> Outros 25%
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* LINHA INFERIOR */}
      <div className="bottom-row">

        {/* Tabela de Processos — integrar com API de processos internos, com paginação */}
        <div className="card">
          <div className="card-title">Processos Internos Recentes</div>
          <div className="card-subtitle">Últimas movimentações registradas</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Processo</th>
                  <th>Responsável</th>
                  <th>Status</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {processos.map((p, i) => (
                  <tr key={i}>
                    <td>{p.nome}</td>
                    <td>{p.responsavel}</td>
                    <td><span className={`status-badge ${p.status}`}>{p.statusLabel}</span></td>
                    <td>{p.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Próximos Vencimentos — integrar com API de gestão de contratos/prazos */}
        <div className="card">
          <div className="card-title">Próximos Vencimentos</div>
          <div className="card-subtitle">Contratos e obrigações com prazo próximo</div>
          <div className="venc-list">
            {vencimentos.map((v, i) => (
              <div key={i} className="venc-item">
                <div className={`venc-dot ${v.urgencia}`} />
                <div className="venc-info">
                  <span className="venc-name">{v.nome}</span>
                  <span className="venc-date">Vence em {v.data}</span>
                </div>
                <span className={`venc-days ${v.urgencia}`}>{v.dias}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}
