"use strict";

const { models:{ UserModel } } = require('../models');

let exportFuns = {};

exportFuns.create = async function (createPattern) {
	return UserModel.create(createPattern).then(createRes => {
		return createRes;
	}).catch(err => {
		throw err;
	});
}

exportFuns.findOneAndSelect = async function (findPattern, select) {
	return  UserModel.findOne(findPattern).select(select).then(resultData => {
		return resultData;
	}).catch(err => {
		throw err;
	});
}
	
exportFuns.updateOne = async function (findPattern, updatePattern) {
	return UserModel.updateOne(findPattern, updatePattern).then(updateRes => {
		return updateRes;
	}).catch(err => {
		throw err;
	});
}

exportFuns.updateMany = async function (findPattern, updatePattern) {
	return UserModel.updateMany(findPattern, updatePattern).then((updateRes) => {
		return updateRes;
	}).catch((err) => {
		throw err;
	});
};

exportFuns.findOneAndUpdate = async function (findPattern, updatePattern) {
	let options = { new: true, runValidators: true, upsert: true };
	return UserModel.findOneAndUpdate(findPattern, updatePattern, options).then(updatedData => {
		return updatedData;
	}).catch(err => {
		throw err;
	});
}

exportFuns.findOne = async function (findPattern, sortPattern) {
	return UserModel.findOne(findPattern).sort(sortPattern).then(resultData => {
		return resultData;
	}).catch(err => {
		throw err;
	});
}

exportFuns.findAll = async function (findPattern) {
	return UserModel.find(findPattern).then(resultData => {
		return resultData;
	}).catch(err => {
		throw err;
	});
}

exportFuns.deleteOne = async function (deletePattern) {
	return UserModel.deleteOne(deletePattern).then(deleteRes => {
		return deleteRes;
	}).catch(err => {
		throw err;
	});
}

exportFuns.countDocuments = async function (findPattern) {
	return UserModel.countDocuments(findPattern).then((count) => {
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

	return UserModel.paginate(query, options).then((paginatedData) => {
		return paginatedData;
	}).catch(err => {
		throw err;
	});
}

exportFuns.getAggregatePaginatedData = async function (queryPattern, sortPattern, page_no, limit) {
	let query = UserModel.aggregate(queryPattern);
	let options = {
		sort: sortPattern,
		page: page_no,
		limit: limit
	};

	return UserModel.aggregatePaginate(query, options).then(resultData => {
		return resultData;
	}).catch(err => {
		throw err;
	});
}

exportFuns.aggregateFindOne = async function (queryPattern, sortPattern) {
	let query = UserModel.aggregate(queryPattern);
	let options = {
		sort: sortPattern,
		page: 1,
		limit: 1
	};

	return UserModel.aggregatePaginate(query, options).then(resultData => {
		return resultData.docs.length > 0 ? resultData.docs[0] : null;
	}).catch(err => {
		throw err;
	});
}

exportFuns.getDistinctRecord = async function (field, findPattern) {
	return UserModel.distinct(field, findPattern).then(resultData => {
		return resultData;
	}).catch(err => {
		throw err;
	});
}

module.exports = exportFuns;
