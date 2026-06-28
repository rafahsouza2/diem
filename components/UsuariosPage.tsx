'use client'

import { useState, useTransition } from 'react'
import { criarUsuario, editarUsuario, excluirUsuario } from '@/app/dashboard/usuarios/actions'

const FUNCOES = ['Administrador', 'Faturamento', 'Recepção', 'Médico(a)', 'Enfermagem', 'Outro']

const FUNCAO_COLOR: Record<string, string> = {
  'Administrador': 's-atrasado',
  'Faturamento':   's-andamento',
  'Recepção':      's-concluido',
  'Médico(a)':     's-pendente',
  'Enfermagem':    's-concluido',
  'Outro':         '',
}

interface Usuario {
  id: string
  email: string
  nome: string
  funcao: string
  confirmado: boolean
  ultimoAcesso: string | null
  criado: string
}

interface UsuariosPageProps {
  usuarios: Usuario[]
  erroConfig?: string
}

function initials(nome: string, email: string) {
  const n = nome || email
  return n.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('')
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

type ModalMode = 'criar' | 'editar' | null

export default function UsuariosPage({ usuarios: inicial, erroConfig }: UsuariosPageProps) {
  const [usuarios, setUsuarios] = useState(inicial)
  const [modo, setModo]         = useState<ModalMode>(null)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [confirmar, setConfirmar] = useState<Usuario | null>(null)
  const [erro, setErro]         = useState('')
  const [busca, setBusca]       = useState('')
  const [isPending, startTransition] = useTransition()

  const filtrados = usuarios.filter(u =>
    u.nome.toLowerCase().includes(busca.toLowerCase()) ||
    u.email.toLowerCase().includes(busca.toLowerCase()) ||
    u.funcao.toLowerCase().includes(busca.toLowerCase())
  )

  function abrirCriar() { setEditando(null); setErro(''); setModo('criar') }
  function abrirEditar(u: Usuario) { setEditando(u); setErro(''); setModo('editar') }
  function fechar() { setModo(null); setEditando(null); setErro('') }

  async function handleSalvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setErro('')
    startTransition(async () => {
      const res = modo === 'criar'
        ? await criarUsuario(fd)
        : await editarUsuario(editando!.id, fd)
      if ('erro' in res && res.erro) { setErro(res.erro); return }
      // Atualiza lista local otimisticamente
      const nome   = fd.get('nome') as string
      const email  = fd.get('email') as string
      const funcao = fd.get('funcao') as string
      if (modo === 'criar') {
        setUsuarios(prev => [...prev, { id: Date.now().toString(), email, nome, funcao, confirmado: true, ultimoAcesso: null, criado: new Date().toISOString() }])
      } else if (editando) {
        setUsuarios(prev => prev.map(u => u.id === editando.id ? { ...u, email, nome, funcao } : u))
      }
      fechar()
    })
  }

  async function handleExcluir() {
    if (!confirmar) return
    startTransition(async () => {
      const res = await excluirUsuario(confirmar.id)
      if ('erro' in res && res.erro) { setErro(res.erro); return }
      setUsuarios(prev => prev.filter(u => u.id !== confirmar.id))
      setConfirmar(null)
    })
  }

  return (
    <main className="main-content">

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--grafite)' }}>
            Configurações <span style={{ color: 'var(--azul)' }}>/ Usuários</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--cinza-texto)', marginTop: 2 }}>
            Gerencie quem tem acesso ao sistema
          </p>
        </div>
        <button className="btn-login" style={{ width: 'auto', padding: '10px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }} onClick={abrirCriar} disabled={!!erroConfig}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo Usuário
        </button>
      </div>

      {/* Alerta de config */}
      {erroConfig && (
        <div style={{ background: 'rgba(200,82,82,0.08)', border: '1px solid rgba(200,82,82,0.3)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: 13 }}>
          <strong style={{ color: 'var(--vermelho)' }}>⚠ Configuração necessária:</strong>
          <span style={{ color: 'var(--grafite)', marginLeft: 8 }}>Adicione a variável <code style={{ background: 'var(--cinza-bg)', padding: '1px 6px', borderRadius: 4 }}>SUPABASE_SERVICE_ROLE_KEY</code> nas variáveis de ambiente do Vercel e faça redeploy.</span>
        </div>
      )}

      {/* Busca + contador */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--cinza-borda)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar usuário..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid var(--cinza-borda)', borderRadius: 8, fontSize: 13, background: 'var(--branco)', color: 'var(--grafite)', outline: 'none' }}
          />
        </div>
        <span style={{ fontSize: 13, color: 'var(--cinza-texto)' }}>
          <strong style={{ color: 'var(--grafite)' }}>{filtrados.length}</strong> usuário{filtrados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabela */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>E-mail</th>
                <th>Função</th>
                <th>Status</th>
                <th>Último acesso</th>
                <th>Cadastrado em</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--cinza-texto)', padding: 32 }}>
                  {erroConfig ? 'Configure a chave de serviço para listar usuários.' : 'Nenhum usuário encontrado.'}
                </td></tr>
              )}
              {filtrados.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--azul)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {initials(u.nome, u.email)}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--grafite)', fontSize: 13 }}>{u.nome || '—'}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--cinza-texto)' }}>{u.email}</td>
                  <td>
                    {u.funcao
                      ? <span className={`status-badge ${FUNCAO_COLOR[u.funcao] ?? ''}`}>{u.funcao}</span>
                      : <span style={{ color: 'var(--cinza-borda)', fontSize: 12 }}>—</span>
                    }
                  </td>
                  <td>
                    <span className={`status-badge ${u.confirmado ? 's-concluido' : 's-pendente'}`}>
                      {u.confirmado ? 'Ativo' : 'Pendente'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--cinza-texto)', whiteSpace: 'nowrap' }}>{fmtDate(u.ultimoAcesso)}</td>
                  <td style={{ fontSize: 12, color: 'var(--cinza-texto)', whiteSpace: 'nowrap' }}>{fmtDate(u.criado)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button
                        onClick={() => abrirEditar(u)}
                        style={{ padding: '5px 10px', fontSize: 11, borderRadius: 6, border: '1px solid var(--cinza-borda)', background: 'var(--branco)', color: 'var(--grafite)', cursor: 'pointer', fontWeight: 500 }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmar(u)}
                        style={{ padding: '5px 10px', fontSize: 11, borderRadius: 6, border: '1px solid rgba(200,82,82,0.4)', background: 'rgba(200,82,82,0.06)', color: 'var(--vermelho)', cursor: 'pointer', fontWeight: 500 }}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal criar/editar */}
      {modo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--branco)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--grafite)', marginBottom: 20 }}>
              {modo === 'criar' ? 'Novo Usuário' : 'Editar Usuário'}
            </h2>

            {erro && (
              <div style={{ background: 'rgba(200,82,82,0.08)', border: '1px solid rgba(200,82,82,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--vermelho)' }}>
                {erro}
              </div>
            )}

            <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div className="field">
                <label>Nome completo</label>
                <div className="input-wrap">
                  <input name="nome" type="text" placeholder="Ex: Ana Lima" defaultValue={editando?.nome ?? ''} required />
                </div>
              </div>

              <div className="field">
                <label>E-mail</label>
                <div className="input-wrap">
                  <input name="email" type="email" placeholder="usuario@diem.com.br" defaultValue={editando?.email ?? ''} required />
                </div>
              </div>

              <div className="field">
                <label>{modo === 'editar' ? 'Nova senha (deixe vazio para manter)' : 'Senha'}</label>
                <div className="input-wrap">
                  <input name="senha" type="password" placeholder="••••••••" {...(modo === 'criar' ? { required: true, minLength: 6 } : { minLength: 6 })} />
                </div>
              </div>

              <div className="field">
                <label>Função</label>
                <div className="input-wrap">
                  <select name="funcao" defaultValue={editando?.funcao ?? 'Faturamento'} required
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--cinza-borda)', borderRadius: 8, fontSize: 13, background: 'var(--branco)', color: 'var(--grafite)', outline: 'none', cursor: 'pointer' }}>
                    {FUNCOES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={fechar}
                  style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid var(--cinza-borda)', background: 'var(--branco)', color: 'var(--grafite)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-login" disabled={isPending}
                  style={{ flex: 1, padding: '11px', fontSize: 13 }}>
                  {isPending ? 'Salvando...' : modo === 'criar' ? 'Criar usuário' : 'Salvar'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal confirmação exclusão */}
      {confirmar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--branco)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--grafite)', marginBottom: 8 }}>Excluir usuário</h2>
            <p style={{ fontSize: 13, color: 'var(--cinza-texto)', marginBottom: 20 }}>
              Tem certeza que deseja excluir <strong style={{ color: 'var(--grafite)' }}>{confirmar.nome || confirmar.email}</strong>? Esta ação não pode ser desfeita.
            </p>
            {erro && <p style={{ color: 'var(--vermelho)', fontSize: 13, marginBottom: 12 }}>{erro}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmar(null)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--cinza-borda)', background: 'var(--branco)', color: 'var(--grafite)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleExcluir} disabled={isPending}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: 'var(--vermelho)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}
