import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import bcrypt from 'bcryptjs';

const productSeed = [
  ['orbit-bottle', 'Orbit Bottle', 'Double-wall steel bottle with a carry-loop cap.', 3200, 12, '/products/orbit-bottle.webp'],
  ['field-notes', 'Field Notes Set', 'Three tactile notebooks for ideas on the move.', 1800, 18, '/products/field-notes.webp'],
  ['arc-lamp', 'Arc Desk Lamp', 'A focused warm light with a compact footprint.', 7400, 7, '/products/arc-lamp.webp'],
  ['cloud-tote', 'Cloud Tote', 'A structured everyday tote in natural canvas.', 2600, 3, '/products/cloud-tote.webp']
];

const taskSeed = [
  ['Build portfolio case study', 'Present the portfolio problem, solution, stack, and learnings.', 'high', '2026-10-04', 'in-progress'],
  ['Connect task API', 'Wire the React interface to the secure Express endpoints.', 'medium', '2026-10-08', 'not-started'],
  ['Test mobile navigation', 'Verify menu, keyboard focus, and narrow layouts.', 'medium', '2026-10-12', 'not-started'],
  ['Write final report', 'Document outcomes, testing evidence, and reflections.', 'low', '2026-10-18', 'completed']
];

export function createDatabase(path = 'server/data/progree.db') {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL CHECK(priority IN ('low','medium','high')),
      due_date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('not-started','in-progress','completed')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
      inventory INTEGER NOT NULL CHECK(inventory >= 0),
      image TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cart_items (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      PRIMARY KEY (user_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL CHECK(status IN ('pending','paid','cancelled')),
      total_cents INTEGER NOT NULL,
      stripe_session_id TEXT UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      paid_at TEXT
    );
    CREATE TABLE IF NOT EXISTS order_items (
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      name TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      PRIMARY KEY (order_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS checkout_events (
      event_id TEXT PRIMARY KEY,
      processed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const addProduct = db.prepare('INSERT OR IGNORE INTO products (id,name,description,price_cents,inventory,image) VALUES (?,?,?,?,?,?)');
  for (const product of productSeed) addProduct.run(...product);

  const demoEmail = 'demo@progree.local';
  let demo = db.prepare('SELECT id FROM users WHERE email = ?').get(demoEmail);
  if (!demo) {
    const passwordHash = bcrypt.hashSync('Demo123!', 12);
    const result = db.prepare('INSERT INTO users (name,email,password_hash) VALUES (?,?,?)').run('Demo Intern', demoEmail, passwordHash);
    demo = { id: Number(result.lastInsertRowid) };
  }
  const taskCount = db.prepare('SELECT COUNT(*) AS count FROM tasks WHERE user_id = ?').get(demo.id).count;
  if (taskCount === 0) {
    const addTask = db.prepare('INSERT INTO tasks (user_id,title,description,priority,due_date,status) VALUES (?,?,?,?,?,?)');
    for (const task of taskSeed) addTask.run(demo.id, ...task);
  }
  return db;
}

export function completeOrder(db, orderId, eventId = null) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
    if (order.status === 'paid') {
      db.exec('COMMIT');
      return order;
    }
    if (eventId) {
      const known = db.prepare('SELECT event_id FROM checkout_events WHERE event_id = ?').get(eventId);
      if (known) {
        db.exec('COMMIT');
        return order;
      }
    }
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
    for (const item of items) {
      const result = db.prepare('UPDATE products SET inventory = inventory - ? WHERE id = ? AND inventory >= ?')
        .run(item.quantity, item.product_id, item.quantity);
      if (result.changes !== 1) throw Object.assign(new Error(`${item.name} is no longer available in that quantity.`), { status: 409 });
    }
    db.prepare("UPDATE orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = ?").run(orderId);
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(order.user_id);
    if (eventId) db.prepare('INSERT INTO checkout_events (event_id) VALUES (?)').run(eventId);
    const completed = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    db.exec('COMMIT');
    return completed;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
