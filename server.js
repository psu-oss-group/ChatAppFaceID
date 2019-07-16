var authConfig = require('./config/auth')
var express = require('express')
var passport = require('passport')
var bodyParser = require('body-parser')
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
var faceapi = require("face-api.js");
var cv = require('opencv4nodejs');
var rectColor = [0, 255, 0];
var rectThickness = 2;
 

app.set('view engine', 'hbs');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

// var logger = require('morgan');
// var cookieParser = require('cookie-parser');
var session = require('express-session');
var port = process.env.PORT || 3000

connections = [];
users = [];
temp_user = "anonymous"

// app.use(logger('dev'));
// app.use(cookieParser());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
// app.use(express.static(__dirname + '/public'));

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

app.get('/', function(req, res) {
  res.render('index', {
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

app.get('/faceID', function(req, res) {
  res.render("faceLogin");

  const webcam = new cv.VideoCapture(0);

  webcam.set(cv.CAP_PROP_FRAME_HEIGHT,300);
  webcam.set(cv.CAP_PROP_FRAME_WIDTH,300);
 
  setInterval(() => {
    const photo = webcam.read(); // return Mat
      const image = cv.imencode('.jpg',photo).toString('base64');
      io.emit('image',image);
      
  },100)
})
    

    
  
  
  //const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);
  
 // faces = classifier.detectMultiScale()
// by nesting callbacks
//cv.imreadAsync('./people.jpg', (err, img) => {
 // if (err) { return console.error(err); }
  //const grayImg = img.bgrToGray();
 //faces = classifier.detectMultiScale(grayImg).objects;

  // for (face in faces) {
  //   console.log(face.objects);
  //   cv.drawDetection(img, [face.x, face.y], [face.width, face.height], rectColor, rectThickness);
    
  // }
  //cv.imshow('i mg',img);
 // cv.imwrite("check.jpg",img.getRegion(faces[0]))
//  return grayImg.getRegion(faces[0]);
//const outBase64 =  cv.imencode('.jpg', img.getRegion(faces[0])).toString('base64'); // Perform base64 encoding
//const htmlImg='<img src=data:image/jpeg;base64,'+outBase64 + '>';
//io.emit('image',outBase64);
//})
   
server.listen(port, function() {
  console.log('Listening on http://localhost:'+`${port}`)
});


// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()){
    console.log("Welcome "+ req.user.displayName)
    console.log(req.user.emails[0].value)
    temp_user = req.user.displayName
    return next();
  }else{
    console.log("Please login with valid user")
    req.logout();
    res.redirect('/login');
  }
}

 //listen on the connection event
io.on('connection', function(socket){
    connections.push(socket);
    socket.username = temp_user
    users.push(socket.username)
    updateUsers();
    console.log('[' + socket.username + '] is connected, the connection.length: ' + connections.length);

    socket.on('disconnect', function(data){
        users.splice(users.indexOf(socket.username),1);

        connections.splice(connections.indexOf(socket),1);
        console.log('[' + socket.username + '} is disconnected, the connection.length: ',connections.length)
    });

    // new user
    //  socket.on('new user', function(data, callback) {
    //     callback(true);
    //     socket.username = data;
    //     console.log('data username' + socket.username);
    //     users.push(socket.username);
    //     updateUsers();
    // });

    socket.on('send message', function(data){
        console.log('server.message: ' + data);
        io.sockets.emit('new message', {msg:data, name:socket.username, color: "blue" });
    });

    function updateUsers() {
        io.sockets.emit('get users', users);
    }

});