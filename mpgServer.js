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
var wss = new WebSocketServer({ port: config.port, host: config.host, path: config.path });

wss.on('connection', function connection(ws) {
	server.add(ws);
});

/*wss.on('error', function connection(ws) {
	console.log("error?");
	//server.add(ws);
});*/

/*

		TODO: new VO struct
	
	{
		chanMsg:		{from: $UserId, text: $String}
			# Client->Server => chanMsg:		$String
		userMsg:		{from: $UserId, to: $UserId, text: $String}		# from disable for Client->Server, to disable fo Server->Client
		serverMsg:		$String											# server -> client
		
		userEvt:		{from: $UserId, label: $String, data: $data}	# from facultative for Client->Server
		chanEvt:		{label: $String, data: $data}
		serverEvt:		{label: $String, data: $data}					# server -> client
			ex: {label: "error", data: {id: $ErrorNum, vars:[]} }
			ex: {label: "chan-added", data: {id: $chanId, name: $chanName} }
			ex: {label: "chan-removed", $chanName }
		
		userData:		$Data											# id required
		chanData:		$Data
		
		chanUserList: 	$Array											# server -> client
						[ {role:0, data: {name: "Jean", id: 5}}, {role:1, data: {name: "Nicolas" id: 25, x: 25, y: 65}} ]
		
		serverCmd:		{label: $String, data: $data}					# client -> server
		
		serverChanList: $Array											# server -> client
						// [ "SF", "Linux" ... ]
	}
	
	serverCmd:	(client -> server)
	
		{label: "get-list-chan"}
		{label: "kick-user", data: {id : $UserId} }



















	OLD
	
	{
		(not "name" and "from" for Client->Server)
		userMsg:		{from: $UserName, to: $UserId, text: $String}		# to disable for Server->Client
		userEvt:		{name: $UserName, label: $String, data: $data}		
		userData:		$Data
		
		(not name for Client->Server)
		chanMsg:		{name: $UserName, text: $String}					<-> $String
		chanEvt:		{label: $String, data: $data}
		
			{label: "user-chan-change", data: {user:$UserData, chan:$ChanData}
		
		chanData:		$data
		chanUserList: 	$Array												# server -> client
						// [ "Jean", "Nicolas" ... ]
						// [ {role:0, data: {name: "Jean", id: 5}}, {role:1, data: {name: "Nicolas" id: 25, x: 25, y: 65}} ]
		
		serverMsg:		$String							# server -> client
		serverEvt:		{label: $String, data: $data}	# server -> client
		serverCmd:		{label: $String, data: $data}	# client -> server
		serverChanList: $Array							# server -> client
						// [ "SF", "Linux" ... ]
						// [ {data: {id: 4, name: "SF", color: "003"}}, {id: 658, data: {name: "Linux", min: 1, max: 2000}} ]
	}
	
	serverCmd:	(client -> server)
	
		{label: "set-chan-pass", data:"newPass"}
		#{label: "set-user-chan", data:{name: "newChanName", pass:"newChanPass"}
		
		#{label: "get-user-data", data: "UserName"}
		
		{label: "get-list-user"}
		{label: "get-list-user-data"}
		
		{label: "get-list-chan"}
		{label: "get-list-chan-data"}
		
		#{label: "get-chan-data"}
		
		{label: "kick-user", data: "userName"}
	
	
	serverEvt:

		# {label: "user-connected", data: $UserData}
		{label: "user-offline", data: {msg: $String, name: $UserName, id:$UserID}}
		
		
		{label: "error", data: {id: $ErrorNum, vars:[]} }
			
			0	"no connection"
			
			
			
			
			100	"commands"
			101	"Command error: label undefined ($1)"
			102 "Unknown command ($1)"
			
			200	"messages"
			201	"Message to user $1 error (text or user name empty)"
			
			300	"user"
			301	"The user $1 don't exist"
			302	"You don't have permission to change chan data ($1)"
			303	"You can only use alphanumeric, - and _ in an user name but you have write \"$1\""
			304	"Name undefined"
			305	"The name $1 is already used"
			
			400	"chan"
			401	"You don't have permission to change the pass of the chan $1 but you have write \"$1\""
			



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