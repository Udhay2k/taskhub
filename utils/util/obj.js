exports.isValid = function (obj) { return _isValid(obj); };
exports.getType = function (obj) { return getType(obj); };
exports.isEmpty = function (obj) { return _isEmpty(obj); };

var _isValid = function (obj) {
  if (obj == null || _getType(obj) === 'undefined') {
    return false;
  }
  return true;
};

var _isEmpty = function (obj) {
  if (_getType(obj) === 'undefined' || obj == null) return true;

  if (obj.length > 0) return false;

  if (obj.length === 0) return true;

  if (Object.getOwnPropertyNames(obj).length > 0) return false;

  return true;
};

var _getType = function (obj) {
  return Object.prototype.toString.call(obj);
};