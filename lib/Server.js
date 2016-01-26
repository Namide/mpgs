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


/* =======================

		INIT

======================= */

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
	
	this.sendServerEvt(u, "user-connected");
	
	console.log(u.data.name + " connected");
	
	
	// Add the listener
	var server = this;
	socket.on("message", function incoming(data, flags) {
		server._parse(u, data);
	});

	
	// Join the default chan
	this._joinChan(config.startChan.data.name, "", u);
	
	
};


/* =======================

		HELPERS

======================= */

/**
 * Check if this name exist
 * @param {string} name
 * @return {boolean}
 */
Server.prototype.hasUserName = function (name) {
	
	return (this.users[name.toLowerCase()] === undefined);
};

/**
 * Check if the name is valid
 * @param {string} name
 * @return {boolean}
 */
Server.prototype.isValidName = function (name) {
	
	var reg = new RegExp("^[_A-Za-z0-9-]+$");
	return (name.match(reg);
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
		
		this._sendList(toUser, msg);
	
	} else {
		
		this._send(toUser, str);
	}
	
};

/**
 * Send an event for the chan
 * @param {User} user - User who send the event
 * @param {string} label - Label of the chan event
 * @param {Object=} data - datas of the chan event
 */
Server.prototype.sendChanEvt = function(user, label, data) {
	
	var d = {label: label};
	
	switch (label) {
			
		case "user-chan-change" :
			
			d.data = {user: user.data, chan: user.chan.data};
			break;
			
		default :
			
			if (data !== undefined)
				d.data = data;
	}
	
	var msg = JSON.stringify({chanEvt: d});
	this._sendList(user.chan.users, msg);
};

/**
 * Send an event for a user
 * @param {User} user - User who have the event
 * @param {string} label - Label of the user event
 * @param {Object=} data - datas of the user event
 */
Server.prototype.sendChanEvt = function(user, label, data) {
	
	var d = {label: label};
	
	switch (label) {
			
		/*case "user-chan-change" :
			
			d.data = {user: user.data, chan: user.chan.data};
			break;*/
			
		default :
			
			if (data !== undefined)
				d.data = data;
	}
	
	var msg = JSON.stringify({userEvt: d});
	this._sendList(user.chan.users, msg);
};
	
/**
 * Send an event
 * @param {User} user - The emiter of the command
 * @param {string} label - The command label
 * @param {Object=} data - Optionnal datas
 */
Server.prototype.sendServerEvt = function(user, label, data) {
	
	var d = {label: label};
	var toChan = false;
	
	switch (label) {
			
		case "user-connected" :
			
			d.data = user.data;
			break;
		/*case "user-left" :
			
			d.data = user.data.name;
			toChan = true;
			break;
		case "user-offline" :
			
			d.data = user.data;
			toChan = true;
			break;*/
			
		default :
			
			console.lof("unknow serverEvent: " + label);
			
	}
	
	// Send the evt to user only or all the chan
	var msg = JSON.stringify({serverEvt: d});
	if (toChan) {
		
		this._sendList(user.chan.users, msg);
		
	} else {
		
		this._send(user, msg);
	}
	
};

/**
 * Send an error to a User
 * @param {User} user - The receiver of the error
 * @param {number} id - ID of the error
 * @param {string[]=} vars - Optionnal additionnal informations
 */
Server.prototype.sendError = function(user, id, vars) {
	
	if (vars === undefined)
		vars = [];
	
	var d = {label: "error", data: {id: id, vars: vars}};
	var msg = JSON.stringify({serverEvt: d});
	this._send(user, msg);
	
};
/**
 * A user send a message to all the chan
 * @param {User} fromUser - The emiter of the message
 * @param {string} msg - The message of the user
 */
