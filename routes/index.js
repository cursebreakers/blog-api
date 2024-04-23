// index.js - Primary router module

const express = require('express');
const router = express.Router();

const authControl = require('../controllers/auth')
const blogControl = require('../controllers/profile')
const postControl = require('../controllers/post')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Cursebreakers API' });
});

// GET application and server health
router.get('/health', function(req, res, next) {
  res.status(200).json({ message: 'Server: OK (200)'});
});

// GET auth route
router.get('/auth', function(req, res, next) {
  res.render('index', { title: 'Cursebreakers API' });
});

// POST new user
router.post('/auth/new', authControl.new_auth);

// POST user login
router.post('/auth/in', authControl.auth_in);

// GET  all blogs
router.get('/profile', blogControl.get_blogs);

// POST blog/account settings
router.post('/profile/:username', blogControl.update_profile);

// GET all posts
router.get('/posts', postControl.get_posts);

// POST new post
router.post('/posts/new', postControl.new_post)

// POST update to existing blog-post
router.post('/posts/edit/:id', postControl.update_post)

// POST comment to blog post
router.post('/posts/:id/comments', postControl.post_comment)

// GET a post by ID (for nav, feeds, linking, sharing etc)
router.get('/posts/:id', postControl.post_id);

// GET a post by keyword or meta
router.get('/posts/:keyword', postControl.spec_post);

// GET posts by user
router.get('/profile/:username/posts', postControl.user_posts);

// GET a specific blog
router.get('/profile/:username', blogControl.spec_blog);


module.exports = router;
