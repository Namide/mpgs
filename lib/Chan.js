'use strict';

/*!
 * mpgs
 * Copyright(c) 2016 Damien Doussaud (namide.com)
 * MIT Licensed
 */


var config = require('./../config');


function Chan(name, pass) {

	//this.name = name;
	this.pass = (pass === null) ? "" : pass;
	
	
	this.users = [];
	
	this.data = {name: name, id: ++Chan.id};
	for (var key in config.defaultChan.data) {
		this.data[key] = config.defaultChan.data[key];
	}
	
	this.onEmpty;
	
	//this.init(user);
}

Chan.id = -1;

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

Chan.prototype.leave = function(user) {
	
	//user.removeModerator();
	if (user.data.role !== "moderator")
		user.data.role = "user";
	
	this.users.splice(this.users.indexOf(user), 1);
	user.chan = null;//{name: "", pass: ""};
	user.data.chan = null; //{name: "", id: -1};
	
	//console.log(user.data.name + " leave " + this.data.name);
	
	
	this.update();
};

Chan.prototype.update = function() {
	
	if (this.users.length < 1) {
		
		if (this.onEmpty !== undefined)
			this.onEmpty();
		
		return;
	}
	
	if (!this.hasModerator())
		this._assignModerator();
};

Chan.prototype._assignModerator = function(user) {
	
	if (!this.data.moderationEnabled)
		return false;
		
	if (user == undefined)
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