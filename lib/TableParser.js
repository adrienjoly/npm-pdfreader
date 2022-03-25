/**
 * TableParser
 * Classifies items into columns and rows, based on their left and top coordinates,
 * and left position of column headers.
 * @author Adrien Joly, http://github.com/adrienjoly
 * This content is released under the MIT License.
 **/

function TableParser() {
  this.rows = {};
}

TableParser.prototype.processItem = function (item, col) {
  var row = (this.rows["" + item.y] = this.rows["" + item.y] || {});
  (row[col] = row[col] || []).push(item);
};

TableParser.prototype.processHeadingItem = function (item, col) {
  this.processItem(
    {
      y: 0,
      x: item.x,
      text: item.text,
    },
    col
  );
};

// Rows

function sortAsFloatValues(values) {
  return values.slice().sort(function (a, b) {
    return parseFloat(a) - parseFloat(b);
  });
}

TableParser.prototype.getRows = function () {
  var rows = this.rows;
  var yValues = sortAsFloatValues(Object.keys(rows));
  return yValues.map(function (y) {
    return rows["" + y];
  });
};

function renderRows(rows) {
  return (rows || [])
    .map(function (row, rowId) {
      var cells = [];
      for (var i in row)
        for (var j in row[i]) cells.push(row[i][j].x + ": " + row[i][j].text);
      return rowId + ":\t" + cells.join(", ");
    })
    .join("\n");
}

TableParser.prototype.renderRows = function () {
  return renderRows(this.getRows());
};

// Matrix

function getSortedXValues(rows) {
  var xSet = {};
  for (var y in rows) for (var x in rows[y]) xSet[x] = true;
  return sortAsFloatValues(Object.keys(xSet));
}

/** @returns an 3-dimension matrix: row -> column -> items_collisionning_in_column -> item */
TableParser.prototype.getMatrix = function () {
  var rows = this.getRows();
  var xValues = getSortedXValues(rows);
  return rows.map(function (row, y) {
    var rowNew = [];
    for (var x in row) {
      var items = row[x];
      var colN = xValues.indexOf(x);
      rowNew[colN] = (rowNew[colN] || []).concat(items);
    }
    return rowNew;
  });
};

/**
 * For use with console.table().
 * @param {String} collisionSeparator separator to use when there are multiple values to join for a given column
 * @returns a 2-dimension matrix: row -> column -> value
 */
TableParser.prototype.getCleanMatrix = function ({ collisionSeparator } = {}) {
  return this.getMatrix().map((rowColumns) =>
    rowColumns.map((items) =>
      items.map((item) => item.text).join(collisionSeparator || "")
    )
  );
};

function getText(item) {
  return item.text;
}

function joinCellCollisions(separ) {
  return function (cell) {
    return (cell || []).map(getText).join(separ).substr(0, 7);
  };
}

function renderMatrix(matrix) {
  return (matrix || [])
    .map(function (row) {
      return (row || []).map(joinCellCollisions("+")).join("\t");
    })
    .join("\n");
}

TableParser.prototype.renderMatrix = function () {
  return renderMatrix(this.getMatrix());
};

module.exports = TableParser;
