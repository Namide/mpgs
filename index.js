'use strict';

/*!
 * mpg
 * Copyright(c) 2016 Damien Doussaud (namide.com)
 * MIT Licensed
 */

// Init the lib WS
var Server = require('./lib/Server');
var WebSocketServer = require('ws').Server;

// Load the config datas
var config = require('./config');

// Init the server
var server = new Server();
var wss = new WebSocketServer({ port: config.port, host: config.host, path: config.path });
console.log("WebSocketServer init on " + config.host + config.path + ":" + config.port );

// Listen the new connections
wss.on('connection', function connection(ws) {
	server.add(ws);
});
