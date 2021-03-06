// 'use strict';

/*!
 * mpgs
 * Copyright(c) 2016 Damien Doussaud (namide.com)
 * MIT Licensed
 */


/*
		╔═══════════════════════════╗
		║							║
		║			USER			║
		║							║
		╚═══════════════════════════╝
*/

/**
 * User, datas and listeners
 *
 * @constructor
 */
function MpgUser () {
	
	this.chan;
	this.data = {};
	
	this.onDataNameChange;
	this.onDataChange;
	this.onLeave;
}

/**
 * Check if the user is a moderator.
 * A moderator can kick user of the chan and change chan's datas.
 *
 * @return {boolean}
 */
MpgUser.prototype.isModerator = function () {
	
	return this.data.role === "moderator";
}

/**
 * Check if the user is an admin.
 * An admin have same power than a moderator and more.
 *
 * @return {boolean}
 */
MpgUser.prototype.isAdmin = function () {
	
	return this.data.role === "admin";
}

/*
		╔═══════════════════════════╗
		║							║
		║			CHAN			║
		║							║
		╚═══════════════════════════╝
*/

/**
 * Chan datas and user list of the chan.
 *
 * @constructor
 */
function MpgChan (id) {

	this.users = [];
	this.data = {};	
}


/*
		    ┌───────────────────┐
		    │	Chan helpers	│
		    └───────────────────┘
*/

/**
 * Push a user in the chan.
 *
 * @param {User} user		 User to push in the chan
 * @return {boolean} The user has join the chan
 */
MpgChan.prototype.join = function (user) {
	
	if (user.data.id !== undefined &&
		this._getUserIndexById(user.data.id) < 0) {
		
		this.users.push(user);
		return true;
		
	} else if (user.data.name !== undefined &&
			   this._getUserIndexByName(user.data.name) < 0) {
		
		this.users.push(user);
		return true;
	}
	
	return false;
};

/**
 * Move a User out of the chan.
 *
 * @param {User} user		User to move out of the chan
 * @return {boolean} The user has move out of the chan
 */
MpgChan.prototype.leave = function (user) {
	
	var i = this.users.indexOf(user);
	if (i > -1) {
		
		this.users.splice(i, 1);
		return true;
	}
	
	return false;
};

/**
 * Replace the user list of the chan.
 *
 * @param {User[]} newUsers	List of the new users
 */
MpgChan.prototype.replaceUsers = function (newUsers) {
	
	this.users = newUsers;
};

/**
 * Get a User by his name.
 *
 * @param {string} name		 Name of the user
 * @return {User|null} User with this name or null
 */
MpgChan.prototype.getUserByName = function (name) {
	
	var i = this.users.length;
	while (--i > -1) {
		
		if (this.users[i].data.name === name)
			return this.users[i];
	}
	
	return null;
};

/**
 * Get a user by his id.
 *
 * @param {int} id		 Id of the user
 * @return {User|null} User with this id or null
 */
MpgChan.prototype.getUserById = function (id) {
	
	var i = this.users.length;
	while (--i > -1) {
		
		if (this.users[i].data.id === id)
			return this.users[i];
	}
	
	return null;
};

/**
 * Remove the user by his name.
 *
 * @param {string} name		 Name of the user
 * @return {boolean} The user has been removed
 */
MpgChan.prototype.removeUserByName = function (name) {
	
	var userI = this._getUserIndexByName(name);
	if (userI > -1) {
		
		this.users.splice(userI, 1);
		return true;
	}
	
	return false;
};

/**
 * Remove the user by his id.
 *
 * @param {string} id		 Id of the user
 * @return {booblean} The user has been removed
 */
MpgChan.prototype.removeUserById = function (id) {
	
	var userI = this._getUserIndexById(id);
	if (userI > -1) {
		
		this.users.splice(userI, 1);
		return true;
	}
	
	return false;
};


/*
		    ┌───────────────────┐
		    │	Chan private	│
		    └───────────────────┘
*/

/**
 * @api private
 */
MpgChan.prototype._getUserIndexById = function (id) {
	
	var i = this.users.length;
	while (--i > -1) {
		
		if (this.users[i].data.id === id)
			return i;
	}
	
	return -1;
};

/**
 * @api private
 */
