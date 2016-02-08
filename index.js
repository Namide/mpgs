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



console.log("- Check IP");
var os = require('os');
var ifaces = os.networkInterfaces();
var HOST = undefined;
Object.keys(ifaces).forEach(function (ifname) {

	var alias = 0;
	ifaces[ifname].forEach(function (iface) {

		if ('IPv4' !== iface.family || iface.internal !== false) {
			// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
			return;
		}

		if (alias >= 1) {
			// this single interface has multiple ipv4 addresses
			HOST = iface.address;
			console.log("	" + ifname + ':' + alias, iface.address);
			
		} else {
			// this interface has only one ipv4 adress
			HOST = iface.address;
			console.log("	" + ifname, iface.address);
			
		}
		++alias;
	});
});
console.log("- Start server");


//console.log(process.env);

// Init the server
var server = new Server();
var wss = new WebSocketServer({port: (process.env.PORT || config.port), host: (HOST || config.host), path: config.path});

console.log("Server init: " + (HOST || config.host) + config.path + ":" + (process.env.PORT || config.port));





// Listen the new connections
wss.on('connection', function connection(ws) {
	server.add(ws);
});
