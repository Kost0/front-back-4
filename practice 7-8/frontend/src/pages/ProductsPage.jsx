import { useState, useEffect } from 'react'
import { productsApi } from '../api'
import { Field, Modal } from '../components/UI'

const emptyForm = { title: '', category: '', description: '', price: '' }

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState(null)    
  const [viewing, setViewing] = useState(null)

  const load = async () => {
    setLoading(true)
    const res = await productsApi.getAll()
    const data = await res.json()
    setProducts(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Удалить товар?')) return
    await productsApi.remove(id)
    setProducts(p => p.filter(x => x.id !== id))
  }

  const handleView = async (id) => {
    const res = await productsApi.getOne(id)
    const data = await res.json()
    setViewing(data)
  }

  return (
    <div>
      <div className="page-header">
        <h1>Товары</h1>
        <button onClick={() => setShowCreate(true)}>+ Добавить</button>
      </div>

      {loading && <div>Загрузка...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Категория</th>
              <th>Цена</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr><td colSpan={5} style={{ color: '#888', padding: '12px 10px' }}>Нет товаров</td></tr>
            )}
            {products.map(p => (
              <tr key={p.id}>
                <td style={{ color: '#888', width: 40 }}>{p.id}</td>
                <td>
                  <a onClick={() => handleView(p.id)}>{p.title}</a>
                </td>
                <td>{p.category}</td>
                <td>{p.price} ₽</td>
                <td>
                  <div className="actions">
                    <button className="small" onClick={() => setEditing(p)}>Изменить</button>
                    <button className="small danger" onClick={() => handleDelete(p.id)}>Удалить</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCreate && (
        <ProductFormModal
          title="Новый товар"
          onClose={() => setShowCreate(false)}
          onSave={product => {
            setProducts(p => [...p, product])
            setShowCreate(false)
          }}
        />
      )}

      {editing && (
        <ProductFormModal
          title="Редактировать товар"
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={updated => {
            setProducts(p => p.map(x => x.id === updated.id ? updated : x))
            setEditing(null)
          }}
        />
      )}

      {viewing && (
        <ProductDetailModal
          product={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null) }}
        />
      )}
    </div>
  )
}

function ProductFormModal({ title, initial, onClose, onSave }) {
  const [form, setForm] = useState(
    initial
      ? { title: initial.title, category: initial.category, description: initial.description, price: initial.price }
      : emptyForm
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  const submit = async () => {
    setError('')
    if (!form.title || !form.category || !form.description || form.price === '') {
      return setError('Заполните все поля')
    }
    setLoading(true)
    const payload = { ...form, price: Number(form.price) }
    const res = initial
      ? await productsApi.update(initial.id, payload)
      : await productsApi.create(payload)
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return setError(data.error || 'Ошибка')
    onSave(data)
  }

  return (
    <Modal title={title} onClose={onClose}>
      <Field label="Название" id="pt" value={form.title} onChange={set('title')} />
      <Field label="Категория" id="pc" value={form.category} onChange={set('category')} />
      <Field label="Описание" id="pd" textarea value={form.description} onChange={set('description')} />
      <Field label="Цена (₽)" id="pp" type="number" value={form.price} onChange={set('price')} />
      {error && <div className="error">{error}</div>}
      <div className="form-actions">
        <button onClick={submit} disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
        <button onClick={onClose}>Отмена</button>
      </div>
    </Modal>
  )
}


function ProductDetailModal({ product, onClose, onEdit }) {
  return (
    <Modal title={product.title} onClose={onClose}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#555' }}>Категория</div>
        <div>{product.category}</div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#555' }}>Описание</div>
        <div>{product.description}</div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: '#555' }}>Цена</div>
        <div style={{ fontSize: 18, fontWeight: 'bold' }}>{product.price} ₽</div>
      </div>
      <div className="form-actions">
        <button onClick={onEdit}>Редактировать</button>
        <button onClick={onClose}>Закрыть</button>
      </div>
    </Modal>
  )
}