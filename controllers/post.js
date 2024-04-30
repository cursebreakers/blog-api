// Post controller module - post.js

const passport = require('passport');
const asyncHandler = require('express-async-handler');
const sanitizeHtml = require('sanitize-html');

const Blog = require('../models/blogModel');
const User= require('../models/userModel')

// GET all posts
const get_posts = asyncHandler(async (req, res, next) => {
    try {
        const blogs = await Blog.find({}).populate('author', 'username');
        const posts = blogs.reduce((allPosts, blog) => {
            const blogPosts = blog.posts.map(post => ({
                ...post.toObject(),
                author: blog.author.username
            }));
            return allPosts.concat(blogPosts);
        }, []);

        console.log(posts);
        res.status(200).json({ posts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET a specific post 
const spec_post = asyncHandler(async (req, res, next) => {
  const { keyword } = req.params;
    try {
        const posts = await Blog.find({
            $or: [
                { 'posts.title': { $regex: keyword, $options: 'i' } }, // Title contains keyword
                { 'posts.hashtags': { $regex: keyword, $options: 'i' } }, // Hashtags contain keyword
                { 'posts.content': { $regex: keyword, $options: 'i' } }, // Content/body contains keyword
                { 'posts.comments.text': { $regex: keyword, $options: 'i' } } // Comments contain keyword
            ]
        }).populate({
            path: 'posts',
            populate: { path: 'author', select: 'username' } 
        });

        if (!posts || posts.length === 0) {
            return res.status(404).json({ message: 'No posts found with the provided keyword' });
        }

        res.status(200).json({ posts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// GET posts by user
const user_posts = asyncHandler(async (req, res, next) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const posts = await Blog.find({ 'author': user._id }).populate({
            path: 'posts',
            populate: { path: 'author', select: 'username' }
        });

        if (!posts || posts.length === 0) {
            return res.status(404).json({ message: 'No posts found for this user' });
        }

        res.status(200).json({ posts });
    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET post by ID
const post_id = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    try {
        const blogWithPost = await Blog.findOne({ 'posts._id': id }).populate({
            path: 'posts',
            match: { _id: id },
            populate: { path: 'author', select: 'username' }
        });

        console.log('Blog with post:', blogWithPost);

        if (!blogWithPost || !blogWithPost.posts || blogWithPost.posts.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const post = blogWithPost.posts.find(p => p._id.toString() === id);
        console.log('Getting post', id, post)

        res.status(200).json({ post });
    } catch (error) {
        console.error('Error fetching post by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST new blog post
const new_post = asyncHandler(async (req, res, next) => {
    const { username } = req.params;
    let { title, content, hashtags, public } = req.body;

    try {
        passport.authenticate('jwt', { session: false }, async (err, user) => {
            if (err || !user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const blog = await Blog.findOne({ author: user._id });
            if (!blog) {
                return res.status(404).json({ message: 'Blog not found' });
            }

            const newPost = {
                title,
                content,
                hashtags,
                public,
            };

            blog.posts.push(newPost);
            await blog.save();

            res.status(201).json({ message: 'Post created successfully', newPost });
        })(req, res, next);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// POST update/edit to a blog post
const update_post = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { title, content, hashtags, public } = req.body;

    try {
        passport.authenticate('jwt', { session: false }, async (err, user) => {
            if (err || !user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const blog = await Blog.findOne({ author: user._id });
            if (!blog) {
                return res.status(404).json({ message: 'Blog not found' });
            }

            const postToUpdate = blog.posts.id(id);
            if (!postToUpdate) {
                return res.status(404).json({ message: 'Post not found' });
            }

            postToUpdate.title = title;
            postToUpdate.content = content;
            postToUpdate.hashtags = hashtags;
            postToUpdate.public = public

            await blog.save();

            res.status(200).json({ message: 'Post updated successfully', updatedPost: postToUpdate });
        })(req, res, next);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST comment to a blog post
const post_comment = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { username, text } = req.body;

    passport.authenticate('jwt', { session: false }, async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        try {
            console.log('Adding comment', text, 'by', username)
            const post = await Blog.findOneAndUpdate(
                { 'posts._id': id }, 
                { $push: { 'posts.$.comments': { username, text, timestamp: new Date() } } }, // Add the new comment to the post
                { new: true }
            );

            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }
            res.status(200).json({ message: 'Comment added successfully', post });
        } catch (error) {
            console.error('Error adding comment:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    })(req, res, next);
});

// POST delete a post
const delete_post = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { username, title } = req.body
    
    console.log('DELETE REQUEST RECIEVED. PROCESSING', id, username, title)

    passport.authenticate('jwt', { session: false }, async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        try {
            const blog = await Blog.findOne({ 'posts._id': id});
            console.log('blog found', blog)

            if (!blog) {
                return res.status(404).json({ message: 'Blog or post not found' });
            }

            blog.posts.pull({ _id: id });
            await blog.save();

            res.status(200).json({ message: 'Post deleted successfully'});
        } catch (error) {
            console.error('Error deleting post:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    })(req, res, next); 
});

module.exports = { get_posts, spec_post, user_posts, new_post, update_post, post_comment, post_id, delete_post };

