// Database controller - mongo.js

const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
require('dotenv').config();

const uri = process.env.MONGODB_URI;

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function connectDB() {
    try {
      // Connect to the MongoDB database
      await mongoose.connect(uri, clientOptions);
  
      // Log the database name and collections
      const dbName = mongoose.connection.name;
      const collections = await mongoose.connection.db.collections();
      const collectionNames = collections.map(collection => collection.collectionName);
  
      console.log("Connected to database:", dbName);
  
      const store = new MongoDBStore({
        uri: uri,
        collection: 'sessions', 
        expires: 60 * 60 * 1000,
      });
      
      // Catch any errors in the MongoDB store
      store.on('error', function(error) {
        console.error('Session store error:', error);
      });
  
      return store; // Return the store for session handling
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error; // Rethrow the error to handle it in the caller
    }
  }

  module.exports = connectDB;
