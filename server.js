const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');
const axios = require('axios');
const qs = require('qs');
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const dotenv = require('dotenv').config();

//Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'DoobleChat Bot';

//Run when a client connects
io.on('connection', socket => {

   socket.on('joinRoom', ({username, room}) => {

      const user = userJoin(socket.id, username, room);
      socket.join(user.room);

      //Welcome current user
      socket.emit('message', formatMessage(botName,'Welcome to DoobleChat'));

      //Broadcast when a user connects
      socket.broadcast
         .to(user.room)
         .emit('message', formatMessage(botName,`${user.username} has joined the chat`));

      //Send users and room info
      io.to(user.room).emit('roomUsers', {
         room: user.room,
         users: getRoomUsers(user.room)
      });
   });


   //Listen for chat messages
   socket.on('chatMessage', (object) => {
      message = object.msg;
      language = object.extra;
      const user = getCurrentUser(socket.id);
      const data = qs.stringify({
         'auth_key': process.env.DEEPL_AUTH_KEY_AND_VALUE,
         'text': message,
         'target_lang': language
      })
      
      const config = {
         method: 'POST',
         url: 'https://api-free.deepl.com/v2/translate',
         headers: {
            'process.env.DEEPL_AUTH_KEY': '',
            'Content-Type': 'application/x-www-form-urlencoded'
         },
         data: data
      }
      axios(config)
      .then( function (response) {
         translatedMessage = JSON.stringify(response.data.translations[0].text);
         io.to(user.room).emit('message', formatMessage(user.username, translatedMessage));
      })
      .catch(function (error) {
         if (error.response) {
         // Request made and server responded
         console.log(error.response.data);
         console.log(error.response.status);
         console.log(error.response.headers);
         } else if (error.request) {
         // The request was made but no response was received
         console.log('Req made but no response', error.request);
         } else {
         // Something happened in setting up the request that triggered an Error
         console.log('ARGH, not again!', error.message);
         }
      });
   })

   //runs when client disconnects
   socket.on('disconnect', ()=> {

      const user = userLeave(socket.id);
      if(user) {
         io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat`));
      }
      //Send users and room info
      io.to(user.room).emit('roomUsers', {
         room: user.room,
         users: getRoomUsers(user.room)
      });
   });
});


const PORT = 5000 || process.env.PORT;
server.listen(PORT, () => {
   console.log(`Server is serving on port ${PORT}`)
})