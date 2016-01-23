'use strict';

/*!
 * mpgs
 * Copyright(c) 2016 Damien Doussaud (namide.com)
 * MIT Licensed
 */

var config = require('./../config');

var ROLES = {
	USER : 0,
	MODERATOR : 1,
	ADMIN : 2
};

function User(socket, id) {

	//this.name;
	this.role = ROLES.USER;
	this.socket = socket;
	this.chan;
	
	this.data = { id: id, name: "" };
	for (var key in config.defaultUser.data) {
		this.data[key] = config.defaultUser.data[key];
	}
	
	//this.add(user);
	
}

User.prototype.setModerator = function() {
	this.role |= ROLES.MODERATOR;
};

User.prototype.removeModerator = function() {
	if (this.isModerator())
		 this.role ^= ROLES.MODERATOR;
};

User.prototype.isModerator = function() {
	return (this.role & ROLES.MODERATOR) == ROLES.MODERATOR;
};

User.prototype.setAdmin = function() {
	this.role |= ROLES.ADMIN;
};

User.prototype.removeAdmin = function() {
	if (this.isAdmin())
		 this.role ^= ROLES.ADMIN;
};

User.prototype.isAdmin = function() {
	return (this.role & ROLES.ADMIN) == ROLES.ADMIN;
};


module.exports = User;