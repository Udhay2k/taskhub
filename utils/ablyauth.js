var jwt = require("jsonwebtoken");
var Ably = require('ably');
//For a dummy API key I2E_JQ.79AfrA:sw2y9zarxwl0Lw5a
//AKkclw.JOC_Kg:9yp7aPSBnuAMgObF
var apiKey = "AKkclw.JOC_Kg:9yp7aPSBnuAMgObF";
var appId = 'AKkclw';
var keyId = 'JOC_Kg';
var keySecret = '9yp7aPSBnuAMgObF';
var ttlSeconds = 60 * 5;

exports.sign = (userId) => {
  var jwtPayload = {
    'x-ably-capability': JSON.stringify({ '*': ["history", "presence", "publish", "stats", "subscribe"] }),
    'x-ably-clientId': userId
  };

  var jwtOptions = {
    expiresIn: ttlSeconds,
    keyid: `${appId}.${keyId}`
  };

  return new Promise((resolve, reject) => {
    jwt.sign(jwtPayload, keySecret, jwtOptions, function (err, tokenId) {
      if (err) {
        reject(err);
      }

      resolve(tokenId);
    });
  });
};

exports.sendSignal = (channelId, message) => {
  let realtime = new Ably.Realtime(apiKey);
  let channel = realtime.channels.get(channelId);

  channel.publish(message.type, message.data);
};