MpgChan.prototype._getUserIndexByName = function (name) {
	
	var i = this.users.length;
	while (--i > -1) {
		
		if (this.users[i].data.name === name)
			return i;
	}
	
	return -1;
};



/*
		╔═══════════════════════════╗
		║							║
		║			CLIENT			║
		║							║
		╚═══════════════════════════╝
*/

/**
 * Manager of the socket connection;
 * Container of users and chan class.
 *
 * @param {string} URI			URI of the socket server (example: ws://host:port/directory)
 * @param {function} onConnected	Called when socket is connected
 * @param {function} onError		Called when an error has occured
 * @param {string} lang			Lang of the client (en, fr...)
 * @constructor
 */
function MpgClient(URI, onConnected, onError, lang) {

	this.me;
	this.chan;
	this.uri = URI;
	this.trad = new MpgTrad(lang);
	
	this.listChans;
	
	this.websocket;
	
	
	
	/*
	
			LISTENER
			
	*/
	
	this.onLog = function(msg) {
		//console.log(msg);
	};
	
	this.onClose = function(msg) {
		//this.onLog("socket closed");
	};
	
	this.onError = function(msg) {
		
		this.onLog(msg);
	};
	
	this.onMsgUser = function(name, msg) {
		
		this.onLog(name + ":" + msg);
	};
	
	this.onChanMsg = function(name, msg) {
		
		if (name === undefined)
			this.onLog(msg);
		else
			this.onLog(name + ":" + msg);
	};
	
	this.onServerMsg = function(msg) {
		this.onLog(msg);
	};
	
	this.onListChan = function(list) {
		this.onLog(list);
	};
	
	this.onUserEvt = function(user, label, data) {
		this.onLog(label);
	};
	
	this.onChanEvt = function(label, data) {
		this.onLog(label);
	};
	
	this.onServerEvt = function(label, data) {
		this.onLog(label);
	};
	
	this.onChanChange = function(chan) {
		
	};
	
	this.onConnected = function(user) {
		//this.onLog(data);
	};
	
	this.onChanDataChange = function(data) {
		//this.onLog(data);
	};
	
	this.onChanUserList = function(list) {
		this.onLog(list);
	};
	
	this.init(onConnected, onError);
}


/*
		    ┌───────────────────┐
		    │	 client init	│
		    └───────────────────┘
*/

/**
 * @api private
 */
MpgClient.prototype.init = function(onConnected, onError) {
	
	if (onConnected !== undefined)
		this.onConnected = onConnected;
		
	if (onError !== undefined)
		this.onError = onError;
	
	try {
		
		var mpgClient = this;
		this.websocket = new WebSocket(this.uri);
		//this.websocket.onopen = function(evt) { onConnected(mpgClient); };
		this.websocket.onclose = function(evt) { mpgClient.onClose(evt.data) };
		this.websocket.onmessage = function(evt) { mpgClient._parse(evt); };
		this.websocket.onerror = function(evt) { mpgClient.onError(mpgClient.trad.get(5)); };

		window.addEventListener("beforeunload", function(e){ mpgClient.close(); }, false);
	
	} catch (e) {
		
		if (this.onError !== undefined)
			this.onError(this.trad.get(0));
	}
};




/*
		    ┌───────────────────┐
		    │   client public	│
		    └───────────────────┘
*/

/**
 * Close the socket
 */
MpgClient.prototype.close = function() {
	
	this.websocket.close();
};

/**
 * Get a user by his name.
 *
 * @param {string} name		 Name of the user
 * @return {User|null} User with the name or null if we don't have
 */
MpgClient.prototype.getUserByName = function(name) {
	
	var u = this.chan.getUserByName(name);
	if (u !== null)
		return u;
	
	if (this.me.data.name === name)
		return this.me;
	
	return null;
};

/**
 * Get a user by his id.
 *
 * @param {int} id		 ID of the user
 * @return {User|null} User or null if not found
 */
MpgClient.prototype.getUserById = function(id) {
	
	var u = this.chan.getUserById(id);
	if (u !== null)
		return u;
	
	if (this.me != undefined && this.me.data.id === id)
		return this.me;
	
	return null;
};

/**
 * Get all the users connect
 * (you and the others in the chan)
 * 
 * @return {User[]} List of the users
 */
