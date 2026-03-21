import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { isLoggedIn, authApi, clearTokens } from './api'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProductsPage from './pages/ProductsPage'
import UsersPage from './pages/UsersPage'

function RequireAuth({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />
  return children
}

function RequireRole({ user, roles, children, authChecked }) {
  if (!authChecked) return null
  if (!user || !roles.includes(user.role)) return <Navigate to="/products" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  const loadUser = async () => {
    if (!isLoggedIn()) { setAuthChecked(true); return }
    const res = await authApi.me()
    if (res.ok) {
      const data = await res.json()
      setUser(data)
    } else {
      clearTokens()
    }
    setAuthChecked(true)
  }

  useEffect(() => { loadUser() }, [])

  const handleLogin  = () => loadUser()
  const handleLogout = () => setUser(null)

  if (!authChecked) return null

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/login"    element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/products" element={
          <ProductsPage user={user} />
        } />
        <Route path="/users" element={
          <RequireAuth>
            <RequireRole user={user} roles={['admin']} authChecked={authChecked}>
              <UsersPage />
            </RequireRole>
          </RequireAuth>
        } />
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </>
  )
}