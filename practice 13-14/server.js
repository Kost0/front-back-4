'use strict';

const fs = require('fs');
const https = require('https');
const path = require('path');

const express = require('express');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');

const HTTPS_PORT = 3000;
const CERT_PATH = path.join(__dirname, 'localhost.pem');
const KEY_PATH  = path.join(__dirname, 'localhost-key.pem');

const vapidKeys = {
  publicKey:  'BC48Z1G9bWaNM5ViJhlNFOp6rZ8L1vKaB0SfPadaBe1rswxqUo580q1HnrUsrsKfpp8i79q3y752Ih383RVyA9c',
  privateKey: '4ur6hClWq66mhDQvUGuV3flbUNdetdCXrKKjbwwKnm0',
};

webpush.setVapidDetails(
  'mailto:lavrenov.konstantin17@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

let subscriptions = [];

app.post('/subscribe', (req, res) => {
  const sub = req.body;
  if (sub?.endpoint && !subscriptions.some(s => s.endpoint === sub.endpoint)) {
    subscriptions.push(sub);
  }
  res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body || {};
  subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
  res.status(200).json({ message: 'Подписка удалена' });
});


const reminders = new Map();

function sendPush(payload) {
  subscriptions.forEach(sub => {
    webpush.sendNotification(sub, payload).catch(err =>
      console.error('Push error:', err?.statusCode || err)
    );
  });
}

function scheduleReminder(id, text, reminderTime) {
  const delay = reminderTime - Date.now();
  if (delay <= 0) {
    console.warn(`[reminder] id=${id} is in the past, skipping`);
    return;
  }

  const timeoutId = setTimeout(() => {
    console.log(`[reminder] Firing id=${id}: "${text}"`);

    sendPush(JSON.stringify({
      title: 'Напоминание',
      body: text,
      reminderId: id,
    }));

    reminders.set(id, { timeoutId: null, text, reminderTime, fired: true });

    const cleanupId = setTimeout(() => {
      if (reminders.get(id)?.fired) {
        console.log(`[reminder] Cleanup id=${id} (no snooze received)`);
        reminders.delete(id);
      }
    }, 60 * 1000);

    reminders.set(id, { timeoutId: cleanupId, text, reminderTime, fired: true });

  }, delay);

  reminders.set(id, { timeoutId, text, reminderTime, fired: false });
  console.log(`[reminder] Scheduled id=${id}, fires in ${Math.round(delay / 1000)}s`);
}

app.post('/snooze', (req, res) => {
  const reminderId = parseInt(req.query.reminderId, 10);

  console.log(`[snooze] Request for id=${reminderId}, map has: [${[...reminders.keys()].join(', ')}]`);

  if (!reminderId || !reminders.has(reminderId)) {
    console.warn(`[snooze] 404 — reminder id=${reminderId} not found in map`);
    return res.status(404).json({ error: 'Reminder not found' });
  }

  const reminder = reminders.get(reminderId);

  clearTimeout(reminder.timeoutId);

  const newDelay = 10 * 1000;
  const newReminderTime = Date.now() + newDelay;

  const newTimeoutId = setTimeout(() => {
    console.log(`[snooze] Firing snoozed reminder id=${reminderId}`);

    sendPush(JSON.stringify({
      title: 'Отложенное напоминание',
      body: reminder.text,
      reminderId: reminderId,
    }));

    reminders.set(reminderId, { timeoutId: null, text: reminder.text, reminderTime: newReminderTime, fired: true });

    const cleanupId = setTimeout(() => {
      reminders.delete(reminderId);
      console.log(`[reminder] Cleanup snoozed id=${reminderId}`);
    }, 60 * 1000);

    reminders.set(reminderId, { timeoutId: cleanupId, text: reminder.text, reminderTime: newReminderTime, fired: true });

  }, newDelay);

  reminders.set(reminderId, {
    timeoutId: newTimeoutId,
    text: reminder.text,
    reminderTime: newReminderTime,
    fired: false,
  });

  console.log(`[snooze] Reminder id=${reminderId} snoozed for 5 min`);
  res.status(200).json({ message: 'Reminder snoozed for 5 minutes' });
});


const httpsServer = https.createServer(
  {
    cert: fs.readFileSync(CERT_PATH),
    key:  fs.readFileSync(KEY_PATH),
  },
  app
);

const io = socketIo(httpsServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  console.log('Клиент подключён:', socket.id);

  socket.on('newTask', (task) => {
    io.emit('taskAdded', task);
    sendPush(JSON.stringify({
      title: 'Новая задача',
      body: task?.text ? String(task.text) : 'Добавлена новая задача',
    }));
  });

  socket.on('newReminder', (reminder) => {
    const { id, text, reminderTime } = reminder;
    if (!id || !text || !reminderTime) return;
    scheduleReminder(id, text, reminderTime);
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключён:', socket.id);
  });
});

httpsServer.listen(HTTPS_PORT, () => {
  console.log(`HTTPS сервер запущен: https://localhost:${HTTPS_PORT}`);
});