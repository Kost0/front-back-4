import { useNavigate, useLocation } from 'react-router-dom'
import { clearTokens, isLoggedIn } from '../api'

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()

  const logout = () => {
    clearTokens()
    onLogout()
    navigate('/login')
  }

  const link = (path, label) => (
    <span
      key={path}
      onClick={() => navigate(path)}
      style={{
        cursor: 'pointer',
        textDecoration: location.pathname === path ? 'none' : 'underline',
        fontWeight: location.pathname === path ? 'bold' : 'normal',
      }}
    >
      {label}
    </span>
  )

  const roleBadgeColor = {
    admin:  '#c00',
    seller: '#c70',
    user:   '#060',
  }

  return (
    <nav style={{
      borderBottom: '2px solid #6365e9',
      paddingBottom: '10px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    }}>
      <span style={{ fontWeight: 'bold', fontSize: 16 }}>Shop</span>

      {link('/products', 'Товары')}

      {user?.role === 'admin' && link('/users', 'Пользователи')}

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
        {user && (
          <>
            <span style={{ fontSize: 12, color: '#555' }}>
              {user.first_name} {user.last_name}
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 'bold',
              padding: '2px 6px',
              border: `1px solid ${roleBadgeColor[user.role] || '#888'}`,
              color: roleBadgeColor[user.role] || '#888',
              borderRadius: 3,
            }}>
              {user.role}
            </span>
          </>
        )}

        {isLoggedIn()
          ? <button className="small" onClick={logout}>Выйти</button>
          : <>
              {link('/login', 'Войти')}
              {link('/register', 'Регистрация')}
            </>
        }
      </div>
    </nav>
  )
}