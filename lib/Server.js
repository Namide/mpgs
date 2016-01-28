'use strict';

/*!
 * mpgs
 * Copyright(c) 2016 Damien Doussaud (namide.com)
 * MIT Licensed
 */

var User = require('./User');
var Chan = require('./Chan');

var config = require('./../config');

/**
 * The Server class is a manager for users, chan and socket
 * @constructor
 */
function Server() {

	/**
	 * All the users by names
	 * @type {object}
	 */
	this.userNames = {};
	
	/**
	 * All the users by id
	 * @type {object}
	 */
	this.userIds = {};
	
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
	
	/**
	 * Debug function
	 */
	this._onDebug;
	
	// create first chan and add to chan list
	this._init();
}


/*
		┌───────────────────────────┐
		│							│
		│			INIT			│
		│							│
		└───────────────────────────┘
*/

/**
 * Add a socket to the server: create a user associate to the socket
 * @param {WebSocketServer} socket
 */
Server.prototype.add = function (socket) {
	
	// Create User
	var u = new User(socket, this.userId);
	this.userId++;
	u.data.name = config.defaultUser.data.name + ((this.userId > 0) ? (this.userId) : "");
	
	// Ad user in user list
	this.userNames[u.data.name.toLowerCase()] = u;
	this.userIds[u.data.id] = u;
	
	// Join the default chan
	this._joinChan(u, config.startChan.data.name, "");
	
	/**
	 * Trace a message
	 * @param {string} msg - Message
	 * @param {User=} user - Optional, if you debug a user info 
	 */
	this._onDebug("connected", u);
	
	
	// Add the socket listeners
	var server = this;
	socket.on("message", function incoming(data, flags) {
		server._parse(u, data);
	});

	socket.on('close', function close() {
		server._close(u);
	});
};


/*
		┌───────────────────────────┐
		│							│
		│		   HELPERS			│
		│							│
		└───────────────────────────┘
*/

/**
 * Check if this name exist
 * @param {string} name
 * @return {boolean}
 */
Server.prototype.hasUserName = function (name) {
	
	return (this.getUserByName(name) !== undefined);
};

/**
 * Check if the name is valid
 * @param {string} name
 * @return {boolean}
 */
Server.prototype.isValidName = function (name) {
	
	var reg = new RegExp("^[_A-Za-z0-9-]+$");
	return name.match(reg);
};

/**
 * Get a user by his name
 * @param {string} name
 * @return {User}
 */
Server.prototype.getUserByName = function (name) {
	
	return this.userNames[name.toLowerCase()];
};

/**
 * Get a user by his name
 * @param {number} id
 * @return {User}
 */
Server.prototype.getUserById = function (id) {
	
	return this.userIds[id];
};

/*
		┌───────────────────────────┐
		│							│
		│			SEND			│
		│							│
		└───────────────────────────┘
*/

/**
 * Send a message by the server
 * @param {string} msg - The message of the server
 * @param {User|User[]} toUser - The emiter(s) of the message
 */
Server.prototype.sendServerMsg = function(msg, toUser) {
	
	var str = JSON.stringify({serverMsg : msg});
	this._send(toUser, str);
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
			
		/*case "user-chan-change" :
			
			d.data = {user: user.data, chan: user.chan.data};
			break;*/
			
		default :
			
			if (data !== undefined)
				d.data = data;
	}
	
	var str = JSON.stringify({chanEvt: d});
	this._send(user.chan.users, str);
};

/**
 * Send an user event to all the chan
 * @param {User} user - User who have the event
 * @param {string} label - Label of the user event
 * @param {Object=} data - datas of the user event
 */
Server.prototype.sendUserEvt = function(user, label, data) {
	
	var d = {from: user.data.id, label: label};
	
	switch (label) {
			
		/*case "user-chan-change" :
			
			d.data = {user: user.data, chan: user.chan.data};
			break;*/
			
		default :
			
			if (data !== undefined)
				d.data = data;
	}
	
	var str = JSON.stringify({userEvt: d});
	this._send(user.chan.users, str);
};
	
/**
 * @param {User|User[]]=} users - User(s) who receive the data
 * @param {string} label - The command label
 * @param {Object=} data - Optionnal datas
 */
