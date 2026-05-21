import amqplib from 'amqplib';
import express from 'express';

const app = express();
app.use(express.json());

let channel, connection;

async function connect() {
  connection = await amqplib.connect('amqp://localhost');
  channel = await connection.createChannel();
  await channel.assertQueue('task_queue', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'dlx_exchange',
      'x-dead-letter-routing-key': 'dead',
    },
  });
}

app.post('/tasks', async (req, res) => {
  const task = req.body;
  if (!task.type || !task.payload) {
    return res.status(400).json({ error: 'Required fields: type, payload' });
  }

  const message = JSON.stringify({ ...task, id: Date.now() });
  channel.sendToQueue('task_queue', Buffer.from(message), { persistent: true });

  console.log(`[Producer] Sent task: ${message}`);
  res.json({ status: 'queued', task: JSON.parse(message) });
});

await connect();
app.listen(3000, () => console.log('[Producer] API running on http://localhost:3000'));