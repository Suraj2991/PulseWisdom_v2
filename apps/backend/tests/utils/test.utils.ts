import { User, IUser } from '../../src/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { HydratedDocument } from 'mongoose';

export const createTestUser = async (email = 'test@example.com'): Promise<{ user: HydratedDocument<IUser>; token: string }> => {
  const hashedPassword = await bcrypt.hash('Test123!@#', 10);
  const user = await User.create({
    email,
    password: hashedPassword,
    firstName: 'Test',
    lastName: 'User',
    birthDate: '1990-01-01',
    birthLocation: {
      latitude: 40.7128,
      longitude: -74.0060,
      placeName: 'New York'
    }
  });

  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );

  return { user, token };
};

export const getTestUserToken = async (userId: string) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}; 