"use strict";

const PlayerPropsModel = require('../models/PlayerProps.Model.js');
let exportFuns = {};

exportFuns.create = async function (createPattern) {
	return PlayerPropsModel.create(createPattern).then(createRes => {
		return createRes;
	}).catch(err => {
		throw err;
	});
}

exportFuns.updateOne = async function (findPattern, updatePattern) {
	return PlayerPropsModel.updateOne(findPattern, updatePattern).then(updateRes => {
		return updateRes;
	}).catch(err => {
		throw err;
	});
}

exportFuns.updateMany = async function (findPattern, updatePattern) {
	return PlayerPropsModel.updateMany(findPattern, updatePattern).then((updateRes) => {
		return updateRes;
	}).catch((err) => {
		throw err;
	});
};

exportFuns.findOneAndUpdate = async function (findPattern, updatePattern) {
	let options = { new: true, runValidators: true, upsert: true };
	return PlayerPropsModel.findOneAndUpdate(findPattern, updatePattern, options).then(updatedData => {
		return updatedData;
	}).catch(err => {
		throw err;
	});
}

exportFuns.findOne = async function (findPattern, sortPattern) {
	return PlayerPropsModel.findOne(findPattern).sort(sortPattern).then(resultData => {
		return resultData;
	}).catch(err => {
		throw err;
	});
}

exportFuns.findAll = async function (findPattern) {
	return PlayerPropsModel.find(findPattern).then(resultData => {
		return resultData;
	}).catch(err => {
		throw err;
	});
}

exportFuns.deleteOne = async function (deletePattern) {
	return PlayerPropsModel.deleteOne(deletePattern).then(deleteRes => {
		return deleteRes;
	}).catch(err => {
		throw err;
	});
}

exportFuns.countDocuments = async function (findPattern) {
	return PlayerPropsModel.countDocuments(findPattern).then((count) => {
		return count;
	}).catch(err => {
		throw err;
	});
}

exportFuns.getPaginatedData = async function (findPattern, sortPattern, page_no, limit) {
	let query = findPattern;
	let options = {
		sort: sortPattern,
		page: page_no,
		limit: limit
	};

	return PlayerPropsModel.paginate(query, options).then((paginatedData) => {
		return paginatedData;
	}).catch(err => {
		throw err;
	});
}

exportFuns.getAggregatePaginatedData = async function (queryPattern, sortPattern, page_no, limit) {
	let query = PlayerPropsModel.aggregate(queryPattern);
	let options = {
		sort: sortPattern,
		page: page_no,
		limit: limit
	};

	return PlayerPropsModel.aggregatePaginate(query, options).then(resultData => {
		return resultData;
	}).catch(err => {
		throw err;
	});
}

exportFuns.aggregateFindOne = async function (queryPattern, sortPattern) {
	let query = PlayerPropsModel.aggregate(queryPattern);
	let options = {
		sort: sortPattern,
		page: 1,
		limit: 1
	};

	return PlayerPropsModel.aggregatePaginate(query, options).then(resultData => {
		return resultData.docs.length > 0 ? resultData.docs[0] : null;
	}).catch(err => {
		throw err;
	});
}

exportFuns.getDistinctRecord = async function (field, findPattern) {
	return PlayerPropsModel.distinct(field, findPattern).then(resultData => {
		return resultData;
	}).catch(err => {
		throw err;
	});
}

module.exports = exportFuns;