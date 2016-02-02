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
	this.onDataChange;
	this.onLeave;
}



/*
		╔═══════════════════════════╗
		║							║
		║			CHAN			║
		║							║
		╚═══════════════════════════╝
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
		//this._dispatchChanUserList();
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

function MpgClient(URI, onConnected, lang) {

	this.me;
	this.chan;
	this.uri = URI;
	this.trad = new MpgTrad(lang);
	
	this.listChans;
	
	this.websocket;
	
	
	this.onLog = function(msg) {
		//console.log(msg);
	};
	
	
	/*
	
			LISTENER
			
	*/
	
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
	
	this.onEvtUser = function(user, label, data) {
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
		this.onConnected = onConnected;
		
	//this.websocket.onopen = function(evt) { onConnected(mpgClient); };
	this.websocket.onclose = function(evt) { mpgClient.onClose(evt.data) };
	this.websocket.onmessage = function(evt) { mpgClient._parse(evt); };
	this.websocket.onerror = function(evt) { mpgClient.onError(this.trad.get(5, [evt.data])); };
	
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

MpgClient.prototype.getChanUserByName = function(name) {
	
	var u = this.chan.getUserByName(name);
	if (u !== undefined)
		return u;
	
	if (this.me.data.name === name)
		return this.me;
	
	return null;
};

MpgClient.prototype.getChanUserById = function(id) {
	
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

MpgClient.prototype.getChans = function (callback) {
	
	this.listChans = [];
	//this.sendUserData({listenChans: true});
	this.sendUserEvt("chan-listen", true);
	this.onListChan = callback;
};

MpgClient.prototype.stopListenChans = function () {
	
	//this.sendUserData({listenChans: false});
	this.sendUserEvt("chan-listen", false);
	this.onListChan = null;
};

MpgClient.prototype.joinChan = function (chanName, chanPass, callback) {
	
	this.sendUserData({chan:{name: chanName, pass: chanPass}});
};

MpgClient.prototype.changeUserName = function(newName, callback) {
	
	this.me.onDataNameChange = callback;
	this.sendUserData({name: newName});
};

MpgClient.prototype.changeChanName = function(newName) {
	this.sendChanData({name: chanName});
};
/*
MpgClient.prototype.askChangeChanPass = function(newPass) {
	this._ask("set-chan-pass", newPass);
};

MpgClient.prototype.askUserData = function(userName) {
	this._ask("get-user-data", userName);
};*/
/*
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
};*/

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

MpgClient.prototype._updateUser = function(data, dispatch) {
	
	if (dispatch === undefined)
		dispatch = true;
	
	if (this.me == undefined) {

		this.me = new MpgUser();
		this._setUserData(data, this.me, false);
		
		if (dispatch)
			this._dispatchConnected();
		
		this.onServerMsg(this.trad.get(3));
		
		return this.me;
	}
	
	var u = this.getChanUserById(data.id);
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

MpgClient.prototype._dispatchChanUserList = function() {
	
	if (this.onChanUserList !== undefined)
		this.onChanUserList(this.getChanUserList());
};

MpgClient.prototype._dispatchServerChanList = function() {
	
	if (this.onListChan !== undefined)
		this.onListChan(this.listChans);
};

MpgClient.prototype._dispatchConnected = function() {
	
	if (this.onConnected !== undefined)
		this.onConnected(this.me);
};

MpgClient.prototype._dispatchChanChange = function() {
	
	if (this.onChanDataChange !== undefined)
		this.onChanDataChange(this.chan.data);
	
	if (this.onChanChange !== undefined)
		this.onChanChange(this.chan);
	
	this._dispatchChanUserList();
	this._dispatchServerChanList();
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
		
		this.onError(this.trad.get(2));
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
		var u = this.getChanUserById(d.from);
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
		this.onEvtUser(d.name, d.label, d.data);
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

/*MpgClient.prototype._createChan = function(data) {

	if (data.id === undefined || data.name === undefined) {
		
		console.log("Not enouth data to create chan");
		return;
	}
	
	this.chan = new MpgChan(data.id);
	this.chan.data.name = data.name;
	this._setChanData(data);
}*/

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
	
	if (dispatch && user.onDataChange !== undefined)
		user.onDataChange();
	/*if (this.onDataUser !== undefined)
		this.onDataUser(user, data);*/
};

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

function MpgTrad (lang) {
	
	this.lang = lang || this.getLang();
	
	if (this._trads[0][this.lang] == undefined)
		throw new Error("The language " + this.lang + " is not supported!");
}

MpgTrad.prototype.getLang = function() {
	
	var l = (navigator.language || navigator.userLanguage).split('-')[0];
			 
	if (this._trads[0][l] != undefined) {
		
		return l;
	}
	
	return "en";
}

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
		  fr: "Vous avez été expulsé par $1"},

  	504: {en: "$1 leave the chan $2",
		  fr: "$1 a quitté le salon $2"},

  	505: {en: "$1 join the chan $2",
		  fr: "$1 a rejoind le salon $2"}

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
