/**
 * parseColumns, for pdfreader, used by the Rule class.
 * accumulates values below each column header (on 1st row, given their name), without detecting empty rows.
 * TODO: use ColumnsParser
 * @author Adrien Joly, http://github.com/adrienjoly
 * This content is released under the MIT License.
 **/

var LOG = require("./LOG.js");

module.exports = function (/* columns */) {
  this.output = [];
  this.cols = Array.prototype.slice.apply(arguments);
  var colNames = this.cols,
    colX = [],
    rows = this.output,
    line = -1, // header
    lineY = null;
  function processItem(item) {
    if (line == -1) {
      // parse x-position of column headers
      var i = colNames.indexOf(item.text);
      if (i > -1) colX[i] = item.x;
      if (colX.length == colNames.length) {
        LOG("table header:", colNames, colX);
        line++;
      }
    } else {
      if (lineY === null) {
        lineY = item.y;
      } else if (lineY != item.y) {
        lineY = item.y;
        line++;
      }
      // parsing values for each column
      var col = 0;
      for (var i = colX.length - 1; i >= 0; --i)
        if (item.x > colX[i]) {
          col = i;
          break;
        }
      rows[lineY] = rows[lineY] || {};
      rows[lineY][col] = item.text;
    }
  }
  processItem(this.currentItem); // apply on header's first item
  return processItem; // then the same function will be run on all following items, until another rule is triggered
};
