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

function MpgUser () {
	
	this.chan;
	this.data = {};
	
	this.onDataNameChange;
}



/*
		╔═══════════════════════════╗
		║							║
		║			CHAN			║
		║							║
		╚═══════════════════════════╝
*/

function MpgChan () {

	this.users = [];
	this.data = {};
}


/*
		    ┌───────────────────┐
		    │	Chan helpers	│
		    └───────────────────┘
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

MpgChan.prototype.leave = function (user) {
	
	var i = this.users.indexOf(user);
	if (i > -1) {
		this.users.splice(i, 1);
		return true;
	}
	
	return false;
};

MpgChan.prototype.replaceUsers = function (newUsers) {
	
	this.users = newUsers;
};

MpgChan.prototype.getUserByName = function (name) {
	
	var i = this.users.length;
	while (--i > -1) {
		
		if (this.users[i].data.name === name)
			return this.users[i];
	}
	
	return null;
};

MpgChan.prototype.getUserById = function (id) {
	
	var i = this.users.length;
	while (--i > -1) {
		
		if (this.users[i].data.id === id)
			return this.users[i];
	}
	
	return null;
};

MpgChan.prototype.removeUserByName = function (name) {
	
	var userI = this._getUserIndexByName(name);
	if (userI > -1) {
		
		this.users.splice(userI, 1);
		return true;
	}
	
	return false;
};

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

MpgChan.prototype._getUserIndexById = function (id) {
	
	var i = this.users.length;
	while (--i > -1) {
		
		if (this.users[i].data.id === id)
			return i;
	}
	
	return -1;
};

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

function MpgClient(URI, lang, onConnected) {

	this.me;
	this.chan;
	this.uri = URI;
	this.trad = new MpgTrad(lang);
	
	this.websocket;
	
	
	this.onLog = function(msg) {
		console.log(msg);
	};
	
	
	/*
	
			CLIENT SYSTEM MESSAGES
			
	*/
	
	/*this.onServerOpen = function(msg) {
		//this.onLog("socket open");
		//console.log(msg);
	};*/
	
	this.onServerClose = function(msg) {
		//this.onLog("socket closed");
	};
	
	this.onServerError = function(msg) {
		//this.onLog(msg);
		this.onLog(this.trad.get(5, [msg]));
	};
	
	
	/*
	
			LISTENERS
	
	*/
	
	/**
	 * Called when a name of user change
	 * @param {User} user - user with new name
	 */
	this.onChangeUserName;
	
	
	
	
	/*
	
			SERVER MESSAGES
			
	*/
	
	this.onMsgUser = function(name, msg) {
		this.onLog(name + ":" + msg);
	};
	
	this.onMsgChan = function(name, msg) {
		if (name === undefined)
			this.onLog(msg);
		else
			this.onLog(name + ":" + msg);
	};
	
	this.onMsgServer = function(msg) {
		this.onLog(msg);
	};
	
	this.onListChan = function(list) {
		this.onLog(list);
	};
	
	this.onListUser = function(list) {
		this.onLog(list);
	};
	
	this.onEvtUser = function(user, label, data) {
		this.onLog(label);
	};
	
	this.onEvtChan = function(label, data) {
		this.onLog(label);
	};
	
	this.onEvtServer = function(label, data) {
		this.onLog(label);
	};
	
	this.onDataUser = function(user, data) {
		//this.onLog(data);
	};
	
	this.onDataChan = function(data) {
		//this.onLog(data);
	};
	
	this.onChanUserList = function(list) {
		this.onLog(list);
	};
	
	this.serverChanList = function(list) {
		this.onLog(list);
	};
	
	
	
	
	this.init(onConnected);
}


/*
		    ┌───────────────────┐
		    │	 client init	│
		    └───────────────────┘
*/

MpgClient.prototype.init = function(onConnected) {
	
	var mpgClient = this;
	
	this.websocket = new WebSocket(this.uri);
	
	if (onConnected !== undefined)
		this.websocket.onopen = onConnected;
	
	this.websocket.onclose = function(evt) { mpgClient.onServerClose(evt.data) };
	this.websocket.onmessage = function(evt) { mpgClient._parse(evt); };
	this.websocket.onerror = function(evt) { mpgClient.onServerError(evt.data); };
	
	window.addEventListener("beforeunload", function(e){ mpgClient.close(); }, false);
};




/*
		    ┌───────────────────┐
		    │   client public	│
		    └───────────────────┘
*/

MpgClient.prototype.close = function() {
	
	this.websocket.close();
};

MpgClient.prototype.getUserByName = function(name) {
	
	var u = this.chan.getUserByName(name);
	if (u !== undefined)
		return u;
	
	if (this.me.data.name === name)
		return this.me;
	
	return null;
};

