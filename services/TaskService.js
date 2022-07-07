"use strict";
const db = require('../database/db');
const env = process.env,
    { metaTask, metaUpdateTask } = require('../metadata'),
    _ = require("underscore"),
    config = require("../config"),
    collections = config["collections"],
    __util = require('../utils/util.js');

exports.metadata = fields => {
    return new Promise(function (resolve, reject) {
        let returnObj = Object.assign({}, metaTask());

        if (fields && fields.length > 0) {
            let sortFields = __util.getMetaDataFilter(fields, returnObj.fields);

            returnObj.fields = sortFields;
        } else {
            let _rtnFields = returnObj.fields.filter(function (item) {
                if (item.parent == "") {
                    return item;
                }
            });

            returnObj.fields = _rtnFields;
        }

        return resolve(returnObj);
    });
};

exports.create = async (obj) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (__util.isEmptyObject(obj)) {
                var err = new Error("Empty object given");
                err["statusCode"] = 401;

                return reject(err);
            }

            let res = await _create(obj);

            if (res.status) {
                resolve(res.data);
            } else {
                var err = new Error(res.message);
                err["statusCode"] = 400;

                reject(err);
            }

        } catch (err) {
            reject(err);
        }
    });
};

const _create = async (obj) => {
    let crudStatus = {
        status: true,
        data: {}
    };
    let data = {};
    let returnObj = Object.assign({}, metaTask());
    let metaFields = returnObj.fields;
    let validateObj = __util.validateObject(metaFields, obj);

    if (!validateObj.status) {
        crudStatus = validateObj;
        return crudStatus;
    }

    obj = _parseData(obj);

    data = await db.insertOne(env.SERVER_DB_NAME, collections.taskhub, obj)
    crudStatus["data"] = data;
    crudStatus["message"] = "Sucessfully saved";

    return crudStatus
}

var _parseData = function (obj) {

    return obj;
}

exports.get = async (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            let taskId = req.swagger.params["id"].value;
            let task = await _get(taskId)

            if (task)
                resolve(task);
            else
                reject(new Error("Invalid Task Id"))
        } catch (e) {
            reject(e);
        }
    })
}

var _get = async (taskId) => {
    let q = {
        _id: taskId
    }
    let options = {
        projections: {}
    }
    let result = await db.findOne(env.SERVER_DB_NAME, collections.taskhub, q, options)

    return result;
}

exports.update = async (taskId, params) => {
    return new Promise(async (resolve, reject) => {
        if (__util.isNullOrEmpty(taskId)) {
            var err = new Error("Data Not Found");
            err["statusCode"] = 401;

            reject(err)
        }

        _update(taskId, params).then(res => _get(taskId)).then(function (res) {
            if (res)
                resolve(res);
            else
                reject(new Error("Invalid Task Id"))
        }).catch(e => {
            reject(e);
        })
    })
}

const _update = async (taskId, params) => {
    delete params["_id"];
    let crudStatus = {}
    let query = { _id: taskId }
    let options = {}
    let returnObj = Object.assign({}, metaUpdateTask());
    let metaFields = returnObj.fields;
    let validateObj = __util.validateObject(metaFields, params);

    if (!validateObj.status) {
        crudStatus = validateObj;
        var err = new Error(crudStatus.message);
        err["statusCode"] = 400;
        throw err;
    }

    params = _parseData(params);

    crudStatus = await db.updateOne(env.SERVER_DB_NAME, collections.taskhub, query, params, options)


    return crudStatus;
};

exports.delete = async (req) => {
    let taskId = req.swagger.params["id"].value;
    let query = { _id: taskId };

    if (__util.isNullOrEmpty(taskId)) {
        var err = new Error("Data Not Found");
        err["statusCode"] = 401;

        reject(err)
    }

    let res = await db.deleteMany(env.SERVER_DB_NAME, collections.taskhub, query)
    return res;
}

exports.list = async (req) => {
    return new Promise(async (resolve, reject) => {
        db.find(env.SERVER_DB_NAME, collections.taskhub, {}, {}).then(res => {
            resolve(res);
        }).catch(err => {
            reject(err);
        })
    })
}


