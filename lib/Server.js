'use strict';

/*!
 * mpgs
 * Copyright(c) 2016 Damien Doussaud (namide.com)
 * MIT Licensed
 */







var User = require('./User');
var Chan = require('./Chan');


/*var config = require('./config');
var chaine;

chaine = fs.readFileSync("fichierEleve", "UTF-8");
var eleve = JSON.parse(chaine);*/

function Server() {

	this.nonames = [];
	
	this.users = {};
	this.chans = {};
	this.chans._ = new Chan();
	
}




Server.prototype.add = function(socket) {
	
	var user = new User(socket);
	
	this.nonames.push(user);
	
	console.log("new user connected");

	var server = this;
	socket.on('message', function incoming(data, flags) {
		
		server.parse(user, data);
		
		//console.log("FLAGS")
		//console.log(flags);
	});

	socket.send('{"msg":"You are connected!"}');
};


/*

		SEND MESSAGES

*/

Server.prototype.sendServerMsg = function(msg, toUser) {
	
	var data = {msg : {type : "server", msg : msg}};
	to.socket.send(JSON.stringify(data));
};

Server.prototype.sendChanMsg = function(msg, fromUser) {
	
	var data = {msg : {type : "chan", msg : msg, from : fromUser.name}};
	var str = JSON.stringify(data);
	
	var users = fromUser.chan.users;
	var l = users.length;
	for (var i = 0; i < l; i++) {
		users[i].socket.send(str);
	}
};

Server.prototype.sendUserMsg = function(msg, fromUser, toName) {
	
	
	var toUser = this.users[toName];
	
	if (toUser !== null) {
		
		var data = {msg : {type : "user", msg : msg, from : fromUser.name}};
		toUser.socket.send(JSON.stringify(data));
		
	} else {
		
		this.sendServerMsg(user, "The user \"" + toName + "\" don't exist");
		
	}
};


/*

		SEND DATAS

*/

Server.prototype.sendUserData = function(data, fromUser) {
	
	var data = {name : fromUser.name, data : data};
	var str = JSON.stringify(data);
	
	var users = fromUser.chan.users;
	var l = users.length;
	for (var i = 0; i < l; i++) {
		users[i].socket.send(str);
	}
};

Server.prototype.sendChanData = function(data, fromUser) {
	
	var data = {chanData : data};
	var str = JSON.stringify(data);
	
	var users = fromUser.chan.users;
	var l = users.length;
	for (var i = 0; i < l; i++) {
		users[i].socket.send(str);
	}
};

/*

		SET DATAS

*/

Server.prototype.setUserData = function(data, fromUser) {
	
	for (key in data) {

		fromUser.data[key] = data[key];
	}

	this.sendUserData(data, fromUser);
		
};

Server.prototype.setChanData = function(data, fromUser) {
	
	if (fromUser.isModerator() || fromUser.isAdmin()) {
		
		for (key in data) {

			fromUser.chan.data[key] = data[key];
		}
		
		this.sendChanData(data, fromUser);
		
	} else {
		
		this.sendServerMsg(user, "You don't have permission to change chan datas " + JSON.stringify(data));
		
	}
};

/*

		PARSER

*/

Server.prototype.parse = function(user, data) {
	
	var msg;
	
	try {
		
		var msg = JSON.parse(data);
		
	} catch(e) {
		
		console.log("JSON ERROR");
		console.log(e.message);
		return;
	}
	
	if (msg === null)
		return;
	
	if (msg.userMsg !== null) {
		
		if (msg.userMsg.name !== null && msg.userMsg.msg !== null) {
			
			this.sendUserMsg(msg.userMsg.msg, user, msg.userMsg.name);
			
		} else {
			
			this.sendServerMsg("Message to user error: " + data);
			
		}
	}
	
	if (msg.chanMsg !== null) {
		
		this.sendChanMsg(msg.chanMsg, user);
	}
	
	if (msg.server !== null) {
		
		if (msg.server.cmd !== null && msg.server.data !== null) {
			
			this.command(user, msg.server.cmd, msg.server.data);
			
		} else {
			
			this.sendServerMsg("Command error: " + data);
			
		}
	}
};

Server.prototype.command = function(user, cmd, data) {
	
	
	
	if (json.cmd !== null) {
		/*switch (json.cmd) {
				
			case "join":

				break;
			case "name":
				
				break;
			case "msg":

				break;
			case "logout":

				break;
			case "logout":

				break;
			default:
				
				
		}*/
	}
};

/*

		COMMANDS

*/

module.exports = Server;