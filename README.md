# Happy Chat

Copyright (c) 2019 psu-oss-group

Happy Chat is a webchat (or Bulletin Board System) that allow authenticated user exchanging messages with other authenticated users through chat room ( or public message board). There are two ways to authenticate: `Login with Google account` or `Login with the facial recognition` that we called it the "FaceID".

- Log in with Google Account
  - User will be redirected to the account page and able see their `Google profile photo, ID, username, and email address` once he/she successfully logs in by using his/her google account.
  - User can join the chat room by clicking either `Start Chat` button or `Home` navlink in the navigation bar.
  - User should see his/her username in the `Online Users` box and the navbar.

- Log in with a Smile (Facial Recognition)
  - User will be captured by the WebCam. It will only allow the user to login if the smile is been detected. The detection is powered by opencv with pre-trained haarcascade.
  - User will be redirected to the chat room, and he/she doesn't have the access to the account page.
  - User will be ask to enter a username, and he/she should see the username in the `Online Users` box and the navbar.

## Project Participants

- Kim Ma
- Ronnie Song
- Weiwei Chen

## Links
- [Live Demo](https://agile-tor-53744.herokuapp.com/)
- [GitHub Page](https://psu-oss-group.github.io/happy-chat/)
- [Repository](https://github.com/psu-oss-group)

## Tech stack

Backend: Nodejs, Express, Socket.io, Opencv4nodejs, Passport.js with passport-google-oauth strategy

Frontend: Handlebarsjs, Ajax, Bootstap, Momentjs, Font Awesome

Deploy: Docker, Heroku

## Pre-reqs, Setup, and Build

Get prerequisites
```shell
$ sudo apt update
$ sudo apt install cmake fswebcam
```

Git clone, and install all modules/dependencies (Opencv4nodejs installation might take longe time)
```shell
$ git clone https://github.com/psu-oss-group/happy-chat.git
$ cd happy-chat
$ npm install

```

Run the server.js
```shell
$ node server.js
```
Go to: [localhost:3000/](http://localhost:3000/)

## Docker (Optional)

With a lightweight, stand-alone docker container, you don't have to worry about complex dependencies or any of the prerequisites.
We made the container, as it allows us to easily deploy our app to anywhere.

Pull the image and list the images info.
```shell
$ docker pull ronniesong0809/chatappfaceid
$ docker images
```
run the docker image by using the image id. Make sure sharing webcam with container by
```shell
$ docker run -p 3000:3000 --device=/dev/video0:/dev/video0 [image_id]
or
$ docker run -p 3001:3000 --privileged -v /dev/video0:/dev/video0 [image_id]
```
Go to: [localhost:3000/](http://localhost:3000/)

## References

- [Documentation | SocketIo](https://socket.io/docs/)
- [Socket.io Chat App Using Websockets | SocketIO](https://www.youtube.com/watch?v=tHbCkikFfDE&amp=&t=1426s)
- [Documentation | Bootstrap](https://getbootstrap.com/docs/4.0/getting-started/introduction/)
- [Documentation | Opencv4nodejs](https://github.com/justadudewhohacks/opencv4nodejs)
- [Face Detection using Haar Cascades | HAAR_CASCADE](https://www.bogotobogo.com/python/OpenCV_Python/python_opencv3_Image_Object_Detection_Face_Detection_Haar_Cascade_Classifiers.php)
- [Google strategy | Passport.js](http://www.passportjs.org/docs/google/)
- [Dockerfile | Docker](https://docs.docker.com/engine/reference/builder/)
- [Deploy with Docker | Heroku](https://devcenter.heroku.com/articles/build-docker-images-heroku-yml)

## License

This program is licensed under the "MIT License". Please
see the file [`LICENSE`](https://github.com/psu-oss-group/ChatAppFaceID/blob/master/LICENSE) in the source distribution of this
software for license terms.
