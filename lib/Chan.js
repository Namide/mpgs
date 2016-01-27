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
	user.chan = this;
	user.data.chan = {name: this.name};
	
	if (this.users.length < 2)
		this.assignModerator(user);
};

Chan.prototype.leave = function(user) {
	
	//user.removeModerator();
	if (user.data.role !== "moderator")
		user.data.role = "user";
	
	this.users.splice(this.users.indexOf(user), 1);
	user.chan = null;//{name: "", pass: ""};
	user.data.chan = {name: "", pass: ""};
	
	//console.log(user.data.name + " leave " + this.data.name);
	
	
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
	
	if (user.data.role !== "admin" && user.data.role !== "moderator") {
		
		user.data.role = "moderator";//setModerator();
		//console.log(user.data.name + " is now moderator");
	}
		
};

Chan.prototype.hasModerator = function() {
	
	var i = -1, l = this.users.length;
	while (++i < l) {
		if (this.users[i].data.role === "moderator")
			return true;
	}
	return false;
};

module.exports = Chan;