import request from 'supertest';
import { app, db } from '../app.js';

describe('Backend integration tests (mocked DB)', () => {
  beforeEach(() => {
    // Default stub: return empty results
    db.query = (sql, params, cb) => cb(null, []);
  });

  test('GET /users returns JSON array', async () => {
    db.query = (sql, cb) => cb(null, [{ uid: 'u1', email: 'a@b.com' }]);
    const res = await request(app).get('/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].uid).toBe('u1');
  });

  test('POST /save-login inserts new user when not exists', async () => {
    let call = 0;
    db.query = (sql, params, cb) => {
      call += 1;
      if (sql.includes('SELECT * FROM users')) return cb(null, []); // no user
      if (sql.includes('INSERT INTO users')) return cb(null, { affectedRows: 1 });
      return cb(null, []);
    };

    const res = await request(app)
      .post('/save-login')
      .send({ uid: 'newuser', email: 'n@e.com' })
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.text).toContain('New user added');
  });

  test('POST /save-login updates user when exists', async () => {
    db.query = (sql, params, cb) => {
      if (sql.includes('SELECT * FROM users')) return cb(null, [{ uid: 'u1' }]);
      if (sql.includes('UPDATE users')) return cb(null, { affectedRows: 1 });
      return cb(null, []);
    };

    const res = await request(app)
      .post('/save-login')
      .send({ uid: 'u1', email: 'x@y.com' })
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.text).toContain('User login info updated');
  });
});
