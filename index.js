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


/*
console.log("- Check IP");
var os = require('os');
var ifaces = os.networkInterfaces();
Object.keys(ifaces).forEach(function (ifname) {

	var alias = 0;
	ifaces[ifname].forEach(function (iface) {

		if ('IPv4' !== iface.family || iface.internal !== false) {
			// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
			return;
		}

		if (alias >= 1) {
			// this single interface has multiple ipv4 addresses
			console.log("	" + ifname + ':' + alias, iface.address);
		} else {
			// this interface has only one ipv4 adress
			console.log("	" + ifname, iface.address);
		}
		++alias;
	});
});
console.log("- Start server");
*/


// Init the server
var server = new Server();
var wss = new WebSocketServer({port: config.port, host: config.host, path: config.path});

console.log("Server init: " + config.host + config.path + ":" + config.port);





// Listen the new connections
wss.on('connection', function connection(ws) {
	server.add(ws);
});
