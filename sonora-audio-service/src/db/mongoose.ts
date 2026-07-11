import mongoose from 'mongoose';

export async function connectMongo() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/sonora';
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  return mongoose.connect(uri);
}
