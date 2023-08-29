const ServiceFuns = { };
const { models:{ Dummy } } = require('../models');

ServiceFuns.create = async (createObj) =>  await Dummy.create(createObj);
ServiceFuns.findOne = async (createObj) => await Dummy.findOne(createObj);
ServiceFuns.find = async (createObj) => await Dummy.find(createObj);

module.exports = ServiceFuns;