MpgClient.prototype.getChanUserList = function() {
	
	if (this.me === undefined ||
		this.chan === undefined ||
		this.chan.users === undefined )
	{
		return [];
	}
	
	return this.chan.users.concat([this.me]);
};


/*
		    ┌────────────────────────┐
		    │   client public send	 │
		    └────────────────────────┘
*/

/**
 * Send a message to the chan or to a user
 *
 * @param {string} msg		Your message
 * @param {User?} user		Facultative, if it's null: the message is send to all the chan
 */
MpgClient.prototype.sendMsg = function(msg, user) {
	
	var d;
	if (user === undefined) {
		
		d = {chanMsg: msg};
		
	} else {
		
		d = {userMsg: {to: user.data.id, text: msg} };
	}
	
	this.websocket.send( JSON.stringify(d) );
};

/**
 * Send an event.
 * 
 * @param {string} label		Label of the event
 * @param {Object} data			Datas of the event
 * @param {User} user			Facultative, target of the event (if it's null, the target is you)
 */
MpgClient.prototype.sendUserEvt = function(label, data, user) {
	
	var d;
	if (user === undefined) {
		
		d = {userEvt: {label: label, data: data} };
		
	} else {
		
		d = {userEvt: {label: label, data: data, from: user.data.id} };
	}
	
	this.websocket.send( JSON.stringify(d) );
};

/**
 * Change data(s) of a user
 *
 * @param {Object} data		Data with new information
 * @param {User?} user		Facultative, target: if null the target is you
 */
MpgClient.prototype.sendUserData = function(data, user) {
	
	var d = data;
	if (user === undefined)
		d.id = this.me.data.id;
	else
		d.id = user.data.id;
	
	this.websocket.send( JSON.stringify({userData : d}) );
};

/**
 * Send an event to the chan.
 *
 * @param {string} label	Label of the event
 * @param {Object} data		Datas of the event
 */
MpgClient.prototype.sendChanEvt = function(label, data) {
	
	var d = {chanEvt: {label: label, data: data}};
	this.websocket.send( JSON.stringify(d) );
};

/**
 * Change a data of the chan (you must to have the moderator of the chan)
 *
 * @param {Object} data		New data to change
 */
MpgClient.prototype.sendChanData = function(data) {
	
	var d = {chanData : data};
	this.websocket.send( JSON.stringify(d) );
};


/*
		    ┌────────────────────────┐
		    │   client public ask    │
		    └────────────────────────┘
*/

/**
 * Get all the chans of the server (asynchronus function)
 * 
 * @param {function} callback		Function called when the list is return (like onListChan)
 */
MpgClient.prototype.getChans = function (callback) {
	
	this.listChans = [];
	this.sendUserEvt("chan-listen", true);
	this.onListChan = callback;
};

/**
 * Stop listen the chan list
 */
MpgClient.prototype.stopListenChans = function () {
	
	this.sendUserEvt("chan-listen", false);
	this.onListChan = null;
};

/**
 * Change the chan.
 *
 * @param {string} chanName		Name of the new chan
 * @param {string?} chanPass		Facultative pass of the new chan
 */
MpgClient.prototype.joinChan = function (chanName, chanPass) {
	
	this.sendUserData({chan:{name: chanName, pass: chanPass}});
};

/**
 * Change your name.
 *
 * @param {string} newName		Your new name
 * @param {function} callback		Called when the name is changed
 */
MpgClient.prototype.changeUserName = function(newName, callback) {
	
	this.me.onDataNameChange = callback;
	this.sendUserData({name: newName});
};

/**
 * Change the name of the chan.
 *
 * @param {string} newName		New name of the chan
 */
MpgClient.prototype.changeChanName = function(newName) {
	this.sendChanData({name: chanName});
};

/**
 * Kick a user out of the chan (only if you are moderator)
 *
 * @param {User} user		User to kick
 */
MpgClient.prototype.kickUser = function(user) {
	
	this.sendUserData({chan:{id:-1}}, user);
};

/**
 * Up a user to be moderator (only if you are moderator)
 *
 * @param {user} user		User to be moderator
 */
MpgClient.prototype.upToModerator = function(user) {
	
	this.sendUserData({role:"moderator"}, user);
};


/*
		    ┌────────────────────┐
		    │   client private	 │
		    └────────────────────┘
*/

/**
 * @api private
 */