Server.prototype.sendChanMsg = function(fromUser, msg) {
	
	var chan = fromUser.chan;
	var data = {chanMsg: {name: fromUser.data.name, text: msg}};
	var str = JSON.stringify(data);
	
	this._sendList(chan.users, str);
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
		
		var data = {userMsg : {from: fromUser.data.id, text: msg}};
		this._send(toUser, JSON.stringify(data));
		
	} else {
		
		this.sendError(user, 301, [toName]);
		
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
Server.prototype.sendUserData = function(fromUser, data, toUser) {
	
	// Add ID to trace User in client
	data.id = fromUser.data.id;
	
	var d = {userData: data};
	var str = JSON.stringify(d);
		
	if (Array.isArray(toUser)) {
		
		this._sendList(toUser, str);
		
	} else {
		
		this._send(toUser, str);
	}
		
};

/**
 * Send chan datas to all the chan
 * @param {Chan} chan - chan that is changed
 * @param {object} data - Object with datas
 * @param {User=} user - Optional, if you send the datas to only 1 user 
 */
Server.prototype.sendChanData = function(chan, data, user) {
	
	var d = {chanData: data};
	var str = JSON.stringify(d);
	
	if (user === undefined) {
		
		this._sendList(chan.users, str);
		
	} else {
		
		this._send(user, str);
	}
	
	
};

/**
 * Send all user list on the chan
 * @param {Chan} chan - chan
 * @param {boolean=} deep - Optional, if you would a list with all datas of users
 */
Server.prototype.sendChanUserList = function(chan, deep) {
	
	if (deep === undefined)
		deep = false;
		
	var list = [];
	var users = chan.users;
	var i = users.length;
	while (--i > -1) {
		
		list.push( (deep) ? users[i].data : users[i].data.name );
	}
		
	
	var d = {chanUserList: list};
	var str = JSON.stringify(d);
	this._sendList(chan.users, str);
};

/**
 * Send all chan list on the server
 * @param {User|User[]} user - Recipient(s) of the data
 * @param {boolean=} deep - Optional, if you would a list with all datas of chans
 */
Server.prototype.sendServerChanList = function(user, deep) {
	
	if (deep === undefined)
		deep = false;
		
	var list = [];
	var chans = this.chans;
	var key;
	for (key in chans) {
		
		list.push((deep) ? chans[key].data : chans[key].data.name);
	}		
	
	var d = {serverChanList: list};
	var str = JSON.stringify(d);
	
	
	if (Array.isArray(user)) {
		
		this._sendList(user, msg);
		
	} else {
		
		this._send(user, str);
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
Server.prototype.setUserData = function(user, data) {
	
	var key;
	for (key in data) {

		if (key === "name") {
			
			if (this._changeUserName(data[key], user))
				user.data[key] = data[key];
			else
				delete(data[key]);
			
		} else (key === "role" && user.data[key] !== data[key]) {
			
			delete(data[key]);
			this.sendError(user, 302);
		
		} else {
			
			user.data[key] = data[key];
		}
	}

	this.sendUserData(user, data, user.chan.users);
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
		
		this.sendChanData(user.chan, data);
		
	} else {
		
		this.sendError(user, 302, [JSON.stringify(data)]);
			
	}
};


/*

		PRIVATE

*/

/**
 * Send with websocket
 * @param {User} user - User who receive the data
 * @param {string} str - data
 */
Server.prototype._send = function (user, str) {
	
	try {
		
		user.socket.send(str);
		
	} catch (e) {
		
		console.log(user.data.name + " disconected (error: " + e.message + ")");
		
		this._close(user);
	}
	
}

/**
 * Send to multiple user with websocket
 * @param {User[]} users - User list who receive the data
 * @param {string} str - data
 */
Server.prototype._sendList = function (users, str) {
	
	var i = users.length;
	while (--i > -1) {
		this._send(users[i], str);
	}
}


/**
 * Close connection with a user
 * @param {User} user - User who is disconected
 */
Server.prototype._close = function (user) {
	
	var name = user.data.name;
	delete(this.users[name.toLowerCase()]);
	var chan = user.chan;
	chan.users.splice(chan.users.indexOf(user), 1);
	chan.update();
	
	// Send to all the chan
	var d = {chanEvt:	{label: "user-offline", data: {user: user.data, chan: chan.data}}};
	var str = JSON.stringify(d);
	this._sendList(chan.users, msg);
	
}			

/**
 * Parse received websocket
 * @param {User} user - User who received the websocket
 * @param {string} data - String content of the data
 */
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
			
			this.sendError(user, 201, [data]);
			//this.sendServerMsg("Message to user error: " + data, user);
		}
	}
	
	if (msg.chanMsg !== undefined) {
		
		this.sendChanMsg(user, msg.chanMsg);
	}
	
	if (msg.serverCmd !== undefined) {
		
		var d = msg.serverCmd;
		if (d.label !== undefined) {
			
			this._command(user, d.cmd, d.data);
			
		} else {
			
			this.sendError(user, 201, [data]);
			//this.sendServerMsg("Command error: " + data, user);
			
		}
	}
	
	if (msg.chanData !== undefined) {
		
		this.setChanData(msg.chanData, user);
	}
	
	if (msg.userData !== undefined) {
		
		this.setUserData(user, msg.userData);
	}
	
	if (msg.chanEvt !== undefined) {
		
		var d = msg.serverCmd;
		if (d.label !== undefined) {
			
			this.sendChanEvt(user, d.label, d.data);
			
		} else {
			
			this.sendError(user, 405, [data]);
			
		}
	}
	
	if (msg.userEvt !== undefined) {
		
		var d = msg.userEvt;
		if (d.label !== undefined) {
			
			this.sendUserEvt(user, d.label, d.data);
			
		} else {
			
			this.sendError(user, 308, [data]);
			
		}
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

				//this.sendServerMsg("You don't have permission to change the chan pass", user);
				this.sendError(user, 401);
			
			}

			break;
		case "get-user-data":
				
			var userTarget = this.users[data.toLowerCase()];
			
			if (userTarget !== undefined) {

				this.sendUserData(userTarget, userTarget.data, user);
				
			} else {

				//this.sendServerMsg("The user " + data + " don't exist", user);
				this.sendError(user, 301, [data]);
			
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

			this.sendChanData(user.chan, user.chan.data);
			
			break;
		case "kick-user":

			break;
		default:

			//this.sendServerMsg("unknown command " + json.cmd, user);
			this.sendError(user, 102, [cmd]);
			
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
	
	this.sendChanEvt(user, "user-chan-change");
	this.sendChanData(chan, chan.data, user);
	this.sendChanUserList(chan, true);
	
	
	//this.sendChanData(chan.data, chan);
	
	/*	this.sendServerMsg("Welcome in the chan: " + chan.data.name, user);
	else
		this.sendServerMsg("You can't access to the chan " + chanName, user);*/
};

