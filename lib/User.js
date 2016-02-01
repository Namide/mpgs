'use strict';

/*!
 * mpgs
 * Copyright(c) 2016 Damien Doussaud (namide.com)
 * MIT Licensed
 */

var config = require('./../config');

function User(socket, id) {

	this.socket = socket;
	this.chan;
	
	this.data = {id: ++User.id, name: ""};
	
	for (var key in config.user.default) {
		
		this.data[key] = config.user.default[key];
	}
}

User.id = -1;

module.exports = User;
