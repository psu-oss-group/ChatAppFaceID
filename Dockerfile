FROM node:latest
LABEL maintainer="ronniesong0809@gmail.com"
RUN apt-get update
RUN apt-get install -y cmake fswebcam
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD [ "node", "server.js" ]
