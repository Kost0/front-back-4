const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

let products = [
  { id: nanoid(6), name: 'Механическая клавиатура Keychron', category: 'Периферия', description: 'Алюминиевый корпус, RGB подсветка', price: 14990, stock: 8, imageUrl: 'https://dxstore.ru/wp-content/uploads/2023/04/besprovodnaya-mehanicheskaya-klaviatura-keychron-k10-full-size-alyum-korpus-rgb-podsvetka-red-switch-05.jpg' },
  { id: nanoid(6), name: 'Игровая мышь Logitech', category: 'Периферия', description: 'Беспроводная', price: 9490, stock: 15, imageUrl: 'https://c.dns-shop.ru/thumb/st4/fit/300/300/95ad0ea05eb7d5ca941d6e7e26528eb5/49ad1af235cb520a4134c4957d28bf034c2d8be7518b9a2efbd9cdb4d7fc534a.jpg' },
  { id: nanoid(6), name: 'Монитор LG', category: 'Мониторы', description: '3840x2160, 144Hz', price: 54990, stock: 3, imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoznTUYaT2xPcxwbLo2eNKwJT_lrPEj7bxww&s' },
  { id: nanoid(6), name: 'SSD 1TB', category: 'Накопители', description: '5 лет гарантии', price: 7490, stock: 22, imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzcnf3TTDlhXWt7nPGHhVIzmGs0Sa4NDJmlQ&s'},
  { id: nanoid(6), name: 'Видеокарта RTX', category: 'Комплектующие', description: 'Поддержка 4K игр', price: 79990, stock: 5, imageUrl: 'https://cdn.citilink.ru/1mJXsQ7Ssg9gbW-BEjpMbBLR9c_hSrnZvZ5_TS2pvd0/resizing_type:fit/gravity:sm/width:400/height:400/plain/product-images/e4714e08-293a-4251-bedb-f8f6695ad76a.jpg' },
  { id: nanoid(6), name: 'Процессор Intel', category: 'Комплектующие', description: '24 ядра, до 5.8 GHz', price: 44990, stock: 7, imageUrl: 'https://3logic.ru/pimg/pim/regular/1104493.jpg' },
  { id: nanoid(6), name: 'Наушники Sony', category: 'Звук', description: 'Шумоподавление, 30 часов работы', price: 29990, stock: 11, imageUrl: 'https://rebro-store.ru/upload/iblock/374/1ib9hwyba0uhuiwiazv788mag2nxfc22.webp' },
  { id: nanoid(6), name: 'Веб-камера Logitech', category: 'Периферия', description: '4K 30fps', price: 18490, stock: 6, imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpLnyZlvIPTzX5YHo1YrTRnFwlKuXPBesbew&s' },
  { id: nanoid(6), name: 'Оперативная память 32GB', category: 'Комплектующие', description: 'DDR5', price: 11990, stock: 14, imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9Su_W0oT89P-ozWY22dAQqrF7MZ2OQDJAHQ&s' },
  { id: nanoid(6), name: 'Блок питания Seasonic', category: 'Комплектующие', description: '850W', price: 12490, stock: 9, imageUrl: 'https://static.onlinetrade.ru/img/fullreviews/66733/1_big.jpg' },
  { id: nanoid(6), name: 'Микрофон Blue', category: 'Звук', description: 'Подставка в комплекте', price: 13990, stock: 4, imageUrl: 'https://www.bluemics.ru/wa-data/public/shop/products/57/02/257/images/1104/1104.970x0.png' },
  { id: nanoid(6), name: 'Кресло игровое', category: 'Мебель', description: 'Очень мягкое и удобное', price: 18990, stock: 2, imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTwg8C-lzOBBbuLunSF__Enk0yvzkxhALf7Q&s' },
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

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API интернет-магазина',
      version: '1.0.0',
      description: 'Простое API для управления товарами интернет-магазина',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Локальный сервер',
      },
    ],
  },
  apis: ['./app.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - description
 *         - price
 *         - stock
 *         - imageUrl
 *       properties:
 *         id:
 *           type: string
 *           description: Автоматически сгенерированный уникальный ID товара
 *         name:
 *           type: string
 *           description: Название товара
 *         category:
 *           type: string
 *           description: Категория товара
 *         description:
 *           type: string
 *           description: Подробное описание товара
 *         price:
 *           type: number
 *           description: Цена товара в рублях
 *         stock:
 *           type: integer
 *           description: Количество товара на складе
 *         imageUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           description: Ссылка на изображение товара
 *       example:
 *         id: "abc123"
 *         name: "Клавиатура"
 *         category: "Периферия"
 *         description: "Очень подробное описание клавиатуры"
 *         price: 200
 *         stock: 15
 *         imageUrl: "https://example.com/keyboard.jpg"
 */

function findProductOr404(id, res) {
  const product = products.find(p => p.id == id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return null;
  }
  return product;
}

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создает новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - description
 *               - price
 *               - stock
 *               - imageUrl
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *                 description: Ссылка на изображение товара
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка в теле запроса
 */
app.post('/api/products', (req, res) => {
  const { name, category, description, price, stock, imageUrl } = req.body;
  const newProduct = {
    id: nanoid(6),
    name: name.trim(),
    category: category.trim(),
    description: description.trim(),
    price: Number(price),
    stock: Number(stock),
    imageUrl: imageUrl ? imageUrl.trim() : undefined,
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Возвращает список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получает товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Данные товара
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */
app.get('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновляет данные товара
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *                 description: Ссылка на изображение товара
 *     responses:
 *       200:
 *         description: Обновленный товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Нет данных для обновления
 *       404:
 *         description: Товар не найден
 */
app.patch('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;

  const { name, category, description, price, stock, imageUrl } = req.body;
  if ([name, category, description, price, stock, imageUrl].every(v => v === undefined)) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (imageUrl !== undefined) product.imageUrl = imageUrl ? imageUrl.trim() : undefined;

  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удаляет товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       204:
 *         description: Товар успешно удален
 *       404:
 *         description: Товар не найден
 */
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
  console.log(`Swagger UI доступен по адресу http://localhost:${port}/api-docs`);
});