MpgClient.prototype._updateUser = function(data, dispatch) {
	
	if (dispatch === undefined)
		dispatch = true;
	
	if (this.me === undefined) {

		this.me = new MpgUser();
		this._setUserData(data, this.me, false);
		
		if (dispatch)
			this._dispatchConnected();
		
		this.onServerMsg(this.trad.get(3));
		
		return this.me;
	}
	
	var u = this.getUserById(data.id);
	if (u !== null) {

		this._setUserData(data, u);

	} else {

		u = new MpgUser();
		this._setUserData(data, u);
		
		if (dispatch)
			this._dispatchChanUserList();
	}

	return u;
};

/**
 * @api private
 */
MpgClient.prototype._dispatchUserDataChange = function(user, data) {
	
	if (user.onDataChange !== undefined)
		user.onDataChange(data);
	
	if (this.onUserDataChange !== undefined)
		this.onUserDataChange(user, data);
};

/**
 * @api private
 */
MpgClient.prototype._dispatchChanUserList = function() {
	
	if (this.onChanUserList !== undefined)
		this.onChanUserList(this.getChanUserList());
};

/**
 * @api private
 */
MpgClient.prototype._dispatchServerChanList = function() {
	
	if (this.onListChan !== undefined)
		this.onListChan(this.listChans);
};

/**
 * @api private
 */
MpgClient.prototype._dispatchConnected = function() {
	
	if (this.onConnected !== undefined)
		this.onConnected(this.me);
};

/**
 * @api private
 */
MpgClient.prototype._dispatchChanChange = function() {
	
	if (this.onChanDataChange !== undefined)
		this.onChanDataChange(this.chan.data);
	
	if (this.onChanChange !== undefined)
		this.onChanChange(this.chan);
	
	this._dispatchChanUserList();
	this._dispatchServerChanList();
};

/**
 * @api private
 */
MpgClient.prototype._ask = function(label, data)
{
	var d = {serverCmd : {label: label}};
	if (data !== undefined)
		d.data = data;
	this.websocket.send( JSON.stringify(d) );
}

/**
 * @api private
 */
MpgClient.prototype._parse = function(evt)
{
	var msg;
	try {
		
		msg = JSON.parse(evt.data);
		
	} catch(e) {
		
		this.onError(this.trad.get(2));
		return;
	}
	
	//console.log(msg);
	
	// MESSAGES
	
	if (msg.userMsg !== undefined) {
		
		var d = msg.userMsg;
		this.onMsgUser(d.from, d.text);
	}
	
	if (msg.chanMsg !== undefined) {
		
		var d = msg.chanMsg;
		var u = this.getUserById(d.from);
		if (u !== null)
			this.onChanMsg(u.data.name, d.text);
		else
			this.onChanMsg("?", d.text);
	}
	
	if (msg.serverMsg !== undefined) {
		
		this.onServerMsg(msg.serverMsg);
	}
	
	
	// EVENTS
	
	if (msg.userEvt !== undefined) {
		
		var d = msg.userEvt;
		this.onUserEvt(d.name, d.label, d.data);
	}
	
	if (msg.chanEvt !== undefined) {
		
		var d = msg.chanEvt;
		
		this.onChanEvt(d.label, d.data);
	}
	
	if (msg.chanUserList !== undefined) {
		
		
		// Check if you have new players
		var d = msg.chanUserList;
		var i = d.length;
		var list = [];
		while (--i > -1) {
			
			var u = this._updateUser(d[i], false);
			if (u !== this.me)
				list.push(u);
		}
		
		this.chan.replaceUsers(list);
		
		this._dispatchChanUserList();
	}
	
	if (msg.serverEvt !== undefined) {
		
		var d = msg.serverEvt;
		switch (d.label) {
				
			case "chan-list" :
				
				this.listChans = d.data;
				this._dispatchServerChanList();
				
				break;
				
			case "chan-added" :
				
				if (this.listChans === undefined)
					this.listChans = [];
				
				this.listChans.push(d.data);
				this._dispatchServerChanList();
				
				break;
				
			case "chan-removed" :
				
				if (this.listChans === undefined)
					this.listChans = [];
				
				var i = this.listChans.indexOf(d.data);
				if (i > -1)
					this.listChans.splice(i, 1);
				
				this._dispatchServerChanList();
				
				break;
				
			case "msg" :
				
				this.onServerMsg(this.trad.get(d.data.id, d.data.vars));
				
				break;
				
			case "error" :
				
				this.onError(this.trad.get(d.data.id, d.data.vars));
				
				break;
				
			default :
				
				this.onServerEvt(this.trad.get(1, [d.label]));
		}
		
		
	}
	
	
	// DATAS
	
	if (msg.userData !== undefined) {
		
		var d = msg.userData;
		this._updateUser(d);
		
	}
	
	if (msg.chanData !== undefined) {
		
		var d = msg.chanData;
		
		//this.chan = new MpgChan();
		this._setChanData(d);
	}
};

