'use strict';

/*!
 * mpgs
 * Copyright(c) 2016 Damien Doussaud (namide.com)
 * MIT Licensed
 */

var config = require('./../config');

/**
 * A channel is like a room for a chat.
 *
 * @param {String} name		Name of the Chan.
 * @param {String} pass		Password of the Chan.
 * @constructor
 * @api public
 */
function Chan(name, pass) {

	//this.name = name;
	this.pass = (pass === null) ? "" : pass;
	
	
	this.users = [];
	
	this.data = {name: name, id: ++Chan.id};
	for (var key in config.chan.default) {
		this.data[key] = config.chan.default[key];
	}
	
	this.onEmpty;
	
	//this.init(user);
}

/**
 * ID of the last channel created.
 *
 * @type {Number}
 * @private
 */
Chan.id = -1;

/**
 * Join this channel.
 *
 * @param {User} user		User who join the chan.
 * @api public
 */
Chan.prototype.join = function(user) {
	
	var oldChan = user.chan;
	if (oldChan != undefined)
		oldChan.leave(user);
	
	if (this.users.indexOf(user) < 0)
		this.users.push(user);
	
	user.chan = this;
	user.data.chan = {name: this.data.name, id: this.data.id};
	
	this.update();
};

/**
 * Leave this channel.
 *
 * @param {User} user		User who leave the chan.
 * @api public
 */
Chan.prototype.leave = function(user) {
	
	if (user.data.role === "moderator")
		user.data.role = "user";
	
	this.users.splice(this.users.indexOf(user), 1);
	user.chan = null; //{name: "", pass: ""};
	user.data.chan = {name: "", id: -1};
		
	this.update();
};

/**
 * Update the User(s) (test if the chan has a moderator).
 *
 * @api public
 */
Chan.prototype.update = function() {
	
	if (this.users.length < 1) {
		
		if (this.onEmpty !== undefined)
			this.onEmpty();
		
		return;
	}
	
	if (!this._hasModerator())
		this._assignModerator();
};

/**
 * Assign a new moderator.
 *
 * @param {User} user		User that would be moderator.
 * @private
 */
Chan.prototype._assignModerator = function(user) {
	
	if (!this.data.moderationEnabled)
		return false;
		
	if (user == undefined)
		user = this.users[0];
	
	if (user.data.role !== "admin" && user.data.role !== "moderator")
		user.data.role = "moderator";
};

/**
 * Test if this channel has a moderator.
 *
 * @returns {Boolean}
 * @private
 */
Chan.prototype._hasModerator = function() {
	
	var i = -1, l = this.users.length;
	while (++i < l) {
		if (this.users[i].data.role === "moderator")
			return true;
	}
	return false;
};

module.exports = Chan;