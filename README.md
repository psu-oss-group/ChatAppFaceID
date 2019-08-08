# ChatAppFaceID
Copyright (c) 2019 psu-oss-group

ChatAppFaceID is a web chat (or Bulletin Board System) that allow user exchanging messages with other users through chat room ( or public message board). Each user has two options to log into the chat room. They can either log in by using their google account or using the smiling facial recognition. 

+ Log in by Google Account
    * When the user succesfully logs in by using his/her google account, they will see their ```Google profile photo, ID, username, and email address```. Then, they can join the chat room by clicking ```Home``` in the navigation bar. 
    *  You should see your name in the ```Online Users``` box and the ```Hello, "your name" ```. You can begin to chat. 

+ Log in by Smiling Facial Recognition
    * When this feature is chosen, the live webcame is turned on. It will only allow you to login when it catches your smiling face.
    * When you click on ```Acccount``` in the nav bar, it will not display anything.

## Project Participants
* Kim Ma
* Ronnie Song
* Weiwei Chen

## Links
* [GitHub Page](https://psu-oss-group.github.io/ChatAppFaceID/)
* [Repository](https://github.com/psu-oss-group)

## Tech stack, Pre-reqs and setup
In the dependencies of your package.json should have Nodejs, express, Socket.io, OpenCV, passport, and passport-google-oauth.

## Build
```shell
$ git clone https://github.com/psu-oss-group/ChatAppFaceID.git
$ cd ChatAppFaceID
$ npm install

```
## Run
```shell
$ node server.js
```
Go to: [localhost:3000/](http://localhost:3000/)

## References
//TODO

## License

This program is licensed under the "MIT License".  Please
see the file [`LICENSE`](https://github.com/psu-oss-group/ChatAppFaceID/blob/master/LICENSE) in the source distribution of this
software for license terms.