/**
 * @api private
 */
MpgClient.prototype._setUserData = function(data, user, dispatch) {
	
	if (dispatch === undefined)
		dispatch = true;
	
	user.data.id = data.id;
	
	for (key in data) {
		
		if (key === "name") {
			
			var oldName = user.data.name;
			user.data.name = data.name;
			
			if (dispatch) {
				
				if (user.onDataNameChange !== undefined && data.name !== oldName)
					user.onDataNameChange();
				
				if (oldName !== undefined && oldName !== data.name)
					this.onServerMsg(this.trad.get(501, [oldName, data.name]));

				this._dispatchChanUserList();
			}
			
		} else if (key === "chan") {
			
			if (user !== this.me) {
				
				if (data.chan.id !== this.chan.data.id) {

					this.chan.leave(user);

					this.onServerMsg(this.trad.get(504, [user.data.name, this.chan.data.name]));

					if (dispatch)
						this._dispatchChanUserList();

					return;
					
				} else {

					this.chan.join(user);

					this.onServerMsg(this.trad.get(505, [user.data.name, this.chan.data.name]));

					if (dispatch)
						this._dispatchChanUserList();

					return;
				}
			}
			
		} else {
			
			user.data[key] = data[key];
		}
	}
	
	this._dispatchUserDataChange(user, data);
};

/**
 * @api private
 */
MpgClient.prototype._setChanData = function(data) {
	
	var newChan = false;
	if (this.chan === undefined || this.chan.data.id != data.id) {
		
		this.chan = new MpgChan(data.id);
		newChan = true;
	}
	
	for (key in data) {
		
		this.chan.data[key] = data[key];
	}
	
	if (newChan) {
		
		this._dispatchChanChange();
		
	} else if (this.onChanDataChange !== undefined) {
		
		this.onChanDataChange(data);
	}
};



/*
		╔═══════════════════════════════╗
		║								║
		║			TRADUCTION			║
		║								║
		╚═══════════════════════════════╝
*/

/**
 * Traduction data
 *
 * @constructor
 */
function MpgTrad (lang) {
	
	this.lang = lang || this.getLang();
	
	if (this._trads[0][this.lang] == undefined)
		throw new Error("The language " + this.lang + " is not supported!");
}

/**
 * Get lang of the navigator
 *
 * @return {string} Language (en, fr...)
 */
MpgTrad.prototype.getLang = function() {
	
	var l = (navigator.language || navigator.userLanguage).split('-')[0];
			 
	if (this._trads[0][l] != undefined) {
		
		return l;
	}
	
	return "en";
}

/**
 * Get lang of the navigator and check if it's in the traductions
 * 
 * @return {string} Language (en, fr...)
 */
MpgTrad.GetLang = function(langList) {
	
	var l = (navigator.language || navigator.userLanguage).split('-')[0];
	
	if (langList !== undefined) {
		
		if (langList.indexOf(l) > -1) {
			
			return l;
		}
		
		return langList[0];
	}
	
	return l;
}

/*
		    ┌────────────────────┐
		    │    trad private	 │
		    └────────────────────┘
*/

/**
 * All the words
 *
 * @api private
 */
