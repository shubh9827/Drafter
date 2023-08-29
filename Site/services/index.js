"use strict";

let userService = require("./AuthService.js");
let BlogsService = require("./BlogsService.js");
let DummyService = require("./DummyService.js");
let StudentService = require('./StudentService.js')
module.exports = {
	userService : userService,
	BlogsService : BlogsService,
	DummyService : DummyService,
	StudentService : StudentService
};