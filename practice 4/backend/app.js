const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();
const port = 3000;

let products = [
  { id: nanoid(6), name: 'Механическая клавиатура Keychron', category: 'Периферия', description: 'Алюминиевый корпус, RGB подсветка', price: 14990, stock: 8 },
  { id: nanoid(6), name: 'Игровая мышь Logitech', category: 'Периферия', description: 'Беспроводная', price: 9490, stock: 15 },
  { id: nanoid(6), name: 'Монитор LG', category: 'Мониторы', description: '3840x2160, 144Hz', price: 54990, stock: 3 },
  { id: nanoid(6), name: 'SSD 1TB', category: 'Накопители', description: '5 лет гарантии', price: 7490, stock: 22 },
  { id: nanoid(6), name: 'Видеокарта RTX', category: 'Комплектующие', description: 'Поддержка 4K игр', price: 79990, stock: 5 },
  { id: nanoid(6), name: 'Процессор Intel', category: 'Комплектующие', description: '24 ядра, до 5.8 GHz', price: 44990, stock: 7 },
  { id: nanoid(6), name: 'Наушники Sony', category: 'Звук', description: 'Шумоподавление, 30 часов работы', price: 29990, stock: 11 },
  { id: nanoid(6), name: 'Веб-камера Logitech', category: 'Периферия', description: '4K 30fps', price: 18490, stock: 6 },
  { id: nanoid(6), name: 'Оперативная память 32GB', category: 'Комплектующие', description: 'DDR5', price: 11990, stock: 14 },
  { id: nanoid(6), name: 'Блок питания Seasonic', category: 'Комплектующие', description: '850W', price: 12490, stock: 9 },
  { id: nanoid(6), name: 'Микрофон Blue', category: 'Звук', description: 'Подставка в комплекте', price: 13990, stock: 4 },
  { id: nanoid(6), name: 'Кресло игровое', category: 'Мебель', description: 'Очень мягкое и удобное', price: 18990, stock: 2 },
];

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      console.log('Body:', req.body);
    }
  });
  next();
});

function findProductOr404(id, res) {
  const product = products.find(p => p.id == id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return null;
  }
  return product;
}

app.post('/api/products', (req, res) => {
  const { name, category, description, price, stock } = req.body;
  const newProduct = {
    id: nanoid(6),
    name: name.trim(),
    category: category.trim(),
    description: description.trim(),
    price: Number(price),
    stock: Number(stock),
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  res.json(product);
});

app.patch('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;

  const { name, category, description, price, stock } = req.body;
  if ([name, category, description, price, stock].every(v => v === undefined)) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);

  res.json(product);
});

app.delete('/api/products/:id', (req, res) => {
  const exists = products.some(p => p.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Product not found' });
  products = products.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});