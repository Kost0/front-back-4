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
  publicKey: 'BC48Z1G9bWaNM5ViJhlNFOp6rZ8L1vKaB0SfPadaBe1rswxqUo580q1HnrUsrsKfpp8i79q3y752Ih383RVyA9c',
  privateKey: '4ur6hClWq66mhDQvUGuV3flbUNdetdCXrKKjbwwKnm0'
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

const httpsServer = https.createServer(
  {
    cert: fs.readFileSync(CERT_PATH),
    key: fs.readFileSync(KEY_PATH)
  },
  app
);

const io = socketIo(httpsServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

io.on('connection', (socket) => {
  console.log('Клиент подключён:', socket.id);

  socket.on('newTask', (task) => {
    io.emit('taskAdded', task);

    const payload = JSON.stringify({
      title: 'Новая задача',
      body: task?.text ? String(task.text) : 'Добавлена новая задача'
    });

    subscriptions.forEach((sub) => {
      webpush.sendNotification(sub, payload).catch((err) => {
        console.error('Push error:', err?.statusCode || err);
      });
    });
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключён:', socket.id);
  });
});

httpsServer.listen(HTTPS_PORT, () => {
  console.log(`HTTPS сервер запущен: https://localhost:${HTTPS_PORT}`);
});