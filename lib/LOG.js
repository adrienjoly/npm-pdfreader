/**
 * Minimal logger
 * @author Adrien Joly, http://github.com/adrienjoly
 * This content is released under the MIT License.
 **/

var util = require("util");

var nullLog = function LOG() {};

var realLog = function LOG() {
  for (var i in arguments)
    if (arguments[i] instanceof Object || arguments[i] instanceof Array)
      arguments[i] = util.inspect(arguments[i]);
  console.log("[DEBUG] " + Array.prototype.join.call(arguments, " "));
};

var LOG = nullLog;

module.exports = function () {
  LOG.apply(null, arguments);
};

module.exports.toggle = function (enabled) {
  LOG = !enabled ? nullLog : realLog;
  return module.exports;
};
