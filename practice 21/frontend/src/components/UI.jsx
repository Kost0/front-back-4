export function Field({ label, id, textarea, ...props }) {
  return (
    <div className="form-field">
      {label && <label htmlFor={id}>{label}</label>}
      {textarea
        ? <textarea id={id} rows={3} {...props} />
        : <input id={id} {...props} />}
    </div>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}