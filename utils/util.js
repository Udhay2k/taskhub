var str = require('./util/str.js');
var obj = require('./util/obj.js');
var file = require('./util/file.js');
var folder = require('./util/folder.js');
const db = require('../database/db');
const _ = require("underscore"),
	fs = require("fs"),
	validator = require('validator'),
	fsPromises = fs.promises;

// Object functions
exports.isValidObject = function (item) {
	return obj.isValid(item);
};

// Object functions
var isArray = (exports.isArray = function (ar) {
	return ar instanceof Array || Array.isArray(ar) || (ar && ar !== Object.prototype && isArray(ar.__proto__));
});

exports.objectType = function (item) {
	return obj.getType(item);
};

var isEmptyObject = exports.isEmptyObject = function (item) {
	return obj.isEmpty(item);
};

exports.isString = function (value) {
	return typeof value === 'string' || value instanceof String;
}

exports.isObject = function (value) {
	return value && typeof value === 'object' && value.constructor === Object;
}

exports.validateId = function (id) {
	if (!isNullOrEmpty(id) && (id.length == 12 || id.length == 24)) {
		return true;
	}

	return false;
};

// String functions
exports.strEndsWith = function (target, search) {
	return str.endsWith(target, search);
};

var isNullOrEmpty = exports.isNullOrEmpty = function (target) {
	return str.isNullOrEmpty(target);
};

exports.isPlainObject = function (obj) {
	return Object.prototype.toString.call(obj) === '[object Object]';
};

exports.replaceEmpty = function (target) {
	return str.replaceEmpty(target);
};

// file Functions
exports.isValidFile = function (filePath) {
	return file.isValid(filePath);
};

exports.filePath = function (filePath, fileName) {
	return file.filePath(filePath, fileName);
};

exports.fileUpload = function (uploadFile, targetPath, fileName, cb) {
	folder.createIfNot(targetPath);
	file.upload(uploadFile, targetPath + fileName, function (err) {
		if (err) {
			cb(err);
		}
		cb();
	});
};

exports.uploadFile = async (folder, targetPath, buffer) => {
	let result = {};

	try {
		await createDir(`${__dirname}` + "/.." + folder);

		let status = await fsPromises.writeFile(targetPath, buffer, "base64");

		result = {
			"status": true,
			"result": status
		};
	} catch (e) {
		result = {
			"status": false,
			"result": {},
			message: e.message
		};
	}

	return result;
};

exports.fileUploadSync = function (uploadFile, targetPath, fileName) {
	folder.createIfNot(targetPath);
	file.uploadSync(uploadFile, targetPath + fileName);
};

exports.fileUploadEncode = function (encodeStr, targetPath, fileName, cb) {
	folder.createIfNot(targetPath);

	file.encodeUpload(encodeStr, targetPath + fileName, function (err) {
		if (err) {
			cb(err);
		}
		cb();
	});
};

var createDir = (exports.createDir = async function (path) {
	let result = {};

	try {
		if (!fs.existsSync(path)) {
			await fsPromises.mkdir(path);
		}

		result = {
			"status": true
		};
	} catch (e) {
		result = {
			"status": false
		};
	}

	return Promise.resolve(result);
});

exports.deleteFile = function (src, cb) {
	return new Promise(function (resolve, reject) {
		fsPromises.unlink(src).then(result => {
			resolve({ "status": true });
		}).catch(error => {
			resolve({ "status": true });
		});
	});
};

// folder functions
exports.validPath = function (filePath) {
	return folder.getValid(filePath);
};

exports.isValidPath = function (filePath) {
	return folder.isValid(filePath);
};

exports.getIsoDate = function () {
	var isoString = new Date().toISOString();
	var isoDate = new Date(isoString);

	return isoDate;
};

exports.stringToDate = function (date) {
	if (!isNullOrEmpty(date)) {
		return (new Date(date));
	}

	return '';
};

var convertToJsonObject = exports.convertToJsonObject = function (obj) {
	if (typeof obj == 'object') {
		obj = JSON.stringify(obj);
	}

	if (typeof obj == 'string') {
		obj = JSON.parse(obj);
	}

	return obj;
};

var validateEmail = exports.validateEmail = function (email) {
	if (!isNullOrEmpty(email)) {
		var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
		return regex.test(email);
	}

	return false;
};

var _cryptString = function (str, fromType, toType) {
	var cipher = crypto.createCipher('des-ede3-cbc', secretkey);
	var cryptedPassword = cipher.update(str, fromType, toType);
	cryptedPassword += cipher.final(toType);

	return cryptedPassword;
};

