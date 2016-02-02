'use strict';

/*!
 * microchat
 * Copyright(c) 2016 Damien Doussaud (namide.com)
 * MIT Licensed
 */


var config = require('./config');
var Server = require('./lib/Server');

var server = new Server();
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: config.port, host: config.host, path: config.path });

console.log("WebSocketServer open on " + config.host + config.path + ":" + config.port );

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



*/