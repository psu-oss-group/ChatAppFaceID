var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
var authConfig = require('./config/auth')
var passport = require('passport')
var bodyParser = require('body-parser')
var session = require('express-session');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var port = process.env.PORT || 3000

connections = [];
users = [];

//app.set('views', './');
app.set('view engine', 'hbs');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new GoogleStrategy(
    authConfig.google,
    function(accessToken, refreshToken, profile, done) {
        return done(null, profile);
    }
));


app.get('/',function(req,res){
    res.render('/', {
       user: req.user
    });
});

app.get('/login', function(req, res) {
    res.render('login', {
      user: req.user
    });
  });

  app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['openid', 'email', 'profile']
}));

app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    res.redirect('/account');
  });

app.get('/account', ensureAuthenticated, function(req, res) {
  res.render('account', {
    user: req.user
  });
});

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated() && req.user.emails[0].value=="ronniesong0809@gmail.com"){
      console.log("Welcome "+ req.user.displayName)
      console.log(req.user.emails[0].value)
      return next();
    }else{
      console.log("You are not admin")
      req.logout();
      res.redirect('/login');
    }
  }

 //listen on the connection event
io.on('connection', function(socket){
    connections.push(socket);
    console.log('a user connected' + connections.length);

    socket.on('disconnect', function(data){
        users.splice(users.indexOf(socket.username),1);

        connections.splice(connections.indexOf(socket),1);
        console.log('disconnected',connections.length)
    });

     // new user
     socket.on('new user', function(data, callback) {
        callback(true);
        socket.username = data;
        console.log('data username' + socket.username);
        users.push(socket.username);
        updateUsers();
    });

    socket.on('send message', function(data){
        console.log('server' + data);
        io.sockets.emit('new message', {msg:data, name:socket.username });
    });

    function updateUsers() {
        io.sockets.emit('get users', users);
    }

});

server.listen(port, function(){
    console.log('Listening on http://localhost:'+`${port}`)
});