'use strict';

/*!
 * mpgs
 * Copyright(c) 2016 Damien Doussaud (namide.com)
 * MIT Licensed
 */

var config = require('./../config');

/**
 * A client user.
 *
 * @param {String} name		Name of the Chan.
 * @param {String} pass		Password of the Chan.
 * @constructor
 * @api public
 */
function User(socket, id) {

	this.socket = socket;
	this.chan;
	
	this.data = {id: ++User.id, name: ""};
	
	for (var key in config.user.default) {
		
		this.data[key] = config.user.default[key];
	}
}

/**
 * ID of the last user initialized.
 *
 * @type {Number}
 * @private
 */
User.id = -1;

module.exports = User;