Server.prototype.sendServerEvt = function(user, label, data) {
	
	var d = {label: label};
	
	switch (label) {
			
		/*case "user-connected" :
			
			d.data = user.data;
			break;
		case "user-left" :
			
			d.data = user.data.name;
			toChan = true;
			break;
		case "user-offline" :
			
			d.data = user.data;
			toChan = true;
			break;*/
			
		case "error" :
			
			d.data = data;
			break;
			
		default :
			
			if (data !== undefined)
				d.data = data;
			
			this._onDebug("unknow serverEvent: " + label + " for " + user.data.name);
			
	}
	
	// Send the evt to user only or all the chan
	var msg = JSON.stringify({serverEvt: d});
	this._send(user, msg);
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
	
	this.sendServerEvt(user, "error", {id: id, vars: vars});
};

/**
 * A user send a message to all the chan
 * @param {User} from - The emiter of the message
 * @param {string} msg - The message of the user
 */
Server.prototype.sendChanMsg = function(from, msg) {
	
	var chan = from.chan;
	var data = {chanMsg: {from: from.data.id, text: msg}};
	
	var str = JSON.stringify(data);
	this._send(chan.users, str);
};

/**
 * A user send a message to an other user
 * @param {string} msg - The message of the user
 * @param {User} from - The emiter of the message
 * @param {User} to - The recipient id of the message
 */
Server.prototype.sendUserMsg = function(msg, from, to) {
	
	var data = {userMsg : {from: from.data.id, text: msg}};
	this._send(to, JSON.stringify(data));
};

/**
 * Send user datas to all the chan or only a user
 * @param {object} data - Object with datas
 * @param {User} from - The emiter of the datas
 * @param {User|User[]} to - The recipient(s) of the datas
 */
Server.prototype.sendUserData = function(from, data, to) {
	
	// Add ID to trace User in client
	data.id = from.data.id;
	
	var d = {userData: data};
	var str = JSON.stringify(d);
	console.log(str);
		
	this._send(to, str);	
};

/**
 * Send chan datas to all the chan
 * @param {Chan} chan - chan that is changed
 * @param {object} data - Object with datas
 * @param {User|User[]=} user - Target(s) of the datas 
 */
Server.prototype.sendChanData = function(chan, data, user) {
	
	data.id = chan.data.id;
	var d = {chanData: data};
	var str = JSON.stringify(d);
	
	this._send(user, str);
};

/**
 * Send all user list on the chan
 * @param {Chan} chan - chan
 * @param {User|User[]} user - User(s) who received the datas
 */
Server.prototype.sendChanUserList = function(chan, user) {
	
	var list = [];
	var users = chan.users;
	var i = users.length;
	while (--i > -1) {
		
		list.push(users[i].data);
	}
		
	
	var d = {chanUserList: list};
	var str = JSON.stringify(d);
	
	this._send(user, str);
};

/**
 * Send all chans name on the server
 * @param {User|User[]} user - Recipient(s) of the data
 */
Server.prototype.sendServerChanList = function(user) {
	
	var list = Object.keys(this.chans);
	var d = {serverChanList: list};
	var str = JSON.stringify(d);
	this._send(user, str);
};
	


/*
		┌───────────────────────────┐
		│							│
		│		   SETTER			│
		│							│
		└───────────────────────────┘
*/

/**
 * Set user datas
 * @param {User} user - user who changed the datas
 * @param {object} data - Object with new datas
 */
