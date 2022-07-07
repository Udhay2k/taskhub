const crypto = require("crypto");
const env = process.env.NODE_ENV || "development";

function Encrypt(opt) {
  if (!(this instanceof Encrypt)) {
    return new Encrypt(opt);
  }

  var self = this;
  self.iv = Buffer.alloc(16, 0);

  opt = opt || {};
  self._algorithm = opt.algorithm || "aes-192-cbc";
  self._iv_length = opt.iv_length || 16;
}

Encrypt.prototype.encrypt = function (value) {
  var self = this;  
  let encrypted = "";

  try {
    const key = crypto.scryptSync(process.env.LOGIN_SECRET, "salt", 24);
    const cipher = crypto.createCipheriv(self._algorithm, key, self.iv);
    encrypted = cipher.update(value, "utf8", "hex");

    encrypted += cipher.final("hex");
  } catch (err) {
    encrypted = value;
  }

  return encrypted;
};

Encrypt.prototype.decrypt = function (value) {
  var self = this;
  let decrypted = "";

  if (!value) {
    return "";
  }

  try {
    const key = crypto.scryptSync(process.env.LOGIN_SECRET, "salt", 24);
    const decipher = crypto.createDecipheriv(self._algorithm, key, self.iv);
    decrypted = decipher.update(value, "hex", "utf8");

    decrypted += decipher.final("utf8");
  } catch (err) {
    decrypted = value;
  }

  return decrypted;
};

var encryptBase64 = Encrypt.prototype.encryptBase64 = function (value) {
  var self = this;
  let encrypted = "";

  try {
    encrypted = Buffer.from(value).toString('base64')
  } catch (err) {
    encrypted = "";
  }

  return encrypted;
};

var decryptBase64 = Encrypt.prototype.decryptBase64 = function (value) {
  var self = this;
  let encrypted = "";

  try {
    encrypted = Buffer.from(value, 'base64').toString('ascii')
  } catch (err) {
    encrypted = "";
  }

  return encrypted;
};

module.exports = Encrypt;
