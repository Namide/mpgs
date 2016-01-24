// 'use strict';

/*!
 * mpgs
 * Copyright(c) 2016 Damien Doussaud (namide.com)
 * MIT Licensed
 */

function MpgUser () {
	
	this.role;
	this.chan;
	this.data = { };
}

function MpgChan () {

	this.users = [];
	this.data = {};
}

function MpgClient(URI, lang) {

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
	
	this.onServerOpen = function(msg) {
		//this.onLog("socket open");
		//console.log(msg);
	};
	
	this.onServerClose = function(msg) {
		//this.onLog("socket closed");
	};
	
	this.onServerError = function(msg) {
		//this.onLog(msg);
		this.onLog(this.trad.get(5, [msg]));
	};
	
	
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
	
	/*
	
			INIT
	
	*/
	
	//this.loadLang(langFile);
	this.init();
	
	this._onChangeUserName;
}


/*

	WebSocket Events

*/

/*MpgClient.prototype.loadLang = function(URL) {

	var server = this;
	var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', URL, true);
    xobj.onreadystatechange = function () {
		
		if (xobj.readyState == 4 && xobj.status == "200") {
			
			server = xobj.responseText;
			
		} else {
			
			this.on
		}
    };
	
    xobj.send(null);
};*/


MpgClient.prototype.init = function() {
	
	var mpgClient = this;
	
	this.websocket = new WebSocket(this.uri);
	
	this.websocket.onopen = function(evt) { mpgClient.onServerOpen(evt.data) };
	this.websocket.onclose = function(evt) { mpgClient.onServerClose(evt.data) };
	this.websocket.onmessage = function(evt) { mpgClient._parse(evt); };
	this.websocket.onerror = function(evt) { mpgClient.onServerError(evt.data); };
	
	window.addEventListener("beforeunload", function(e){ mpgClient.close(); }, false);
	
	//writeToScreen("CONNECTED");
	//doSend("WebSocket rocks");
	
	
};




/*

	Public Mpg Methods

*/

MpgClient.prototype.close = function() {
	
	this.websocket.close();
};


/*

	Helpers

*/

MpgClient.prototype.getUserByName = function(name) {
	
	var u = this.chan.users;
	var i = u.length;
	while (--i > -1)
	{
		if (u[i].data.name === name)
			return u;
	}
	
	if (this.me.data.name === name)
		return this.me;
	
	return null;
};

MpgClient.prototype.getUserById = function(id) {
	
	var u = this.chan.users;
	var i = u.length;
	while (--i > -1)
	{
		if (u[i].data.id === id)
			return u;
	}
	
	if (this.me.data.id === id)
		return this.me;
	
	return null;
};



/*

	Send messages

*/

MpgClient.prototype.sendMsg = function(msg, userName) {
	
	var d;
	if (userName === undefined) {
		
		d = {chanMsg: msg};
		
	} else {
		
		d = {userMsg: {name: userName, text: msg} };
	}
	
	this.websocket.send( JSON.stringify(d) );
};

MpgClient.prototype.sendUserEvt = function(label, data, userName) {
	
	var d;
	if (userName === undefined) {
		
		d = {userEvt: {label: label, data: data} };
		
	} else {
		
		d = {userEvt: {label: label, data: data, name:userName} };
	}
	
	this.websocket.send( JSON.stringify(d) );
};

MpgClient.prototype.sendUserData = function(data) {
	
	var d = {userData : data};
	this.websocket.send( JSON.stringify(d) );
};

MpgClient.prototype.sendChanEvt = function(label, data) {
	
	var d = {chanEvt: {label: label, data: data}};
	this.websocket.send( JSON.stringify(d) );
};

MpgClient.prototype.sendChanData = function(data) {
	
	var d = {chanData : data};
	this.websocket.send( JSON.stringify(d) );
};

MpgClient.prototype.askChangeChan = function(chanName, chanPass) {
	this._ask("set-user-chan", {name: chanName, pass: ((chanPass === undefined)?"":chanPass) });
};

