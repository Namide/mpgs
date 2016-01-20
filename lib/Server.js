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

	this.users = {};
	this.chans = {};
	
	// start chan
	var chanName = config.startChan.data.name;
	var startChan = new Chan(chanName);
	for (var key in config.startChan.data) {
		startChan.data[key] = config.startChan.data[key];
	}
	this.chans[chanName.toLowerCase()] = startChan;
	
	
	this.defaultNameID = 0;
}




Server.prototype.add = function(socket) {
	
	
	
	var u = new User(socket);
	u.data.name = config.defaultUser.data.name + (++this.defaultNameID);
	
	console.log(u.data.name + " connected");
	this.sendServerMsg("You are connected, your name is " + u.data.name, u);
	
	
	this._joinChan(config.startChan.data.name, "", u);
	
	
	
	
	var server = this;
	socket.on("message", function incoming(data, flags) {
		
		server._parse(u, data);
		
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
	this._send(toUser, JSON.stringify(data));
};

Server.prototype.sendChanMsg = function(msg, chan, fromUser) {
	
	/*if (fromUser.data.chan === undefined) {

		this.sendServerMsg("You are not in a chan", fromUser);
		return false;
	}*/

	var data = {msg : {type : "chan", msg : msg}};
	if (fromUser !== undefined)
		data.from = fromUser.data.name;
				
	var str = JSON.stringify(data);

	var users = chan.users;
	var i = users.length;
	while (--i > -1) {
	//for (var i = 0; i < l; i++) {
		//users[i].socket.send(str);
		this._send(users[i], str);
	//}	
	}
	
};

Server.prototype.sendUserMsg = function(msg, fromUser, toName) {
	
	
	var toUser = this.users[toName];
	
	if (toUser !== undefined) {
		
		var data = {msg : {type : "user", msg : msg, from : fromUser.data.name}};
		//toUser.socket.send(JSON.stringify(data));
		this._send(toUser, JSON.stringify(data));
		
	} else {
		
		this.sendServerMsg("The user \"" + toName + "\" don't exist", user);
		
	}
};


/*

		SEND DATAS

*/

Server.prototype.sendUserData = function(data, fromUser, toUser) {
	
	var data = data;
	var str = JSON.stringify(data);
	
	if (toUser === undefined)
	{
		var users = fromUser.data.chan.users;
		var l = users.length;
		for (var i = 0; i < l; i++) {

			//users[i].socket.send(str);
			this._send(users[i], str);
		}
		
	} else {
		
		//toUser.socket.send(str);
		this._send(toUser, str);
	}
		
};

Server.prototype.sendChanData = function(data, fromUser, toUser) {
	
	var data = {chanData : data};
	var str = JSON.stringify(data);
	
	if (toUser === undefined)
	{
		var users = fromUser.data.chan.users;
		var l = users.length;
		for (var i = 0; i < l; i++) {

			//users[i].socket.send(str);
			this._send(users[i], str);
		}
		
	} else {
		
		//toUser.socket.send(str);
		this._send(toUser, str);
	}
};


/*

		SET DATAS

*/

Server.prototype.setUserData = function(data, fromUser) {
	
	for (var key in data) {

		if (key === "name") {
			
			this._changeUserName(data[key], fromUser);
			
		} else if (key === "chan") {
			
			if (typeof data[key] === "string")
				this._joinChan(data[key], "", fromUser);
			else
				this._joinChan(data[key].name, data[key].pass, fromUser);
			
		} else {
			
			fromUser.data[key] = data[key];
		}
	}

	this.sendUserData(data, fromUser);
		
};

Server.prototype.setChanData = function(data, fromUser) {
	
	if (fromUser.isModerator() || fromUser.isAdmin()) {
		
		for (var key in data) {

			if (key === "name") {

				this._changeChanName(data[key], fromUser);

			} else {

				fromUser.data.chan.data[key] = data[key];
			}
			
		}
		
		this.sendChanData(data, fromUser);
		
	} else {
		
		this.sendServerMsg("You don't have permission to change chan data " + JSON.stringify(data), user);
	}
};


/*

		PARSER

*/

Server.prototype._send = function (user, str) {
	
	try {
		
		user.socket.send(str);
		
	} catch (e) {
		
		this._close(user, e.message);
	}
	
}
			
Server.prototype._close = function (user, msg) {
	
	delete(this.users[user.data.name.toLowerCase()]);
	var chan = user.data.chan;
	chan.users.splice(chan.users.indexOf(user), 1);
	chan.update();
	
	//chan.leave(user);
	this.sendChanMsg(user.data.name + " is offline: " + msg, chan);
	//this.sendServerMsg(user.data.name + " is offline: " + msg, user);
	
}			

Server.prototype._parse = function(user, data) {
	
	var msg;
	
	try {
		
		var msg = JSON.parse(data);
		
	} catch(e) {
		
		console.log("JSON ERROR");
		console.log("	" + e.message);
		return;
	}
	
	if (msg === undefined)
		return;
	
	/*
		server : { cmd:$String, data:Object } ,
		userMsg : { name:$UserName, msg:$String } ,
		chanMsg:$String,
		chanEvt : { $datas }
		chanData : { $datas }
		userData : { name:$UserName, data: { $datas } } ,
		userEvt : { name:$UserName, evt: { $datas } }
	*/
	
	if (msg.userMsg !== undefined) {
		
		if (msg.userMsg.name !== undefined && msg.userMsg.msg !== undefined) {
			
			this.sendUserMsg(msg.userMsg.msg, user, msg.userMsg.name);
			
		} else {
			
			this.sendServerMsg("Message to user error: " + data, user);
		}
	}
	
	if (msg.chanMsg !== undefined) {
		
		this.sendChanMsg(msg.chanMsg, user.data.chan, user);
	}
	
	if (msg.server !== undefined) {
		
		if (msg.server.cmd !== undefined && msg.server.data !== undefined) {
			
			this._command(user, msg.server.cmd, msg.server.data);
			
		} else {
			
			this.sendServerMsg("Command error: " + data, user);
			
		}
	}
	
	if (msg.chanData !== undefined) {
		
		this.setChanData(msg.chanData, user);
	}
	
	if (msg.userData !== undefined) {
		
		this.setUserData(msg.userData, user);
	}
	
	if (msg.chanEvt !== undefined) {
		
		// todo
	}
	
	if (msg.userEvt !== undefined) {
		
		// todo
	}
};

Server.prototype._command = function(user, cmd, data) {
	
	
	
		
		
	switch (cmd) {

		/*case "set-user-name":

			this._changeUserName(json.data, user);

			break;*/
		/*case "set-user-chan":

			this._joinChan(json.data.name, json.data.pass, user);

			break;*/
		/*case "set-chan-name":
"newName"
			break;*/
		case "set-chan-pass":
//"newPass"
			if (user.isModerator() || user.isAdmin()) {

				user.data.chan.pass = data;
				this.sendChanMsg("The chan pass is now: " + data, user.data.chan);
			
			} else {

				this.sendServerMsg("You don't have permission to change the chan pass", user);
			}

			break;
		case "get-user-data":
				
			var userTarget = this.users[data.toLowerCase()];
			
			if (userTarget !== undefined) {

				this.sendUserData(userTarget.data, userTarget, user);
				
			} else {

				this.sendServerMsg("The user " + data + " don't exist", user);
			}
			
			break;
		case "get-list-user":

			// todo
			
			break;
		case "get-list-user-data":
			
			// todo
			
			break;
		case "get-list-chan":
			
			// todo
			
			break;
		case "get-list-chan-data":
			
			// todo
			
			break;
		case "get-chan-data":

			this.sendChanData(user.data.chan.data, user, user);
			
			break;
		case "kick-user":

			break;
		default:

			this.sendServerMsg("undefined command " + json.cmd, user);
	}
		
		 
		 

		 
		 

		 
	
};

Server.prototype._joinChan = function(chanName, pass, user) {
	
	var chan = this.chans[chanName.toLowerCase()];
	
	if (chan === undefined ) {
		
		chan = this._createChan(chanName, pass, user);
		if (chan === undefined)
			return false;
	}
	
	chan.join(user);
	/*	this.sendServerMsg("Welcome in the chan: " + chan.data.name, user);
	else
		this.sendServerMsg("You can't access to the chan " + chanName, user);*/
};

Server.prototype._changeChanName = function(newName, user) {
	
	if (newName === undefined) {
		
		this.sendServerMsg("name undefined", user);
		
	} else if (this.chans[newName.toLowerCase()] !== undefined) {
		
		this.sendServerMsg(newName + " is already used", user);
		
	} else {
		
		//var reg = new RegExp("^[A-Za-z0-9_[\]-]$");
		var reg = new RegExp("^[_A-Za-z0-9-]+$");
		if (newName.match(reg)) {

			var chan = user.data.chan;
			var oldName = chan.data.name;
			
			delete(this.chans[oldName.toLowerCase()]);
			
			
			chan.data.name = newName;
			this.chans[newName.toLowerCase()] = chan;
			
			this.sendChanMsg(oldName + " change name is to " + newName, chan);
			
			return true;
		}
		
		
		this.sendServerMsg("You can only use alphanumeric, - and _ in an user name", user);
	
	}
	
	return false;
};

Server.prototype._changeUserName = function(newName, user) {
	
	if (newName === undefined) {
		
		this.sendServerMsg("name undefined", user);
		
	} else if (this.users[newName.toLowerCase()] !== undefined) {
		
		this.sendServerMsg(newName + " is already used", user);
		
	} else {
		
		//var reg = new RegExp("^[A-Za-z0-9_[\]-]$");
		var reg = new RegExp("^[_A-Za-z0-9-]+$");
		if (newName.match(reg)) {

			var oldName = user.data.name;
			
			delete(this.users[oldName.toLowerCase()]);
			delete(user.data.chan.users[oldName.toLowerCase()]);
			
			
			user.data.name = newName;
			this.users[newName.toLowerCase()] = user;
			user.data.chan.users[newName.toLowerCase()] = user;
			
			this.sendChanMsg(oldName + " is now know as " + newName, user.data.chan);
			
			return true;
		}
		
		
		this.sendServerMsg("You can only use alphanumeric, - and _ in an user name", user);
	
	}
	
	return false;
};

Server.prototype._createChan = function(chanName, pass, user) {
	
	if (pass === undefined)
		pass = "";
	
	var chan = this.chans[chanName.toLowerCase()];
	if (chan !== undefined)
		return chan;
	
	//var reg = new RegExp("^[A-Za-z0-9_[\]-]$");
	var reg = new RegExp("^[_A-Za-z0-9-]+$");
	if (chanName.match(reg)) {
		
		return this.chans[chanName.toLowerCase()] = new Chan(chanName, pass);
		
	}
	
	this.sendServerMsg("You can only use alphanumeric, - and _ in a chan name", user);
	return null;
};


/*

		COMMANDS

*/

module.exports = Server;