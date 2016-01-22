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



	TODO: new VO struct
	
	{
		(not "name" for Client->Server)
		user 
		userMsg:		{name: $UserName, text: $String}
		userEvt:		{name: $UserName, label: $String, data: $data}
		userData:		{name: $UserName, data: $data}
		
		(not name for Client->Server)
		chanMsg:		{name: $UserName, text: $String}
		chanEvt:		{label: $String, data: $data}
		chanData:		$data
		chanUserList: 	$Array
						// [ "Jean", "Nicolas" ... ]
						// [ {role:0, data: {name: "Jean"}}, {role:1, data: {name: "Nicolas", x: 25, y: 65}} ]
		
		serverMsg:		$String
		serverEvt:		{label: $String, data: $data}	# server -> client
		serverCmd:		{label: $String, data: $data}	# client -> server
		serverChanList: $Array
						// [ "SF", "Linux" ... ]
						// [ {data: {name: "SF", color: "003"}}, {data: {name: "Linux", min: 1, max: 2000}} ]
	}
	
	serverCmd:
	
		{label: "set-chan-pass", data:"newPass"}
		
		{label: "get-user-data", data: "userName"}
		
		{label: "get-list-user"}
		{label: "get-list-user-data"}
		
		{label: "get-list-chan"}
		{label: "get-list-chan-data"}
		
		{label: "get-chan-data"}
		
		{label: "kick-user", data: "userName"}
	
	
	serverEvt:

		{label: "add-user", data:$UserData}
		{label: "add-user", data:$UserData}









==========================================================



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
				data: { ... }
			}
		
		data
			{
				type: chan / user
				name:
				data: { ... }
			}
	
	}
	
	
	Commands:
	
		set-chan-pass "newPass"
		
		get-user-data "userName"
		
		get-list-user
		get-list-user-data
		
		get-list-chan
		get-list-chan-data
		
		get-chan-data
		
		kick-user "userName"
		
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