var _decryptString = function (str, fromType, toType) {
	var decipher = crypto.createDecipher('des-ede3-cbc', secretkey);
	var decryptedPassword = decipher.update(str, fromType, toType);
	decryptedPassword += decipher.final(toType);

	return false;
};

exports.validateObject = function (fields, obj) {
	let result = { status: true, message: "" }
	let fieldNames = []
	const skippable = ["createdBy", "createdAt", "createdName", "updatedAt", "updatedBy", "updatedName"]

	for (var f = 0; f < fields.length; f++) {
		let fieldObj = fields[f]
		let name = fieldObj.name;
		fieldNames.push(name);

		if (fieldObj && (fieldObj.nullable == false && (fieldObj.type == "string" || fieldObj.type == "date" || fieldObj.type == "datetime"))) {
			let value = obj[name] ? obj[name].toString() : "";
			value = value.trim();

			if (validator.isEmpty(value)) {
				result["status"] = false;
				result["message"] = fieldObj.displayName + " " + "is required.";

				return result;

			} else if (name == "email" && !validateEmail(value)) {
				result["status"] = false;
				result["message"] = fieldObj.displayName + " " + "is invalid.";

				return result;

			} else if (name == "dob") {
				let dob = new Date(value);

				if (dob > new Date()) {
					result["status"] = false;
					result["message"] = fieldObj.displayName + " should be lesser than today's date.";
				}
			}
		}
	}

	for (const param in obj) {
		if (skippable.includes(param)) {
			continue;

		} else if (!fieldNames.includes(param)) {
			result["status"] = false;
			result["message"] = param + " property passed in is invalid.";
			break;
		}
	}

	return result;
};

exports.createdBy = function (obj, user) {
	let isoString = new Date().toISOString();
	let isoDate = new Date(isoString);

	obj["createdBy"] = !isEmptyObject(user) && user["uid"] && !isNullOrEmpty(user["uid"]) ? db.objectId(user["uid"]) : "";

	if (obj && obj.hasOwnProperty('userId')) {
		obj["userId"] = !isEmptyObject(obj) && obj["userId"] && !isNullOrEmpty(obj["userId"]) ? db.objectId(obj["userId"]) : "";
	}

	obj["createdAt"] = isoDate;
	obj["createdName"] = !isEmptyObject(user) && user["name"] ? user["name"] : "";
	obj["createdName"] = !isEmptyObject(user) && user["name"] ? user["name"] : "";

	return obj;
};

exports.updated = function (obj, user) {
	let isoString = new Date().toISOString();
	let isoDate = new Date(isoString);

	obj["updatedBy"] = !isEmptyObject(user) && user["uid"] && !isNullOrEmpty(user["uid"]) ? db.objectId(user["uid"]) : "";

	if (obj && obj.hasOwnProperty('userId')) {
		obj["userId"] = !isEmptyObject(obj) && obj["userId"] && !isNullOrEmpty(obj["userId"]) ? db.objectId(obj["userId"]) : "";
	}

	obj["updatedAt"] = isoDate;
	obj["updatedName"] = !isEmptyObject(user) && user["name"] ? user["name"] : "";

	return obj;
};

exports.getMetaDataFilter = (fields, allFields) => {
	let _rtnFields = [];

	if (fields.indexOf("_id") == -1) {
		fields.push("_id");
	}

	fields.forEach(field => {
		let fieldData = field.split(".");
		let name = fieldData[0];
		let parent = "";

		if (fieldData.length == 2) {
			parent = fieldData[0];
			name = fieldData[1];
		}

		let fieldObj = _.findWhere(allFields, {
			name: name,
			parent: parent
		});

		if (fieldObj) {
			if (!_.findWhere(_rtnFields, {
				name: name,
				parent: parent
			})) {
				_rtnFields.push(fieldObj);
			}
		}
	});

	return _rtnFields;
};

exports.getDomainDetails = function loginUser(req) {
	var ip = req.clientIp;
	var host = req.get('host');
	var origin = req.get('origin');
	const secureUrl = 'https://' + req.hostname + req.originalUrl

	return { ip: ip, secureUrl: secureUrl, hostname: req.hostname, ips: req.ips, host: host, origin: origin };
}

exports.throwError = function (message, statusCode) {
	let err = new Error(message);

	if (statusCode) {
		err["statusCode"] = statusCode;
	}

	return err;
};

exports.getCurrentUTC = function () {
	let curDateTime = new Date(),
		currentUTCString = new Date(curDateTime).toUTCString(),
		currentUTC = new Date(currentUTCString);

	return currentUTC;
};