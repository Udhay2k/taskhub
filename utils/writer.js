"use strict";
const fs = require('fs'),
  mime = require('mime'),
  stream = require('stream'),
  PassThrough = stream.PassThrough,
  fsPromises = fs.promises;

var ResponsePayload = function (code, payload) {
  this.code = code;
  this.payload = payload;
};

exports.respondWithCode = function (code, payload) {
  return new ResponsePayload(code, payload);
};

var writeJson = (exports.writeJson = function (response, arg1, arg2) {
  var code;
  var payload;

  if (arg1 && arg1 instanceof ResponsePayload) {
    writeJson(response, arg1.payload, arg1.code);
    return;
  }

  if (arg2 && Number.isInteger(arg2)) {
    code = arg2;
  } else {
    if (arg1 && Number.isInteger(arg1)) {
      code = arg1;
    }
  }
  if (code && arg1) {
    payload = arg1;
  } else if (arg1) {
    payload = arg1;
  }

  if (!code) {
    // if no response code given, we default to 200
    code = 200;
  }
  if (typeof payload === "object") {
    payload = JSON.stringify(payload, null, 2);
  }
  response.writeHead(code, { "Content-Type": "application/json" });
  response.end(payload);
});

exports.writeImage = function (req, res, path) {

  if (!fs.existsSync(path)) {
    return res.sendStatus(404);
  }

  if (fs.lstatSync(path).isDirectory()) {
    return res.sendStatus(404);
  }

  const r = fs.createReadStream(path) // or any other way to get a readable stream
  const ps = new PassThrough();  // <---- this makes a trick with stream error handling
  stream.pipeline(r, ps, // <---- this makes a trick with stream error handling
    (err) => {
      if (err) {
        // No such file or any other kind of error
        return res.sendStatus(404);
      }
    });

  res.setHeader("Content-Type", mime.getType(req.url)); //set the header for requested file type!
  res.writeHead(200);

  ps.pipe(res);
};