Server.prototype._changeChanName = function(newName, user) {
	
	if (newName === undefined) {
		
		//this.sendServerMsg("name undefined", user);
		this.sendError(user, 403);
		
		
	} else if (this.chans[newName.toLowerCase()] !== undefined) {
		
		//this.sendServerMsg(newName + " is already used", user);
		this.sendError(user, 402, [newName]);
		
	} else {
		
		if (this.isValidName(newName)) {

			var chan = user.chan;
			var oldName = chan.data.name;
			
			delete(this.chans[oldName.toLowerCase()]);
			
			
			chan.data.name = newName;
			this.chans[newName.toLowerCase()] = chan;
			
			return true;
		}
		
		//this.sendServerMsg("You can only use alphanumeric, - and _ in an user name", user);
		this.sendError(user, 404, [newName]);
			
	}
	
	return false;
};

Server.prototype._changeUserName = function(newName, user) {
	
	if (newName === undefined) {
		
		//this.sendServerMsg("name undefined", user);
		this.sendError(user, 306);
		
	} else if (this.hasUserName()) {
		
		//this.sendServerMsg(newName + " is already used", user);
		this.sendError(user, 305);
		
	} else {
		
		if (this.isValidName(newName)) {

			var oldName = user.data.name;
			
			delete(this.users[oldName.toLowerCase()]);
			delete(user.chan.users[oldName.toLowerCase()]);
			
			
			user.data.name = newName;
			this.users[newName.toLowerCase()] = user;
			user.chan.users[newName.toLowerCase()] = user;
			
			return true;
		}
		
		
		this.sendError(user, 303, [newName]);
	}
	
	return false;
};

Server.prototype._createChan = function(chanName, pass, user) {
	
	if (pass === undefined)
		pass = "";
	
	var chan = this.chans[chanName.toLowerCase()];
	if (chan !== undefined)
		return chan;
	
	if (this.isValidName(chanName)) {
		
		return this.chans[chanName.toLowerCase()] = new Chan(chanName, pass);
		
	}
	
	//this.sendServerMsg("You can only use alphanumeric, - and _ in a chan name", user);
	this.sendError(user, 404, [chanName]);
	return null;
};


/*

		COMMANDS

*/

module.exports = Server;