var authConfig = require('./config/auth')
var express = require('express')
var passport = require('passport')
var bodyParser = require('body-parser')
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io').listen(server)
var cv = require('opencv4nodejs')
var cam = require('node-webcam')
var fs = require('fs')

// var logger = require('morgan');
// var cookieParser = require('cookie-parser');
var session = require('express-session')
var port = 3000
var isFace = false
var connections = []
var users = []
var temp_user = ''

app.set('view engine', 'hbs')
app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
// app.use(logger('dev'));
// app.use(cookieParser());
app.use(
    session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: false
    })
)

app.use(passport.initialize())
app.use(passport.session())
app.use(express.static('public'))

passport.serializeUser(function(user, done) {
    done(null, user)
})

passport.deserializeUser(function(obj, done) {
    done(null, obj)
})

passport.use(
    new GoogleStrategy(authConfig.google, function(accessToken, refreshToken, profile, done) {
        return done(null, profile)
    })
)

app.get('/', function(req, res) {
    res.render('index', { user: req.user, face: isFace })
})

app.get('/login', function(req, res) {
    res.render('login', {
        user: req.user
    })
})

app.get('/auth/google', passport.authenticate('google', {
    scope: ['openid', 'email', 'profile']
})
)

app.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/login'
}),function(req, res) {
    res.redirect('/account')
}
)

app.get('/account', ensureAuthenticated, function(req, res) {
    res.render('account', {
        user: req.user
    })
    // console.log(req.user);
})

app.get('/logout', function(req, res) {
    req.logout()
    temp_user = ''
    isFace = false
    res.redirect('/')
})

app.get('/countTime', function(req, res) {
    res.render('countTime')
})

app.get('/test', function(req, res) {
    res.render('test')
})

app.get('/faceID', function(req, res) {
    cam.capture('public/test_pic', {}, function(err) {
        if (err) {
            res.render('faceLoginFailed')
            console.log(err)
            var error = err.stack
            io.on('connection', function(socket) {
                fs.readFile('public/assets/placeholder.jpg', function(err, buff) {
                    socket.emit('imageNotSmile', {
                        image: 'data:image/jpg;base64,' + buff.toString('base64'),
                        message: error
                    }
                    )
                })
            })
        } else {
            detect_smile_helper(req, res, 'faceLoginFailed')
        }
    })
})

app.get('/testResult', function(req, res) {
    detect_smile_helper(req, res, 'faceLoginFailed')
})

app.post('/api/picture', function(req, res) {
    var img = req.body.jpg.replace('data:image/jpeg;base64,','')
    buff = new Buffer(img, 'base64').toString('binary')
    fs.writeFile('public/test_pic.jpg',buff, 'binary', function(err){if(err){console.log(err)}})
})

// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        console.log('Welcome ' + req.user.displayName)
        console.log(req.user.emails[0].value)
        temp_user = req.user.displayName
        return next()
    } else {
        console.log('Please login with valid user')
        req.logout()
        res.redirect('/login')
    }
}

// Wrapper for smile detection
function detect_smile_helper(req, res, rder){
    const mat = new cv.imread('public/test_pic.jpg')
    const gray = mat.bgrToGray()
    cv.imwrite('public/result_GRAY.jpg', gray)
    var result = detect_smile(gray, mat)

    if (result == 0) {
        res.render(rder)
        cv.imwrite('public/result_NOSMILE.jpg', mat)
        io.on('connection', function(socket) {
            fs.readFile('public/result_NOSMILE.jpg', function(err, buff) {
                socket.emit('imageNotSmile', {
                    image: 'data:image/jpg;base64,' + buff.toString('base64'),
                    message: 'Smiles Can Not Be Detected, Let\'s Try Again!'
                }
                )
            })
        })
    } else {
        isFace = true
        cv.imwrite('public/result_SMILE.jpg', result)
        io.on('connection', function(socket) {
            fs.readFile('public/result_SMILE.jpg', function(err, buff) {
                socket.emit('imageSmile', {
                    image: 'data:image/jpg;base64,' + buff.toString('base64'),
                    message: 'Smiles Detected'
                }
                )
            })
        })
        res.redirect('/')
    }
}

// Detect smile function
function detect_smile(grayImg, mat) {
    const blue = new cv.Vec(255, 0, 0)
    // haarcascade trained model
    const smile = new cv.CascadeClassifier(cv.HAAR_SMILE)
    smiles_Rects = smile.detectMultiScale(grayImg, {
        scaleFactor: 1.8,
        minNeighbors: 25,
        minSize: new cv.Size(100, 100),
        maxSize: new cv.Size(300, 300)
    }).objects //return the array of smiling object with the rectangular size
    // console.log("SMILE" + smiles_Rects);

    if (smiles_Rects.length <= 0) {
        console.log('smiles_Rects.length: ' + smiles_Rects.length)
        return 0
    } else {
        for (var i = 0; i < smiles_Rects.length; ++i) {
            mat.drawRectangle(
                new cv.Point(smiles_Rects[i].x, smiles_Rects[i].y),
                new cv.Point(
                    smiles_Rects[i].x + smiles_Rects[i].width,
                    smiles_Rects[i].y + smiles_Rects[i].height
                ),
                blue,
                cv.LINE_4 // thichkness
            )
        }
        return mat
    }
}

//listen on the connection event
io.on('connection', function(socket) {
    if(temp_user != '' || temp_user == null){
        connections.push(socket)
        socket.username = temp_user
        users.push(socket.username)
        updateUsers()
    }

    console.log('[' + socket.username + '] is connected, the connection.length: ' + connections.length)

    socket.on('disconnect', function(data) {
        users.splice(users.indexOf(socket.username), 1)
        connections.splice(connections.indexOf(socket), 1)
        console.log('[' + socket.username + '] is disconnected, the connection.length: ', connections.length)
    })  

    socket.on('send message', function(data) {
        console.log('server.message: ' + data)
        io.sockets.emit('new message', { msg: data, name: socket.username })
    })

    socket.on('change name', function(data) {
        console.log('The username is changed to ' + data)
        users.splice(users.indexOf(socket.username), 1)
        connections.splice(connections.indexOf(socket), 1)
        socket.username = data
        users.push(socket.username)
        updateUsers()
    })

    function updateUsers() {
        io.sockets.emit('get users', users)
    }
})

server.listen(port, function() {
    console.log('Listening on http://localhost:' + `${port}`)
})