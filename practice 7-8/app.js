const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();

const PORT = 3000;

const JWT_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";

const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Shop with RBAC',
      version: '2.0.0',
      description: 'API с системой ролей (RBAC): guest, user, seller, admin',
    },
    servers: [{ url: `http://localhost:${PORT}`, description: 'Локальный сервер' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      },
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Ноутбук' },
            category: { type: 'string', example: 'техника' },
            description: { type: 'string', example: 'Описание товара' },
            price: { type: 'number', example: 999 },
            imageUrl: { type: 'string', example: 'https://example.com/image.jpg' },
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', example: 'ivan@example.com' },
            first_name: { type: 'string', example: 'Иван' },
            last_name: { type: 'string', example: 'Иванов' },
            role: { type: 'string', enum: ['user', 'seller', 'admin'], example: 'user' },
            blocked: { type: 'boolean', example: false },
          }
        }
      }
    }
  },
  apis: ['./app.js'],
};

let users = [];
let refreshTokens = new Set();
let products = [
  {
    id: 1,
    title: "MacBook Pro",
    category: "Ноутбуки",
    description: "Мощный ноутбук Apple с чипом M3",
    price: 189990,
    imageUrl: "https://img.freepik.com/free-vector/laptop-realistic_78370-511.jpg?semt=ais_hybrid&w=740&q=80"
  },
  {
    id: 2,
    title: "iPhone 15",
    category: "Смартфоны",
    description: "Флагманский смартфон Apple с Dynamic Island",
    price: 99990,
    imageUrl: "https://i.pinimg.com/736x/30/95/b1/3095b1417854248b35d2ba9416520714.jpg"
  },
  {
    id: 3,
    title: "Sony WH-1000XM5",
    category: "Аудио",
    description: "Беспроводные наушники с шумоподавлением",
    price: 29990,
    imageUrl: "https://www.sony-mea.com/image/6145c1d32e6ac8e63a46c912dc33c5bb?fmt=png-alpha"
  },
];

function generateTokens(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  refreshTokens.add(refreshToken);
  return { accessToken, refreshToken };
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Проверяет Bearer-токен. Если токен валиден — кладёт payload в req.user.
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Фабрика middleware для ограничения доступа по ролям.
 * @param {string[]} allowedRoles
 */
function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());
app.use(express.static(__dirname));

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
  });
  next();
});

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Аутентификация и авторизация
 *   - name: Users
 *     description: Управление пользователями (только Admin)
 *   - name: Products
 *     description: Управление товарами
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, first_name, last_name, password]
 *             properties:
 *               email:       { type: string, example: ivan@example.com }
 *               first_name:  { type: string, example: Иван }
 *               last_name:   { type: string, example: Иванов }
 *               password:    { type: string, example: qwerty123 }
 *               role:        { type: string, enum: [user, seller, admin], example: user }
 *     responses:
 *       201: { description: Пользователь создан }
 *       400: { description: Некорректные данные }
 *       409: { description: Email уже занят }
 */
app.post('/api/auth/register', async (req, res) => {
  const { email, first_name, last_name, password, role } = req.body;

  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'email, password, first_name and last_name are required' });
  }

  if (users.some(u => u.email === email)) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const allowedRoles = ['user', 'seller', 'admin'];
  const assignedRole = allowedRoles.includes(role) ? role : 'user';

  const user = {
    id: users.length + 1,
    email,
    first_name,
    last_name,
    hashedPassword: await hashPassword(password),
    role: assignedRole,
    blocked: false,
  };
  users.push(user);

  res.status(201).json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
  });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: ivan@example.com }
 *               password: { type: string, example: qwerty123 }
 *     responses:
 *       200: { description: Пара токенов }
 *       401: { description: Неверные данные или аккаунт заблокирован }
 */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  if (user.blocked) {
    return res.status(401).json({ error: 'Account is blocked' });
  }

  const valid = await verifyPassword(password, user.hashedPassword);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const tokens = generateTokens(user);
  res.json(tokens);
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновить пару токенов
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Новая пара токенов }
 *       401: { description: Токен недействителен }
 */
