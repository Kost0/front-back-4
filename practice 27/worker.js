import amqplib from 'amqplib';

const WORKER_ID = process.env.WORKER_ID || '1';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function processTask(task) {
  await new Promise(resolve => setTimeout(resolve, 500));
  if (Math.random() < 0.4) throw new Error('Simulated processing failure');
  console.log(`[Worker ${WORKER_ID}] Done: type=${task.type} id=${task.id}`);
}

async function startWorker() {
  const connection = await amqplib.connect('amqp://localhost');
  const channel = await connection.createChannel();

  await channel.assertExchange('dlx_exchange', 'direct', { durable: true });
  await channel.assertQueue('dead_letter_queue', { durable: true });
  await channel.bindQueue('dead_letter_queue', 'dlx_exchange', 'dead');

  await channel.assertQueue('task_queue', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'dlx_exchange',
      'x-dead-letter-routing-key': 'dead',
    },
  });

  channel.prefetch(1);

  channel.consume('task_queue', async (msg) => {
    if (!msg) return;

    const task = JSON.parse(msg.content.toString());
    const retryCount = msg.properties.headers?.['x-retry-count'] || 0;

    console.log(`[Worker ${WORKER_ID}] Attempt ${retryCount + 1}/${MAX_RETRIES + 1}: task id=${task.id}`);

    try {
      await processTask(task);
      channel.ack(msg);
    } catch (err) {
      console.error(`[Worker ${WORKER_ID}] Error: ${err.message}`);

      if (retryCount < MAX_RETRIES) {
        channel.nack(msg, false, false);

        const delay = Math.min(BASE_DELAY_MS * 2 ** retryCount, 30000) + Math.random() * 500;
        console.warn(`[Worker ${WORKER_ID}] Retry in ${Math.round(delay)}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);

        await new Promise(resolve => setTimeout(resolve, delay));

        channel.sendToQueue('task_queue', msg.content, {
          persistent: true,
          headers: { 'x-retry-count': retryCount + 1 },
        });
      } else {
        console.error(`[Worker ${WORKER_ID}] Sending to DLQ after ${MAX_RETRIES} retries: id=${task.id}`);
        channel.nack(msg, false, false);
      }
    }
  });

  console.log(`[Worker ${WORKER_ID}] Started, waiting for tasks...`);
}

await startWorker();