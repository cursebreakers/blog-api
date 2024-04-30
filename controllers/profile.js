// Blog controller module - profile.js

const passport = require('passport');
const asyncHandler = require('express-async-handler');
const Blog = require('../models/blogModel');
const User = require('../models/userModel');


// GET all blogs
const get_blogs = asyncHandler(async (req, res, next) => {
    try {
        const blogs = await Blog.find({}).populate('author', 'username email');
        console.log('Getting blogs: ', blogs)
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
      const user = await User.findOne({ username });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const blog = await Blog.findOne({ author: user._id }).populate('author', 'username');
      console.log('User blog: ', blog)
  
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

        const { newTitle, userBefore, newUsername, category, links } = req.body;
        console.log('Trying account updates with:', newTitle, category, links, userBefore, newUsername);

        const usernameRegex = /^[a-zA-Z0-9-]+$/;
        if (
            newUsername.length > 24 || 
            !usernameRegex.test(newUsername) 
        ) {
            return res.status(400).json({
                message: 'Invalid username format. Usernames must be 24 characters or less and can only contain letters, numbers, and hyphens.'
            });
        }

        try {
            let updatedUser;
            if (newUsername !== userBefore) {
                // Check if the new username already exists
                const existingUser = await User.findOne({ username: newUsername });
                if (existingUser) {
                    return res.status(400).json({ message: 'Username already exists' });
                }

                // Update the username only if it's different from the current username
                updatedUser = await User.findOneAndUpdate(
                    { _id: user._id }, 
                    { username: newUsername },
                    { new: true }
                );
            } else {
                updatedUser = user; // No need to update the username
            }

            // Always update the blog title and category regardless of existing title
            const updatedBlog = await Blog.findOneAndUpdate(
                { author: user._id }, 
                { title: newTitle, category, links },
                { new: true }
            );

            if (!updatedBlog || !updatedUser) {
                return res.status(404).json({ message: 'Blog or user not found' });
            }

            res.status(200).json({ message: 'Blog updated successfully', updatedBlog });
        } catch (error) {
            console.error('Error updating blog:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    })(req, res, next);
});

module.exports = { get_blogs, spec_blog, update_profile };

