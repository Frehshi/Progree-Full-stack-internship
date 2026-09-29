import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

function setup() {
  return createApp({ dbPath: ':memory:', jwtSecret: 'test-secret-that-is-long-enough', clientUrl: 'http://localhost:5173' });
}

async function login(app) {
  const response = await request(app).post('/api/auth/login').send({ email: 'demo@progree.local', password: 'Demo123!' }).expect(200);
  return response.body.token;
}

test('health exposes database and checkout mode', async () => {
  const response = await request(setup()).get('/api/health').expect(200);
  assert.equal(response.body.database, 'sqlite');
  assert.equal(response.body.checkout, 'local-sandbox');
});

test('register, authenticate, and enforce task ownership', async () => {
  const app = setup();
  const registered = await request(app).post('/api/auth/register').send({ name: 'Omar Mohamed Aly', email: 'omar@example.com', password: 'StrongPass9!' }).expect(201);
  const token = registered.body.token;
  const created = await request(app).post('/api/tasks').set('Authorization', `Bearer ${token}`).send({
    title: 'Finish internship report', description: 'Add screenshots and reflections.', priority: 'high', dueDate: '2026-10-18', status: 'in-progress'
  }).expect(201);
  await request(app).patch(`/api/tasks/${created.body.task.id}`).set('Authorization', `Bearer ${token}`).send({ status: 'completed' }).expect(200);
  const tasks = await request(app).get('/api/tasks').set('Authorization', `Bearer ${token}`).expect(200);
  assert.equal(tasks.body.tasks.length, 1);
  assert.equal(tasks.body.tasks[0].status, 'completed');
  await request(app).delete(`/api/tasks/${created.body.task.id}`).set('Authorization', `Bearer ${token}`).expect(204);
  await request(app).get('/api/tasks').expect(401);
});

test('cart persists and local checkout atomically adjusts inventory', async () => {
  const app = setup();
  const token = await login(app);
  const before = await request(app).get('/api/products').expect(200);
  const bottle = before.body.products.find((item) => item.id === 'orbit-bottle');
  await request(app).post('/api/cart').set('Authorization', `Bearer ${token}`).send({ productId: bottle.id, quantity: 2 }).expect(200);
  const cart = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`).expect(200);
  assert.equal(cart.body.items[0].quantity, 2);
  const checkout = await request(app).post('/api/checkout/session').set('Authorization', `Bearer ${token}`).expect(200);
  assert.equal(checkout.body.mode, 'local');
  const order = await request(app).get(`/api/orders/${checkout.body.orderId}`).set('Authorization', `Bearer ${token}`).expect(200);
  assert.equal(order.body.order.status, 'paid');
  const after = await request(app).get('/api/products').expect(200);
  assert.equal(after.body.products.find((item) => item.id === bottle.id).inventory, bottle.inventory - 2);
});
