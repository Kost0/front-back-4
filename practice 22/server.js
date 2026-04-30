const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
const SERVER_ID = process.env.SERVER_ID || `server-${PORT}`;

app.use(express.json());

app.use((req, res, next) => {
  res.on('finish', () =>
    console.log(`[${SERVER_ID}] [${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode}`)
  );
  next();
});

app.get('/', (req, res) => {
  res.json({
    message: 'Response from backend server',
    server: SERVER_ID,
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: SERVER_ID });
});

app.get('/api/info', (req, res) => {
  res.json({
    server: SERVER_ID,
    port: PORT,
    uptime: process.uptime(),
  });
});

app.listen(PORT, () => {
  console.log(`[${SERVER_ID}] Server started on port ${PORT}`);
});