Server.prototype.setUserData = function(user, data) {
	
	var key;
	var by = user;
	var to = user;
	if (data.id !== undefined) {
		
		if (data.id != user.data.id)
			to = this.getUserById(data.id);
		
	} else {
		
		data.id = to.data.id;
	}
	
	
	if (by === to) {
		
		for (key in data) {

			// Change his name
			if (key === "name") {

				if (this._changeUserName(data[key], to)) {
					
					to.data.name = data[key];
					
				} else {
					
					delete(data[key]);
					
				}
					

			// Change his role (unathorized)
			} else if (key === "role" && to.data.role !== data.role) {

				delete(data[key]);
				this.sendError(by, 302);

			// Join a new chan
			} else if (key === "chan" && to.data.chan.name !== data.chan.name) {

				if(!this._joinChan(to, data.chan.name, data.chan.pass)) {

				   delete(data[key]);
				}

			// Change an other property
			} else {

				to.data[key] = data[key];
			}
		}
		
	} else {
		
		for (key in data) {

			if (key === "role" && to.data.role !== data.role) {

				if (by.data.role === "moderator" || by.data.role === "admin") {
					
					delete(data[key]);
					this.sendError(by, 309, [to.data.name]);
					
				} else {
					
					to.data.role = data.role;
				}

			// kick a user
			} else if (key === "chan") {

				if (by.data.role === "moderator" || by.data.role === "admin") {
					
					if (data.chan.id !== to.data.chan.id)
					{
						var oldChan = to.chan;
						this._joinChan(to);
						
						this.sendError(oldChan.users, 502, [to.data.name, by.data.name]);
						this.sendError(to, 503, [by.data.name]);
					}
					
				} else {
					
					delete(data[key]);
					this.sendError(by, 311, [to.data.name, to.data.chan.name]);
				}

			// D'ont change other property
			} else if(key !== "id") {

				delete(data[key]);
				this.sendError(by, 310, [key, to.data.name]);
			}
		}
	}
	
	
	// We are more data than just data.id we send datas
	var n = Object.keys(data).length
	if (n > 1) {
		
		this.sendUserData(to, data, to.chan.users);
	}
	
};

/**
 * Set chan datas
 * @param {User} user - user who try to change chan datas
 * @param {object} data - Object with datas
 */
Server.prototype.setChanData = function(user, data) {
	
	var key;
	if (user.data.role === "moderator" || user.data.role === "admin") {
		
		for (key in data) {

			if (key === "name") {

				this._changeChanName(data[key], user);

			} else {

				user.chan.data[key] = data[key];
			}
			
		}
		
		this.sendChanData(user.chan, data, user.chan.users);
		
	} else {
		
		this.sendError(user, 302, [JSON.stringify(data)]);
	}
};


/*
		┌───────────────────────────────┐
		│								│
		│			 PRIVATE			│
		│								│
		└───────────────────────────────┘
*/

/**
 * Send with websocket
 * @param {User|User[]} user - User(s) who receive the data
 * @param {string} str - data
 */
Server.prototype._send = function (user, str) {
	
	if (Array.isArray(user)) {
	
		var i = user.length;
		while (--i > -1) {
			
			try {

				user[i].socket.send(str);

			} catch (e) {

				this._close(user[i]);
			}
		}
		
	} else {
		
		try {
		
			user.socket.send(str);

		} catch (e) {

			this._close(user);
		}
	}
}

/**
 * Close connection with a user
 * @param {User} user - User who is disconected
 */
Server.prototype._close = function (user) {
	
	this._onDebug("disconected", user)
	
	var name = user.data.name;
	delete(this.userNames[name.toLowerCase()]);
	delete(this.userId[user.data.id]);
	
	var chan = user.chan;
	chan.leave(user);
	chan.update();
	
	this.sendUserData(user, user.data, chan.users);
}

/**
 * Debug message
 */
Server.prototype._debug = function () {
	
	var id, key;
	
	console.log("");
	console.log("DEBUG");
	console.log("");
	
	// user list
	console.log("	users: " + Object.keys(this.userNames).length);
	console.log("");
	for(id in this.userIds) {
		
		var u = this.userIds[id];
		console.log("		" + u.data.name + "(" + id + "): " + u.chan.users.length);
	}
	
	// chan list
	console.log("");
	console.log("	chans: " + Object.keys(this.chans).length);
	for(key in this.chans) {
		
		console.log("		" + this.chans[key].data.name+ ": " + this.chans[key].users.length);
	}
	
	console.log("");
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
		
		this._onDebug("Json error : " + e.message, user);
		return;
	}
	
	if (msg === undefined)
		return;
	
	if (msg.userMsg !== undefined) {
		
		var d = msg.userMsg;
		if (d.to !== undefined &&
			d.text !== undefined) {
			
			var toUser = user.chan.getUserById(d.to);
			if (toUser !== undefined) {

				this.sendUserMsg(d.text, user, toUser);
				
			} else {

				this.sendError(user, 301);

			}
			
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
			
			this._command(user, d.label, d.data);
			
		} else {
			
			this.sendError(user, 201, [data]);
			//this.sendServerMsg("Command error: " + data, user);
			
		}
	}
	
	if (msg.chanData !== undefined) {
		
		this.setChanData(user, msg.chanData);
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
			break;
		case "set-chan-pass":
//"newPass"
			if (user.isModerator() || user.isAdmin()) {

				user.chan.pass = data;
				//this.sendChanMsg("The chan pass is now: " + data, user.chan);
			
			} else {

				//this.sendServerMsg("You don't have permission to change the chan pass", user);
				this.sendError(user, 401);
			
			}

			break;*/
		case "get-list-chan":
			
			// todo
			
			break;
		case "get-chan-data":

			this.sendChanData(user.chan, user.chan.data, user);
			
			break;
		/*case "kick-user":

			break;*/
		default:

			//this.sendServerMsg("unknown command " + json.cmd, user);
			this.sendError(user, 102, [cmd]);
			
	}
};