MpgClient.prototype.getUserById = function(id) {
	
	var u = this.chan.getUserById(id);
	if (u != undefined)
		return u;
	
	if (this.me != undefined && this.me.data.id === id)
		return this.me;
	
	return null;
};

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

MpgClient.prototype.sendMsg = function(msg, user) {
	
	var d;
	if (user === undefined) {
		
		d = {chanMsg: msg};
		
	} else {
		
		d = {userMsg: {to: user.data.id, text: msg} };
	}
	
	this.websocket.send( JSON.stringify(d) );
};

MpgClient.prototype.sendUserEvt = function(label, data, user) {
	
	var d;
	if (user === undefined) {
		
		d = {userEvt: {label: label, data: data} };
		
	} else {
		
		d = {userEvt: {label: label, data: data, from: user.data.id} };
	}
	
	this.websocket.send( JSON.stringify(d) );
};

MpgClient.prototype.sendUserData = function(data, user) {
	
	var d = data;
	if (user === undefined)
		d.id = this.me.data.id;
	else
		d.id = user.data.id;
	
	this.websocket.send( JSON.stringify({userData : d}) );
};

MpgClient.prototype.sendChanEvt = function(label, data) {
	
	var d = {chanEvt: {label: label, data: data}};
	this.websocket.send( JSON.stringify(d) );
};

MpgClient.prototype.sendChanData = function(data) {
	
	var d = {chanData : data};
	this.websocket.send( JSON.stringify(d) );
};


/*
		    ┌────────────────────────┐
		    │   client public ask	 │
		    └────────────────────────┘
*/

MpgClient.prototype.askChangeChan = function(chanName, chanPass) {
	
	this.sendUserData({chan:{name: chanName, pass: chanPass}});
	
	//this._ask("set-user-chan", {name: chanName, pass: ((chanPass === undefined)?"":chanPass) });
};

MpgClient.prototype.askChangeUserName = function(newName, callback) {
	
	this.me.onDataNameChange = callback;
	this.sendUserData({name: newName});
};

MpgClient.prototype.askChangeChanName = function(newName) {
	this.sendChanData({name: chanName});
};

MpgClient.prototype.askChangeChanPass = function(newPass) {
	this._ask("set-chan-pass", newPass);
};

/*MpgClient.prototype.askUserData = function(userName) {
	this._ask("get-user-data", userName);
};*/

MpgClient.prototype.askListUser = function() {
	this._ask("get-list-user");
};

MpgClient.prototype.askListUserData = function() {
	this._ask("get-list-user-data");
};

MpgClient.prototype.askListChan = function() {
	this._ask("get-list-chan");
};

MpgClient.prototype.askListChanData = function() {
	this._ask("get-list-chan-data");
};

/*MpgClient.prototype.askChanData = function() {
	this._ask("get-chan-data");
};*/

MpgClient.prototype.askKick = function(userName) {
	this._ask("kick-user", userName);
};



/*
		    ┌────────────────────┐
		    │   client private	 │
		    └────────────────────┘
*/

MpgClient.prototype._updateUser = function(data) {
	
	if (this.me == undefined) {

		this.me = new MpgUser();
		this._setUserData(data, this.me);
		this.onMsgServer(this.trad.get(3));
		return this.me;
		
	} else if (data.id !== undefined) {

		var u = this.getUserById(data.id);
		if (u !== null) {
			
			this._setUserData(data, u);
			
		} else {

			u = new MpgUser();
			this._setUserData(data, u);
		}
		
		return u;
		
	} /*else if (d.name !== undefined && 
			   this.getUserByName(d.name) !== null) {

		var u = this.getUserByName(d.name);
		this._setUserData(d, u);

	}*/ 
	
	return null;
};

MpgClient.prototype._dispatchChanUserList = function() {
	
	var list = this.getChanUserList();
	
	if (this.onChanUserList !== undefined)
		this.onChanUserList(list);
};
	

MpgClient.prototype._ask = function(label, data)
{
	var d = {serverCmd : {label: label}};
	if (data !== undefined)
		d.data = data;
	this.websocket.send( JSON.stringify(d) );
}

