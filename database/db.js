const dbObj = require("./connection.js"),
	log = require("../utils/logger.js");
var done = 1;

var objectId = function (_id) {
	return dbObj._objectId(_id);
};

var newObjectId = function () {
	return dbObj._newObjectId();
};

var getObjectIds = function (ids) {
	var objectIds = [];

	_.each(ids, function (id) {
		objectIds.push(dbObj._objectId(id));
	});

	return objectIds;
};

var getCollection = async (dbname, table) => {
	let collection = null;

	if ($db[dbname]) {
		collection = await $db[dbname].collection(table);
	} else {
		let database = await dbObj.getDbConnection(dbname);
		collection = await database.collection(table);
	}

	return collection;
};

var insertOne = (dbname, table, data) => (
	new Promise((resolve, reject) => {
		if (done > 0) {
			done++;
			getCollection(dbname, table)
				.then(collection => dbObj.insertOne(collection, data))
				.then(function (res) {
					if (res["ops"].length > 0 && res["result"]["ok"] === 1) {
						resolve(res["ops"][0]);
					} else {
						resolve(res)
					}
				})
				.catch(error => {
					log.error(error);
					reject(error);
				});
		}
	})
);

var insertMany = (dbname, table, datas, options) => (
	new Promise((resolve, reject) => {

		getCollection(dbname, table)
			.then(collection => dbObj.insertMany(collection, datas, options))
			.then(function (result) {
				resolve(result);
			})
			.catch(error => {
				log.error(error);
				reject(error);
			});
	})
);

var updateOne = (dbname, table, query, data, options) => (
	new Promise((resolve, reject) => {

		getCollection(dbname, table)
			.then(collection => dbObj.updateOne(collection, query, data, options))
			.then(function (result) {
				resolve(result);
			})
			.catch(error => {
				log.error(error);
				reject(error);
			});
	})
);

var updateMany = (dbname, table, query, data, options) => (
	new Promise((resolve, reject) => {

		getCollection(dbname, table)
			.then(collection => dbObj.updateMany(collection, query, data, options))
			.then(function (result) {
				resolve(result);
			})
			.catch(error => {
				log.error(error);
				reject(error);
			});
	})
);

var update = (dbname, table, query, data, options) => (
	new Promise((resolve, reject) => {

		getCollection(dbname, table)
			.then(collection => dbObj.update(collection, query, data, options))
			.then(function (result) {
				resolve(result);
			})
			.catch(error => {
				log.error(error);
				reject(error);
			});
	})
);

var findOneAndUpdate = (dbname, table, query, data, options) => (
	new Promise((resolve, reject) => {

		getCollection(dbname, table)
			.then(collection => dbObj.findOneAndUpdate(collection, query, data, options))
			.then(function (result) {
				resolve(result);
			})
			.catch(error => {
				log.error(error);
				reject(error);
			});
	})
);

var count = (dbname, table, query) => (
	new Promise((resolve, reject) => {

		getCollection(dbname, table)
			.then(collection => dbObj.count(collection, query))
			.then(function (result) {
				resolve(result);
			})
			.catch(error => {
				log.error(error);
				reject(error);
			});
	})
);

var findOne = (dbname, table, query, options) => (
	new Promise((resolve, reject) => {

		getCollection(dbname, table)
			.then(collection => dbObj.findOne(collection, query, options))
			.then(function (result) {
				resolve(result);
			})
			.catch(error => {
				log.error(error);
				reject(error);
			});
	})
);

var find = (dbname, table, query, options) => (
	new Promise((resolve, reject) => {

		getCollection(dbname, table)
			.then(collection => dbObj.find(collection, query, options))
			.then(function (result) {
				resolve(result);
			})
			.catch(error => {
				log.error(error);
				reject(error);
			});
	})
);

var aggregate = (dbname, table, query) => (
	new Promise((resolve, reject) => {

		getCollection(dbname, table)
			.then(collection => dbObj.aggregate(collection, query))
			.then(function (result) {
				resolve(result);
			})
			.catch(error => {
				log.error(error);
				reject(error);
			});
	})
);

var deleteOne = (dbname, table, query) => (
	new Promise((resolve, reject) => {

		getCollection(dbname, table)
			.then(collection => dbObj.deleteOne(collection, query))
			.then(function (result) {
				resolve(result);
			})
			.catch(error => {
				log.error(error);
				reject(error);
			});
	})
);

var deleteMany = (dbname, table, query) => (
	new Promise((resolve, reject) => {

		getCollection(dbname, table)
			.then(collection => dbObj.deleteMany(collection, query))
			.then(function (result) {
				resolve(result);
			})
			.catch(error => {
				log.error(error);
				reject(error);
			});
	})
);

module.exports = {
	"objectId": objectId,
	"newObjectId": newObjectId,
	"getObjectIds": getObjectIds,
	"findOneAndUpdate": findOneAndUpdate,
	"find": find,
	"findOne": findOne,
	"insertOne": insertOne,
	"insertMany": insertMany,
	"updateOne": updateOne,
	"updateMany": updateMany,
	"deleteOne": deleteOne,
	"deleteMany": deleteMany,
	"count": count,
	"aggregate": aggregate,
	"update": update
};