Server.prototype._canJoinChan = function(chan, pass, user) {
	
	if (chan !== undefined && chan.pass !== pass)
		return false;
	
	return true;
};

Server.prototype._joinChan = function(user, chanName, pass) {
	
	if (chanName === undefined)
		chanName = config.startChan.data.name;
	
	var oldChan = user.chan;
	var chan = this.chans[chanName.toLowerCase()];
	
	if (chan === undefined ) {
		
		chan = this._createChan(user, chanName, pass);
		if (chan === undefined)
			return false;
	}
	
	if (!this._canJoinChan(chan, pass, user)) {
		
		this.sendError(user, 406, [chan.data.name]);
		return false;
	}
	
	
	chan.join(user);
	
	
	// Send the chan change to old and new chan
	if (oldChan !== undefined) {
		
		this.sendUserData(user, user.data, oldChan.users);
	}
	
	
	this.sendUserData(user, user.data, chan.users);
	
	// send new data for user
	this.sendUserData(user, user.data, user);
	this.sendChanData(chan, chan.data, user);
	this.sendChanUserList(chan, user);
	
	return true;
};

Server.prototype._changeChanName = function(newName, user) {
	
	if (newName === undefined) {
		
		this.sendError(user, 403);
		
		
	} else if (this.chans[newName.toLowerCase()] !== undefined) {
		
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
		
		this.sendError(user, 404, [newName]);	
	}
	
	return false;
};

Server.prototype._changeUserName = function(newName, user) {
	
	if (newName === undefined) {
		
		this.sendError(user, 306);
		
	} else if (this.hasUserName(newName)) {
		
		this.sendError(user, 305, [newName]);
		
	} else {
		
		if (this.isValidName(newName)) {

			var oldName = user.data.name;
			
			delete(this.userNames[oldName.toLowerCase()]);
			delete(user.chan.users[oldName.toLowerCase()]);
			
			this._onDebug("change his name to: " + newName, user)
			
			user.data.name = newName;
			this.userNames[newName.toLowerCase()] = user;
			user.chan.users[newName.toLowerCase()] = user;
			
			return true;
		}
		
		
		this.sendError(user, 303, [newName]);
	}
	
	return false;
};

Server.prototype._createChan = function(user, chanName, pass) {
	
	if (pass === undefined)
		pass = "";
	
	var chan = this.chans[chanName.toLowerCase()];
	if (chan !== undefined)
		return chan;
	
	if (this.isValidName(chanName)) {
		
		return this.chans[chanName.toLowerCase()] = new Chan(chanName, pass, this.chanId++);
	}
	
	this.sendError(user, 404, [chanName]);
	return null;
};

/**
 * Init the server
 */
Server.prototype._init = function() {

	// Start first chan
	var key;
	var chanName = config.startChan.data.name;
	var startChan = new Chan(chanName, "", this.chanId++);
	for (key in config.startChan.data) {
		startChan.data[key] = config.startChan.data[key];
	}
	
	this.chans[chanName.toLowerCase()] = startChan;
	
	// Active debug mode
	if (config.debug) {
		
		this._onDebug = function(msg, user) {
			
			if (user !== undefined)
				msg = (user.data.name + "(" + user.data.id + ") ") + msg;
			console.log(msg);
		};
		
	} else {
		
		this._onDebug = function(msg, user) { };
	}
		
}

module.exports = Server;
