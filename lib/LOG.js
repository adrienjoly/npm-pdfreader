/**
 * Minimal logger
 * @author Adrien Joly, http://github.com/adrienjoly
 * This content is released under the MIT License.
 **/

var sys = require("sys");

var LOG = function(){}; 

module.exports = LOG.bind(null);

module.exports.toggle = function(enabled){
  LOG = !enabled ? function LOG(){} : function LOG(){
    for (var i in arguments)
      if (arguments[i] instanceof Object || arguments[i] instanceof Array)
        arguments[i] = sys.inspect(arguments[i]);
    console.log("[DEBUG] " + Array.prototype.join.call(arguments, " "));
  };
  return module.exports = LOG.bind(null);
};
