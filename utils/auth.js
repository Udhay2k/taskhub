"use strict";

const jwt = require("jsonwebtoken"),
  env = process.env.NODE_ENV || "development",
  util = require('util'),
  path = require("path"),
  _ = require("underscore"),
  __util = require('../utils/util.js'),
  logger = require('../utils/logger.js');

module.exports.getToken = (data, options) => {
  if (!options) {
    options = { expiresIn: process.env.JWT_TOKENLIFE };
  }

  var token = jwt.sign(data, process.env.JWT_SECRET, options);

  return token;
};

module.exports.verifyToken = function (req, obj, token, next) {
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, function (error, decoded) {
      if (error) {
        return next(req.res.status(403).send('Access denied'));
      } else {
        if (!decoded) {
          return next(req.res.status(403).send('Access denied'));
        } else {
          return next();
        }
      }
    });
  } else {
    return next(req.res.status(403).send('Access denied'));
  }
};

module.exports.verify = async (token) => {
  var resdata = {
    success: false
  };

  try {
    let decoded = await jwt.verify(token, process.env.JWT_SECRET);

    if (decoded) {
      resdata.success = true;
      resdata.data = decoded;
    } else {
      resdata.success = false;
    }

    return Promise.resolve(resdata);
  } catch (err) {
    logger.error(`auth: ${err}`)
    resdata.success = false;
    return Promise.resolve(resdata);
  }
};

module.exports.getDataByToken = function (token) {
  var options = { };

  var obj = jwt.verify(token, process.env.JWT_SECRET, options);

  return obj;
};

module.exports.refresh = function (token, cb) {
  return new Promise(function (resolve, reject) {
    jwt.verify(token, process.env.JWT_SECRET)
      .then(data => {
        resolve({ newToken: jwt.issue({ _id: data._id }) });
      }).catch(error => {
        reject(error);
      });
  });
};


module.exports.isExpired = async (token) => {
  let expired = true;

  try {
    let decoded = await jwt.verify(token, process.env.JWT_SECRET);

    if (decoded) {
      expired = false;
    }

    return expired;

  } catch (e) {
    if (e.message === 'jwt expired') {
      expired = true;
    }

    return expired;
  }
};

module.exports.validateToken = async (token) => {
  let resdata = { success: false, data: {} };
  return new Promise(async function (resolve, reject) {
    try {
      let decoded = await jwt.verify(token, process.env.JWT_SECRET);

      if (decoded) {
        resdata.success = true;
        resdata.data = decoded;
      }

      return resolve(resdata);

    } catch (e) {
      return reject(e)
    }
  });
};