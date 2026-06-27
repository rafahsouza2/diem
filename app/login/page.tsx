import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <div className="login-screen">
      {/* Painel Esquerdo — Visual da Marca */}
      <div className="login-visual">
        <div className="diamond d1" />
        <div className="diamond d2" />
        <div className="diamond d3" />
        <div className="diamond d4" />

        <div className="login-brand">
          <div className="logo-wrap">
            <svg className="logo-icon" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <ellipse cx="34" cy="18" rx="16" ry="10" fill="#7D9A3A" transform="rotate(-30 34 18)" />
              <circle cx="24" cy="28" r="6" fill="#E8722A" />
              <path d="M30 14 Q42 20 36 30" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
            </svg>
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
      </div>

      {/* Painel Direito — Formulário */}
      <div className="login-form-panel">
        <LoginForm />
      </div>
    </div>
  )
}
