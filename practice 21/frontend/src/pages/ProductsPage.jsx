import { useState, useEffect } from 'react'
import { productsApi } from '../api'
import { Field, Modal } from '../components/UI'

const emptyForm = { title: '', category: '', description: '', price: '', imageUrl: '' }

export default function ProductsPage({ user }) {
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [viewing, setViewing]     = useState(null)

  const canManage = user?.role === 'seller' || user?.role === 'admin'
  const canDelete = user?.role === 'admin'

  const load = async () => {
    setLoading(true)
    const res = await productsApi.getAll()
    if (res.ok) setProducts(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Удалить товар?')) return
    await productsApi.remove(id)
    setProducts(p => p.filter(x => x.id !== id))
  }

  const handleView = async (id) => {
    if (user) {
      const res = await productsApi.getOne(id)
      if (res.ok) { setViewing(await res.json()); return }
    }
    setViewing(products.find(p => p.id === id))
  }

  return (
    <div>
      <div className="page-header">
        <h1>Товары</h1>
        {canManage && (
          <button onClick={() => setShowCreate(true)}>+ Добавить</button>
        )}
      </div>

      {loading && <div>Загрузка...</div>}

      {!loading && (
        <div className="products-grid">
          {products.length === 0 && (
            <div style={{ color: '#888', padding: '12px 0' }}>Нет товаров</div>
          )}
          {products.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              canManage={canManage}
              canDelete={canDelete}
              onView={() => handleView(p.id)}
              onEdit={() => setEditing(p)}
              onDelete={() => handleDelete(p.id)}
            />
          ))}
        </div>
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
          canManage={canManage}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null) }}
        />
      )}
    </div>
  )
}

function ProductCard({ product, canManage, canDelete, onView, onEdit, onDelete }) {
  return (
    <div className="product-card">
      <div className="product-card__image" onClick={onView}>
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.title} />
          : <div className="product-card__image-placeholder">📦</div>
        }
      </div>
      <div className="product-card__body">
        <div className="product-card__category">{product.category}</div>
        <div className="product-card__title">
          <a onClick={onView}>{product.title}</a>
        </div>
        <div className="product-card__price">{Number(product.price).toLocaleString('ru-RU')} ₽</div>
        {(canManage || canDelete) && (
          <div className="actions" style={{ marginTop: 10 }}>
            {canManage && (
              <button className="small" onClick={onEdit}>Изменить</button>
            )}
            {canDelete && (
              <button className="small danger" onClick={onDelete}>Удалить</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ProductFormModal({ title, initial, onClose, onSave }) {
  const [form, setForm] = useState(
    initial
      ? { title: initial.title, category: initial.category, description: initial.description, price: initial.price, imageUrl: initial.imageUrl || '' }
      : emptyForm
  )
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  const submit = async () => {
    setError('')
    if (!form.title || !form.category || !form.description || form.price === '') {
      return setError('Заполните все обязательные поля')
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
      <Field label="Название *"    id="pt"  value={form.title}       onChange={set('title')} />
      <Field label="Категория *"   id="pc"  value={form.category}    onChange={set('category')} />
      <Field label="Описание *"    id="pd"  textarea value={form.description} onChange={set('description')} />
      <Field label="Цена (₽) *"   id="pp"  type="number" value={form.price}  onChange={set('price')} />
      <Field label="Ссылка на изображение" id="pi" type="url" placeholder="https://..." value={form.imageUrl} onChange={set('imageUrl')} />
      {error && <div className="error">{error}</div>}
      <div className="form-actions">
        <button onClick={submit} disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
        <button onClick={onClose}>Отмена</button>
      </div>
    </Modal>
  )
}

function ProductDetailModal({ product, canManage, onClose, onEdit }) {
  return (
    <Modal title={product.title} onClose={onClose}>
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.title}
          style={{ width: '100%', maxHeight: 240, objectFit: 'cover', marginBottom: 14, borderRadius: 4 }}
        />
      )}
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
        <div style={{ fontSize: 18, fontWeight: 'bold' }}>{Number(product.price).toLocaleString('ru-RU')} ₽</div>
      </div>
      <div className="form-actions">
        {canManage && <button onClick={onEdit}>Редактировать</button>}
        <button onClick={onClose}>Закрыть</button>
      </div>
    </Modal>
  )
}