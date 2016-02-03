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
	 * All the users by names.
	 *
	 * @type {Object}
	 * @private
	 */
	this.userNames = {};
	
	/**
	 * All the users by id.
	 *
	 * @type {Object}
	 * @private
	 */
	this.userIds = {};
	
	/**
	 * All the users who listen the chans.
	 *
	 * @type {Object}
	 * @private
	 */
	this.userListenChansIds = [];
	
	/**
	 * All the chans by names.
	 *
	 * @type {Object}
	 * @private
	 */
	this.chans = {};
		
	/**
	 * Debug function.
	 *
	 * @type {Function}
	 * @private
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
 * Add a socket to the server: create a user associate to the socket.
 *
 * @param {WebSocketServer} socket
 * @api public
 */
Server.prototype.add = function (socket) {
	
	// Create User
	var u = new User(socket);
	u.data.name = config.user.default.name + ((User.id > 0) ? (User.id) : "");
	
	this._onDebug("connected", u);
	
	// Ad user in user list
	this.userNames[u.data.name.toLowerCase()] = u;
	this.userIds[u.data.id] = u;
	
	// Inform user of his datas
	this.sendUserData(u, u.data, u);
	
	// Join the default chan
	this._joinChan(u, config.chan.start.name, "");
	
	// Add the socket listeners
	var server = this;
	socket.on("message", function incoming(data, flags) {
		server._parse(u, data);
	});

	socket.on("close", function close() {
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
 * Check if this name exist.
 *
 * @param {string} name
 * @return {boolean}
 * @api public
 */
Server.prototype.hasUserName = function (name) {
	
	return (this.getUserByName(name) !== undefined);
};

/**
 * Check if the name is valid.
 *
 * @param {string} name
 * @return {boolean}
 * @api public
 */
Server.prototype.isValidName = function (name) {
	
	//var reg = new RegExp("^[_A-Za-z0-9-]+$");
	//return name.match(reg) && name.length > 2 &&  name.length < 11;
	var reg = new RegExp("^[_A-Za-z0-9-]{3,10}$");
	return name.match(reg);
};

/**
 * Get a user by his name.
 *
 * @param {string} name
 * @return {User}
 * @api public
 */
Server.prototype.getUserByName = function (name) {
	
	return this.userNames[name.toLowerCase()];
};

/**
 * Get a user by his name.
 *
 * @param {number} id
 * @return {User}
 * @api public
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
 * Send a server message to a User.
 *
 * @param {User|User[]} user - The receiver of the message
 * @param {number} id - ID of the message
 * @param {string[]=} vars - Optionnal additionnal informations
 * @api public
 */
Server.prototype.sendServerMsg = function (user, id, vars) {
	
	if (vars === undefined)
		vars = [];
	
	this.sendServerEvt(user, "msg", {id: id, vars: vars});
};

/**
 * Send an event for the chan.
 *
 * @param {User|User[]} user - User who send the event
 * @param {string} label - Label of the chan event
 * @param {Object=} data - datas of the chan event
 * @api public
 */
Server.prototype._parseChanEvt = function (user, label, data) {
	
	var d = {label: label};
	
	switch (label) {
			
		/*case "chan-added" :
			
			break;
		case "chan-removed" :
			
			break;*/
		default :
			
			if (data !== undefined)
				d.data = data;
	}
	
	var str = JSON.stringify({chanEvt: d});
	this._send(user, str);
};

/**
 * Parse and (not for all) send an user event to all the chan.
 *
 * @param {User} user - User who have the event
 * @param {string} label - Label of the user event
 * @param {Object=} data - datas of the user event
 * @api public
 */
Server.prototype._parseUserEvt = function(user, label, data) {
	
	var d = {from: user.data.id, label: label};
	
	switch (label) {
			
		case "chan-listen" :
			
			if (Boolean(data)) {
					
				//to.data.listenChans = true;
				this.userListenChansIds[user.data.id] = user;
				this.sendServerEvt(user, "chan-list");

			} else {

				delete(this.userListenChansIds[user.data.id]);
			}
			
			return;
			
			break;
			
		default :
			
			if (data !== undefined)
				d.data = data;
	}
	
	var str = JSON.stringify({userEvt: d});
	this._send(user.chan.users, str);
};
	
/**
 * @param {User|User[]]=} users - User(s) who receive the data.
 *
 * @param {string} label - The command label
 * @param {Object=} data - Optionnal datas
 * @api public
 */
Server.prototype.sendServerEvt = function(user, label, data) {
	
	var d = {label: label};
	
	switch (label) {
			
		/*case "user-connected" :
			
			break;
		case "user-left" :
			
			toChan = true;
			break;
		case "user-offline" :
			
			toChan = true;
			break;*/
			
		/*case "chan-list" :
			
			break;*/
			
		case "chan-list" :
			
			var list = [];
			for (var key in this.chans) {
				list.push(this.chans[key].data.name);
			}
			
			d.data = list;
			
			break;
			
		case "error" :
			
			d.data = data;
			break;
			
		case "msg" :
			
			d.data = data;
			break;
			
		default :
			
			if (data !== undefined)
				d.data = data;
			
			this._onDebug("unknow serverEvent: " + label);
			
	}
	
	// Send the evt to user only or all the chan
	var msg = JSON.stringify({serverEvt: d});
	this._send(user, msg);
};

/**
 * Send an error to a User.
 *
 * @param {User} user - The receiver of the error
 * @param {number} id - ID of the error
 * @param {string[]=} vars - Optionnal additionnal informations
 * @api public
 */
Server.prototype.sendError = function(user, id, vars) {
	
	if (vars === undefined)
		vars = [];
	
	this.sendServerEvt(user, "error", {id: id, vars: vars});
};

/**
 * A user send a message to all the chan.
 *
 * @param {User} from - The emiter of the message
 * @param {string} msg - The message of the user
 * @api public
 */
Server.prototype.sendChanMsg = function(from, msg) {
	
	var chan = from.chan;
	var data = {chanMsg: {from: from.data.id, text: msg}};
	
	var str = JSON.stringify(data);
	this._send(chan.users, str);
};

/**
 * A user send a message to an other user.
 *
 * @param {string} msg - The message of the user
 * @param {User} from - The emiter of the message
 * @param {User} to - The recipient id of the message
 * @api public
 */
Server.prototype.sendUserMsg = function(msg, from, to) {
	
	var data = {userMsg : {from: from.data.id, text: msg}};
	this._send(to, JSON.stringify(data));
};

/**
 * Send user datas to all the chan or only a user.
 *
 * @param {Object} data - Object with datas
 * @param {User} from - The emiter of the datas
 * @param {User|User[]} to - The recipient(s) of the datas
 * @api public
 */
Server.prototype.sendUserData = function(from, data, to) {
	
	// Add ID to trace User in client
	data.id = from.data.id;
	
	var d = {userData: data};
	var str = JSON.stringify(d);
		
	this._send(to, str);	
};

/**
 * Send chan datas to all the chan.
 *
 * @param {Chan} chan - chan that is changed
 * @param {Object} data - Object with datas
 * @param {User|User[]=} user - Target(s) of the datas 
 * @api public
 */
Server.prototype.sendChanData = function(chan, data, user) {
	
	data.id = chan.data.id;
	var d = {chanData: data};
	var str = JSON.stringify(d);
	
	this._send(user, str);
};

/**
 * Send all user list on the chan.
 *
 * @param {Chan} chan - chan
 * @param {User|User[]} user - User(s) who received the datas
 * @api public
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


/*
		┌───────────────────────────┐
		│							│
		│		   SETTER			│
		│							│
		└───────────────────────────┘
*/

/**
 * Set user datas.
 *
 * @param {User} user - user who changed the datas
 * @param {Object} data - Object with new datas
 * @api public
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
					
					to.data.name = new String(data[key]);
					
				} else {
					
					delete(data[key]);
				}
					
			// Change his role (unauthorized)
			} else if (key === "role" && to.data.role !== data.role) {

				delete(data[key]);
				this.sendError(by, 302);

			// Join a new chan
			} else if (key === "chan" && to.data.chan.name !== data.chan.name) {

				this._joinChan(to, data.chan.name, data.chan.pass);
				delete(data[key]);

			// Change an other property
			/*} else if (key === "listenChans") {

				if (data.listenChans) {
					
					to.data.listenChans = true;
					this.userListenChansIds[to.data.id] = to;
					this.sendServerEvt(user, "chan-list");
					
				} else {
					
					delete(to.data[key]);
					delete(this.userListenChansIds[to.data.id]);
				}*/

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
						delete(data[key]);
						
						this.sendServerMsg(oldChan.users, 502, [to.data.name, by.data.name]);
						this.sendServerMsg(to, 503, [by.data.name]);
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
	var n = Object.keys(data).length;
	if (n > 1) {
		this.sendUserData(to, data, to.chan.users);
	}
	
};

/**
 * Set chan datas.
 *
 * @param {User} user - user who try to change chan datas
 * @param {Object} data - Object with datas
 * @api public
 */
Server.prototype.setChanData = function(user, data) {
	
	var key;
	if (user.data.role === "moderator" || user.data.role === "admin") {
		
		for (key in data) {

			if (key === "name") {

				this._changeChanName(new String(data[key]), user);

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
 * Send with websocket.
 *
 * @param {User|User[]} user - User(s) who receive the data
 * @param {string} str - data
 * @private
 */
Server.prototype._send = function (user, str) {
	
	if (Array.isArray(user)) {
	
		var i = user.length;
		
		if (i > 0)
			this._onDebug("	SEND *" + i + "	" + str);
		
		while (--i > -1) {
			
			try {

				user[i].socket.send(str);

			} catch (e) {

				this._close(user[i]);
			}
		}
		
	} else {
		
		this._onDebug("	SEND	" + str);
		
		try {
		
			user.socket.send(str);

		} catch (e) {

			this._close(user);
		}
	}
}

/**
 * Close connection with a user.
 *
 * @param {User} user - User who is disconected
 * @private
 */
Server.prototype._close = function (user) {
	
	this._onDebug("disconected", user)
	
	var name = user.data.name;
	delete(this.userNames[name.toLowerCase()]);
	delete(this.userIds[user.data.id]);
	
	// exist
	if (this.userListenChansIds[user.data.id] !== undefined)
		delete(this.userListenChansIds[user.data.id]);
	
	var chan = user.chan;
	if (chan !== null) {
		
		// todo
		chan.leave(user);
		chan.update();
		this.sendUserData(user, user.data, chan.users);
	}	
}

/**
 * Debug message.
 *
 * @private
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
 * Parse received websocket.
 *
 * @param {User} user - User who received the websocket
 * @param {string} data - String content of the data
 * @private
 */
Server.prototype._parse = function(user, data) {
	
	this._onDebug("	PARSE	" + data);
		
	
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
			
			this._parseChanEvt(user.chan.users, d.label, d.data);
			
		} else {
			
			this.sendError(user, 405, [data]);
			
		}
	}
	
	if (msg.userEvt !== undefined) {
		
		var d = msg.userEvt;
		if (d.label !== undefined) {
			
			this._parseUserEvt(user, d.label, d.data);
			
		} else {
			
			this.sendError(user, 308, [data]);
			
		}
	}
};

/**
 * Parse command from client.
 *
 * @param {User} user - User who send the command
 * @param {string} cmd - Command
 * @param {Object} data - Data of the command
 * @private
 */
Server.prototype._command = function(user, cmd, data) {
	
	
	
		
		
	switch (cmd) {

		/*case "get-list-chan":
			
			// todo
			
			break;*/
		case "get-chan-data":

			this.sendChanData(user.chan, user.chan.data, user);
			
			break;
		/*case "kick-user":

			break;*/
		default:

			this.sendError(user, 102, [cmd]);
			
	}
};

/**
 * Try if the user can join the chan.
 *
 * @param {Chan} chan - Chan to join
 * @param {string} pass - Password of the chan (default = "")
 * @param {User} user - User who send the command
 * @returns {Boolean}
 * @private
 */
Server.prototype._canJoinChan = function(chan, pass, user) {
	
	if (chan !== undefined && chan.pass !== pass)
		return false;
	
	return true;
};

/**
 * Join a chan.
 *
 * @param {User} user - User who join the chan
 * @param {String} chanName - Name of the chan
 * @param {string} pass - Password of the chan (default = "")
 * @returns {Boolean}
 * @private
 */
Server.prototype._joinChan = function(user, chanName, pass) {
	
	if (chanName === undefined)
		chanName = config.chan.start.name;
	
	if (pass === undefined)
		pass = "";
	
	var oldChan = user.chan;
	
	var chan = this.chans[chanName.toLowerCase()];
	if (chan == undefined) {
		
		chan = this._createChan(user, chanName, pass);
		if (chan == undefined)
			return false;
	}
	
	if (!this._canJoinChan(chan, pass, user)) {
		
		this.sendError(user, 406, [chan.data.name]);
		return false;
	}
	
	chan.join(user);
	
	// Add the new chan to the user who leave
	this.sendChanData(chan, chan.data, user);
	
	
	// Send the chan change to old chan
	if (oldChan != undefined) {
		
		this.sendUserData(user, user.data, oldChan.users);
	}
	
	// send to all users in the new chan without the new user
	var list = chan.users.slice();
	list.splice(list.indexOf(user), 1);
	this.sendUserData(user, user.data, list);
	
	// send new data for user
	this.sendChanUserList(chan, user);
	
	return true;
};

/**
 * Change a name of the chan.
 *
 * @param {String} newName - New chan name
 * @param {User} user - User who change the chan name
 * @returns {Boolean}
 * @private
 */
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
			
			
			// dispatch to users
			var list = [];
			for(var key in this.userListenChansIds) {
				list.push(this.userListenChansIds[key]);
			}
			this.sendServerEvt(list, "chan-removed", oldName);
			this.sendServerEvt(list, "chan-added", newName);
			
			
			
			return true;
		}
		
		this.sendError(user, 404, [newName]);	
	}
	
	return false;
};

/**
 * Change a name of the user.
 *
 * @param {String} newName - New user name
 * @param {User} user - User who change his name
 * @returns {Boolean}
 * @private
 */
Server.prototype._changeUserName = function(newName, user) {
	
	if (newName === undefined) {
		
		this.sendError(user, 306);
		
	} else if (this.hasUserName(newName)) {
		
		this.sendError(user, 305, [newName]);
		
	} else {
		
		if (this.isValidName(newName)) {

			var oldName = user.data.name;
			
			delete(this.userNames[oldName.toLowerCase()]);
			
			this._onDebug("change his name to: " + newName, user)
			
			user.data.name = newName;
			this.userNames[newName.toLowerCase()] = user;
			
			
			return true;
		}
		
		
		this.sendError(user, 303, [newName]);
	}
	
	return false;
};

/**
 * Create a new chan.
 *
 * @param {User} user - User who create the new chan
 * @param {String} chanName - New chan name
 * @param {String} pass - pass of the new chan (default = "")
 * @returns {Chan|null}
 * @private
 */
Server.prototype._createChan = function(user, chanName, pass) {
	
	if (pass === undefined)
		pass = "";
	
	var chan = this.chans[chanName.toLowerCase()];
	if (chan !== undefined)
		return chan;
	
	if (this.isValidName(chanName)) {
		
		var chan = this.chans[chanName.toLowerCase()] = new Chan(chanName, pass);
		var server = this;
		chan.onEmpty = function() { server._removeChan(chan); };
		
		var list = [];
		for(var key in this.userListenChansIds) {
			list.push(this.userListenChansIds[key]);
		}
		this.sendServerEvt(list, "chan-added", chan.data.name);
		return chan;
	}
	
	this.sendError(user, 404, [chanName]);
	return null;
};

/**
 * Remove a chan.
 *
 * @param {Chan} chan - Chan to remove
 * @private
 */
Server.prototype._removeChan = function(chan) {
	
	chan.onEmpty = undefined;
	delete(this.chans[chan.data.name.toLowerCase()]);
	
	var list = [];
	for(var key in this.userListenChansIds) {
		list.push(this.userListenChansIds[key]);
	}
	this.sendServerEvt(list, "chan-removed", chan.data.name);
};

/**
 * Init the server.
 *
 * @private
 */
Server.prototype._init = function() {

	// Start first chan
	var key;
	var chanName = config.chan.start.name;
	var startChan = new Chan(chanName, "");
	for (key in config.chan.start) {
		startChan.data[key] = config.chan.start[key];
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
