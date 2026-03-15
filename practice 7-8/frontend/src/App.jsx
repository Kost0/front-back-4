import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { isLoggedIn, authApi, clearTokens } from './api'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProductsPage from './pages/ProductsPage'

function RequireAuth({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />
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

  const handleLogin = () => loadUser()
  const handleLogout = () => setUser(null)

  if (!authChecked) return null

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/login"    element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/products" element={
          <RequireAuth><ProductsPage /></RequireAuth>
        } />
        <Route path="*" element={<Navigate to={isLoggedIn() ? '/products' : '/login'} replace />} />
      </Routes>
    </>
  )
}