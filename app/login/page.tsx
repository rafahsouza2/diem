import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <div className="login-screen">

      {/* ===== PAINEL ESQUERDO — VISUAL ANIMADO ===== */}
      <div className="login-visual">

        {/* Diamonds flutuantes */}
        <div className="diamond d1" />
        <div className="diamond d2" />
        <div className="diamond d3" />
        <div className="diamond d4" />
        <div className="diamond d5" />
        <div className="diamond d6" />
        <div className="diamond d7" />
        <div className="diamond d8" />

        {/* Logo + Nome */}
        <div className="login-brand">
          <div className="logo-wrap">
            <div className="logo-pulse-wrap">
              <svg className="logo-icon" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <ellipse cx="34" cy="18" rx="16" ry="10" fill="#7D9A3A" transform="rotate(-30 34 18)" />
                <circle cx="24" cy="28" r="6" fill="#E8722A" />
                <path d="M30 14 Q42 20 36 30" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
            <div>
              <span className="logo-text-small">Centro Clínico</span>
              <span className="logo-text-big">Diem</span>
            </div>
          </div>
          <p className="tagline">
            <strong>Intranet Corporativa</strong>
            <br />Sua plataforma de gestão clínica
          </p>
        </div>

        {/* Feature Cards animados */}
        <div className="login-features">

          <div className="feature-card">
            <div className="feature-icon verde">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="feature-text">
              <strong>Financeiro & Faturamento</strong>
              <span>KPIs e relatórios em tempo real</span>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon azul">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div className="feature-text">
              <strong>Processos Internos</strong>
              <span>Gestão e acompanhamento de fluxos</span>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon laranja">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="feature-text">
              <strong>Colaboradores</strong>
              <span>Equipe e gestão de pessoas</span>
            </div>
          </div>

        </div>

        {/* Linha ECG animada */}
        <div className="ecg-wrap">
          <svg className="ecg-svg" viewBox="0 0 800 48" preserveAspectRatio="none">
            <path
              className="ecg-path"
              d="M0,24 L60,24 L75,24 L82,6 L90,42 L98,6 L106,24 L120,24
                 L180,24 L195,24 L202,8 L210,40 L218,8 L226,24 L240,24
                 L300,24 L315,24 L322,6 L330,42 L338,6 L346,24 L360,24
                 L420,24 L435,24 L442,8 L450,40 L458,8 L466,24 L480,24
                 L540,24 L555,24 L562,6 L570,42 L578,6 L586,24 L600,24
                 L660,24 L675,24 L682,8 L690,40 L698,8 L706,24 L720,24
                 L780,24 L800,24"
            />
          </svg>
        </div>

      </div>

      {/* ===== PAINEL DIREITO — FORMULÁRIO ===== */}
      <div className="login-form-panel">
        <LoginForm />
      </div>

    </div>
  )
}
