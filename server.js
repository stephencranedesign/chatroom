var socket_io = require('socket.io');
var http = require('http');
var express = require('express');

var app = express();
app.use(express.static('public'));

var server = http.Server(app);
var io = socket_io(server);

var prevChatSession = [];
var totalUsers = 0;

var uid = 1;

var users = {};

var User = function(socket) {
	this.id = uid;
	uid++;
	this.socket = socket;
	users[this.id] = this;
};

function timeStamp() { return new Date().toLocaleString() }

io.on('connection', function(socket) {
	console.log('Client connected');
	
	var user = new User(socket);
	
	prevChatSession.push({ id: user.id, time: timeStamp(), msg: 'user entered', type: 'notice' });
	totalUsers++;
	
	io.emit('connected', { totalUsers: totalUsers, id: user.id }); // send to all
	socket.broadcast.emit('message', { id: user.id, time: timeStamp(), msg: 'user entered', type: 'notice' }); // all but this socket
	socket.emit('bootstrap', { prevChatSession: prevChatSession, id: user.id }); // only this socket
	
	socket.on('message', function(message) {
		console.log('Received message: ', message);
		prevChatSession.push(message);
		socket.broadcast.emit('message', message);
	});
	
	socket.on('disconnect', function() {
		totalUsers--;
		prevChatSession.push({ id: user.id, time: timeStamp(), msg: 'user exit', type: 'notice' });
		io.emit('disconnected', { totalUsers: totalUsers, id: user.id });
		
		delete users[user.id];
	});
	
	socket.on('nickname::change', function(o) {
		updateNickname(o.id, o.nickname);
		io.emit('nickname::changed', prevChatSession);
	});
	
	socket.on('message::private', function(msg) {
		console.log('Received message: ', msg);
		
		var privateSocket = users[msg.audience].socket;
		privateSocket.emit('message', msg);
	});

});

function updateNickname(id, val) {
	console.log('updateNickname: ', id, val);
	prevChatSession.forEach(function(msg) {
		if(msg.id === id) msg.id = val;
	});
}

server.listen(8080);
console.log('server listening at :8080');