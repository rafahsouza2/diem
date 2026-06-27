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

        {/* Health Animation */}
        <div className="health-anim">

          {/* Núcleo pulsante */}
          <div className="health-core">
            <div className="hc-ring hc-r1" />
            <div className="hc-ring hc-r2" />
            <div className="hc-ring hc-r3" />
            <div className="hc-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
          </div>

          {/* Card 1 — Emagrecimento */}
          <div className="hm-card hm1">
            <div className="hm-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
              </svg>
            </div>
            <span className="hm-val">14 kg</span>
            <span className="hm-label">Emagrecimento</span>
          </div>

          {/* Card 2 — Frequência */}
          <div className="hm-card hm2">
            <div className="hm-icon hm-icon-heart">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <span className="hm-val">68 bpm</span>
            <span className="hm-label">Freq. Cardíaca</span>
          </div>

          {/* Card 3 — IMC */}
          <div className="hm-card hm3">
            <div className="hm-icon hm-icon-imc">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="2"/><path d="M12 7v8M8 11l4 4 4-4"/>
              </svg>
            </div>
            <span className="hm-val">IMC 23.4</span>
            <span className="hm-label">Massa Corporal</span>
          </div>

          {/* Card 4 — Saúde */}
          <div className="hm-card hm4">
            <div className="hm-icon hm-icon-ok">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span className="hm-val">94%</span>
            <span className="hm-label">Aderência</span>
          </div>

          {/* Linha de conexão sutil */}
          <svg className="hm-lines" viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="80" y1="55"  x2="160" y2="110" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 4"/>
            <line x1="240" y1="55"  x2="160" y2="110" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 4"/>
            <line x1="80" y1="165" x2="160" y2="110" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 4"/>
            <line x1="240" y1="165" x2="160" y2="110" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 4"/>
          </svg>

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
