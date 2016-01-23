'use strict';

/*!
 * mpgs
 * Copyright(c) 2016 Damien Doussaud (namide.com)
 * MIT Licensed
 */

var User = require('./User');
var Chan = require('./Chan');
var config = require('./../config');


function Server() {

	/**
	 * All the users by names
	 * @type {object}
	 */
	this.users = {};
	
	/**
	 * All the chans by names
	 * @type {object}
	 */
	this.chans = {};
	
	/**
	 * Number of users who have connected
	 * @type {number}
	 */
	this.userId = 0;
	
	/**
	 * Number of users who have created
	 * @type {number}
	 */
	this.chanId = 0;
	
	// create first chan and add to chan list
	this.initStartChan();
}

/**
 * Create the first chan
 */
Server.prototype.initStartChan = function() {

	var key;
	
	var chanName = config.startChan.data.name;
	var startChan = new Chan(chanName, "", this.chanId++);
	for (key in config.startChan.data) {
		startChan.data[key] = config.startChan.data[key];
	}
	
	this.chans[chanName.toLowerCase()] = startChan;
}

/**
 * Add a socket to the server: create a user associate to the socket
 * @param {WebSocketServer} socket
 */
Server.prototype.add = function (socket) {
	
	// Create User
	var u = new User(socket, this.userId);
	u.data.name = config.defaultUser.data.name + (++this.userId);
	
	// Ad user in user list
	this.users[u.data.name.toLowerCase()] = u;
	
	console.log(u.data.name + " connected");
	
	this.sendServerEvt("user-connected", u);
	
	// Add the listener
	var server = this;
	socket.on("message", function incoming(data, flags) {
		server._parse(u, data);
	});

	
	// Join the default chan
	this._joinChan(config.startChan.data.name, "", u);
	
};

/* =======================

		SEND MESSAGES

======================= */

/**
 * Send a message by the server
 * @param {string} msg - The message of the server
 * @param {User|User[]} toUser - The emiter(s) of the message
 */
Server.prototype.sendServerMsg = function(msg, toUser) {
	
	var str = JSON.stringify({serverMsg : msg});
	
	if (Array.isArray(toUser)) {
		
		var i = toUser.length;
		while (--i > -1) {
			this._send(toUser[i], str);
		}
	} else {
		
		this._send(toUser, str);
	}
	
};

/**
 * Send an event
 * @param {string} label - The command label
 * @param {User} user - The emiter of the command
 */
Server.prototype.sendServerEvt = function(label, user) {
	
	var d = {label: label};
	var toChan = false;
	
	switch (label) {
			
		case "user-join" :
			
			d.data = user.data;
			toChan = true;
			break;
		case "user-connected" :
			
			d.data = user.data;
			break;
		case "user-left" :
			
			d.data = user.data.name;
			toChan = true;
			break;
		case "user-offline" :
			
			d.data = user.data.name;
			toChan = true;
			break;
	}
	
	// Send the evt to user only or all the chan
	var msg = JSON.stringify({serverEvt: d});
	if (toChan) {
		
		var users = user.chan.users;
		var i = users.length;
		while (--i > -1) {
			this._send(users[i], msg);
		}
	} else {
		
		this._send(user, msg);
	}
	
};

/**
 * A user send a message to all the chan
 * @param {string} msg - The message of the user
 * @param {User} fromUser - The emiter of the message
 */
Server.prototype.sendChanMsg = function(msg, fromUser) {
	
	var chan = fromUser.chan;
	var data = {chanMsg: {name: chan.name, text: msg}};
	var str = JSON.stringify(data);
	
	var users = chan.users;
	var i = users.length;
	while (--i > -1) {
		this._send(users[i], str);
	}
	
};

/**
 * A user send a message to an other user
 * @param {string} msg - The message of the user
 * @param {User} fromUser - The emiter of the message
 * @param {string} toName - The name of the recipient of the message
 */
