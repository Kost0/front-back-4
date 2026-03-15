import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, setTokens } from '../api'
import { Field } from '../components/UI'

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  const submit = async () => {
    setError('')
    const res = await authApi.login(form)
    const data = await res.json()
    if (!res.ok) return setError(data.error || 'Неверный email или пароль')
    setTokens(data.accessToken, data.refreshToken)
    onLogin()
    navigate('/products')
  }

  const handleKey = e => e.key === 'Enter' && submit()

  return (
    <div className="form-box">
      <h1>Вход</h1>
      <Field label="Email" id="le" type="email" placeholder="ivan@example.com" value={form.email} onChange={set('email')} onKeyDown={handleKey} />
      <Field label="Пароль" id="lp" type="password" value={form.password} onChange={set('password')} onKeyDown={handleKey} />
      {error && <div className="error">{error}</div>}
      <div className="form-actions">
        <button onClick={submit}>Войти</button>
        <button onClick={() => navigate('/register')}>Регистрация</button>
      </div>
    </div>
  )
}