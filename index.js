"use strict";
var fs = require("fs"),
  path = require("path"),
  dotenv = require('dotenv'),
  http = require("http");

dotenv.config({ path: path.join(__dirname, `.${process.env.NODE_ENV}.env`) });

const cluster = require('cluster'),
  numCPUs = require('os').cpus().length,
  multer = require('multer'),
  upload = multer(),
  morgan = require('morgan'),
  express = require("express"),
  app = express(),
  jsyaml = require("js-yaml"),
  swaggerTools = require('oas-tools'),
  serverPort = process.env.PORT,
  auth = require("./utils/auth.js"),
  __util = require('./utils/util.js'),
  log = require("./utils/logger.js");

// const initDatabases = require('./database/connection');

app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(upload.any());
app.use(morgan("combined", { stream: log.stream.write }));

var options_object = {
  controllers: path.join(__dirname, './controllers'),
  checkControllers: true,
  loglevel: 'info',
  logfile: path.join(__dirname, './log/file'),
  // customLogger: myLogger,
  strict: true,
  router: true,
  validator: true,
  oasSecurity: true,
  customErrorHandling: true,
  securityFile: {
    AccessToken: auth.verifyToken
  },
  docs: {
    apiDocs: process.env.SWAGGER_API_DOCS_ROOT,
    apiDocsPrefix: '',
    swaggerUi: process.env.SWAGGER_API_DOCS,
    swaggerUiPrefix: ''
  },
  ignoreUnknownFormats: true
};

swaggerTools.configure(options_object);

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var yamlKeys = ["tags", "paths", "security", "components"];
var spec = fs.readFileSync(path.join(__dirname, "api/swagger.yaml"), "utf8");

try {
  yamlKeys.forEach(yKey => {
    let fPath = path.join(__dirname, "api/" + yKey);

    if (fs.statSync(fPath).isDirectory()) {
      let yfiles = fs.readdirSync(fPath);
      spec += "\n" + yKey + ":";

      yfiles.forEach(yfile => {
        let fSubPath = path.join(__dirname, "api/" + yKey + "/" + yfile);

        if (fs.statSync(fSubPath).isDirectory()) {
          let subfiles = fs.readdirSync(fSubPath);
          spec += "\n  " + yfile + ":";

          subfiles.forEach(sfile => {
            let fContent = fs.readFileSync(path.join(fSubPath, "/" + sfile), "utf8");
            fContent = fContent.replace(yKey + ":", "");
            fContent = fContent.replace(yfile + ":", "");
            spec += fContent;
          });

        } else {
          let fContent = fs.readFileSync(path.join(fPath, "/" + yfile), "utf8");
          spec += fContent.replace(yKey + ":", "");
        }
      });
    }
  });
} catch (e) {

}

var swaggerDoc = jsyaml.safeLoad(spec);

app.use(async function (req, res, next) {
  let token;
  let requestUrl = req.url;
  let isVerify = true;

  // if (requestUrl.indexOf("client/stellar/login") != -1) {
  //   isVerify = false;
  // }

  if (req.headers.authorization && req.headers.authorization) {
    token = req.headers.authorization;

    if (token) {
      let res = await auth.verify(token, isVerify);

      if (res.success == true) {
        let data = res.data;
        let name = "";

        if (data && data.hasOwnProperty('name') && !__util.isNullOrEmpty(data["name"])) {
          name = data["name"] ? data["name"].trim() : "";
        }

        req.userId = data.uid;
        req.email = data.email;
        req.name = name;
        req.user = data;

        next();
      } else {
        next(new Error('Access denied!'))
      }
    } else {
      next(new Error('Access denied!'))
    }
  } else {
    req.user = {};
    next();
  }
});

// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, app, function (middleware) {
  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata());

  // Validate Swagger requests
  app.use(middleware.swaggerValidator());

  // Route validated requests to appropriate controller
  //app.use(middleware.swaggerRouter(options_object));

  //catch error and throw as definied object
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next()
    }

    if (err) {
      log.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

      let errorMessage = "";

      if (err.code == "SCHEMA_VALIDATION_FAILED" && err.results) {
        let schemaErrors = err.results.errors;

        schemaErrors.forEach(specficError => {
          errorMessage += "'" + specficError.code + "[" + specficError.path.join(".") + "]: " + specficError.message + "' ";
        });
      } else if (err.code == "server_error") {
        if (err.statusCode == "403") {
          errorMessage = "Access denied";
        }
      } else {
        errorMessage = err.message;
      }

      let obj = { status: false, message: errorMessage, error: err.validationResult[0].error };

      if (errorMessage.toLowerCase().indexOf('denied') !== -1) {
        obj["type"] = "login";
      }

      let payload = JSON.stringify(obj, null, 2);

      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(payload);
    }
  });

  app.use(middleware.swaggerUi());

  // if (cluster.isMaster) {
  //   console.log(`Master ${process.pid} is running`);

  //   // Fork workers.
  //   for (let i = 0; i < numCPUs; i++) {
  //     cluster.fork();
  //   }

  //   cluster.on('fork', function (worker) {
  //     console.log('forked worker : ' + worker.process.pid);
  //   });

  //   cluster.on('exit', function (deadWorker, code, signal) {
  //     console.log('worker ' + deadWorker.process.pid + ' died');

  //     let newWorker = cluster.fork();
  //     console.log('worker ' + newWorker.process.pid + ' born');
  //   });

  // } else {
  // initDatabases.init();
  // Serve the Swagger documents and Swagger UI

  http.createServer(app).listen(serverPort, function () {
    console.log("Your server is listening on port %d (http://localhost:%d)", serverPort, serverPort);
  }).on("error", onError);

  console.log(`Worker ${process.pid} started`);

  function onError(error) {
    log.error(`${error.status || 500} - ${error.message}`);
    console.log("error on server " + error);
  }
  //}
});

