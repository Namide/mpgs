'use strict';

/*!
 * microchat
 * Copyright(c) 2016 Damien Doussaud (namide.com)
 * MIT Licensed
 */







var User = require('./User');
var Chan = require('./Chan');


/*var config = require('./config');
var chaine;

chaine = fs.readFileSync("fichierEleve", "UTF-8");
var eleve = JSON.parse(chaine);*/

function Server() {

	this.nonames = [];
	
	this.users = {};
	this.chans = {};
	this.chans._ = new Chan();
	
}




Server.prototype.add = function(socket) {
	
	var user = new User(socket);
	
	this.nonames.push(user);
	
	console.log("new user connected");

	var server = this;
	socket.on('message', function incoming(data, flags) {
		server.command(data);
		
		console.log("FLAGS")
		console.log(flags);
	});

	socket.send('{"msg":"You are connected!"}');
};

Server.prototype.command = function(user, data) {
	
	var json;
	
	try {
		
		var json = JSON.parse(data);
		
	} catch(e) {
		
		console.log("JSON ERROR");
		console.log(e.message);
		return;
	}
	
	if (json === null)
		return;
	
	if (json.cmd !== null) {
		/*switch (json.cmd) {
				
			case "join":

				break;
			case "name":
				
				break;
			case "msg":

				break;
			case "logout":

				break;
			case "logout":

				break;
			default:
				
				
		}*/
	}
};



/*

		COMMANDS

*/

module.exports = Server;