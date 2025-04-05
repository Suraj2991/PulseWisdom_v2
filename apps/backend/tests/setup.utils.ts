// Jest setup file for utility tests
jest.setTimeout(5000); // 5 second timeout for utility tests 

import mongoose from 'mongoose';

export const connect = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
  await mongoose.connect(mongoUri);
};

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

export const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}; 