MpgClient.prototype._parse = function(evt)
{
	var msg;
	try {
		
		msg = JSON.parse(evt.data);
		
	} catch(e) {
		
		this.onServerError(this.trad.get(2));
		return;
	}
	
	console.log(msg);
	
	// MESSAGES
	
	if (msg.userMsg !== undefined) {
		
		var d = msg.userMsg;
		this.onMsgUser(d.from, d.text);
	}
	
	if (msg.chanMsg !== undefined) {
		
		var d = msg.chanMsg;
		var u = this.getUserById(d.from);
		if (u !== null)
			this.onMsgChan(u.data.name, d.text);
		else
			this.onMsgChan("?", d.text);
	}
	
	if (msg.serverMsg !== undefined) {
		
		this.onMsgServer(msg.serverMsg);
	}
	
	
	// EVENTS
	
	if (msg.userEvt !== undefined) {
		
		var d = msg.userEvt;
		this.onEvtUser(d.name, d.label, d.data);
	}
	
	if (msg.chanEvt !== undefined) {
		
		var d = msg.chanEvt;
		this.onEvtChan(d.label, d.data);
	}
	
	if (msg.chanUserList !== undefined) {
		
		
		// Check if you have new players
		var d = msg.chanUserList;
		var i = d.length;
		var list = [];
		while (--i > -1) {
			
			var u = this._updateUser(d[i]);
			if (u !== this.me)
				list.push(u);
		}
		
		this.chan.replaceUsers(list);
		
		this._dispatchChanUserList();
	}
	
	if (msg.serverChanList !== undefined) {
		
		var d = msg.serverChanList;
		
		// todo
	}
	
	if (msg.serverEvt !== undefined) {
		
		var d = msg.serverEvt;
		switch (d.label) {
				
			/*case "user-connected" :
				
				if (this.me === undefined) {
					this.me = new MpgUser();
					this._setUserData(d.data, this.me);
				}
				
				this.onMsgServer(this.trad.get(3));
				
				break;
			case "user-offline" :
				
				
				var user = this.getUserById(d.data.user.id);
				if (user !== undefined)
					this.chan.users.splice(this.chan.users.indexOf(user), 1);
				
				this.onMsgServer(this.trad.get(4));
				
				break;*/
			case "error" :
				
				this.onMsgServer(this.trad.get(d.data.id, d.data.vars));
				
				break;
			default :
				
				this.onMsgServer(this.trad.get(1, [d.label]));
				//this.onEvtUser(d.label, d.data);
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

MpgClient.prototype._setUserData = function(data, user) {
	
	if (data.id !== undefined)
		user.data.id = data.id;
	
	for (key in data) {
		
		if (key === "name") {
			
			user.data.name = data.name;
			
			/*if (this.onChangeUserName !== undefined)
				this.onChangeUserName(user);*/
			
			if (user.onDataNameChange !== undefined)
				user.onDataNameChange();
			
			this._dispatchChanUserList();
			
		} else if (key === "chan") {
			
					
			if (this.chan == undefined) {
				
				this.chan = new MpgChan();
				this.chan.data.name = "";
			}
			
			//console.log(data.chan.id+" "+this.chan.data.id);
			
			if (data.chan.id !== this.chan.data.id) {
				
				if (user === this.me) {

					this.chan = new MpgChan();
					this._setChanData(data.chan);	

				} else {

					//console.log("leave");
					this.chan.leave(user);
					this._dispatchChanUserList();
				}
				
			} else {
				
				var u = this.chan.getUserById(user.data.id);
				if (u === null) {
					
					this.chan.join(user);
					this._dispatchChanUserList();
					
				} else {
					
					delete(data[key]);
				}
					
			}
			
		} else {
			
			user.data[key] = data[key];
		
		}
		
	}
	
	this.onDataUser(user, data);
};

MpgClient.prototype._setChanData = function(data) {
	
	if (this.chan === undefined || this.chan.data.id !== data.id) {
		
		this.chan = new MpgChan();
	}
		
	for (key in data) {

		this.chan.data[key] = data[key];
	}
	
	if (this.onDataChan !== undefined)
		this.onDataChan(data);
};



/*
		╔═══════════════════════════════╗
		║								║
		║			TRADUCTION			║
		║								║
		╚═══════════════════════════════╝
*/

function MpgTrad (lang) {
	
	this.lang = lang;
	
	if (this._trads[0][lang] === undefined)
		throw new Error("The language " + lang + " is not supported!");
}
	

/*
		    ┌────────────────────┐
		    │    trad private	 │
		    └────────────────────┘
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

	5: {en: "Socket error: $1",
		fr: "Erreur de socket : $1"},

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

	303: {en: "You can only use alphanumeric, - and _ in an user name but you have write $1",
		  fr: "Pour un nom d'utilisateur vous ne pouvez utiliser que des caractères latin standarts (minuscules, majuscules), des chiffres, des tirets et des underscores mais vous avez écris $1"},

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

	// Chan
	401: {en: "You don't have permission to change the pass of the chan",
		  fr: "Vous n'avez pas la permission de changer le mot de passe du salon"},

	402: {en: "The name $1 is already used",
		  fr: "Le nom $1 est déjà utilisé"},

	403: {en: "Name undefined",
		  fr: "Nom indéfinis"},

	404: {en: "You can only use alphanumeric, - and _ in an chan name but you have write $1",
		  fr: "Pour un nom de salon vous ne pouvez utiliser que des caractères latin standarts (minuscules, majuscules), des chiffres, des tirets et des underscores mais vous avez écris $1"},

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
		  fr: "Vous avez été expulsé par $1"}

};

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
