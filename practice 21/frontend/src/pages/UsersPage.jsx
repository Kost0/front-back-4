import { useState, useEffect } from 'react'
import { usersApi } from '../api'
import { Field, Modal } from '../components/UI'

export default function UsersPage() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [editing, setEditing] = useState(null)

  const load = async () => {
    setLoading(true)
    const res = await usersApi.getAll()
    if (res.ok) setUsers(await res.json())
    else setError('Не удалось загрузить пользователей')
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleBlock = async (id) => {
    if (!confirm('Заблокировать пользователя?')) return
    const res = await usersApi.block(id)
    if (res.ok) {
      setUsers(u => u.map(x => x.id === id ? { ...x, blocked: true } : x))
    }
  }

  const roleBadge = (role) => {
    const colors = { admin: '#c00', seller: '#c70', user: '#060' }
    return (
      <span style={{
        fontSize: 11,
        fontWeight: 'bold',
        padding: '1px 5px',
        border: `1px solid ${colors[role] || '#888'}`,
        color: colors[role] || '#888',
        borderRadius: 3,
      }}>
        {role}
      </span>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Пользователи</h1>
      </div>

      {loading && <div>Загрузка...</div>}
      {error   && <div className="error">{error}</div>}

      {!loading && (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Имя</th>
              <th>Роль</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={6} style={{ color: '#888', padding: '12px 10px' }}>Нет пользователей</td></tr>
            )}
            {users.map(u => (
              <tr key={u.id} style={{ opacity: u.blocked ? 0.5 : 1 }}>
                <td style={{ color: '#888', width: 40 }}>{u.id}</td>
                <td>{u.email}</td>
                <td>{u.first_name} {u.last_name}</td>
                <td>{roleBadge(u.role)}</td>
                <td>
                  {u.blocked
                    ? <span style={{ color: '#c00', fontSize: 12 }}>заблокирован</span>
                    : <span style={{ color: '#060', fontSize: 12 }}>активен</span>
                  }
                </td>
                <td>
                  <div className="actions">
                    <button className="small" onClick={() => setEditing(u)}>Изменить</button>
                    {!u.blocked && (
                      <button className="small danger" onClick={() => handleBlock(u.id)}>Блок</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <UserEditModal
          user={editing}
          onClose={() => setEditing(null)}
          onSave={updated => {
            setUsers(u => u.map(x => x.id === updated.id ? updated : x))
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function UserEditModal({ user, onClose, onSave }) {
  const [form, setForm]       = useState({ first_name: user.first_name, last_name: user.last_name, role: user.role })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  const submit = async () => {
    setError('')
    setLoading(true)
    const res  = await usersApi.update(user.id, form)
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return setError(data.error || 'Ошибка')
    onSave(data)
  }

  return (
    <Modal title={`Редактировать: ${user.email}`} onClose={onClose}>
      <Field label="Имя"      id="uf" value={form.first_name} onChange={set('first_name')} />
      <Field label="Фамилия"  id="ul" value={form.last_name}  onChange={set('last_name')} />
      <div className="form-field">
        <label htmlFor="ur">Роль</label>
        <select id="ur" value={form.role} onChange={set('role')}
          style={{ fontFamily: 'monospace', fontSize: 14, width: '100%', padding: '6px 8px', border: '2px solid #6365e9', outline: 'none' }}>
          <option value="user">user</option>
          <option value="seller">seller</option>
          <option value="admin">admin</option>
        </select>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="form-actions">
        <button onClick={submit} disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
        <button onClick={onClose}>Отмена</button>
      </div>
    </Modal>
  )
}