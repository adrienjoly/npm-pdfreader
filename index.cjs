'use strict';

var util = require('util');
var PDFParser = require('pdf2json');

/**
 * Minimal logger
 * @author Adrien Joly, http://github.com/adrienjoly
 * This content is released under the MIT License.
 **/


var nullLog = function LOG() {};

var realLog = function LOG() {
  for (var i in arguments)
    if (arguments[i] instanceof Object || arguments[i] instanceof Array)
      arguments[i] = util.inspect(arguments[i]);
  console.log("[DEBUG] " + Array.prototype.join.call(arguments, " "));
};

var LOG = nullLog;

function log() {
  LOG.apply(null, arguments);
}

function toggle(enabled) {
  LOG = !enabled ? nullLog : realLog;
}

var LOG$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  log: log,
  toggle: toggle
});

/**
 * PdfReader: class that reads a PDF file, and calls a function on each item found while parsing that file.
 * @author Adrien Joly, http://github.com/adrienjoly
 * This content is released under the MIT License.
 *
 * An item object can match one of the following objects:
 * - null, when the parsing is over, or an error occured.
 * - {file:{path:string}}, when a PDF file is being opened.
 * - {page:integer}, when a new page is being parsed, provides the page number, starting at 1.
 * - {text:string, x:float, y:float, w:float, h:float...}, represents each text with its position.
 *
 **/


function forEachItem(pdf, handler) {
  var pageNumber = 0;
  // pdf.formImage was removed in pdf2json@2, but we keep backward compatibility too
  var Pages = pdf.Pages || pdf.formImage.Pages;
  for (var p in Pages) {
    var page = Pages[p];
    var number = ++pageNumber;
    handler(null, {
      page: number,
      width: page.Width || (pdf.formImage ? pdf.formImage.Width : 0),
      height:
        page.Height ||
        (pdf.formImage ? pdf.formImage.Pages[number - 1].Height : 0),
    });
    for (var t in page.Texts) {
      var item = page.Texts[t];
      item.text = decodeURIComponent(item.R[0].T);
      handler(null, item);
    }
  }
  handler();
}

function PdfReader(options) {
  log("PdfReader"); // only displayed if LOG.js was first loaded with `true` as init parameter
  this.options = options || {};
}

/**
 * parseFileItems: calls itemHandler(error, item) on each item parsed from the pdf file
 **/
PdfReader.prototype.parseFileItems = function (pdfFilePath, itemHandler) {
  itemHandler(null, { file: { path: pdfFilePath } });
  var pdfParser;
  if (this.options.password) {
    pdfParser = new PDFParser(null, null, this.options.password);
  } else {
    pdfParser = new PDFParser();
  }

  pdfParser.on("pdfParser_dataError", itemHandler);
  pdfParser.on("pdfParser_dataReady", function (pdfData) {
    forEachItem(pdfData, itemHandler);
  });
  var verbosity = this.options.debug ? 1 : 0;
  pdfParser.loadPDF(pdfFilePath, verbosity);
};

/**
 * parseBuffer: calls itemHandler(error, item) on each item parsed from the pdf file received as a buffer
 */
PdfReader.prototype.parseBuffer = function (pdfBuffer, itemHandler) {
  itemHandler(null, { file: { buffer: pdfBuffer } });
  var pdfParser;
  if (this.options.password) {
    pdfParser = new PDFParser(null, null, this.options.password);
  } else {
    pdfParser = new PDFParser();
  }

  pdfParser.on("pdfParser_dataError", itemHandler);
  pdfParser.on("pdfParser_dataReady", function (pdfData) {
    forEachItem(pdfData, itemHandler);
  });
  var verbosity = this.options.debug ? 1 : 0;
  pdfParser.parseBuffer(pdfBuffer, verbosity);
};

/**
 * parseColumns, for pdfreader, used by the Rule class.
 * accumulates values below each column header (on 1st row, given their name), without detecting empty rows.
 * TODO: use ColumnsParser
 * @author Adrien Joly, http://github.com/adrienjoly
 * This content is released under the MIT License.
 **/


