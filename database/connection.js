const mongo = require("mongodb"),
    mongoClient = mongo.MongoClient,
    f = require('util').format,
    env = process.env.NODE_ENV || "development",
    path = require("path"),
    _ = require("underscore"),
    log = require("../utils/logger.js"),
    __util = require('../utils/util.js');
global.$db = {};

// connection database

var connect = async function (url, dbName, options) {
    try {
        let client = await mongoClient.connect(url, options);
        let db = client.db(dbName);

        log.info('Database ' + dbName + ' connection established!');
        return Promise.resolve(db)
    } catch (error) {
        log.error("database connection error: " + error);
        return Promise.resolve(null)
    }
}

/* Create Connection for single database */

var getDbConnection = async function (dbName) {

    var user = encodeURIComponent(process.env.SERVER_DB_USER),
        password = encodeURIComponent(process.env.SERVER_DB_PASSWORD),
        database = null,
        authMechanism = 'DEFAULT',
        url = "",
        authSource = dbName;

    if (env == "development") {
        url = f('mongodb://%s:%s@%s:%s/%s?retryWrites=true&w=majority&authMechanism=%s&authSource=%s', user, password, process.env.SERVER_DB_HOST, process.env.SERVER_DB_PORT, authSource, authMechanism, authSource);
    } else {
        url = f('mongodb+srv://%s:%s@%s/%s?retryWrites=true&w=majority', user, password, process.env.SERVER_DB_HOST, authSource);
    }

    // connection url
    var url = f('mongodb://%s:%s@%s:%s/%s?retryWrites=true&w=majority&authMechanism=%s&authSource=%s',
        user, password, process.env.SERVER_DB_HOST, process.env.SERVER_DB_PORT, authSource, authMechanism, authSource);

    if ($db[authSource]) {
        database = $db[authSource];
    } else {
        database = await connect(url, authSource, { poolSize: 50, useNewUrlParser: true, useUnifiedTopology: true });
        $db[authSource] = database;
    }

    return database;
};

var createConnection = async function () {
    var user = encodeURIComponent(process.env.SERVER_DB_USER),
        password = encodeURIComponent(process.env.SERVER_DB_PASSWORD),
        database = null,
        authMechanism = 'DEFAULT',
        url = "",
        authSource = process.env.SERVER_DB_NAME;

    // connection url
    if (env == "development") {
        url = f('mongodb://%s:%s@%s:%s/%s?retryWrites=true&w=majority&authMechanism=%s&authSource=%s', user, password, process.env.SERVER_DB_HOST, process.env.SERVER_DB_PORT, authSource, authMechanism, authSource);
    } else {
        url = f('mongodb+srv://%s:%s@%s/%s?retryWrites=true&w=majority', user, password, process.env.SERVER_DB_HOST, authSource);
    }

    await connect(url, authSource, { poolSize: 50, useNewUrlParser: true, useUnifiedTopology: true });
}

var _objectId = function (_id) {
    if (_validateId(_id)) {
        return new mongo.ObjectID(_id);

    } else {
        return _id;
    }
};

var _newObjectId = function () {
    return new mongo.ObjectID();
};

var insertOne = function (collection, data) {
    if (_validateId(data._id)) {
        data._id = new mongo.ObjectID(data._id);

    } else {
        delete data["_id"];
    }

    return new Promise((resolve, reject) => {
        collection.insertOne(data)
            .then(result => resolve(result))
            .catch(err => reject(err));
    });
};

var insertMany = function (collection, datas, options) {
    if (datas.length == 0) {
        var err = new Error("Invalid request");
        err["statusCode"] = 400;

        reject(err);
        return;
    }

    return new Promise((resolve, reject) => {
        collection.insertMany(datas, options)
            .then(result => resolve(result))
            .catch(err => reject(err));
    });
};

var find = function (collection, query, options) {
    if (typeof query._id == "object" && query._id.length > 1) {
        var $in = [];

        _.each(query._id, function (id) {
            if (_validateId(id)) {
                $in.push(mongo.ObjectID(id));
            }
        });

        query._id = {};
        query._id.$in = $in;
    } else {
        var id = "";
        if (typeof query._id == "object") {
            id = query._id[0];
        } else {
            id = query._id;
        }
        if (_validateId(id)) {
            query._id = new mongo.ObjectID(id);
        }
    }

    return new Promise((resolve, reject) => {
        collection.find(query, options).toArray()
            .then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
    });
};

var aggregate = function (collection, query) {
    return new Promise((resolve, reject) => {
        collection.aggregate(query).toArray()
            .then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
    });
};

var findOne = function (collection, query, options) {
    if (typeof query._id == "object" && query._id.length > 1) {
        var $in = [];

        _.each(query._id, function (id) {
            if (_validateId(id)) {
                $in.push(mongo.ObjectID(id));
            }
        });

        query._id = {};
        query._id.$in = $in;
    } else {
        var id = "";
        if (typeof query._id == "object") {
            id = query._id[0];
        } else {
            id = query._id;
        }
        if (_validateId(id)) {
            query._id = new mongo.ObjectID(id);
        }
    }

    return new Promise((resolve, reject) => {
        collection.findOne(query, options).then(result => {
            resolve(result);
        }).catch(err => {
            reject(err);
        });
    });
};

var findOneAndUpdate = function (collection, query, data, options) {
    if (typeof query._id == "object" && query._id.length > 1) {
        var $in = [];

        _.each(query._id, function (id) {
            if (_validateId(id)) {
                $in.push(mongo.ObjectID(id));
            }
        });

        query._id = {};
        query._id.$in = $in;
    } else {
        var id = "";
        if (typeof query._id == "object") {
            id = query._id[0];
        } else {
            id = query._id;
        }
        if (_validateId(id)) {
            query._id = new mongo.ObjectID(id);
        }
    }

    let obj = data.$addToSet || data.$push || data.$pushAll || data.$pull || data.$pullAll || data.$inc || data.$setOnInsert ? data : { $set: data }

    return new Promise((resolve, reject) => {
        collection.findOneAndUpdate(query, obj, options)
            .then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
    });
};

