const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());


MONGODB_URI='mongodb://YourMongoAdmin:1234@localhost:27017/usersdb?authSource=admin'

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Подключено к MongoDB'))
  .catch((err) => {
    console.error('Ошибка подключения к MongoDB:', err);
    process.exit(1);
  });

const userSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true },
    last_name:  { type: String, required: true, trim: true },
    age:        { type: Number, required: true, min: 0 },
    created_at: { type: Number, default: () => Math.floor(Date.now() / 1000) },
    updated_at: { type: Number, default: () => Math.floor(Date.now() / 1000) },
  },
  {
    versionKey: false,
  }
);

const User = mongoose.model('User', userSchema);

app.post('/api/users', async (req, res) => {
  const { first_name, last_name, age } = req.body;

  if (!first_name || !last_name || age === undefined) {
    return res.status(400).json({ error: 'Поля first_name, last_name, age обязательны' });
  }

  try {
    const user = await User.create({ first_name, last_name, age });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (err) {
    res.status(404).json({ error: 'Пользователь не найден' });
  }
});


app.patch('/api/users/:id', async (req, res) => {
  const { first_name, last_name, age } = req.body;
  const updates = {};

  if (first_name !== undefined) updates.first_name = first_name;
  if (last_name  !== undefined) updates.last_name  = last_name;
  if (age        !== undefined) updates.age        = age;

  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: 'Нет полей для обновления' });
  }

  updates.updated_at = Math.floor(Date.now() / 1000);

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({ message: 'Пользователь удалён' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});