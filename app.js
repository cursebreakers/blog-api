// app.js

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const axios = require('axios');
const asyncHandler = require('express-async-handler');
const passport = require('passport');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const connectDB = require('./controllers/mongo');
require('dotenv').config();

const sessKey = process.env.JWT_SECRET;

const indexRouter = require('./routes/index');

const app = express();

// Run basic network checks
async function networkChecks() {
  console.log('Checking network health...');
  try {
    const response = await axios.get('http://localhost:6969/health');
    if (response.status === 200) {
      console.log('Server: OK');

      // Connect to MongoDB and initialize session store
      const store = await connectDB();
      app.use(
        session({
          secret: sessKey,
          resave: false,
          saveUninitialized: false,
          store: store,
        })
      );
      
      // Initialize Passport middleware after session setup
      app.use(passport.initialize());
      app.use(passport.session());
      
      console.log('MongoDB & sessions: OK')
      console.log('Network checks: OK');

    } else {
      console.log('Network checks: BAD');
    }
  } catch (error) {
    console.error('Error checking network:', error);
  }
}

networkChecks()

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
app.use('/health', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
