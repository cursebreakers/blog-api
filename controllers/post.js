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

        // Sanitize each post's content and comments
        const sanitizedPosts = posts.map(post => ({
            ...post,
            content: sanitizeHtml(post.content),
            comments: post.comments.map(comment => ({
                ...comment,
                text: sanitizeHtml(comment.text),
            })),
        }));

        res.status(200).json({ posts: sanitizedPosts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET a specific post 
const spec_post = asyncHandler(async (req, res, next) => {
  const { keyword } = req.params;
  const sanitizedKeyword = sanitizeHtml(keyword);

    try {
        const posts = await Blog.find({
            $or: [
                { 'posts.title': { $regex: sanitizedKeyword, $options: 'i' } }, // Title contains keyword
                { 'posts.hashtags': { $regex: sanitizedKeyword, $options: 'i' } }, // Hashtags contain keyword
                { 'posts.content': { $regex: sanitizedKeyword, $options: 'i' } }, // Content/body contains keyword
                { 'posts.comments.text': { $regex: sanitizedKeyword, $options: 'i' } } // Comments contain keyword
            ]
        }).populate({
            path: 'posts',
            populate: { path: 'author', select: 'username' } 
        });

        if (!posts || posts.length === 0) {
            return res.status(404).json({ message: 'No posts found with the provided keyword' });
        }

        const sanitizedPosts = posts.map(post => ({
            ...post.toObject(),
            posts: post.posts.map(p => ({
                ...p.toObject(),
                content: sanitizeHtml(p.content),
                comments: p.comments.map(comment => ({
                    ...comment.toObject(),
                    text: sanitizeHtml(comment.text),
                })),
            })),
        }));

        res.status(200).json({ posts: sanitizedPosts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET posts by user
const user_posts = asyncHandler(async (req, res, next) => {
    const { username } = req.params;
    const sanitizedUsername = sanitizeHtml(username);

    try {
        const user = await User.findOne({ username: sanitizedUsername });
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

        const sanitizedPosts = posts.map(post => ({
            ...post.toObject(),
            posts: post.posts.map(p => ({
                ...p.toObject(),
                content: sanitizeHtml(p.content),
                comments: p.comments.map(comment => ({
                    ...comment.toObject(),
                    text: sanitizeHtml(comment.text),
                })),
            })),
        }));

        res.status(200).json({ posts: sanitizedPosts });
    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET post by ID
const post_id = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const sanitizedId = sanitizeHtml(id);

    try {
        const blogWithPost = await Blog.findOne({ 'posts._id': sanitizedId }).populate({
            path: 'posts',
            match: { _id: sanitizedId },
            populate: { path: 'author', select: 'username' }
        });

        console.log('Blog with post:', blogWithPost);

        if (!blogWithPost || !blogWithPost.posts || blogWithPost.posts.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const post = blogWithPost.posts.find(p => p._id.toString() === id);
        console.log('Getting post', id, post)

        const sanitizedPost = {
            ...blogWithPost.posts[0].toObject(),
            content: sanitizeHtml(blogWithPost.posts[0].content),
            comments: blogWithPost.posts[0].comments.map(comment => ({
                ...comment.toObject(),
                text: sanitizeHtml(comment.text),
            })),
        };

        res.status(200).json({ post: sanitizedPost });
    } catch (error) {
        console.error('Error fetching post by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST new blog post
const new_post = asyncHandler(async (req, res, next) => {
    const { username } = req.params;
    let { title, content, hashtags, public } = req.body;

    const sanitizedTitle = sanitizeHtml(title);
    const sanitizedContent = sanitizeHtml(content);
    const sanitizedHashtags = Array.isArray(hashtags) ? hashtags.map(tag => sanitizeHtml(tag)) : [];
    const sanitizedPublic = Boolean(public);

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
                title: sanitizedTitle,
                content: sanitizedContent,
                hashtags: sanitizedHashtags,
                public: sanitizedPublic,
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

    const sanitizedTitle = sanitizeHtml(title);
    const sanitizedContent = sanitizeHtml(content);
    const sanitizedHashtags = Array.isArray(hashtags) ? hashtags.map(tag => sanitizeHtml(tag)) : [];
    const sanitizedPublic = Boolean(public);
    
    try {
        passport.authenticate('jwt', { session: false }, async (err, user) => {
            if (err || !user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const blog = await Blog.findOne({ 'posts._id': id, 'author': user._id });
            if (!blog) {
                return res.status(404).json({ message: 'Post not found or unauthorized' });
            }

            const postToUpdate = blog.posts.id(id);
            if (!postToUpdate) {
                return res.status(404).json({ message: 'Post not found' });
            }

            postToUpdate.title = sanitizedTitle;
            postToUpdate.content = sanitizedContent;
            postToUpdate.hashtags = sanitizedHashtags;
            postToUpdate.public = sanitizedPublic;

            await blog.save();

            const sanitizedUpdatedPost = {
                title: sanitizedTitle,
                content: sanitizedContent,
                hashtags: sanitizedHashtags,
                public: sanitizedPublic,
            };

            res.status(200).json({ message: 'Post updated successfully', updatedPost: sanitizedUpdatedPost });
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

    sanitizedUsername = sanitizeHtml(username);
    sanitizedtext = sanitizeHtml(text);

    passport.authenticate('jwt', { session: false }, async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        try {
            const post = await Blog.findOneAndUpdate(
                { 'posts._id': id }, 
                { $push: { 'posts.$.comments': { username: sanitizedUsername, text: sanitizedtext, timestamp: new Date() } } },
                { new: true }
            );

            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }
            
            console.log('Posted comment', sanitizedtext, 'by', sanitizedUsername)
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

    const sanitizedUsername = sanitizeHtml(username);
    const sanitizedTitle = sanitizeHtml(title);
    
    console.log('DELETE REQUEST RECIEVED. PROCESSING', id, sanitizedUsername, sanitizedTitle)

    passport.authenticate('jwt', { session: false }, async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        try {
            const blog = await Blog.findOne({ 'posts._id': id, 'author': user._id });
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

