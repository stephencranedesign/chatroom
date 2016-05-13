$(document).ready(function() {
	var socket = io.connect('https://chat-room-stephenrusselcrane.c9users.io');
	var input = $('#msg');
	var messages = $('#messages');
	var users = $('#users');
	
	var privateMsg = $('#privateMsg');
	var privateAud = $('#private-audience');
	var sendMsg = $('#send-private-message');
	
	sendMsg.on('click', function() {
		var audience = privateAud.val();
		var val = privateMsg.val();
		
		var msg = new Message(val, 'private', audience);
		prevMessages.push(msg);
		addMessage(msg);
		socket.emit('message::private', msg);
		privateAud.val('');
		privateMsg.val('');
		
	});
	
	var Message = function(msg, type, audience) {
		this.time = new Date().toLocaleString();
		this.id = id;
		this.msg = msg;
		this.type = type || 'msg';
		this.audience = audience;
	};
	
	var id;
	
	var prevMessages = [];
	
	var buildMessage = function(o) {
		if(o.type === 'notice') return '<div class="msg"><div div="msg-meta"><div class="msg-author">from: '+o.id+' | </div> <div class="msg-date">date: '+o.time+' | </div><div class="msg-notice"> '+ o.msg +' </div></div></div>';
		return '<div class="msg"><div div="msg-meta"><div class="msg-author">from: '+o.id+' | </div> <div class="msg-date">date: '+o.time+'</div></div>'+ o.msg +'</div>';
	};
	var addMessage = function(o) {
		prevMessages.push(o);
		messages.append(buildMessage(o));
	};

	input.on('keydown', function(event) {
		if(event.keyCode != 13) {
			return;
		}

		var val = input.val();
		var msg = new Message(val);
		prevMessages.push(msg);
		addMessage(msg);
		socket.emit('message', msg);
		input.val('');
	});
	
	input.on('focus', function(e) {
		e.target.className = e.target.className + ' focus';
		socket.emit('userTyping', { id: id });
	});
	
	socket.on('message', function(o) { prevMessages.push(o); addMessage(o); });
	socket.on('connected', function(o) { 
		users.html('totalUsers: ' + o.totalUsers);
	});
	socket.on('disconnected', function(o) {
		var msg = new Message('user exit', 'notice');
		prevMessages.push(msg);
		addMessage(msg); 
		users.html('totalUsers: ' +o.totalUsers);
	});
	
	socket.on('bootstrap', function(o) {
		console.log('bootstrap: ', o);
		prevMessages = o.prevChatSession;
		o.prevChatSession.forEach(function(msg) {
			addMessage(msg);
		});
		id = o.id;
	});
	
	socket.on('nickname::changed', function(o) {
		prevMessages = o;	
		var array = [];
		prevMessages.forEach(function(msg) {
			array.push(buildMessage(msg));
		});
		messages.html(array.join(''));
	});
	
	/* nickname */
	var nickname = $('#nickname');
	nickname.on('keydown', function() {
		if(event.keyCode != 13) {
			return;
		}
		
		var val = nickname.val();
		socket.emit('nickname::change', { id: id, nickname: val });
		id = val;
		nickname.val('');
	});
});