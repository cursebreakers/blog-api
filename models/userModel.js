// User Schema - userModel.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the user schema
const userSchema = new Schema({
  username: { type: String, required: true, unique: true }, 
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  joinDate: { type: Date, default: Date.now }
});

// Create and export the User model
const User = mongoose.model('User', userSchema, 'users');

module.exports = User;