const parseColumns$1 = function (/* columns */) {
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
        log("table header:", colNames, colX);
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

var parseColumnsExports = /*#__PURE__*/Object.freeze({
  __proto__: null,
  parseColumns: parseColumns$1
});

/**
 * parseTable accumulator, for pdfreader, used by the Rule class.
 * items are classified into columns and rows, based on their left and top coordinates,
 * and left position of column headers.
 * TODO: use TableParser
 * @author Adrien Joly, http://github.com/adrienjoly
 * This content is released under the MIT License.
 **/

function getTopPos(item) {
  return item.y;
}

function getLeftPos(item) {
  return item.x;
}

function getText$1(item) {
  return item.text;
}

/**
 * makeClassifier(): makes a classifier, based on an array of numbers and an expected number of clusters.
 * nbClusters: expected number of clusters
 * arr: array of numbers
 * => returns a function that takes a number, and returns the number of its corresponding column.
 **/
function makeFloorClassifier(nbClusters, arr) {
  var min = Math.min.apply(Math, arr);
  var delta = Math.max.apply(Math, arr) - min;
  min -= delta / nbClusters / 2;
  return function classify(value) {
    return Math.floor((nbClusters * (value - min)) / delta);
  };
}

function makeColumnClassifier(header) {
  var colX = [0].concat(header.map(getLeftPos)).sort(function (a, b) {
    return a - b;
  });
  return function classify(item) {
    for (var i = colX.length - 1; i > -1; --i)
      if (getLeftPos(item) >= colX[i]) return i;
  };
}

function buildRowList(items, classifyRow) {
  var rows = [];
  for (var i in items) {
    var item = items[i];
    var row = classifyRow(getTopPos(item));
    (rows[row] = rows[row] || []).push(item);
  }
  return rows;
}

function joinCellCollisions$1(separ) {
  return function (cell) {
    return (cell || []).map(getText$1).join(separ).substr(0, 7);
  };
}

function fillTab(str) {
  return str.substr(0, 7);
}

function renderTable(table) {
  return (table || [])
    .map(function (row) {
      return (row || []).map(fillTab).join("\t");
    })
    .join("\n");
}

function renderMatrix$1(matrix) {
  return (matrix || [])
    .map(function (row) {
      return (row || []).map(joinCellCollisions$1("+")).join("\t");
    })
    .join("\n");
}

function renderRows$1(rows) {
  return (rows || [])
    .map(function (row, rowId) {
      var cells = [rowId + ":"];
      for (var i in row)
        cells.push((Math.floor(row[i].x) + ":" + row[i].text).substr(0, 7));
      return cells.join("\t");
    })
    .join("\n");
}

function renderItems(items) {
  return items
    .map(function (i) {
      return [i.y, i.x, i.text].join("\t");
    })
    .join("\n");
}

function buildMatrix(rows, classifyColumn) {
  var matrix = [];
  for (var y in rows) {
    var row = [];
    for (var x in rows[y]) {
      var item = rows[y][x];
      var colN = classifyColumn(item);
      (row[colN] = row[colN] || []).push(item);
    }
    matrix.push(row);
  }
  return matrix;
}

function detectCollisions(matrix) {
  var collisions = [];
  (matrix || []).map(function (row, rowN) {
    (row || []).map(function (cellItems, colN) {
      if (cellItems.length > 1)
        collisions.push({
          row: rowN,
          col: colN,
          items: cellItems,
        });
    });
  });
  return collisions;
}

const parseTable$1 = function makeAccumulator(nbRows, headerRow) {
  var rule = this,
    items = [];

  rule.nbRows = nbRows || 0;
  rule.output = {
    items: items,
    rows: null,
    matrix: null,
  };

  function accumulate(item) {
    items.push(item);
  }

  // when parsing is done: generate a clean table, from items.
  rule.whenDone(function () {
    // classify items into rows
    var classifyRow = makeFloorClassifier(rule.nbRows, items.map(getTopPos));
    //LOG(items.map(function(i){ return [getTopPos(i), classifyRow(getTopPos(i)), i.text].join("\t"); }).join("\n"));
    this.output.rows = buildRowList(items, classifyRow);
    // classify row items into columns
    var classifyColumn = makeColumnClassifier(this.output.rows[headerRow || 0]);
    this.output.matrix = buildMatrix(this.output.rows, classifyColumn);
  });

  return accumulate; // then the same function will be run on all following items, until another rule is triggered
};

var parseTableExports = /*#__PURE__*/Object.freeze({
  __proto__: null,
  detectCollisions: detectCollisions,
  parseTable: parseTable$1,
  renderItems: renderItems,
  renderMatrix: renderMatrix$1,
  renderRows: renderRows$1,
  renderTable: renderTable
});

/**
 * Rule: class that can be used to define and process data extraction rules, while parsing a PDF document.
 * @author Adrien Joly, http://github.com/adrienjoly
 * This content is released under the MIT License.
 **/


/**
 * regexp: a regular expression which a PDF item's text must match in order to execute that rule.
 * => a Rule object exposes "accumulators": methods that defines the data extraction strategy of a rule.
 **/
function Rule(regexp) {
  this.regexp = regexp;
  var self = this;
  // proxy accumulators methods
  Object.keys(Rule.accumulators).forEach(function (name) {
    self[name] = function () {
      log("building rule:", regexp, "->", name);
      self.methodName = name;
      self.accumulatorParams = arguments;
      self.accumulatorBuilder = Rule.accumulators[name];
      return self;
    };
  });
}

// shortcut for defining Rule objects in a more concise manner
Rule.on = function (regexp) {
  return new Rule(regexp);
};

Rule.after = function (regexp) {
  var rule = new Rule(regexp);
  rule.skipCurrentItem = true;
  return rule;
};

/**
 * then(): defines a function to be called after a Rule's accumulator has finished processing items.
 * fct: the function to be called after a Rule's accumulator has finished processing items.
 *      the output of the accumulator will be passed as the first parameter of that function.
 **/
Rule.prototype.then = function (fct) {
  var self = this;
  this.terminate = function () {
    fct.call(self, self.output);
  };
  return this;
};

// private function that checks a PDF item against the Rule's regexp, and returns the corresponding accumulator.
Rule.prototype.test = function (item) {
  if (this.regexp.test(item.text)) {
    // lazy init of accumulators: build and init the accumulator on first match
    this.currentItem = item;
    if (!this.accumulatorImpl && this.accumulatorBuilder) {
      this.accumulatorImpl = this.accumulatorBuilder.apply(
        this,
        this.accumulatorParams
      );
      this.accumulatorImpl.methodName = this.methodName;
      this.accumulatorImpl.terminate = this.terminate;
    }
    return this.accumulatorImpl;
  }
};

// intended to be run from accumulator, in order to process output before calling termination then() handler.
Rule.prototype.whenDone = function (fct) {
  var self = this;
  var then = this.terminate;
  this.terminate = function () {
    fct.call(self);
    then();
  };
};

/**
 * rules: array of Rule objects that will be executed one-by-one, whenever a PDF item matches a rule.
 *        each rule can only be executed once.
 * => returns a function to be called for each item by the PdfReader.
 **/
Rule.makeItemProcessor = function (rules) {
  var currentAccumulator = null;
  function terminateAccumulator() {
    var terminatePreviousAcc = (currentAccumulator || {}).terminate;
    if (terminatePreviousAcc) {
      log("terminating accumulator:", currentAccumulator.methodName);
      terminatePreviousAcc(currentAccumulator); // TODO: remove currentAccumulator parameter
    }
  }
  var applyRulesOnNextItem = true;
  return function (item) {
    if (!item)
      // last item of the file => flush buffers
      return terminateAccumulator();
    else if (!item.text) return;
    //LOG("ITEM:", item.text, "=> apply rules:", applyRulesOnNextItem);
    if (applyRulesOnNextItem)
      for (var r in rules) {
        var accumulator = rules[r].test(item);
        if (accumulator) {
          terminateAccumulator();
          log("current accumulator:", accumulator.methodName);
          if (rules[r].skipCurrentItem) applyRulesOnNextItem = false;
          currentAccumulator = accumulator;
          delete rules[r];
          return;
        }
      }
    else applyRulesOnNextItem = true;
    // if reaching this point, the current item matches none of the rules => accumulating data on current accumulator
    if (currentAccumulator) applyRulesOnNextItem = !currentAccumulator(item);
  };
};

/**
 * Rule.accumulators: array of accumulators that can be used for defining Rule objects.
 * An accumulator is a function that may (or may not) accept parameters, to be provided by the developer of a parser.
 * It returns another function that will be run on every following PDF item, in order to accumulate data.
 * The output of an accumulator is stored in this.output (field of its parent Rule object).
 **/
Rule.accumulators = {
  stopAccumulating: function () {
    return function () {};
  },
};

// method for adding accumulators
Rule.addAccumulator = function (methodName, methodBuilder) {
  Rule.accumulators[methodName] = methodBuilder;
};

/**
 * This accumulator will store the values extracted by the regexp of the Rule object,
 * on the current matching PDF item, into an array.
 **/
Rule.addAccumulator("extractRegexpValues", function () {
  var matches = this.regexp.exec(this.currentItem.text);
  this.output = matches.slice(1);
  return function () {}; // following lines are not to be processed by this accumulator
});

/**
 * This accumulator will store the value of the next PDF item.
 **/
Rule.addAccumulator("parseNextItemValue", function () {
  var self = this,
    done = false;
  return function (item) {
    if (done) return;
    done = true;
    self.output = item.text;
  };
});

/**
 * This accumulator will store the text of all following PDF items into an array.
 **/
Rule.addAccumulator("accumulateAfterHeading", function () {
  var output = (this.output = []);
  return function accumulate(item) {
    output.push(item.text);
  };
});

/**
 * This accumulator will store the text of all following PDF items with equal x-coordinates.
 **/
Rule.addAccumulator("accumulateFromSameX", function () {
  var output = (this.output = []),
    x = null;
  return function accumulate(item) {
    if (x === null) x = item.x;
    if (x == item.x) output.push(item.text);
  };
});

/**
 * This accumulator will store a table by detecting its columns, given their names.
 **/
Rule.addAccumulator("parseColumns", parseColumns$1);

/**
 * This accumulator will store a table by detecting its columns, given their count.
 **/
Rule.addAccumulator("parseTable", parseTable$1);

/**
 * Applies a list of simple actions to apply to each provided item, in order to accumulate field values.
 * Provides a list of parsed `fields`.
 * Calls `callback(error, this)` when all accumulators were processed, or when processing a null item.
 **/
function SequentialParser(accumulators, callback) {
  var step = 0;
  var fields = {};
  return {
    fields: fields,
    addField: function (key, value) {
      this.fields[key] = value;
    },
    parseItem: function (item) {
      if (step >= accumulators.length) {
        return console.warn(
          "warning: skipping item, because SequentialParser is done."
        );
      }
      var current = accumulators[step];
      if (current.field) {
        this.addField(current.field, item);
        ++step;
      } else if (current.accumulator) {
        var doneAccumulating = current.accumulator(item, this);
        if (doneAccumulating) ++step;
      } // no action => skip item
      else ++step;
      if (!item || step >= accumulators.length) {
        callback && callback(null, this);
      }
    },
  };
}

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

/**
 * ColumnsParser
 * Classifies items into columns, nearest to the left position of their corresponding header.
 * @author Adrien Joly, http://github.com/adrienjoly
 * This content is released under the MIT License.
 **/


function getColumnIndex(cols, x) {
  var bestDist = null;
  for (var i = 0; i < cols.length; ++i) {
    var dist = Math.abs(x - cols[i].x);
    if (bestDist !== null && dist > bestDist) {
      break;
    } else {
      bestDist = dist;
    }
  }
  return i - 1;
}

function ColumnsParser(colNames) {
  this.cols = [];
  var cols = this.cols,
    colNames = colNames.slice(), // clone (for parameter immutability)
    line = -1; // -1 = header

  this.processItem = function (item) {
    if (line == -1) {
      // parse x-position of column headers
      var i = colNames.indexOf(item.text);
      if (i > -1) {
        log("ColumnsParser header", i, item.text, "=> x:", item.x);
        cols[i] = {
          name: item.text,
          x: item.x,
          items: [],
        };
        colNames[i] = ""; // needed so that a column name can be associated to more than 1 index
      }
      if (cols.length == colNames.length) {
        // done parsing header
        line++;
      }
    } else {
      cols[getColumnIndex(cols, item.x)].items.push(item);
    }
  };
}

const parseTable = Object.assign(
  parseTable$1,
  parseTableExports
);
const parseColumns = Object.assign(
  parseColumns$1,
  parseColumnsExports
);

exports.ColumnsParser = ColumnsParser;
exports.LOG = LOG$1;
exports.PdfReader = PdfReader;
exports.Rule = Rule;
exports.SequentialParser = SequentialParser;
exports.TableParser = TableParser;
exports.parseColumns = parseColumns;
exports.parseTable = parseTable;
