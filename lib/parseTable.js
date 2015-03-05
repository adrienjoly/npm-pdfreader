/**
 * parseTable, for pdfreader, used by the Rule class
 * @author Adrien Joly, http://github.com/adrienjoly
 * This content is released under the MIT License.
 **/

var ColumnClassifier = require("./ColumnClassifier.js");

module.exports = function(nbColumns){
  var rule = this,
      items = {};
  // when parsing is done: generate a clean this.matrix object, from items.
  this.whenDone(function(){
    // detect x-position of columns
    function getRightPositions(matrix){        
      var xPos = [];
      for (var y in matrix)
        for (var x in matrix[y])
          xPos.push(matrix[y][x].x + matrix[y][x].w);
      return xPos;
    }
    // build column classifier
    var xPos = getRightPositions(items);
    var classifyColumn = new ColumnClassifier().cluster(xPos, nbColumns).getClassifier();
    // re-create clean matrix, based on column classifier
    var table = [],
        row = 0;
    for (var y in items){
      table[row] = [];
      for (var x in items[y]){
        var item = items[y][x];
        table[row][classifyColumn(item.x)] = item.text;
      }
      ++row;
    }
    rule.output = table;
  });
  // parse values and store them in items
  function processItem(item){
    var y = parseInt(3 * item.y), // TODO: set 3 as parameter, or detect it
        x = parseInt(3 * item.x);
    items[y] = items[y] || {};
    items[y][x] = item;
  };
  processItem(this.currentItem); // apply on first item (not necessarily header)
  return processItem; // then the same function will be run on all following items, until another rule is triggered
};
