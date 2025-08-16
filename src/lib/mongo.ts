import mongoose from 'mongoose';

// Validate MongoDB URI
if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI environment variable is required');
}

const MONGO_URI = process.env.MONGO_URI;

// Connection state
interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global connection cache to prevent multiple connections in serverless environments
let cached: MongooseConnection = (global as unknown as { mongoose: MongooseConnection }).mongoose;

if (!cached) {
  cached = (global as unknown as { mongoose: MongooseConnection }).mongoose = { conn: null, promise: null };
}

const connectDB = async (): Promise<typeof mongoose> => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

export default connectDB;

