# Cursebreakers | Blog API

v0.0.9 ![](/images/brkr-cloud.png)

Powers [React Dashboard](https://github.com/cursebreakers/blog-react-dashboard) and [Static Viewer](https://github.com/cursebreakers/blog-static-viewer)

**WORKING: v0.1.0**

- SECURITY
  - HELMET, HTTPS,RATE LIMITING, ETC
- DOCUMENTATION 
  - README
- DEPLYOMENT
  - [Glitch.com](https://glitch.com/)
  
## Overview:

The two main endpoints are /profile and /posts. 

Sensitive routes are protected using JWT. Token can be acquired via /auth route.

Posts are stored as arrays within the author's blog object. Comments are stored as an array within each post. 

### Routes & Endpoints

**index.js**
- / - GET
  - /README - GET
  - /health - GET

- /auth
  - /auth/new - POST
  - /auth/in - POST
  - /auth/check - GET

- /posts - GET
  - /posts/new - POST
  - /posts/edit/:id - POST
  - /posts/delete/:id - POST
  - /posts/:id/comments - POST
  - /posts/:id - GET
  - /posts/:keyword - GET

  - /profile - GET
  - /profile/:username/posts - GET
  - /profile/:username - GET and POST

### Controllers

**auth.js**
- Authentication & JWT Module:
  - new_auth
  - auth_in
  - auth_check

**mongo.js**
- MongoDB Connection Module

**post.js**
- Post Controller Module:
  - get_posts
  - spec_post
  - user_posts
  - post_id
  - new_post - REQUIRES AUTHENTICATION
  - update_post - REQUIRES AUTHENTICATION
  - post_comment - REQUIRES AUTHENTICATION
  - delete_post - REQUIRES AUTHENTICATION

**profile.js**
- Blog Controller Module:
  - get_blogs
  - spec_blog
  - update_profile - REQUIRES AUTHENTICATION

### Models
**blogModel.js**
- Blog schema
- Post schema

**userModel.js**
- User schema

## Credits & Acknowledgements:

### Built with:

- [Express](https://expressjs.com/)
- [NPM](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Glitch.com](https://glitch.com/)

### Author:

- Esau [@Cursebreakers LLC](https://cursebreakers.net)

### Coursework:

- The Odin Project - [Full Stack JavaScript](https://www.theodinproject.com/lessons/nodejs-blog-api)