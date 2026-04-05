'use strict';


const STORAGE_KEY = 'pwa-notes-v1';

const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');

const toast = document.getElementById('toast');
let toastTimer;

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function setActiveButton(activeId) {
  [homeBtn, aboutBtn].forEach(btn => btn?.classList.remove('is-active'));
  document.getElementById(activeId)?.classList.add('is-active');
}

async function loadContent(page) {
  try {
    const response = await fetch(`./content/${page}.html`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    contentDiv.innerHTML = html;

    if (page === 'home') initNotes();
  } catch (err) {
    contentDiv.innerHTML = `
      <section class="input-section">
        <div class="input-card">
          <h2 class="input-title">Ошибка</h2>
          <p style="margin-top:8px;color:#b00020;">
            Не удалось загрузить страницу. Проверь пути /content и работу Service Worker.
          </p>
        </div>
      </section>
    `;
    console.error(err);
  }
}

homeBtn?.addEventListener('click', () => {
  setActiveButton('home-btn');
  loadContent('home');
});

aboutBtn?.addEventListener('click', () => {
  setActiveButton('about-btn');
  loadContent('about');
});

setActiveButton('home-btn');
loadContent('home');


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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderNotes() {
  const notes = getNotes();

  const notesList = document.getElementById('notes-list');
  const notesEmpty = document.getElementById('notes-empty');
  const notesCount = document.getElementById('notes-count');

  if (!notesList || !notesEmpty || !notesCount) return;

  notesList.innerHTML = '';

  if (notes.length === 0) {
    notesEmpty.classList.remove('hidden');
    notesCount.textContent = '0';
    return;
  }

  notesEmpty.classList.add('hidden');
  notesCount.textContent = String(notes.length);

  notes.forEach((note, index) => {
    const li = document.createElement('li');
    li.className = 'note-item' + (note.done ? ' done' : '');
    li.dataset.index = String(index);

    const date = new Date(note.createdAt);
    const dateStr = date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
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

    li.querySelector('.note-check')?.addEventListener('change', (e) => {
      toggleDone(index, e.target.checked);
    });

    li.querySelector('.note-delete')?.addEventListener('click', () => {
      deleteNote(index, li);
    });

    notesList.appendChild(li);
  });
}

function addNote(title, body) {
  const notes = getNotes();
  const note = {
    id: Date.now(),
    title: title.trim(),
    body: body.trim(),
    done: false,
    createdAt: new Date().toISOString(),
  };

  notes.unshift(note);
  saveNotes(notes);
  renderNotes();
  showToast('Заметка добавлена ✦');

  if (socket) {
    socket.emit('newTask', {
      text: note.title,
      body: note.body,
      timestamp: Date.now()
    });
  }
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

function initNotes() {
  const form = document.getElementById('note-form');
  const titleInput = document.getElementById('note-title');
  const bodyInput = document.getElementById('note-body');

  if (!form || !titleInput || !bodyInput) return;

  form.onsubmit = null;

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

  renderNotes();
}


let socket = null;
try {
  if (typeof io === 'function') {
    socket = io(); 
  }
} catch {
  socket = null;
}

if (socket) {
  socket.on('connect', () => console.log('[socket] connected:', socket.id));

  socket.on('taskAdded', (task) => {
    showToast(`Новая задача: ${task?.text ?? ''}`);
  });

  socket.on('disconnect', () => console.log('[socket] disconnected'));
}

const VAPID_PUBLIC_KEY = 'BC48Z1G9bWaNM5ViJhlNFOp6rZ8L1vKaB0SfPadaBe1rswxqUo580q1HnrUsrsKfpp8i79q3y752Ih383RVyA9c';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });

  await fetch('/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });
}

async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await fetch('/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint })
    });

    await subscription.unsubscribe();
  }
}


if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      console.log('[SW] registered, scope:', reg.scope);

      const enableBtn = document.getElementById('enable-push');
      const disableBtn = document.getElementById('disable-push');

      if (enableBtn && disableBtn) {
        const subscription = await reg.pushManager.getSubscription();
        if (subscription) {
          enableBtn.style.display = 'none';
          disableBtn.style.display = 'inline-block';
        }

        enableBtn.addEventListener('click', async () => {
          if (Notification.permission === 'denied') {
            alert('Уведомления запрещены. Разрешите их в настройках браузера.');
            return;
          }
          if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
              alert('Необходимо разрешить уведомления.');
              return;
            }
          }

          try {
            await subscribeToPush();
            enableBtn.style.display = 'none';
            disableBtn.style.display = 'inline-block';
            showToast('Push включены');
          } catch (err) {
            console.error('Ошибка подписки на push:', err);
            showToast('Не удалось включить push');
          }
        });

        disableBtn.addEventListener('click', async () => {
          try {
            await unsubscribeFromPush();
            disableBtn.style.display = 'none';
            enableBtn.style.display = 'inline-block';
            showToast('Push отключены');
          } catch (err) {
            console.error('Ошибка отписки от push:', err);
            showToast('Не удалось отключить push');
          }
        });
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showToast('Доступно обновление — перезагрузите страницу');
          }
        });
      });
    } catch (err) {
      console.error('[SW] registration failed:', err);
    }
  });
}