exports.search = (req) => {
    let body = req.swagger.params["body"].value;

    return new Promise(function (resolve, reject) {
        _getSearchResult(body).then(results => {
            resolve(results);
        }).catch(e => {
            log.error(`${e.status || 200} - ${e.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

            reject(e);
        });
    });
};

exports.summary = (req) => {
    let body = req.swagger.params["body"].value;

    return new Promise(function (resolve, reject) {
        _getSearchResult(body).then(res => {
            var textList = [];

            res.results.forEach(result => {
                textList.push({ _id: result._id, text: result.name });
            });

            res["results"] = textList;

            resolve(res);
        }).catch(e => {
            log.error(`${e.status || 200} - ${e.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

            reject(e);
        });
    });
};

var _getSearchResult = async (body) => {
    try {
        let query = _getQuery(body);
        let page = _getQueryPagging(body);
        let deleteQuery = { $or: [{ "deleted": { $exists: false } }, { "deleted": false }] };

        if (query && query["$and"] && Object.keys(query["$and"]).length > 0) {
            query["$and"] = [...query["$and"], deleteQuery];
        } else {
            query["$and"] = [deleteQuery];
        }

        let total = await db.count(env.SERVER_DB_NAME, collections.taskhub, query)
        let result = await _searchQueryByAggregate(query, page, body);
        let _more = total - body.count * body.page > 0;
        let finalResult = await _getFilterResult(body, result);

        let rtn = {
            pagination: {
                count: body.count,
                more: _more,
                offset: page.skip,
                page: body.page,
                total: total
            },
            results: finalResult,
            status: true
        };

        return Promise.resolve(rtn);
    } catch (e) {
        return Promise.reject(e);
    }
};

var _getQuery = (body) => {
    let query = [];
    let obj = body;
    let filterQuery = {};

    if (body.filter && Object.keys(body.filter).length > 0) {
        let filter = obj.filter;
        let keys = Object.keys(body.filter);

        keys.forEach(key => {
            let fields = filter[key];

            if (__util.isArray(fields)) {

                fields.map(async field => {
                    let fkeys = Object.keys(field);

                    fkeys.forEach(key => {
                        let arrayfields = field[key];
                        let isArrayField = __util.isArray(arrayfields);
                        let isObjectField = __util.isPlainObject(arrayfields);

                        if (!isArrayField && isObjectField) {
                            let isDbObject = _isKeyObject(key);

                            let filterFields = _objectLoop(arrayfields, isDbObject);

                            field[key] = filterFields;

                        } else {
                            if (isArrayField) {
                                let flds = [];

                                for (var aVal of arrayfields) {
                                    let akeys = Object.keys(aVal);

                                    akeys.forEach(akey => {
                                        let isDb = _isKeyObject(akey);
                                        let isDbObject = isDb["obj"];
                                        let isDate = isDb["date"];
                                        let aflds = aVal[akey];

                                        if (_.isObject(aflds)) {
                                            aVal[akey] = _objectLoop(aflds, isDb);
                                        } else {
                                            aVal[akey] = isDbObject ? db.objectId(aflds) : isDate ? __util.stringToDate(aflds) : aflds;
                                        }
                                    });

                                    flds.push(aVal);
                                }

                                field[key] = flds;

                            } else {
                                let valObject = _isKeyObject(key);
                                let isDbObject = valObject["obj"];
                                let isDate = valObject["date"];

                                field[key] = isDbObject ? db.objectId(arrayfields) : isDate ? __util.stringToDate(arrayfields) : arrayfields;
                            }
                        }
                    });

                    return field;
                });

                filterQuery[key] = fields;
            } else {
                let valObject = _isKeyObject(key);
                let isDbObject = valObject["obj"];
                let isDate = valObject["date"];

                if (_.isObject(fields)) {
                    let filterFields = _objectLoop(fields, valObject);

                    filterQuery[key] = filterFields;
                } else {
                    filterQuery[key] = isDbObject ? db.objectId(fields) : isDate ? __util.stringToDate(fields) : fields;
                }
            }
        });
    }

    if (obj.term && !__util.isNullOrEmpty(obj.term)) {
        let term = obj.term.replace(/[&\/\\#$'"]/g, '');
        term = term.replace(/[(]/g, '\\(');
        term = term.replace(/[)]/g, '\\)');

        let fields = [];

        if (!__util.isNullOrEmpty(obj["termfields"]) && obj["termfields"].length > 0) {
            fields = obj["termfields"];
        } else {
            fields = ['name'];
        }

        _.each(fields, function (field, indx) {
            let tObj = {};
            tObj[field] = new RegExp(term, 'i');
            query.push(tObj);
        });
    }

    let termQuery = {};
    if (query.length > 0) {
        termQuery["$or"] = query;
    }

    query = Object.assign(filterQuery, termQuery);
    let finalQuery = {}
    let include = {};
    let exclude = {};

    if (!__util.isNullOrEmpty(obj["include"]) && obj["include"].length > 0) {
        const includeIds = obj["include"].map(id => db.objectId(id));
        include = { _id: { $in: includeIds } };
    }

    if (!__util.isNullOrEmpty(obj["exclude"]) && obj["exclude"].length > 0) {
        const excludeIds = obj["exclude"].map(id => db.objectId(id));
        exclude = { _id: { $nin: excludeIds } }
    }

    if (!__util.isEmptyObject(include) && !__util.isEmptyObject(exclude)) {
        query = Object.assign(exclude, query)

        finalQuery["$or"] = [include, query]
    } else if (!__util.isEmptyObject(include) && __util.isEmptyObject(exclude)) {
        finalQuery["$or"] = [include, query]
    } else if (__util.isEmptyObject(include) && !__util.isEmptyObject(exclude)) {
        finalQuery["$and"] = [exclude, query]
    } else {
        finalQuery = query;
    }

    return finalQuery;
};

var _getFieldsByQuery = (body) => {
    let obj = body;
    let dbFields = {};

    dbFields["_id"] = "$_id";

    if (!__util.isNullOrEmpty(obj["fields"]) && obj["fields"].length > 0) {
        var fields = obj["fields"];

        _.each(fields, function (field, indx) {
            if (field == "name") {
                dbFields[field] = "$" + field;
                dbFields["lower" + field] = { "$toLower": "$name" }
            } else {
                dbFields[field] = "$" + field;
            }
        });
    } else {
        dbFields["name"] = "$name";
        dbFields["lowername"] = { "$toLower": "$name" }
    }

    return dbFields;
};

let _objectLoop = function (fields, valObject) {
    let filterFields = {};
    let isDbObject = valObject["obj"];
    let isDate = valObject["date"];

    for (var key in fields) {
        let values = fields[key];

        let isArrayField = __util.isArray(values);
        let isObjectField = __util.isPlainObject(values);

        if (!isArrayField && isObjectField) {
            let ele = {};

            for (const [ikey, ivalue] of Object.entries(values)) {
                ele[ikey] = ikey == "organizationId" ? db.objectId(ivalue) : ivalue;
            }

            filterFields[key] = ele;
        }
        else if (isArrayField && !isObjectField) {
            filterFields[key] = values.map(id => isDbObject ? db.objectId(id) : isDate ? __util.stringToDate(id) : id);
        } else {
            filterFields[key] = isDbObject ? db.objectId(values) : isDate ? __util.stringToDate(values) : values;
        }
    }

    return filterFields;
};

let _isKeyObject = function (key) {
    let isObject = !__util.isNullOrEmpty(key) && (key == "_id") ? true : false;
    let isDate = false;

    if (!isObject) {
        isDate = _isKeyDate(key);
    }

    return { obj: isObject, date: isDate };
};

let _isKeyDate = function (key) {
    let isDate = false;
    let returnObj = Object.assign({}, metaUser());
    let metaFields = returnObj.fields;
    let fieldData = key.split(".");
    let name = fieldData[0];
    let parent = "";

    if (fieldData.length == 2) {
        parent = fieldData[0];
        name = fieldData[1];
    }

    let fieldObj = _.findWhere(metaFields, { name: name });

    if (fieldObj && (fieldObj.type == "date" || fieldObj.type == "datetime")) {
        isDate = true;
    }

    return isDate;
};

var _getQueryPagging = (body) => {
    let obj = body;
    let options = {};

    if (!__util.isNullOrEmpty(obj.page) && !__util.isNullOrEmpty(obj.count)) {
        var pageNo = parseInt(obj.page)
        var size = parseInt(obj.count)

        options.skip = size * (pageNo - 1);
        options.limit = size;
    }

    return options;
};

var _getQuerySort = (body) => {
    let options = {};

    if (body.order) {

        for (let i = 0; i < body.order.length; i++) {
            let sort = body.order[i];
            let order = -1;

            if (sort.order == 'asc') {
                order = 1
            }

            if (sort.field == "code") {
                options["lower" + sort.field] = order;
            } else if (sort.field == "name") {
                options["lower" + sort.field] = order;
            } else {
                options[sort.field] = order;
            }
        }
    }
    else {
        options["_id"] = -1;
    }

    return options;
};

var _searchQueryByAggregate = async function (queryObj, page, body) {
    let sort = _getQuerySort(body);
    let project = _getFieldsByQuery(body);

    let query = [
        { $match: queryObj },
        { $project: project }
    ];

    query.push({ $sort: sort });

    if (!__util.isEmptyObject(page)) {
        query.push({ $skip: page.skip })
        query.push({ $limit: page.limit });
    }

    let res = await db.aggregate(env.SERVER_DB_NAME, collections.taskhub, query);

    return res;
};

var _getFilterResult = async (obj, lists) => {
    let fields = !__util.isNullOrEmpty(obj["fields"]) && obj["fields"].length > 0 ? obj["fields"] : [];
    let pList = [];

    for (let list of lists) {
        list = __util.convertToJsonObject(list);

        pList.push(_processObj(list))
    }

    return pList;
};

var _processObj = (obj) => {
    return obj;
};