MpgTrad.prototype._trads = {
		
	// System
	0: {en: "Can not connect",
		fr: "Connexion impossible"},

	1: {en: "Client undefined error ($1)",
		fr: "Erreur client indéfinie ($1)"},

	2: {en: "Data parsing stopped: transferred data incomplete",
		fr: "Analyse des données stoppé, données transférées incomplêtes"},

	3: {en: "You are connected!",
		fr: "Vous êtes connecté !"},

	4: {en: "You are disconnected!",
		fr: "Vous êtes déconnecté !"},

	5: {en: "Connection server error",
		fr: "Erreur de connexion avec le serveur"},

	// Commands
	101: {en: "Command label undefined ($1)",
		  fr: "Commande indéfinie ($1)"},

	102: {en: "Unknown command ($1)",
		  fr: "Commande inconnue ($1)"},

	201: {en: "Message to user $1 error (text or user name empty)",
		  fr: "Erreur d'envoie de message à l'utilisateur $1 (texte ou nom d'utilisateur manquant)"},

	// Users
	301: {en: "User not found",
		  fr: "L'utilisateur n'a pas été trouvé"},

	302: {en: "You don't have permission to change chan data $1",
		  fr: "Vous n'avez pas la permission de changer les données du salon $1"},

	303: {en: "You can only use alphanumeric, hyphen and underscore between 3 and 10 characters in an user name but you have write $1",
		  fr: "Pour un nom d'utilisateur vous ne pouvez utiliser que des caractères latin standarts (minuscules, majuscules), des chiffres, des tirets et des underscores entre 3 et 10 caractères mais vous avez écris $1"},

	304: {en: "Name undefined",
		  fr: "Nom indéfinis"},

	305: {en: "The name $1 is already used",
		  fr: "Le nom $1 est déjà utilisé"},

	306: {en: "Name undefined",
		  fr: "Nom indéfinis"},

	307: {en: "You can't change your role",
		  fr: "Vous ne pouvez pas changer votre rôle"},

	308: {en: "A user event must have a label property ($1)",
		  fr: "Un évênement utilisateur doit avoir une propriété \"label\" ($1)"},

	309: {en: "You can't change the role of $1 if you are not moderator",
		  fr: "Vous ne pouvez pas changer le role de $1 si vous n'êtes pas modérateur"},

	310: {en: "You don't have permission to change data $1 of $2",
		  fr: "Vous n'avez pas la permission de changer la donnée $1 de $2"},

	311: {en: "You don't have permission to kick $1 from $2",
		  fr: "Vous n'avez pas la permission d'expulser $1 du salon $2"},

	312: {en: "$1 is already $2",
		  fr: "$1 est déjà $2"},

	// Chan
	401: {en: "You don't have permission to change the pass of the chan",
		  fr: "Vous n'avez pas la permission de changer le mot de passe du salon"},

	402: {en: "The name $1 is already used",
		  fr: "Le nom $1 est déjà utilisé"},

	403: {en: "Name undefined",
		  fr: "Nom indéfinis"},

	404: {en: "You can only use alphanumeric, hyphen and underscore between 3 and 10 characters in a chan name but you have write $1",
		  fr: "Pour un nom de salon vous ne pouvez utiliser que des caractères latin standarts (minuscules, majuscules), des chiffres, des tirets et des underscores entre 3 et 10 caractères mais vous avez écris $1"},
	
	405: {en: "A chan event must have a label property ($1)",
		  fr: "Un évênement de salon doit avoir une propriété \"label\" ($1)"},

	406: {en: "You can't join the chan $1",
		  fr: "Vous n'êtes pas autorisé à rejoindre le salon $1)"},

	// Messages
	501: {en: "$1 change his name to $2",
		  fr: "$1 s'appele désormais $2"},

	502: {en: "$1 has been kicked by $2",
		  fr: "$1 a été expulsé par $2"},

	503: {en: "You have been kicked by $1",
		  fr: "Vous avez été expulsé par $1"},

  	504: {en: "$1 leave the chan $2",
		  fr: "$1 a quitté le salon $2"},

  	505: {en: "$1 join the chan $2",
		  fr: "$1 a rejoind le salon $2"}

};

/**
 * Get a traduction words
 *
 * @param {int} id			ID of the words
 * @param {string|string[]} vars	Variable(s) to add in the words
 * @return {string}
 */
MpgTrad.prototype.get = function(id, vars) {

	if (vars === undefined)
		vars = [];
	
	if (this._trads[id] === undefined || this._trads[id][this.lang] === undefined) {
		id = 1;
		vars = ["id: " + id];
	}

	var raw = this._trads[id][this.lang];
	
	var i = vars.length;
	while (--i > -1) {
		
		raw = raw.replace("$" + (i + 1), vars[i]);
	}
	
	return raw;
	
};
