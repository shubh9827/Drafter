"use strict";

let PlayerProps = require("./PlayerProps");
let PlayerPropMembers = require("./PlayerPropMembers");
let PlayerPropDrafts = require("./PlayerPropDrafts");
let PlayerPropLimitations = require("./PlayerPropLimitations");
let PlayerPropRules = require("./PlayerPropRules");
let PlayerPropReports = require("./PlayerPropReports");
let Historicals = require("./Historicals");

module.exports = {
	PlayerPropsService: PlayerProps,
	PlayerPropMembersService: PlayerPropMembers,
	PlayerPropDraftsService: PlayerPropDrafts,
	PlayerPropLimitationsService: PlayerPropLimitations,
	PlayerPropRulesService: PlayerPropRules,
	PlayerPropReportsService: PlayerPropReports,
	HistoricalsService: Historicals
};