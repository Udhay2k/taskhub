"use strict";

const utils = require("../utils/writer.js"),
  __util = require('../utils/util.js'),
  validate = require("../utils/validate.js"),
  sTask = require("../services/TaskService");

/**
 * metadata for dynamic UI structure
 */
module.exports.metadata = (req, res, next) => {
  var fields = req.swagger.params["fields"].value;

  if (fields && fields.length == 1) {
    fields = fields[0].split(',');
  }

  sTask.metadata(fields).then(mdata => {
    utils.writeJson(res, { status: true, results: mdata }, 200);
  }).catch(error => {
    utils.writeJson(res, { status: false, message: error.message }, 200);
  });
};

/**
 * create a Task
 */
module.exports.create = (req, res, next) => {
  let obj = req.swagger.params["body"].value;
  obj = __util.createdBy(obj, req);

  sTask.create(obj).then(result => {
    utils.writeJson(res, { status: true, results: result }, 200);
  }).catch(error => {
    utils.writeJson(res, { status: false, message: error.message }, 200);
  });
};

/**
 * Get Task by _id
 */
module.exports.get = (req, res, next) => {
    sTask.get(req).then(function (response) {
        utils.writeJson(res, { status: true, results: response }, 200);
    }).catch(function (error) {
        utils.writeJson(res, { status: false, message: error.message }, 200);
    });
}

/**
 * Update Task by _id
 */
module.exports.update = (req, res, next) => {
    let uid = req.swagger.params["id"].value
    let body = req.swagger.params["body"].value
    body = __util.updated(body, req["user"]);

    sTask.update(uid, body).then(function (response) {
        utils.writeJson(res, { status: true, results: response }, 200);
    }).catch(function (error) {
        utils.writeJson(res, { status: false, message: error.message }, 200);
    });
}

/**
 * delete the Task by _id
 */
 module.exports.delete = (req, res, next) => {
    sTask.delete(req).then(function (response) {
        utils.writeJson(res, { status: true, message: "Successfully deleted" }, 200);
    }).catch(function (error) {
        utils.writeJson(res, { status: false, message: error.message }, 200);
    });
};

/**
 * Get all Task
 */
 module.exports.list = (req, res, next) => {
    sTask.list(req).then(function (response) {
        utils.writeJson(res, { status: true, results: response }, 200);
    }).catch(function (error) {
        utils.writeJson(res, { status: false, message: error.message }, 200);
    });
};

/**
 * search/filter by given params and return result
 */
 module.exports.search = (req, res, next) => {
  sTask.search(req).then(function (response) {
    utils.writeJson(res, response, 200);
  }).catch(function (error) {
    utils.writeJson(res, { status: false, message: error.message }, 200);
  });
};

/**
* search by given params and return text
*/
module.exports.summary = (req, res, next) => {
  sTask.summary(req).then(function (response) {
    utils.writeJson(res, response, 200);
  }).catch(function (error) {
    utils.writeJson(res, { status: false, message: error.message }, 200);
  });
};