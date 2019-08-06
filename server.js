var authConfig = require("./config/auth");
var express = require("express");
var passport = require("passport");
var bodyParser = require("body-parser");
var GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
var cv = require("opencv4nodejs");
var cam = require("node-webcam");
var fs = require("fs");

app.set("view engine", "hbs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// var logger = require('morgan');
// var cookieParser = require('cookie-parser');
var session = require("express-session");
var port = process.env.PORT || 3000;

connections = [];
users = [];
temp_user = "anonymous";

// app.use(logger('dev'));
// app.use(cookieParser());
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());
// app.use(express.static(__dirname + '/public'));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(
  new GoogleStrategy(authConfig.google, function(
    accessToken,
    refreshToken,
    profile,
    done
  ) {
    return done(null, profile);
  })
);

app.get("/", function(req, res) {
  res.render("index", {
    user: req.user
  });
});

app.get("/login", function(req, res) {
  res.render("login", {
    user: req.user
  });
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["openid", "email", "profile"]
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login"
  }),
  function(req, res) {
    res.redirect("/account");
  }
);

app.get("/account", ensureAuthenticated, function(req, res) {
  res.render("account", {
    user: req.user
  });
  console.log(req.user)
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/faceID", function(req, res) {
  cam.capture("test_pic1", {}, function(err, data) {
    if (err) throw err;
    console.log(data);

    const mat = new cv.imread("test_pic1.jpg");
    const gray = mat.bgrToGray();

    var result = detect_smile(gray, mat);

    if (result == 0) {
      res.render("faceLogin");
      console.log("No smilling face detected ");
      cv.imwrite("result_NOSMILE.jpg", mat);
      io.on("connection", function(socket) {
        fs.readFile("result_NOSMILE.jpg", function(err, buff) {
          socket.emit(
            "image",
            "data:image/jpg;base64," + buff.toString("base64")
          );
        });
      });
    } else {
      //const outBase64 = cv.imencode(".jpg", result).toString("base64");
      cv.imwrite("result_SMILE.jpg", result);
      res.render("chatroom");
    }

    //FUNCTION to detect smile
    function detect_smile(grayImg, mat) {
      const blue = new cv.Vec(255, 0, 0);
      // detect smile
      const smile = new cv.CascadeClassifier(cv.HAAR_SMILE);
      smiles_Rects = smile.detectMultiScale(grayImg, 1.8, 20).objects; //return the array of smiling object with the rectangular size
      // console.log("SMILE" + smiles_Rects);

      if (smiles_Rects.length <= 0) {
        console.log("LENGTH" + smiles_Rects.length);
        return 0;
      } else {
        mat.drawRectangle(
          new cv.Point(smiles_Rects[0].x, smiles_Rects[0].y),
          new cv.Point(
            smiles_Rects[0].x + smiles_Rects[0].width,
            smiles_Rects[0].y + smiles_Rects[0].height
          ),
          blue,
          cv.LINE_4 // thichkness
        );
        return mat;
      }
    }
  });
});

server.listen(port, function() {
  console.log("Listening on http://localhost:" + `${port}`);
});

// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    console.log("Welcome " + req.user.displayName);
    console.log(req.user.emails[0].value);
    temp_user = req.user.displayName;
    return next();
  } else {
    console.log("Please login with valid user");
    req.logout();
    res.redirect("/login");
  }
}

//listen on the connection event
io.on("connection", function(socket) {
  connections.push(socket);
  socket.username = temp_user;
  users.push(socket.username);
  updateUsers();
  console.log(
    "[" +
      socket.username +
      "] is connected, the connection.length: " +
      connections.length
  );

  socket.on("disconnect", function(data) {
    users.splice(users.indexOf(socket.username), 1);

    connections.splice(connections.indexOf(socket), 1);
    console.log(
      "[" + socket.username + "} is disconnected, the connection.length: ",
      connections.length
    );
  });

  // new user
  //  socket.on('new user', function(data, callback) {
  //     callback(true);
  //     socket.username = data;
  //     console.log('data username' + socket.username);
  //     users.push(socket.username);
  //     updateUsers();
  // });

  socket.on("send message", function(data) {
    console.log("server.message: " + data);
    io.sockets.emit("new message", { msg: data, name: socket.username });
  });

  function updateUsers() {
    io.sockets.emit("get users", users);
  }
});
