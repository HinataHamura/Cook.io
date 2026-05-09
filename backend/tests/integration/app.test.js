import request from 'supertest';
import assert from 'node:assert/strict';
import { app, db } from '../../app.js';

test('GET /users returns mocked empty array', async () => {
  const originalQuery = db.query;
  // mock db.query to return empty results for SELECT
  db.query = (sql, params, cb) => {
    const callback = typeof params === 'function' ? params : cb;
    callback(null, []);
  };

  const res = await request(app).get('/users');
  assert.deepEqual(res.body, []);

  db.query = originalQuery;
});

test('POST /save-login inserts new user when none found', async () => {
  const originalQuery = db.query;
  // First call (SELECT) -> no results; Second call (INSERT) -> success
  db.query = (sql, params, cb) => {
    const callback = typeof params === 'function' ? params : cb;
    if (/SELECT/i.test(sql)) {
      callback(null, []);
    } else if (/INSERT/i.test(sql)) {
      callback(null, { insertId: 1 });
    } else {
      callback(null, []);
    }
  };

  const res = await request(app)
    .post('/save-login')
    .send({ uid: 'u1', email: 'u1@example.com' })
    .set('Accept', 'application/json');

  const text = res.text;
  // should return confirmation text
  assert.match(text, /New user added|User login info updated|New user added!/i);

  db.query = originalQuery;
});
