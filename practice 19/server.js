const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'users',
      password: 'password',
      port: parseInt('5432'),
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      first_name  VARCHAR(100) NOT NULL,
      last_name   VARCHAR(100) NOT NULL,
      age         INTEGER      NOT NULL CHECK (age >= 0),
      created_at  BIGINT       NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
      updated_at  BIGINT       NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
    )
  `);
  console.log('Таблица users готова');
}

app.post('/api/users', async (req, res) => {
  const { first_name, last_name, age } = req.body;

  if (!first_name || !last_name || age === undefined) {
    return res.status(400).json({ error: 'Поля first_name, last_name, age обязательны' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (first_name, last_name, age)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [first_name, last_name, age]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  const { first_name, last_name, age } = req.body;

  const fields = [];
  const values = [];
  let idx = 1;

  if (first_name !== undefined) { fields.push(`first_name = $${idx++}`); values.push(first_name); }
  if (last_name  !== undefined) { fields.push(`last_name  = $${idx++}`); values.push(last_name);  }
  if (age        !== undefined) { fields.push(`age        = $${idx++}`); values.push(age);        }

  if (!fields.length) {
    return res.status(400).json({ error: 'Нет полей для обновления' });
  }

  fields.push(`updated_at = $${idx++}`);
  values.push(Math.floor(Date.now() / 1000));
  values.push(req.params.id);

  try {
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!rowCount) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({ message: 'Пользователь удалён' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Сервер запущен: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Ошибка инициализации БД:', err);
    process.exit(1);
  });