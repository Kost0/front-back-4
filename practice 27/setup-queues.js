import amqplib from 'amqplib';

async function setupQueues() {
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

  await connection.close();
}

await setupQueues();