MpgClient.prototype.askChangeUserName = function(newName, callback) {
	//this._ask("set-user-name", newName);
	this._onChangeUserName = callback;
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

	Private Mpg Methods

*/

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
		this.onMsgChan(d.name, d.text);
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
		
		var d = msg.chanUserList;
		this.onChanUserList(d);
	}
	
	if (msg.serverChanList !== undefined) {
		
		var d = msg.serverChanList;
		this.onServerChanList(d);
	}
	
	if (msg.serverEvt !== undefined) {
		
		var d = msg.serverEvt;
		switch (d.label) {
				
			case "user-connected" :
				
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
				
				break;
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
		var user = this.getUserById(d.id);
		this._setUserData(d, user);
		/*if (user !== undefined)
		for (var key in d) {

			if (key === "name" && d[key] !== user.data.name) {

				this.onMsgServer( this.trad.get(501, [user.data.name, d[key]]) );
			}

			user.data[key] = d[key];
		}*/
		
		this.onDataUser(user, d);
	}
	
	if (msg.chanData !== undefined) {
		
		if (this.chan === undefined) {
			
			this.chan = new MpgChan();
			
		} else if (	msg.chanData.id !== undefined &&
				 	msg.chanData.id !== this.chan.id) {
			
			this.chan = new MpgChan();
		}
			
		
		var d = msg.chanData;
		for (var key in d) {

			this.chan.data[key] = d[key];
		}
		
		this.onDataChan(d);
	}
	
	
	/*
	if (msg.msg !== undefined) {
		var d = msg.msg;
		switch(d.type) {
			case "server":
				this.onMsgServer(d.msg);
				break;
			case "chan":
				this.onMsgChan(d.msg, d.from);			
				break;
			case "user":
				this.onMsgUser(d.msg, d.from);			
				break;
			default :
				//this.onLog ("msg from undefined: " + msg.type);
		}
	}
	
	if (msg.list !== undefined) {
		
		var out = [];
		var d = msg.list;
		var l = list.length;
		for(var i = 0; i < l; i++) {
		
			out[i] = (typeof d[i] === "string") ? {name : d[i]} : d[i];
		}
		
		if (d.type === "chan")
			this.onListChan(out);
		else if (d.type === "user")
			this.onChanUser(out);
		
	}
	
	if (msg.evt !== undefined) {
		
		var d = msg.evt;
		if (d.type === "chan")
			this.onEvtChan(d.data);
		else if (type === "user")
			this.onEvtChan(d.data, this.getUser(d.name));
	}
	
	if (msg.data !== undefined) {
		
		var d = msg.data;
		if (d.type === "chan") {
			
			var dt = d.data;
			this._setChanData(dt);
			this.onDataChan(dt);
		}
		else if (d.type === "user") {
			
			var dt = d.data;
			var u = this.getUser(d.name);
			this._setUserData(dt, u);
			this.onDataUser(dt, u);
		}			
	}*/
};

MpgClient.prototype._setUserData = function(data, user) {
	
	for (key in data) {
		
		user.data[key] = data[key];
		
		if (user === this.me &&
			key === "name" &&
		    this._onChangeUserName !== undefined)
			this._onChangeUserName(user);
			
	}		
};

MpgClient.prototype._setChanData = function(data) {
	
	if (this.chan === undefined)
		this.chan = new MpgChan();
		
	for (key in data) {

		this.chan.data[key] = data[key];
	}
};


/*

		TRADUCTIONS

*/

function MpgTrad (lang) {
	
	this.lang = lang;
	
	if (this._trads[0][lang] === undefined)
		throw new Error("The language " + lang + " is not supported!");
}
	

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
		301: {en: "The user $1 don't exist",
			  fr: "L'utilisateur $1 n'existe pas"},
	
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

		// Chan
		401: {en: "You don't have permission to change the pass of the chan",
			  fr: "Vous n'avez pas la permission de changer le mot de passe du salon"},
			  
		402: {en: "The name $1 is already used",
			  fr: "Le nom $1 est déjà utilisé"},
			  
		403: {en: "Name undefined",
			  fr: "Nom indéfinis"},
			  
		404: {en: "You can only use alphanumeric, - and _ in an chan name but you have write $1",
			  fr: "Pour un nom de salon vous ne pouvez utiliser que des caractères latin standarts (minuscules, majuscules), des chiffres, des tirets et des underscores mais vous avez écris $1"},
	
		// Messages
		501: {en: "$1 change his name to $2",
			  fr: "$1 s'appele désormais $2"}
	
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
	
}