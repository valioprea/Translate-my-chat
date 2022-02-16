//FRONT END JAVASCRIPT
const socket = io();

const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');

//Get username and room from URL
const {username, room} = Qs.parse(location.search, {
   ignoreQueryPrefix: true
})

//Join chatroom
socket.emit('joinRoom', {username, room});

//Get room and users
socket.on('roomUsers', ({ room, users}) => {
   outputRoomName(room);
   outputUsers(users);
});

//Message from server
socket.on('message', message => {
   console.log(message);
   outputMessage(message);

   //we wanna scroll down
   chatMessages.scrollTop = chatMessages.scrollHeight;
});

//message submit
chatForm.addEventListener('submit', (e) => {
   e.preventDefault();

   //IN WHICH LANGUAGE DO I WANT TO WRITE ?
   let select = document.getElementById('language');
   let selectedLanguage = select.options[select.selectedIndex].value;
   //IN WHICH LANGUAGE DO I WANT TO WRITE ?

   //Get message text from DOM
   const msg = e.target.elements.msg.value;

   //Emit message to server
   socket.emit('chatMessage', {msg, 'extra': selectedLanguage});

   //Clear input
   e.target.elements.msg.value = '';
   e.target.elements.msg.focus();
})

//Output message TO DOM
function outputMessage(message) {
   const div = document.createElement('div');
   div.classList.add('message');
   div.innerHTML = `<p class="meta">${message.username}<span>${message.time}</span></p>
   <p class="text">
     ${message.text}
   </p>`;
   document.querySelector('.chat-messages').appendChild(div);
}

//Add room name to DOM
function outputRoomName(room) {
   roomName.innerText = room;
}

//Add users to DOM
function outputUsers(users) {
   userList.innerHTML = `
      ${users.map( user => `<li>${user.username}</li>`).join('')}
   `;
}