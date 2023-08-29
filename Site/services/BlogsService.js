"use strict";

const { 
    models:{ BlogsModel } 
} = require('../models');

let exportFuns = {};

exportFuns.create = async function (createPattern) {
	return BlogsModel.create(createPattern).then(createRes => {
		return createRes;
	}).catch(err => {
		throw err;
	});
}

exportFuns.findOneAndSelect = async function (findPattern, select) {
	return  BlogsModel.findOne(findPattern).select(select).then(resultData => {
		return resultData;
	}).catch(err => {
		throw err;
	});
}
	
exportFuns.updateOne = async function (findPattern, updatePattern) {
	return BlogsModel.updateOne(findPattern, updatePattern).then(updateRes => {
		return updateRes;
	}).catch(err => {
		throw err;
	});
}

exportFuns.updateMany = async function (findPattern, updatePattern) {
	return BlogsModel.updateMany(findPattern, updatePattern).then((updateRes) => {
		return updateRes;
	}).catch((err) => {
		throw err;
	});
};

exportFuns.findOneAndUpdate = async function (findPattern, updatePattern) {
	let options = { new: true, runValidators: true, upsert: true };
	return BlogsModel.findOneAndUpdate(findPattern, updatePattern, options).then(updatedData => {
		return updatedData;
	}).catch(err => {
		throw err;
	});
}

exportFuns.findOne = async function (findPattern, sortPattern) {
	return BlogsModel.findOne(findPattern).sort(sortPattern).then(resultData => {
		return resultData;
	}).catch(err => {
		throw err;
	});
}

exportFuns.findAll = async function (findPattern) {
	return BlogsModel.find(findPattern).then(resultData => {
		return resultData;
	}).catch(err => {
		throw err;
	});
}

exportFuns.deleteOne = async function (deletePattern) {
	return BlogsModel.deleteOne(deletePattern).then(deleteRes => {
		return deleteRes;
	}).catch(err => {
		throw err;
	});
}

exportFuns.countDocuments = async function (findPattern) {
	return BlogsModel.countDocuments(findPattern).then((count) => {
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

	return BlogsModel.paginate(query, options).then((paginatedData) => {
		return paginatedData;
	}).catch(err => {
		throw err;
	});
}

exportFuns.getAggregatePaginatedData = async function (queryPattern, sortPattern, page_no, limit) {
	let query = BlogsModel.aggregate(queryPattern);
	let options = {
		sort: sortPattern,
		page: page_no,
		limit: limit
	};

	return BlogsModel.aggregatePaginate(query, options).then(resultData => {
		return resultData;
	}).catch(err => {
		throw err;
	});
}

exportFuns.aggregateFindOne = async function (queryPattern, sortPattern) {
	let query = BlogsModel.aggregate(queryPattern);
	let options = {
		sort: sortPattern,
		page: 1,
		limit: 1
	};

	return BlogsModel.aggregatePaginate(query, options).then(resultData => {
		return resultData.docs.length > 0 ? resultData.docs[0] : null;
	}).catch(err => {
		throw err;
	});
}

exportFuns.getDistinctRecord = async function (field, findPattern) {
	return BlogsModel.distinct(field, findPattern).then(resultData => {
		return resultData;
	}).catch(err => {
		throw err;
	});
}

module.exports = exportFuns;
