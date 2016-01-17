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
		to: [server, chan, user] 
		data
			server :
				{ cmd, data }
				
			chan :
				{ msg }
			
			user :
				{ name, msg }
	}

	server -> client
	{
		type: serverMsg, chanMsg, userMsg, chanListName, chanListData, userListName, userlistData
		data
			msg
				{
					from: 
				}
			
			chanListName
				[name, ...]
				
			chanListData
				[{name, userLength, data}, ...]
			
			userlistName
				[name, ...]
			
			userlistData
				[{name, role, data}, ...]
		
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