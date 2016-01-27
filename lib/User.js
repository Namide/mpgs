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
	
	this.data = {id: id, name: ""};
	for (var key in config.defaultUser.data) {
		this.data[key] = config.defaultUser.data[key];
	}
	
}

module.exports = User;