var updateOne = function (collection, query, data, options) {
    if (typeof query._id == "object" && query._id.length > 1) {
        var $in = [];

        _.each(query._id, function (id) {
            if (_validateId(id)) {
                $in.push(mongo.ObjectID(id));
            }
        });

        query._id = {};
        query._id.$in = $in;
    } else {
        var id = "";
        if (typeof query._id == "object") {
            id = query._id[0];
        } else {
            id = query._id;
        }
        if (_validateId(id)) {
            query._id = new mongo.ObjectID(id);
        }
    }

    let obj = data.$addToSet || data.$push || data.$pushAll || data.$pull || data.$pullAll || data.$inc || data.$setOnInsert ? data : { $set: data }

    return new Promise((resolve, reject) => {
        collection.updateOne(query, obj, options)
            .then(res => {
                let result = res.result;

                if (result.ok === 1 && result.n === 1) {
                    resolve({ status: true });
                } else {
                    resolve({ status: false });
                }
            }).catch(err => {
                reject(err);
            });
    });
};

var updateMany = function (collection, query, data, options) {
    if (typeof query._id == "object" && query._id.length > 1) {
        var $in = [];

        _.each(query._id, function (id) {
            if (_validateId(id)) {
                $in.push(mongo.ObjectID(id));
            }
        });

        query._id = {};
        query._id.$in = $in;
    } else {
        var id = "";
        if (typeof query._id == "object") {
            id = query._id[0];
        } else {
            id = query._id;
        }
        if (_validateId(id)) {
            query._id = new mongo.ObjectID(id);
        }
    }

    let obj = data.$addToSet || data.$push || data.$pushAll || data.$pull || data.$pullAll || data.$inc || data.$setOnInsert ? data : { $set: data }

    return new Promise((resolve, reject) => {
        collection.updateMany(query, obj, options)
            .then(result => {
                const { matchedCount, modifiedCount } = result;

                if (matchedCount && modifiedCount) {
                    resolve(result);
                } else {
                    resolve({});
                }

            }).catch(err => {
                reject(err);
            });
    });
};

var update = function (collection, query, data, options) {
    if (typeof query._id == "object" && query._id.length > 1) {
        var $in = [];

        _.each(query._id, function (id) {
            if (_validateId(id)) {
                $in.push(mongo.ObjectID(id));
            }
        });

        query._id = {};
        query._id.$in = $in;
    } else {
        var id = "";
        if (typeof query._id == "object") {
            id = query._id[0];
        } else {
            id = query._id;
        }
        if (_validateId(id)) {
            query._id = new mongo.ObjectID(id);
        }
    }

    return new Promise((resolve, reject) => {
        collection.update(query, data, options)
            .then(result => {
                const { matchedCount, modifiedCount } = result;

                if (matchedCount && modifiedCount) {
                    resolve(result);
                } else {
                    resolve({});
                }

            }).catch(err => {
                reject(err);
            });
    });
};

var deleteMany = (collection, query) => {

    if (typeof query._id == "object" && query._id.length > 1) {
        var $in = [];

        _.each(query._id, function (id) {
            if (_validateId(id)) {
                $in.push(mongo.ObjectID(id));
            }
        });

        query._id = {};
        query._id.$in = $in;

    } else {
        var id = "";

        if (typeof query._id == "object") {
            id = query._id[0];
        } else {
            id = query._id;
        }

        if (_validateId(id)) {
            query._id = new mongo.ObjectID(id);
        }
    }

    return new Promise((resolve, reject) => {
        collection.deleteMany(query)
            .then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
    });
};

var deleteOne = (collection, query) => {

    if (typeof query._id == "object" && query._id.length > 1) {
        var $in = [];

        _.each(query._id, function (id) {
            if (_validateId(id)) {
                $in.push(mongo.ObjectID(id));
            }
        });

        query._id = {};
        query._id.$in = $in;

    } else {
        var id = "";

        if (typeof query._id == "object") {
            id = query._id[0];
        } else {
            id = query._id;
        }

        if (_validateId(id)) {
            query._id = new mongo.ObjectID(id);
        }
    }

    return new Promise((resolve, reject) => {
        collection.deleteOne(query)
            .then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
    });
};

var count = (collection, query) => {

    if (typeof query._id == "object" && query._id.length > 1) {
        var $in = [];

        _.each(query._id, function (id) {
            if (_validateId(id)) {
                $in.push(mongo.ObjectID(id));
            }
        });

        query._id = {};
        query._id.$in = $in;

    } else {
        var id = "";

        if (typeof query._id == "object") {
            id = query._id[0];
        } else {
            id = query._id;
        }

        if (_validateId(id)) {
            query._id = new mongo.ObjectID(id);
        }
    }

    return new Promise((resolve, reject) => {
        collection.countDocuments(query)
            .then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
    });
};

var _validateId = function (id) {
    if (!__util.isNullOrEmpty(id) && (id.length == 12 || id.length == 24)) {
        return true;
    }

    return false;
};

var init = async function () {
    let databases = await createConnection();

    return databases;
}

module.exports = {
    "init": init,
    "_objectId": _objectId,
    "_newObjectId": _newObjectId,
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
    "getDbConnection": getDbConnection,
    "aggregate": aggregate,
    "update": update,
    "createConnection": createConnection
};