'use strict';

/*!
 * microchat
 * Copyright(c) 2016 Damien Doussaud (namide.com)
 * MIT Licensed
 */

/**
 * Module dependencies
 */

console.log("multiserver started");

var config = require('./config');

var Server = require('./lib/Server');
var server = new Server();



var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: config.port, host:config.host, path:config.path });

wss.on('connection', function connection(ws) {
	server.add(ws);
});

/*

	client -> server
	{
		server : { cmd:$String, data:Object } ,
		userMsg : { name:$UserName, msg:$String } ,
		chanMsg:$String,
		chanEvt : { $datas }
		chanData : { $datas }
		userData : { name:$UserName, data: { $datas } } ,
		userEvt : { name:$UserName, evt: { $datas } }
		
	}

	server -> client
	{
		msg
			{
				type: server / chan / user
				from: 
				?to: 
				msg: 
			}
		
		list
			{
				type: chan / user
				list: []
					// [ "Jean", "Nicolas" ... ]
					// [ {name:"Jean", role:0}, {name:"Nicolas", role:1, x:25, y:65} ]
			}
		
		evt
			{
				type: chan / user
				name:
				datas: { ... }
			}
		
		data
			{
				type: chan / user
				name:
				datas: { ... }
			}
	
	}

*/









/**
 * Functions
 */

/*var user = new User("jean");
var chan = new Chan(user, "Paris");*/



/*
ws.on('open', function open() {
	var array = new Float32Array(5);

	for (var i = 0; i < array.length; ++i) {
	array[i] = i / 2;
	}

	ws.send(array, { binary: true, mask: true });
});

ws.on('message', function(data, flags) {
	console.log("test");
	// flags.binary will be set if a binary data is received.
	// flags.masked will be set if the data was masked.
});
*/