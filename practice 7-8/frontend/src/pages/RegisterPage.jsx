import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { Field } from '../components/UI'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  const submit = async () => {
    setError('')
    const res = await authApi.register(form)
    const data = await res.json()
    if (!res.ok) return setError(data.error || 'Ошибка регистрации')
    setSuccess(true)
    setTimeout(() => navigate('/login'), 1200)
  }

  return (
    <div className="form-box">
      <h1>Регистрация</h1>
      <Field label="Email" id="re" type="email" placeholder="ivan@example.com" value={form.email} onChange={set('email')} />
      <Field label="Имя" id="rf" placeholder="Иван" value={form.first_name} onChange={set('first_name')} />
      <Field label="Фамилия" id="rl" placeholder="Иванов" value={form.last_name} onChange={set('last_name')} />
      <Field label="Пароль" id="rp" type="password" value={form.password} onChange={set('password')} />
      {error && <div className="error">{error}</div>}
      {success && <div className="success">Успешно! Переход на вход...</div>}
      <div className="form-actions">
        <button onClick={submit}>Зарегистрироваться</button>
        <button onClick={() => navigate('/login')}>Уже есть аккаунт</button>
      </div>
    </div>
  )
}