var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jquery = require('jquery');
var bcrypt = require("bcrypt");
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');

var username = "cmps369";
var password = "finalproject";
bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(password, salt, function(err, hash) {
        password = hash;
        console.log("Hashed password = " + password);
    });
});

var index = require('./routes/index');
var users = require('./routes/users');
//var update = require('./views/update');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: 'cmps369'}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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

//setting up passport to deal with user authentication

passport.use(new LocalStrategy(
    {
      usernameField: 'username', //name of field to be taken req.body
      passwordField: 'password'	//same here
    },

    function(user, pswd, done) {
        if ( user != username ) {
            console.log("Username mismatch");
            return done(null, false);
        }

        bcrypt.compare(pswd, password, function(err, isMatch) {
            if (err) return done(err);
            if ( !isMatch ) {
                console.log("Password mismatch");
            }
            else {
                console.log("Valid credentials");
            }
            done(null, isMatch);
        });
      }
  ));
passport.serializeUser(function(username, done) {
    
    done(null, username);
});

passport.deserializeUser(function(username, done) {
    
    done(null, username);
});

index.get('/login', function (req, res) {
  res.render('login', {});
});

index.post('/login', 
    passport.authenticate('local', { 
    	successRedirect: '/contacts',
        failureRedirect: '/login-fail'
    })
);

index.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/login');
});
index.get('/login-fail', function (req, res) {
  res.render('login-fail');
});


module.exports = app;
