import React from 'react';

function formatPrice(price) {
  return price.toLocaleString('ru-RU') + ' ₽';
}

export default function ProductItem({ product, onEdit, onDelete }) {
  return (
    <div className="productRow">
      <div className="productMain">
        <div className="productTop">
          <span className="productId">#{product.id}</span>
          <span className="productName">{product.name}</span>
          <span className="productCategory">{product.category}</span>
        </div>
        <div className="productDesc">{product.description}</div>
        <div className="productMeta">
          <span className="productPrice">{formatPrice(product.price)}</span>
          <span className="productStock">На складе: {product.stock} шт.</span>
        </div>
      </div>
      <div className="productActions">
        <button className="btn btn--sm" onClick={() => onEdit(product)}>
          Редактировать
        </button>
        <button className="btn btn--sm btn--danger" onClick={() => onDelete(product.id)}>
          Удалить
        </button>
      </div>
    </div>
  );
}