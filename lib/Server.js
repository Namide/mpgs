'use strict';

/*!
 * mpgs
 * Copyright(c) 2016 Damien Doussaud (namide.com)
 * MIT Licensed
 */







var User = require('./User');
var Chan = require('./Chan');
var config = require('./../config');

/*var config = require('./config');
var chaine;

chaine = fs.readFileSync("fichierEleve", "UTF-8");
var eleve = JSON.parse(chaine);*/

function Server() {

	//this.nonames = [];
	
	this.users = {};
	this.chans = {};
	
	// default chan
	this.chans[config.defaultChanName] = new Chan(config.defaultChanName);
	this.chans[config.defaultChanName].datas.moderationEnabled = false;
	this.chans[config.defaultChanName].datas.max = Infinity;
	
	this.defaultNameID = 0;
	
}




Server.prototype.add = function(socket) {
	
	
	
	var u = new User(socket);
	u.name = config.defaultUserName + (++this.defaultNameID);
	this.sendServerMsg("You are connected, your name is " + u.name, u);
	
	
	this._joinChan(config.defaultChanName, "", u);
	
	
	//this.nonames.push(u);
	
	
	var server = this;
	socket.on("message", function incoming(data, flags) {
		
		server.parse(u, data);
		
		//console.log("FLAGS")
		//console.log(flags);
	});

	//this.sendUserData(u, u.data);
	
};






/*

		SEND MESSAGES

*/

Server.prototype.sendServerMsg = function(msg, toUser) {
	
	var data = {msg : {type : "server", msg : msg}};
	toUser.socket.send(JSON.stringify(data));
};

Server.prototype.sendChanMsg = function(msg, fromUser) {
	
	if (fromUser.chan === undefined) {
	
		this.sendServerMsg("You are not in a chan", fromUser);
		return false;
	}
	
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
	
	if (toUser !== undefined) {
		
		var data = {msg : {type : "user", msg : msg, from : fromUser.name}};
		toUser.socket.send(JSON.stringify(data));
		
	} else {
		
		this.sendServerMsg("The user \"" + toName + "\" don't exist", user);
		
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
		
		this.sendServerMsg("You don't have permission to change chan datas " + JSON.stringify(data), user);
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
	
	if (msg === undefined)
		return;
	
	if (msg.userMsg !== undefined) {
		
		if (msg.userMsg.name !== undefined && msg.userMsg.msg !== undefined) {
			
			this.sendUserMsg(msg.userMsg.msg, user, msg.userMsg.name);
			
		} else {
			
			this.sendServerMsg("Message to user error: " + data, user);
			
		}
	}
	
	if (msg.chanMsg !== undefined) {
		
		this.sendChanMsg(msg.chanMsg, user);
	}
	
	if (msg.server !== undefined) {
		
		if (msg.server.cmd !== undefined && msg.server.data !== undefined) {
			
			this.command(user, msg.server.cmd, msg.server.data);
			
		} else {
			
			this.sendServerMsg("Command error: " + data, user);
			
		}
	}
};

Server.prototype.command = function(user, cmd, data) {
	
	
	
	if (json.cmd !== undefined) {
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

Server.prototype._joinChan = function(chanName, pass, user) {
	
	var chan = this.chans[chanName];
	
	if (chan === undefined ) {
		
		chan = this._createChan(chanName, pass, user);
		if (chan === undefined)
			return false;
	}
	
	chan.join(user);
	this.sendServerMsg("Welcome in the chan: " + chan.name, user);
};

Server.prototype._createChan = function(chanName, pass, user) {
	
	if (pass === undefined)
		pass = "";
	
	var chan = this.chans[chanName];
	if (chan !== undefined)
		return chan;
	
	var reg = new RegExp("^[A-Za-z0-9_[\]-]$");
	
	if (chanName.match(regexp)) {
		
		return this.chans[chanName] = new Chan(chanName, pass);
		
	}
	
	this.sendServerMsg("You can only use alphanumeric, - and _ in a chan name", user);
	return null;
};


/*

		COMMANDS

*/

module.exports = Server;