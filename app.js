const createError = require('http-errors');
const cors = require('cors');
const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('./utils/passport.js');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config();

// Routes
const index = require('./routes/index');
const auth = require('./routes/auth');
const users = require('./routes/user');

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Trust proxy servers
app.set('trust proxy', 1);

// To prevent CORS errors
app.use(cors());

// Set up passport
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true for https in production
      maxAge: 1000 * 60 * 60 * 24,
    }, // Session expires in 24 hours
  }),
);
app.use(passport.session());

// Set user local variable
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Connecting mongoDB
const mongoose = require('./utils/mongodb.js'); //Database

app.use('/', index);
app.use('/', auth);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
