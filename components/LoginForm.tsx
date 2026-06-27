'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [manterConectado, setManterConectado] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed')) {
        setErro('Não foi possível conectar ao servidor. Verifique sua conexão ou se o projeto Supabase está ativo.')
      } else if (error.message.includes('Email not confirmed')) {
        setErro('E-mail não confirmado. Desative a confirmação de e-mail no painel do Supabase.')
      } else if (error.message.includes('Invalid login credentials')) {
        setErro('E-mail ou senha incorretos. Verifique seus dados e tente novamente.')
      } else {
        setErro(error.message)
      }
      setCarregando(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="login-form-inner">
      <h1 className="login-heading">Bem-vindo de volta</h1>
      <p className="login-sub">Acesse sua área interna</p>

      <form onSubmit={handleSubmit}>
        {erro && <div className="login-error">{erro}</div>}

        {/* Campo E-mail */}
        <div className="field">
          <label htmlFor="email">E-mail corporativo</label>
          <div className="input-wrap">
            <span className="icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </span>
            <input
              type="email"
              id="email"
              placeholder="voce@diem.com.br"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className={erro ? 'input-error' : ''}
            />
          </div>
        </div>

        {/* Campo Senha */}
        <div className="field">
          <label htmlFor="senha">Senha</label>
          <div className="input-wrap">
            <span className="icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              type={mostrarSenha ? 'text' : 'password'}
              id="senha"
              placeholder="••••••••"
              autoComplete="current-password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              className={erro ? 'input-error' : ''}
            />
            <button
              type="button"
              className="eye-toggle"
              onClick={() => setMostrarSenha(v => !v)}
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {mostrarSenha ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Manter conectado + Esqueci senha */}
        <div className="form-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={manterConectado}
              onChange={e => setManterConectado(e.target.checked)}
            />
            Manter conectado
          </label>
          <a href="#" className="forgot-link">Esqueci minha senha</a>
        </div>

        <button type="submit" className="btn-login" disabled={carregando}>
          {carregando ? (
            <>
              <span className="spinner" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </button>
      </form>

      <p className="login-footer">© 2025 Centro Clínico Diem — Uso exclusivo interno</p>
    </div>
  )
}
