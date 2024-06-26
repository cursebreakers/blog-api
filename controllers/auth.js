// Authentication control module - auth.js

const asyncHandler = require('express-async-handler');
const sanitizeHtml = require('sanitize-html');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');

const sessKey = process.env.JWT_SECRET;

const User = require('../models/userModel')
const Blog = require('../models/blogModel')

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: sessKey,
};

passport.use(
  new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      const user = await User.findById(jwtPayload.userId);
      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);

function generateToken(userId, username) {
  return jwt.sign({ userId, username }, sessKey, { expiresIn: '1h' });
}

// POST new user
const new_auth = asyncHandler(async (req, res, next) => {
    const { username, email, password, confirmPassword } = req.body;
    console.log('Signing up:', req.body)
   
    try {
        const usernameRegex = /^[a-zA-Z0-9-]+$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ message: 'Invalid username format. Usernames must contain only letters, numbers, and hyphens' });
        }

        const sanitizedUsername = sanitizeHtml(username);
        const sanitizedEmail = sanitizeHtml(email);
        const sanitizedPassword = sanitizeHtml(password);
        const sanitizedConfirmPassword = sanitizeHtml(confirmPassword);

        if (password !== confirmPassword) {
          return res.status(400).json({ message: 'Passwords do not match' });
        }

        if (password.length < 8) {
          return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }
    
        const existingUser = await User.findOne({ email: sanitizedEmail });
    
        if (existingUser) {
          return res.status(400).json({ message: 'User already exists with this email' });
        }
    
        // Hash the password
        const hashedPassword = await bcrypt.hash(sanitizedPassword, 12);
    
        const newUser = new User({ username: sanitizedUsername, email: sanitizedEmail, password: hashedPassword });
        await newUser.save();

        const newBlog = new Blog({
          title: sanitizedUsername.toString(),
          author: newUser._id,
        });
        
        await newBlog.save();

        const defaultPost = {
            title: 'Hello, World!',
            content: 'Hello, World!',
            username: sanitizedUsername.toString(),
            public: false,
        };
        
        newBlog.posts.push(defaultPost);
        await newBlog.save();

        const token = generateToken(newUser._id, newUser.username);
        console.log(newUser, newBlog);
        res.status(201).json({ message: 'User created successfully', newUser, token });

    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
});

// POST login
const auth_in = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
  
    try {
        const sanitizedEmail = sanitizeHtml(email);
        const sanitizedPassword = sanitizeHtml(password);

        const user = await User.findOne({ email: sanitizedEmail });
  
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
  
        const isMatch = await bcrypt.compare(sanitizedPassword, user.password);
  
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
  
        const token = generateToken(user._id, user.username);
        console.log(user);
        res.status(200).json({ message: 'Login successful', user, token });
    } catch (error) {
      console.error('Error logging in user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
});

// GET to check if user is authenticated
const auth_check = asyncHandler(async (req, res, next) => {

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, sessKey, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { userId, username } = decoded;
      if (!userId || !username) {
        console.error('Invalid token payload');
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Token is valid, send success response
      res.status(200).json({ message: 'Token verified', token, userId, username });
    });
  } catch (error) {
    console.error('Error checking authentication:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = { passport, generateToken, new_auth, auth_in, auth_check };
