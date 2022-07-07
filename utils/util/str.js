var obj = require('./obj');

exports.endsWith = function (str, search) { return _endsWith(str, search); };
exports.isNullOrEmpty = function (str) { return _isNullOrEmpty(str); };
exports.replaceEmpty = function (str) { return str.replace(/ /g, '_'); };

var isMatch = function (str, pattern) {
  if (match(str, pattern) != null) {
    return true;
  }
  return false;
};

var match = function (str, pattern) {
  var regex = new RegExp(pattern);
  return regex.exec(str);
};

var _endsWith = function (str, search) {
  if (!_isNullOrEmpty(str) || !_isNullOrEmpty(search)) {
    var pattern = search + '$';
    return isMatch(str, pattern);
  }
  return false;
};

var _isNullOrEmpty = function (str) {
  if (obj.isValid(str) && str.toString().trim() != '') {
    return false;
  }
  return true;
};