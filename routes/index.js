// index.js - Primary router module

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const markdownIt = require('markdown-it')();

const authControl = require('../controllers/auth')
const blogControl = require('../controllers/profile')
const postControl = require('../controllers/post')

/* GET home page. */
router.get('/', function(req, res, next) {
    res.redirect('/README');
  });

// Redirect root request to README
/* GET home page. */
router.get('/README', function(req, res, next) {
  const readmePath = path.join(__dirname, '..', 'README.md');
  fs.readFile(readmePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading README.md');
      return;
    }

    const htmlContent = markdownIt.render(data);
    res.render('index', { title: 'Cursebreakers API', content: htmlContent });
  });
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

// GET auth check
router.get('/auth/check', authControl.auth_check);

// GET  all blogs
router.get('/profile', blogControl.get_blogs);

// GET all posts
router.get('/posts', postControl.get_posts);

// POST new post
router.post('/posts/new', postControl.new_post)

// POSTs to update or delete existing blog-post
router.post('/posts/edit/:id', postControl.update_post)
router.post('/posts/delete/:id', postControl.delete_post);

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

// POST blog/account settings
router.post('/profile/:username', blogControl.update_profile);

module.exports = router;
