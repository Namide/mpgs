'use strict';

/*!
 * mpgs
 * Copyright(c) 2016 Damien Doussaud (namide.com)
 * MIT Licensed
 */

function MpgUser() {

	this.name;
	this.role;
	this.chan;
	
	this.data = {};	
}

function MpgChan() {

	this.name;
	this.users = [];
	this.datas = {};
}

function MpgClient(URI) {

	this.me = new MpgUser();
	this.chan;
	
	this.websocket;
	
	this.init();
}


/*

	WebSocket Events

*/

MpgClient.prototype.init = function() {
	
	this.websocket = new WebSocket(uri);
	this.websocket.onopen = function(evt) { this.onLog("socket open"); };
	this.websocket.onclose = function(evt) { this.onLog("socket closed"); };
	this.websocket.onmessage = this.msg;
	this.websocket.onerror = function(evt) { this.onLog("error: " + evt.data); };
	
	writeToScreen("CONNECTED");
	doSend("WebSocket rocks");
	
	this.onLog = function(msg) {
		console.log(msg);
	};
	
	this.onMsgUser = function(msg, name) {
		this.onLog(name + ":" + msg);
	};
	
	this.onMsgChan = function(msg, name) {
		this.onLog(name + ":" + msg);
	};
	
	this.onMsgServer = function(msg) {
		this.onLog(msg);
	};
	
	
	
	
	
};




/*

	Public Mpg Methods

*/

MpgClient.prototype.close = function() {
	this.websocket.close();
};

MpgClient.prototype.sendMsg = function(msg, userName) {
	
	var data;
	if (userName === null) {
		data = { userMsg : { chan : msg } };
	} else {
		data = { userMsg : { name: userName, msg : msg } };
	}
	
	websocket.send( JSON.stringify(data) );
};

MpgClient.prototype.sendUserEvt = function(evtDatas, userName) {
	
	var data;
	if (userName === null) {
		data = { userEvt : { name : this.me.name, evt : evtDatas } };
	} else {
		data = { userEvt : { name : userName, evt : evtDatas } };
	}
	
	websocket.send( JSON.stringify(data) );
};

MpgClient.prototype.sendUserDatas = function(datas, userName) {
	
	var data;
	if (userName === null) {
		data = { userData : { name : this.me.name, datas : datas } };
	} else {
		data = { userData : { name : userName, datas : datas } };
	}
	
	websocket.send( JSON.stringify(data) );
};

MpgClient.prototype.sendChanEvt = function(evtDatas) {
	
	var data = { chanEvt : evtDatas };
	websocket.send( JSON.stringify(data) );
};

MpgClient.prototype.sendChanDatas = function(datas) {
	
	var data = { chanData : datas };
	websocket.send( JSON.stringify(data) );
};





changeChan
getChanList
getUserList
changeName
kickUser





/*

	Private Mpg Methods

*/



MpgClient.prototype.msg(evt)
{
	var msg = JSON.parse(evt.data);
	
	if (msg.msg !== null) {
		switch(msg.from) {
			case "server":
				this.onMsgServer(msg.text);			
				break;
			case "chan":
				this.onMsgChan(msg.text, msg.name);			
				break;
			case "user":
				this.onMsgUser(msg.text, msg.name);			
				break;
			default :
				this.onLog ("from undefined: " + msg.from);
		}
	}
	
	if (msg.list !== null) {
		
	}
	
	if (msg.evt !== null) {
		
	}
	
	if (msg.data !== null) {
		
	}
};
