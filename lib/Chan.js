'use strict';

/*!
 * microchat
 * Copyright(c) 2016 Damien Doussaud (namide.com)
 * MIT Licensed
 */



function Chan(name, pass) {

	this.name = name;
	this.pass = (pass === null) ? "" : pass;
	
	this.users = [];
	this.datas = {};
	
	this.onEmpty;
	
	//this.init(user);
}

Chan.prototype.join = function(user) {
	
	this.users.push(user);
	user.chan = this;
	console.log(user.name + " join " + this.name);
	
	if (this.users.length < 2)
		this.assignModerator(user);
};

Chan.prototype.leave = function(user) {
	
	user.removeModerator();
	this.users.splice(this.users.indexOf(user), 1);
	user.chan = null;
	
	console.log(user.name + " leave " + this.name);
	
	
	if (this.users.length < 1 && this.onEmpty !== null)
		this.onEmpty();
	
	if (this.hasModerator())
		this.assignModerator();
};

Chan.prototype.assignModerator = function(user) {
	
	if (user === null)
		user = this.users[0];
		
	user.setModerator();
	console.log(user.name + " is now moderator");
};

Chan.prototype.hasModerator = function() {
	
	var i = -1, l = this.users.length;
	while (++i < l) {
		if (thus.users.isModerator())
			return true;
	}
	return false;
};

module.exports = Chan;