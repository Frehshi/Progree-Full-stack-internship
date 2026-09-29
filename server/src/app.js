import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';
import { createDatabase, completeOrder } from './db.js';
import { requireAuth, signToken } from './auth.js';
import { cartSchema, credentialsSchema, registerSchema, taskPatchSchema, taskSchema } from './validation.js';

function taskDto(row) {
  return { id: row.id, title: row.title, description: row.description, priority: row.priority, dueDate: row.due_date, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
}

function productDto(row) {
  return { id: row.id, name: row.name, description: row.description, priceCents: row.price_cents, inventory: row.inventory, image: row.image };
}

function parse(schema, body, res) {
  const result = schema.safeParse(body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0]?.message || 'Invalid request.' });
    return null;
  }
  return result.data;
}

export function createApp(options = {}) {
  const db = options.db || createDatabase(options.dbPath);
  const jwtSecret = options.jwtSecret || process.env.JWT_SECRET || 'development-only-change-this-secret';
  const clientUrl = options.clientUrl || process.env.CLIENT_URL || 'http://localhost:5173';
  const stripe = options.stripe || (process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' }) : null);
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: clientUrl, methods: ['GET', 'POST', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));

  app.post('/api/checkout/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: 'Stripe webhook is not configured.' });
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, req.get('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET);
      if (event.type === 'checkout.session.completed') {
        const orderId = Number(event.data.object.metadata?.orderId);
        if (orderId) completeOrder(db, orderId, event.id);
      }
      return res.json({ received: true });
    } catch (error) {
      return res.status(400).json({ error: `Webhook rejected: ${error.message}` });
    }
  });

  app.use(express.json({ limit: '100kb' }));
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: 'draft-8', legacyHeaders: false });
  const auth = requireAuth(jwtSecret);

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: 'sqlite', checkout: stripe ? 'stripe-test' : 'local-sandbox' }));

  app.post('/api/auth/register', authLimiter, (req, res) => {
    const input = parse(registerSchema, req.body, res);
    if (!input) return;
    try {
      const hash = bcrypt.hashSync(input.password, 12);
      const result = db.prepare('INSERT INTO users (name,email,password_hash) VALUES (?,?,?)').run(input.name, input.email, hash);
      const user = { id: Number(result.lastInsertRowid), name: input.name, email: input.email };
      return res.status(201).json({ user, token: signToken(user, jwtSecret) });
    } catch (error) {
      if (String(error.message).includes('UNIQUE')) return res.status(409).json({ error: 'An account with that email already exists.' });
      throw error;
    }
  });

  app.post('/api/auth/login', authLimiter, (req, res) => {
    const input = parse(credentialsSchema, req.body, res);
    if (!input) return;
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(input.email);
    if (!row || !bcrypt.compareSync(input.password, row.password_hash)) return res.status(401).json({ error: 'Email or password is incorrect.' });
    const user = { id: row.id, name: row.name, email: row.email };
    return res.json({ user, token: signToken(user, jwtSecret) });
  });

  app.get('/api/auth/me', auth, (req, res) => res.json({ user: req.user }));

  app.get('/api/tasks', auth, (req, res) => {
    const rows = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date, id').all(req.user.id);
    res.json({ tasks: rows.map(taskDto) });
  });

  app.post('/api/tasks', auth, (req, res) => {
    const input = parse(taskSchema, req.body, res);
    if (!input) return;
    const result = db.prepare('INSERT INTO tasks (user_id,title,description,priority,due_date,status) VALUES (?,?,?,?,?,?)')
      .run(req.user.id, input.title, input.description, input.priority, input.dueDate, input.status);
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ task: taskDto(row) });
  });

  app.patch('/api/tasks/:id', auth, (req, res) => {
    const input = parse(taskPatchSchema, req.body, res);
    if (!input) return;
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Task not found.' });
    const merged = {
      title: input.title ?? existing.title,
      description: input.description ?? existing.description,
      priority: input.priority ?? existing.priority,
      dueDate: input.dueDate ?? existing.due_date,
      status: input.status ?? existing.status
    };
    db.prepare("UPDATE tasks SET title=?,description=?,priority=?,due_date=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?")
      .run(merged.title, merged.description, merged.priority, merged.dueDate, merged.status, req.params.id, req.user.id);
    res.json({ task: taskDto(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)) });
  });

  app.delete('/api/tasks/:id', auth, (req, res) => {
    const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (!result.changes) return res.status(404).json({ error: 'Task not found.' });
    return res.status(204).end();
  });

  app.get('/api/products', (_req, res) => {
    res.json({ products: db.prepare('SELECT * FROM products ORDER BY rowid').all().map(productDto) });
  });

  app.get('/api/cart', auth, (req, res) => {
    const items = db.prepare(`SELECT p.*, c.quantity FROM cart_items c JOIN products p ON p.id=c.product_id WHERE c.user_id=? ORDER BY p.rowid`).all(req.user.id);
    res.json({ items: items.map((row) => ({ product: productDto(row), quantity: row.quantity })) });
  });

  app.post('/api/cart', auth, (req, res) => {
    const input = parse(cartSchema, req.body, res);
    if (!input) return;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(input.productId);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    if (input.quantity > product.inventory) return res.status(409).json({ error: `Only ${product.inventory} item(s) remain.` });
    if (input.quantity === 0) db.prepare('DELETE FROM cart_items WHERE user_id=? AND product_id=?').run(req.user.id, input.productId);
    else db.prepare('INSERT INTO cart_items (user_id,product_id,quantity) VALUES (?,?,?) ON CONFLICT(user_id,product_id) DO UPDATE SET quantity=excluded.quantity')
      .run(req.user.id, input.productId, input.quantity);
    return res.json({ ok: true });
  });

  app.post('/api/checkout/session', auth, async (req, res, next) => {
    try {
      const items = db.prepare(`SELECT p.*, c.quantity FROM cart_items c JOIN products p ON p.id=c.product_id WHERE c.user_id=? ORDER BY p.rowid`).all(req.user.id);
      if (!items.length) return res.status(400).json({ error: 'Your cart is empty.' });
      for (const item of items) if (item.quantity > item.inventory) return res.status(409).json({ error: `${item.name} does not have enough stock.` });
      const total = items.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
      const orderResult = db.prepare("INSERT INTO orders (user_id,status,total_cents) VALUES (?,'pending',?)").run(req.user.id, total);
      const orderId = Number(orderResult.lastInsertRowid);
      const addItem = db.prepare('INSERT INTO order_items (order_id,product_id,name,price_cents,quantity) VALUES (?,?,?,?,?)');
      for (const item of items) addItem.run(orderId, item.id, item.name, item.price_cents, item.quantity);

      if (stripe) {
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          line_items: items.map((item) => ({ price_data: { currency: 'usd', product_data: { name: item.name }, unit_amount: item.price_cents }, quantity: item.quantity })),
          success_url: `${clientUrl}/shop?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${clientUrl}/shop?checkout=cancelled`,
          customer_email: req.user.email,
          metadata: { orderId: String(orderId), userId: String(req.user.id) }
        });
        db.prepare('UPDATE orders SET stripe_session_id=? WHERE id=?').run(session.id, orderId);
        return res.json({ mode: 'stripe', checkoutUrl: session.url, orderId });
      }

      completeOrder(db, orderId, `local-${orderId}`);
      return res.json({ mode: 'local', checkoutUrl: `${clientUrl}/shop?checkout=success&order_id=${orderId}`, orderId });
    } catch (error) {
      return next(error);
    }
  });

  app.get('/api/orders/:id', auth, (req, res) => {
    const order = db.prepare('SELECT * FROM orders WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    return res.json({ order: { id: order.id, status: order.status, totalCents: order.total_cents, paidAt: order.paid_at } });
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(error.status || 500).json({ error: error.status ? error.message : 'Unexpected server error.' });
  });

  app.locals.db = db;
  return app;
}

