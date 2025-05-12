import { createServer } from 'http';
import request from 'supertest';
import { Server } from '../server';
import { DbUser } from '../types/users';
import { launchDatabase } from '../database/databaseService';

jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'log').mockImplementation(() => {});

describe('User API Integration Tests', () => {
  const testPort = 5000;
  const dbPort = testPort + 1;
  const testServer = new Server(testPort, false, dbPort);
  const { instance } = testServer;
  let dbServer: ReturnType<typeof createServer>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    dbServer = await launchDatabase(dbPort);
    testServer.start();
  });

  const sampleUser: DbUser = {
    username: 'TestUser',
    age: 30,
    hobbies: ['Coding', 'Testing'],
  };

  let createdUserId: string;

  it('GET /api/users - should return empty array initially', async () => {
    const response = await request(instance).get('/api/users');
    expect(response.status).toEqual(200);
    expect(response.body).toEqual([]);
  });

  it('POST /api/users - should create new user', async () => {
    const response = await request(instance).post('/api/users').send(sampleUser);

    expect(response.status).toEqual(201);
    expect(response.body).toMatchObject(sampleUser);
    createdUserId = response.body.id;
    expect(createdUserId).toBeDefined();
  });

  it('GET /api/users/{id} - should retrieve created user', async () => {
    const response = await request(instance).get(`/api/users/${createdUserId}`);

    expect(response.status).toEqual(200);
    expect(response.body).toMatchObject({
      ...sampleUser,
      id: createdUserId,
    });
  });

  it('PUT /api/users/{id} - should update user data', async () => {
    const updatedData = {
      ...sampleUser,
      age: 31,
      hobbies: ['Updated hobby'],
    };

    const response = await request(instance).put(`/api/users/${createdUserId}`).send(updatedData);

    expect(response.status).toEqual(200);
    expect(response.body).toMatchObject(updatedData);
  });

  it('DELETE /api/users/{id} - should remove user', async () => {
    const response = await request(instance).delete(`/api/users/${createdUserId}`);

    expect(response.status).toEqual(204);
  });

  it('GET /api/users/{id} - should return 404 after deletion', async () => {
    const response = await request(instance).get(`/api/users/${createdUserId}`);

    expect(response.status).toEqual(404);
    expect(response.body).toMatchObject({
      name: 'Not Found',
      statusCode: 404,
    });
  });

  describe('Validation Tests', () => {
    it('POST /api/users - should reject invalid username', async () => {
      const response = await request(instance)
        .post('/api/users')
        .send({ ...sampleUser, username: 123 });

      expect(response.status).toEqual(400);
      expect(response.body.message).toContain('Invalid username format');
    });

    it('POST /api/users - should reject negative age', async () => {
      const response = await request(instance)
        .post('/api/users')
        .send({ ...sampleUser, age: -5 });

      expect(response.status).toEqual(400);
      expect(response.body.message).toContain('Invalid age value');
    });

    it('POST /api/users - should reject invalid hobbies array', async () => {
      const response = await request(instance)
        .post('/api/users')
        .send({ ...sampleUser, hobbies: [1, true] });

      expect(response.status).toEqual(400);
      expect(response.body.message).toContain('Invalid hobbies format');
    });

    it('POST /api/users - should reject extra properties', async () => {
      const response = await request(instance)
        .post('/api/users')
        .send({ ...sampleUser, extraField: 'test' });

      expect(response.status).toEqual(400);
      expect(response.body.message).toContain('Unexpected fields');
    });
  });

  describe('Error Handling Tests', () => {
    it('GET /invalid-route - should return 404', async () => {
      const response = await request(instance).get('/invalid-route');
      expect(response.status).toEqual(404);
    });

    it('POST /api/users/123 - should reject invalid endpoint', async () => {
      const response = await request(instance)
        .post('/api/users/6d883b71-a570-47b4-81c0-20b6f45453d5')
        .send(sampleUser);

      expect(response.status).toEqual(404);
    });

    it('PUT /api/users/invalid-id - should reject malformed UUID', async () => {
      const response = await request(instance).put('/api/users/invalid-id').send(sampleUser);

      expect(response.status).toEqual(400);
      expect(response.body.message).toContain('Invalid user ID format');
    });
  });

  afterAll(() => {
    dbServer.close();
    instance.close();
  });
});
