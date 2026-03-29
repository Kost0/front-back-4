'use strict';

const form        = document.getElementById('note-form');
const titleInput  = document.getElementById('note-title');
const bodyInput   = document.getElementById('note-body');
const notesList   = document.getElementById('notes-list');
const notesEmpty  = document.getElementById('notes-empty');
const notesCount  = document.getElementById('notes-count');
const toast       = document.getElementById('toast');

const STORAGE_KEY = 'pwa-notes-v1';

function getNotes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function renderNotes() {
  const notes = getNotes();
  notesList.innerHTML = '';

  if (notes.length === 0) {
    notesEmpty.classList.remove('hidden');
    notesCount.textContent = '0';
    return;
  }

  notesEmpty.classList.add('hidden');
  notesCount.textContent = notes.length;

  notes.forEach((note, index) => {
    const li = document.createElement('li');
    li.className = 'note-item' + (note.done ? ' done' : '');
    li.dataset.index = index;

    const date = new Date(note.createdAt);
    const dateStr = date.toLocaleString('ru-RU', {
      day:    '2-digit',
      month:  '2-digit',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    });

    li.innerHTML = `
      <input
        type="checkbox"
        class="note-check"
        ${note.done ? 'checked' : ''}
        aria-label="Отметить выполненным"
      >
      <div class="note-text">
        <div class="note-title">${escapeHtml(note.title)}</div>
        ${note.body ? `<div class="note-body">${escapeHtml(note.body)}</div>` : ''}
        <div class="note-date">${dateStr}</div>
      </div>
      <button class="note-delete" aria-label="Удалить заметку" title="Удалить">✕</button>
    `;

    li.querySelector('.note-check').addEventListener('change', (e) => {
      toggleDone(index, e.target.checked);
    });

    li.querySelector('.note-delete').addEventListener('click', () => {
      deleteNote(index, li);
    });

    notesList.appendChild(li);
  });
}

function addNote(title, body) {
  const notes = getNotes();
  notes.unshift({
    id:        Date.now(),
    title:     title.trim(),
    body:      body.trim(),
    done:      false,
    createdAt: new Date().toISOString(),
  });
  saveNotes(notes);
  renderNotes();
  showToast('Заметка добавлена ✦');
}

function toggleDone(index, isDone) {
  const notes = getNotes();
  if (!notes[index]) return;
  notes[index].done = isDone;
  saveNotes(notes);
  renderNotes();
}

function deleteNote(index, listItem) {
  listItem.classList.add('removing');
  listItem.addEventListener('animationend', () => {
    const notes = getNotes();
    notes.splice(index, 1);
    saveNotes(notes);
    renderNotes();
  }, { once: true });
  showToast('Заметка удалена');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) {
    titleInput.focus();
    showToast('Введите заголовок заметки');
    return;
  }
  addNote(title, bodyInput.value);
  form.reset();
  titleInput.focus();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('[SW] Зарегистрирован, scope:', registration.scope);

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showToast('Доступно обновление — перезагрузите страницу');
          }
        });
      });
    } catch (err) {
      console.error('[SW] Ошибка регистрации:', err);
    }
  });
}

renderNotes();