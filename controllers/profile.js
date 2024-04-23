// Blog controller module - profile.js

const passport = require('passport');
const asyncHandler = require('express-async-handler');
const Blog = require('../models/blogModel');

// GET all blogs
const get_blogs = asyncHandler(async (req, res, next) => {
    try {
      const blogs = await Blog.find({}).populate('author', 'username email');
      console.log(blogs)
      res.status(200).json({ blogs });
    } catch (error) {
      console.error('Error fetching blogs:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
});

// GET specific blog by username
const spec_blog = asyncHandler(async (req, res, next) => {
    const { username } = req.params;
    console.log('Searching for ', username)
  
    try {
      // Find the blog with the matching username
      const blog = await Blog.findOne({ title: username }).populate('author', 'username');
  
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }
  
      res.status(200).json(blog);
    } catch (error) {
      console.error('Error fetching blog:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
});

// POST profile updates
const update_profile = asyncHandler(async (req, res, next) => {
    passport.authenticate('jwt', { session: false }, async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { title, category, links } = req.body;

        try {
            // Check if the blog title already exists
            const existingBlog = await Blog.findOne({ title });
            if (existingBlog) {
                return res.status(400).json({ message: 'Blog title already exists' });
            }

            // Update the blog title only
            const updatedBlog = await Blog.findOneAndUpdate(
                { author: user._id }, 
                { title, category, links },
                { new: true }
            );

            if (!updatedBlog) {
                return res.status(404).json({ message: 'Blog not found' });
            }

            res.status(200).json({ message: 'Blog updated successfully', updatedBlog });
        } catch (error) {
            console.error('Error updating blog:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    })(req, res, next);
});

module.exports = { get_blogs, spec_blog, update_profile };

