const getToken   = () => localStorage.getItem('accessToken')
const getRefresh = () => localStorage.getItem('refreshToken')

export const setTokens = (access, refresh) => {
  localStorage.setItem('accessToken', access)
  localStorage.setItem('refreshToken', refresh)
}

export const clearTokens = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

export const isLoggedIn = () => !!getToken()

async function tryRefresh() {
  const rt = getRefresh()
  if (!rt) return false
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + rt },
  })
  if (!res.ok) { clearTokens(); return false }
  const data = await res.json()
  setTokens(data.accessToken, data.refreshToken)
  return true
}

async function request(method, path, body, retry = true) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = 'Bearer ' + token

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && retry) {
    const ok = await tryRefresh()
    if (ok) return request(method, path, body, false)
    clearTokens()
    window.location.href = '/login'
    return res
  }

  return res
}

export const authApi = {
  register: (data) => request('POST', '/api/auth/register', data),
  login:    (data) => request('POST', '/api/auth/login', data),
  me:       ()     => request('GET',  '/api/auth/me'),
}

export const productsApi = {
  getAll:  ()         => request('GET',    '/api/products'),
  getOne:  (id)       => request('GET',    `/api/products/${id}`),
  create:  (data)     => request('POST',   '/api/products', data),
  update:  (id, data) => request('PUT',    `/api/products/${id}`, data),
  remove:  (id)       => request('DELETE', `/api/products/${id}`),
}

export const usersApi = {
  getAll:  ()         => request('GET',    '/api/users'),
  getOne:  (id)       => request('GET',    `/api/users/${id}`),
  update:  (id, data) => request('PUT',    `/api/users/${id}`, data),
  block:   (id)       => request('DELETE', `/api/users/${id}`),
}