app.post('/api/auth/refresh', (req, res) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  if (!refreshTokens.has(token)) {
    return res.status(401).json({ error: 'Refresh token is invalid or already used' });
  }

  try {
    const payload = jwt.verify(token, REFRESH_SECRET);
    const user = users.find(u => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: 'User not found' });

    refreshTokens.delete(token);
    const tokens = generateTokens(user);
    res.json(tokens);
  } catch {
    refreshTokens.delete(token);
    return res.status(401).json({ error: 'Refresh token expired or invalid' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить данные текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Данные пользователя }
 *       401: { description: Не авторизован }
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    blocked: user.blocked,
  });
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список всех пользователей
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Список пользователей }
 *       403: { description: Только для администратора }
 */
app.get('/api/users',
  authMiddleware,
  roleMiddleware(['admin']),
  (req, res) => {
    res.json(users.map(u => ({
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      role: u.role,
      blocked: u.blocked,
    })));
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по id
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Пользователь }
 *       404: { description: Не найден }
 */
app.get('/api/users/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  (req, res) => {
    const user = users.find(u => u.id == req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      blocked: user.blocked,
    });
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить информацию пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name: { type: string }
 *               last_name:  { type: string }
 *               role:       { type: string, enum: [user, seller, admin] }
 *     responses:
 *       200: { description: Пользователь обновлён }
 */
app.put('/api/users/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  (req, res) => {
    const user = users.find(u => u.id == req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { first_name, last_name, role } = req.body;
    const allowedRoles = ['user', 'seller', 'admin'];

    if (first_name !== undefined) user.first_name = first_name;
    if (last_name !== undefined)  user.last_name  = last_name;
    if (role !== undefined && allowedRoles.includes(role)) user.role = role;

    res.json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      blocked: user.blocked,
    });
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Заблокировать пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Пользователь заблокирован }
 */
app.delete('/api/users/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  (req, res) => {
    const user = users.find(u => u.id == req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.blocked = true;
    res.json({ message: 'User blocked', id: user.id });
  }
);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров
 *     tags: [Products]
 *     description: Доступно всем (включая неавторизованных пользователей)
 *     responses:
 *       200: { description: Массив товаров }
 */
app.get('/api/products', (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по id
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Товар }
 *       404: { description: Не найден }
 */
app.get('/api/products/:id',
  authMiddleware,
  (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  }
);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     description: Доступно seller и admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category, description, price]
 *             properties:
 *               title:       { type: string,  example: Ноутбук }
 *               category:    { type: string,  example: техника }
 *               description: { type: string,  example: Описание }
 *               price:       { type: number,  example: 999 }
 *               imageUrl:    { type: string,  example: 'https://example.com/img.jpg' }
 *     responses:
 *       201: { description: Товар создан }
 *       403: { description: Только для продавца/администратора }
 */
app.post('/api/products',
  authMiddleware,
  roleMiddleware(['seller', 'admin']),
  (req, res) => {
    const { title, category, description, price, imageUrl } = req.body;
    if (!title || !category || !description || price === undefined) {
      return res.status(400).json({ error: 'title, category, description and price are required' });
    }
    const newProduct = {
      id: products.length ? Math.max(...products.map(p => p.id)) + 1 : 1,
      title,
      category,
      description,
      price: Number(price),
      imageUrl: imageUrl || '',
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
  }
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить параметры товара
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     description: Доступно seller и admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Товар обновлён }
 *       403: { description: Только для продавца/администратора }
 */
app.put('/api/products/:id',
  authMiddleware,
  roleMiddleware(['seller', 'admin']),
  (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const { title, category, description, price, imageUrl } = req.body;
    if (title       !== undefined) product.title       = title;
    if (category    !== undefined) product.category    = category;
    if (description !== undefined) product.description = description;
    if (price       !== undefined) product.price       = Number(price);
    if (imageUrl    !== undefined) product.imageUrl    = imageUrl;

    res.json(product);
  }
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     description: Только для admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Товар удалён }
 *       403: { description: Только для администратора }
 */
app.delete('/api/products/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  (req, res) => {
    const exists = products.find(p => p.id == req.params.id);
    if (!exists) return res.status(404).json({ error: 'Product not found' });

    products = products.filter(p => p.id != req.params.id);
    res.json({ message: 'Product deleted' });
  }
);


app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log(`Swagger UI доступен по адресу http://localhost:${PORT}/api-docs`);
});