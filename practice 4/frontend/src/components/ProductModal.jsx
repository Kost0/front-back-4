import React, { useEffect, useState } from 'react';

const CATEGORIES = ['Периферия', 'Мониторы', 'Накопители', 'Комплектующие', 'Звук', 'Мебель'];

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initialProduct?.name ?? '');
    setCategory(initialProduct?.category ?? CATEGORIES[0]);
    setDescription(initialProduct?.description ?? '');
    setPrice(initialProduct?.price != null ? String(initialProduct.price) : '');
    setStock(initialProduct?.stock != null ? String(initialProduct.stock) : '');
  }, [open, initialProduct]);

  if (!open) return null;

  const title = mode === 'edit' ? 'Редактирование товара' : 'Добавление товара';

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (!trimmedName) { alert('Введите название товара'); return; }
    if (!trimmedDesc) { alert('Введите описание товара'); return; }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) { alert('Введите корректную цену'); return; }
    if (!Number.isInteger(parsedStock) || parsedStock < 0) { alert('Введите корректное количество'); return; }

    onSubmit({
      id: initialProduct?.id,
      name: trimmedName,
      category,
      description: trimmedDesc,
      price: parsedPrice,
      stock: parsedStock,
    });
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__header">
          <div className="modal__title">{title}</div>
          <button className="iconBtn" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Клавиатура Keychron Q1"
              autoFocus
            />
          </label>

          <label className="label">
            Категория
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="label">
            Описание
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание характеристик товара"
            />
          </label>

          <div className="formRow">
            <label className="label">
              Цена (₽)
              <input
                className="input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Например, 9990"
                inputMode="numeric"
              />
            </label>
            <label className="label">
              Количество на складе
              <input
                className="input"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Например, 15"
                inputMode="numeric"
              />
            </label>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn--primary">
              {mode === 'edit' ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}