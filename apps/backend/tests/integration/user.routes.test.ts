import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/models/User';
import { clearDatabase, closeDatabase, connect } from '../setup.utils';
import { createTestUser, getTestUserToken } from '../utils/test.utils';

describe('User Routes', () => {
  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('GET /api/v1/users/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/users/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        service: 'users'
      });
    });
  });

  describe('POST /api/v1/users', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
        birthDate: '1990-01-01',
        birthLocation: {
          latitude: 40.7128,
          longitude: -74.0060,
          placeName: 'New York'
        }
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.email).toBe(userData.email);
      expect(response.body.firstName).toBe(userData.firstName);
      expect(response.body.lastName).toBe(userData.lastName);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'short',
        firstName: 'T',
        lastName: 'U'
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
    });
  });

  describe('GET /api/v1/users/:userId', () => {
    it('should get user by ID', async () => {
      const { user, token } = await createTestUser();

      const response = await request(app)
        .get(`/api/v1/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body._id).toBe(user._id.toString());
      expect(response.body.email).toBe(user.email);
    });

    it('should return 404 for non-existent user', async () => {
      const { token } = await createTestUser();

      await request(app)
        .get('/api/v1/users/nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/v1/users/some-id')
        .expect(401);
    });
  });

  describe('PUT /api/v1/users/:userId', () => {
    it('should update user', async () => {
      const { user, token } = await createTestUser();
      const updates = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const response = await request(app)
        .put(`/api/v1/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updates)
        .expect(200);

      expect(response.body.firstName).toBe(updates.firstName);
      expect(response.body.lastName).toBe(updates.lastName);
    });

    it('should return 403 when updating another user', async () => {
      const { user } = await createTestUser();
      const { token: otherToken } = await createTestUser('other@example.com');

      await request(app)
        .put(`/api/v1/users/${user._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ firstName: 'Updated' })
        .expect(403);
    });
  });

  describe('PUT /api/v1/users/:userId/preferences', () => {
    it('should update user preferences', async () => {
      const { user, token } = await createTestUser();
      const preferences = {
        themePreferences: {
          colorScheme: 'dark',
          fontSize: 'medium'
        },
        notificationPreferences: {
          email: {
            dailyInsights: true
          }
        }
      };

      const response = await request(app)
        .put(`/api/v1/users/${user._id}/preferences`)
        .set('Authorization', `Bearer ${token}`)
        .send(preferences)
        .expect(200);

      expect(response.body.preferences).toEqual(preferences);
    });
  });

  describe('DELETE /api/v1/users/:userId', () => {
    it('should delete user', async () => {
      const { user, token } = await createTestUser();

      await request(app)
        .delete(`/api/v1/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });

    it('should return 403 when deleting another user', async () => {
      const { user } = await createTestUser();
      const { token: otherToken } = await createTestUser('other@example.com');

      await request(app)
        .delete(`/api/v1/users/${user._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });

  describe('POST /api/v1/users/:userId/validate-password', () => {
    it('should validate correct password', async () => {
      const { user, token } = await createTestUser();

      const response = await request(app)
        .post(`/api/v1/users/${user._id}/validate-password`)
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'Test123!@#' })
        .expect(200);

      expect(response.body.isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const { user, token } = await createTestUser();

      const response = await request(app)
        .post(`/api/v1/users/${user._id}/validate-password`)
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'WrongPassword123!@#' })
        .expect(200);

      expect(response.body.isValid).toBe(false);
    });
  });
}); 