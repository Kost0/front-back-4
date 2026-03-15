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

  return (
    <nav style={{
      borderBottom: '2px solid #6365e9',
      paddingBottom: '10px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    }}>
      <span style={{ fontWeight: 'bold' }}>Shop</span>

      {isLoggedIn() && (
        <>
          {link('/products', 'Товары')}
        </>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
        {user && <span style={{ fontSize: 12, color: '#555' }}>{user.email}</span>}
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