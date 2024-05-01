// Blog controller module - profile.js

const passport = require('passport');
const asyncHandler = require('express-async-handler');
const sanitizeHtml = require('sanitize-html');

const Blog = require('../models/blogModel');
const User = require('../models/userModel');


// GET all blogs
const get_blogs = asyncHandler(async (req, res, next) => {
    try {
        const preSanBlogs = await Blog.find({}).populate('author', 'username email');

        // Sanitize each blog's content and comments
        const blogs = preSanBlogs.map(blog => ({
            ...blog.toJSON(),
            posts: blog.posts.map(post => ({
                ...post.toJSON(),
                content: sanitizeHtml(post.content),
                comments: post.comments.map(comment => ({
                    ...comment.toJSON(),
                    text: sanitizeHtml(comment.text),
                })),
            })),
        }));

        res.status(200).json({ blogs: blogs });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET specific blog by username
const spec_blog = asyncHandler(async (req, res, next) => {
    const { username } = req.params;
    const sanitizedUsername = sanitizeHtml(username); 

    console.log('Searching for ', sanitizedUsername)
  
    try {
      const user = await User.findOne({ username: sanitizedUsername });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const blog = await Blog.findOne({ author: user._id }).populate('author', 'username');
  
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }

      const sanitizedBlog = {
        ...blog.toJSON(),
        posts: blog.posts.map(post => ({
          ...post.toJSON(),
          content: sanitizeHtml(post.content),
          comments: post.comments.map(comment => ({
            ...comment.toJSON(),
            text: sanitizeHtml(comment.text),
          })),
        })),
      };
  
      res.status(200).json(sanitizedBlog);
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

        const { newTitle, userBefore, newUsername, category, links } = req.body;
        const usernameRegex = /^[a-zA-Z0-9-]+$/;
        
        if (
            newUsername.length > 24 || 
            !usernameRegex.test(newUsername) 
        ) {
            return res.status(400).json({
                message: 'Invalid username format. Usernames must be 24 characters or less and can only contain letters, numbers, and hyphens.'
            });
        }

        const sanitizedTitle = sanitizeHtml(newTitle);
        const sanitizedUsername = sanitizeHtml(newUsername);
        const sanitizedCategory = sanitizeHtml(category);
        const sanitizedLinks = Array.isArray(links) ? links.map(link => sanitizeHtml(link)) : [];

        try {
            if (userBefore !== user.username) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            let updatedUser;
            if (sanitizedUsername !== userBefore) {
                // Check if the new username already exists
                const existingUser = await User.findOne({ username: sanitizedUsername });
                if (existingUser) {
                    return res.status(400).json({ message: 'Username already exists' });
                }

                // Update the username only if it's different from the current username
                updatedUser = await User.findOneAndUpdate(
                    { _id: user._id }, 
                    { username: sanitizedUsername },
                    { new: true }
                );
            } else {
                updatedUser = user; // No need to update the username
            }

            // Always update the blog title and category regardless of existing title
            const updatedBlog = await Blog.findOneAndUpdate(
                { author: user._id }, 
                { title: sanitizedTitle, category: sanitizedCategory, links: sanitizedLinks },
                { new: true }
            );

            if (!updatedBlog || !updatedUser) {
                return res.status(404).json({ message: 'Blog or user not found' });
            }

            const sanitizedBlog = {
                ...updatedBlog.toJSON(),
                posts: updatedBlog.posts.map(post => ({
                    ...post.toJSON(),
                    content: sanitizeHtml(post.content),
                    comments: post.comments.map(comment => ({
                        ...comment.toJSON(),
                        text: sanitizeHtml(comment.text),
                    })),
                })),
            };

            res.status(200).json({ message: 'Blog updated successfully', updatedBlog: sanitizedBlog });
        } catch (error) {
            console.error('Error updating blog:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    })(req, res, next);
});

module.exports = { get_blogs, spec_blog, update_profile };

