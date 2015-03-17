/**
 * parseTable, for pdfreader, used by the Rule class.
 * items are classified into columns and rows, based on their left and top coordinates,
 * and left position of column headers.
 * @author Adrien Joly, http://github.com/adrienjoly
 * This content is released under the MIT License.
 **/

function getLeftPos(item){        
  return item.x;
}

function deleteFirstRows(rows, nb){
  if (!nb)
    return;
  // TODO : rows = rows.slice(nb);
  for (var i in rows) {
    if (--nb < 0)
      return;
    delete rows[i];
  }
}

function getFirstRow(rows){
  for (var i in rows)
    return rows[i];
}

function makeColumnClassifier(header){
  var colX = [0]; // TODO: .concat(header.map(getLeftPos));
  for (var i in header)
    colX.push(getLeftPos(header[i]));
  return function classify(item){
    for (var i=colX.length-1; i>-1; --i)
      if (getLeftPos(item) >= colX[i])
        return i;
  };
}

module.exports = function(nbColumns, rowsToSkip){
  var rule = this,
      items = {};
  // when parsing is done: generate a clean matrix object, from items.
  this.whenDone(function(){
    deleteFirstRows(items, rowsToSkip);
    var header = getFirstRow(items);
    if (!header) return;
    // build column classifier
    var classifyColumn = makeColumnClassifier(header);
    // create clean matrix, based on column classifier
    var table = [],
        row = 0;
    for (var y in items){
      table[row] = [];
      for (var x in items[y]){
        var item = items[y][x];
        table[row][classifyColumn(item)] = item.text;
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