Server.prototype.sendUserMsg = function(msg, fromUser, toName) {
	
	var toUser = this.users[toName.toLowerCase()];
	if (toUser !== undefined) {
		
		var data = {userMsg : {from: fromUser.data.name, text: msg}};
		//toUser.socket.send(JSON.stringify(data));
		this._send(toUser, JSON.stringify(data));
		
	} else {
		
		this.sendServerMsg("The user \"" + toName + "\" don't exist", user);
		
	}
};


/* =======================

		SEND DATA

======================= */

/**
 * Send user datas to all the chan or only a user
 * @param {object} data - Object with datas
 * @param {User} fromUser - The emiter of the datas
 * @param {User|User[]} toUser - The recipient(s) of the datas
 */
Server.prototype.sendUserData = function(data, fromUser, toUser) {
	
	var d = {userData: {name: fromUser.data.name, data: data}};
	var str = JSON.stringify(data);
		
	if (Array.isArray(toUser)) {
		
		var i = toUser.length;
		while (--i > -1) {
			this._send(toUser[i], d);
		}
	} else {
		
		this._send(toUser, d);
	}
		
};

/**
 * Send chan datas to all the chan
 * @param {object} data - Object with datas
 * @param {Chan} chan - chan that is changed
 */
Server.prototype.sendChanData = function(data, chan) {
	
	var d = {chanData: data};
	var str = JSON.stringify(data);
	
	var users = chan.users;
	var i = users.length;
	while (--i > -1) {

		this._send(users[i], str);
	}
};


/* =======================

		SET DATA

======================= */

/**
 * Set user datas
 * @param {object} data - Object with datas
 * @param {User} user - user who is changed
 */
Server.prototype.setUserData = function(data, user) {
	
	var key;
	for (key in data) {

		if (key === "name") {
			
			this._changeUserName(data[key], user);
			
		} else {
			
			user.data[key] = data[key];
		}
	}

	this.sendUserData(data, user, user.chan.users);
};

/**
 * Set chan datas
 * @param {object} data - Object with datas
 * @param {User} user - user who try to change chan datas
 */
Server.prototype.setChanData = function(data, user) {
	
	var key;
	if (user.isModerator() || user.isAdmin()) {
		
		for (key in data) {

			if (key === "name") {

				this._changeChanName(data[key], user);

			} else {

				user.chan.data[key] = data[key];
			}
			
		}
		
		this.sendChanData(data, user.chan);
		
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
	
	var un = user.data.name;
	delete(this.users[un.toLowerCase()]);
	var chan = user.chan;
	chan.users.splice(chan.users.indexOf(user), 1);
	chan.update();
	
	this.sendServerEvt("user-offline", un);
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
	
	if (msg.userMsg !== undefined) {
		
		var d = msg.userMsg;
		if (d.to !== undefined &&
			d.text !== undefined) {
			
			this.sendUserMsg(d.text, user, d.to);
			
		} else {
			
			this.sendServerMsg("Message to user error: " + data, user);
		}
	}
	
	if (msg.chanMsg !== undefined) {
		
		this.sendChanMsg(msg.chanMsg, user);
	}
	
	if (msg.serverCmd !== undefined) {
		
		var d = msg.serverCmd;
		if (d.label !== undefined) {
			
			this._command(user, d.cmd, d.data);
			
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

				user.chan.pass = data;
				//this.sendChanMsg("The chan pass is now: " + data, user.chan);
			
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

			this.sendChanData(user.chan.data, user, user);
			
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
	
	this.sendChanData(chan.data, user, user);
	
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
		
		var reg = new RegExp("^[_A-Za-z0-9-]+$");
		if (newName.match(reg)) {

			var chan = user.chan;
			var oldName = chan.data.name;
			
			delete(this.chans[oldName.toLowerCase()]);
			
			
			chan.data.name = newName;
			this.chans[newName.toLowerCase()] = chan;
			
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
			delete(user.chan.users[oldName.toLowerCase()]);
			
			this.sendUserData({name: newName}, user, user.chan.users);
			
			user.data.name = newName;
			this.users[newName.toLowerCase()] = user;
			user.chan.users[newName.toLowerCase()] = user;
			
			this.sendChanMsg(oldName + " is now know as " + newName, user.chan);
			
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