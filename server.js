var authConfig = require('./config/auth')
var express = require('express')
var passport = require('passport')
var bodyParser = require('body-parser')
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io').listen(server)
var session = require('express-session')
var port = process.env.PORT || 3000
var connections = []
var users = []
var temp_user = 'anonymous'
app.set('view engine', 'hbs')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser(function(user, done) {
  done(null, user)
})

passport.deserializeUser(function(obj, done) {
  done(null, obj)
})

passport.use(new GoogleStrategy(
  authConfig.google,
  function(accessToken, refreshToken, profile, done) {
    return done(null, profile)
  }
))

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html', {
    user: req.user
  })
})

app.get('/login', function(req, res) {
  res.sendFile(__dirname + '/login.html', {
    user: req.user
  })
})

app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['openid', 'email', 'profile']
  }))

app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    res.redirect('/account')
  })

app.get('/account', ensureAuthenticated, function(req, res) {
  res.sendFile(__dirname + '/account.html')
})

app.get('/account1', ensureAuthenticated, function(req, res) {
  res.send(JSON.stringify({user: req.user}))
})

app.get('/logout', function(req, res) {
  req.logout()
  res.redirect('/')
})

server.listen(port, function() {
  console.log('Listening on http://localhost:'+`${port}`)
})

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()){
    console.log('Welcome '+ req.user.displayName)
    console.log(req.user.emails[0].value)
    temp_user = req.user.displayName
    return next()
  }else{
    console.log('Please login with valid user')
    req.logout()
    res.redirect('/login')
  }
}

io.on('connection', function(socket){
  connections.push(socket)
  socket.username = temp_user
  users.push(socket.username)
  updateUsers()
  console.log('[' + socket.username + '] is connected, the connection.length: ' + connections.length)

  socket.on('disconnect', function(data){
    users.splice(users.indexOf(socket.username),1)

    connections.splice(connections.indexOf(socket),1)
    console.log('[' + socket.username + '] with [' + data +'] is disconnected, the connection.length: ',connections.length)
  })

  socket.on('send message', function(data){
    console.log('server.message: ' + data)
    io.sockets.emit('new message', {msg:data, name:socket.username })
  })

  function updateUsers() {
    io.sockets.emit('get users', users)
  }
})