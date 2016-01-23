'use strict';

/*!
 * mpgs
 * Copyright(c) 2016 Damien Doussaud (namide.com)
 * MIT Licensed
 */


var config = require('./../config');


function Chan(name, pass, id) {

	//this.name = name;
	this.pass = (pass === null) ? "" : pass;
	
	
	this.users = [];
	
	this.data = { name: name, id: id };
	for (var key in config.defaultChan.data) {
		this.data[key] = config.defaultChan.data[key];
	}
	
	this.onEmpty;
	
	//this.init(user);
}

Chan.prototype.join = function(user) {
	
	this.users.push(user);
	user.data.chan = this;
	
	console.log(user.data.name + " join " + this.data.name);
	
	if (this.users.length < 2)
		this.assignModerator(user);
};

Chan.prototype.leave = function(user) {
	
	user.removeModerator();
	this.users.splice(this.users.indexOf(user), 1);
	user.chan = undefined;
	
	console.log(user.data.name + " leave " + this.data.name);
	
	
	this.update();
};

Chan.prototype.update = function() {
	
	if (this.users.length < 1 && this.onEmpty !== undefined)
		this.onEmpty();
	
	if (!this.hasModerator())
		this.assignModerator();
};

Chan.prototype.assignModerator = function(user) {
	
	if (!this.data.moderationEnabled)
		return false;
		
	if (user === null)
		user = this.users[0];
		
	user.setModerator();
	console.log(user.data.name + " is now moderator");
};

Chan.prototype.hasModerator = function() {
	
	var i = -1, l = this.users.length;
	while (++i < l) {
		if (this.users[i].isModerator())
			return true;
	}
	return false;
};

module.exports = Chan;