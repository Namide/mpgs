// 'use strict';
	

/*!
 * mpgs
 * Copyright(c) 2016 Damien Doussaud (namide.com)
 * MIT Licensed
 */

function MpgUser() {
	
	this.name;
	this.role;
	this.chan;
	
	this.data = { };
}

function MpgChan() {

	this.name;
	this.users = [];
	this.datas = {};
}

function MpgClient(URI) {

	this.me = new MpgUser();
	this.chan;
	this.uri = URI;
	
	this.websocket;
	
	this.init();
}


/*

	WebSocket Events

*/

MpgClient.prototype.init = function() {
	
	var mpgClient = this;
	
	this.websocket = new WebSocket(this.uri);
	
	this.websocket.onopen = function(evt) { mpgClient.onServerOpen(evt) };
	this.websocket.onclose = function(evt) { mpgClient.onServerClose(evt) };
	this.websocket.onmessage = function(evt) { mpgClient._parse(evt); };
	this.websocket.onerror = function(evt) { mpgClient.onServerError(evt) };
	
	window.addEventListener("beforeunload", function(e){ mpgClient.close(); }, false);
	
	//writeToScreen("CONNECTED");
	//doSend("WebSocket rocks");
	
	this.onLog = function(msg) {
		console.log(msg);
	};
	
	/*
	
			CLIENT SYSTEM MESSAGES
			
	*/
	
	this.onServerOpen = function(evt) {
		this.onLog("socket open");
		console.log(evt);
	};
	
	this.onServerClose = function(evt) {
		this.onLog("socket closed");
	};
	
	this.onServerError = function(evt) {
		this.onLog("error: " + evt.data);
	};
	
	
	/*
	
			SERVER MESSAGES
			
	*/
	
	this.onMsgUser = function(msg, name) {
		this.onLog(name + ":" + msg);
	};
	
	this.onMsgChan = function(msg, name) {
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
	
	this.onEvtUser = function(evt, user) {
		this.onLog(evt);
	};
	
	this.onEvtChan = function(evt) {
		this.onLog(evt);
	};
	
	this.onDataUser = function(data, user) {
		this.onLog(data);
	};
	
	this.onDataChan = function(data) {
		this.onLog(data);
	};
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

MpgClient.prototype.getUser = function(name) {
	
	var u = this.chan.users;
	var i = u.length;
	while (--i > -1)
	{
		if (u[i].name === name)
			return u;
	}
	
	return null;
};



/*

	Send messages

*/

MpgClient.prototype.sendMsg = function(msg, userName) {
	
	var data;
	if (userName === undefined) {
		
		data = { chanMsg : { msg : msg } };
		
	} else {
		
		data = { userMsg : { name: userName, msg : msg } };
	}
	
	this.websocket.send( JSON.stringify(data) );
};

MpgClient.prototype.sendUserEvt = function(evtDatas, userName) {
	
	var data;
	if (userName === undefined) {
		
		data = { userEvt : { name : this.me.name, evt : evtDatas } };
		
	} else {
		
		data = { userEvt : { name : userName, evt : evtDatas } };
	}
	
	this.websocket.send( JSON.stringify(data) );
};

MpgClient.prototype.sendUserDatas = function(datas, userName) {
	
	var data;
	if (userName === undefined) {
		
		data = { userData : { name : this.me.name, datas : datas } };
		
	} else {
		
		data = { userData : { name : userName, datas : datas } };
	}
	
	this.websocket.send( JSON.stringify(data) );
};

MpgClient.prototype.sendChanEvt = function(evtDatas) {
	
	var data = { chanEvt : evtDatas };
	this.websocket.send( JSON.stringify(data) );
};

MpgClient.prototype.sendChanDatas = function(datas) {
	
	var data = { chanData : datas };
	this.websocket.send( JSON.stringify(data) );
};




/*
		!!!!!!!!!!!!!!!!!!!!

			changeChan
			getChanList
			getUserList
			changeName
			kickUser
			
				set-user-name "newName"
				set-user-chan "newChanName"

				set-chan-name "newName"
				set-chan-pass "newPass"

				get-user-data "userName"

				get-list-user
				get-list-user-data

				get-list-chan
				get-list-chan-data

				get-chan-data

				kick-user "userName"
			
*/

MpgClient.prototype.changeChan = function(chanName, chanPass) {
	
	if (chanPass === undefined)
		chanPass = "";
	
	var data = { server : { cmd: "set-user-chan", data: {} } };
	this.websocket.send( JSON.stringify(data) );
};




/*

	Private Mpg Methods

*/

MpgClient.prototype._parse = function(evt)
{
	var msg = JSON.parse(evt.data);
	
	
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
			this.onEvtChan(dt);
		}
		else if (d.type === "user") {
			
			var dt = d.data;
			var u = this.getUser(d.name);
			this._setUserData(dt, u);
			this.onEvtChan(dt, u);
		}			
	}
};

MpgClient.prototype._setUserData = function(data, user) {
	
	for (key in data) {

		user.data[key] = data[key];
	}		
};

MpgClient.prototype._setChanData = function(data) {
	
		
	for (key in data) {

		this.chan.data[key] = data[key];
	}
};