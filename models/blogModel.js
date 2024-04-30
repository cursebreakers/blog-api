// Blog schema - blogModel.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the post schema
const postSchema = new Schema({
  title: { type: String, required: true }, // Title of the post
  timestamp: { type: Date, default: Date.now }, // Timestamp of the post
  hashtags: [{ type: String }], // Array of hashtags associated with the post
  content: { type: String, required: true }, // Content/body of the post
  public: { type: Boolean, default: true }, // Public status of the post, default is true
  comments: [{
    username: { type: String, required: true }, // Username of the commenter
    text: { type: String, required: true }, // Comment text
    timestamp: { type: Date, default: Date.now } // Timestamp of the comment
  }] // Array of comments on the post
});

// Define the blog schema
const blogSchema = new Schema({
  title: { type: String, required: true }, // Title of the blog
  category: { type: String }, // Category of the blog (can be a string or array of strings)
  posts: [postSchema], // Array of posts in the blog
  links: [{ type: String }], // Array of URLs to other user web profiles
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User who owns the blog
}, { toJSON: { virtuals: true } });

// Define a virtual field for the blog URL
blogSchema.virtual('url').get(function() {
  return `/profile/${this.author.username}`;
});

postSchema.virtual('url').get(function() {
  return '/posts/' + this._id;
})

// Create and export the Blog model
const Blog = mongoose.model('Blog', blogSchema, 'blogs');

module.exports = Blog;