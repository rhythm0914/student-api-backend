// db.js
const mongoose = require('mongoose');

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const MAX_ATTEMPTS = 2;

function createConnection() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  return mongoose
    .connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    })
    .catch((error) => {
      // Never keep a rejected promise cached. Otherwise a single transient
      // failure would break every later request served by this instance.
      cached.promise = null;
      throw error;
    });
}

async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (!cached.promise) {
      cached.promise = createConnection();
    }

    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) throw error;
    }
  }
}

module.exports = connectToDatabase;
