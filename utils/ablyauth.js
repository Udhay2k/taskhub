var jwt = require("jsonwebtoken");
var Ably = require('ably');
//For a dummy API key I2E_JQ.79AfrA:sw2y9zarxwl0Lw5a
//AKkclw.JOC_Kg:9yp7aPSBnuAMgObF
var apiKey = "AKkclw.JOC_Kg:9yp7aPSBnuAMgObF";
var appId = 'AKkclw';
var keyId = 'JOC_Kg';
var keySecret = '9yp7aPSBnuAMgObF';
var ttlSeconds = 60 * 5;
var ablyClient = null;

function ably() {
  ablyClient = new Ably.Realtime({ key: apiKey });

  ablyClient.connection.on('failed', () => {
    console.dir('failed')
  });

  ablyClient.connection.on('suspended', () => {
    console.dir('suspended')
  });

  ablyClient.connection.on('connected', () => {
    console.dir('connected')
  });

  this.sign = (userId) => {
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
  },
    this.sendSignal = async (channelId, message) => {
      let channel = ablyClient.channels.get(channelId);

      channel.publish(message.type, message.data);

      channel.subscribe(function (message) {
        console.dir(message.name); // 'greeting'
        console.dir(message.data); // 'Hello World!'
      });

      // const presenceMessage = await channel.presence.get();
      // console.log(presenceMessage);

      // // Querying history
      // const history = await channel.history({ limit: 25 });
      // console.log(await history.current());

      // // Getting the status of a channel
      // const channelDetails = await channel.status();
      // console.log(channelDetails);

    }
}

module.exports = ably;