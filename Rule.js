/**
 * Rule: class that can be used to define and process data extraction rules, while parsing a PDF document.
 * @author Adrien Joly, http://github.com/adrienjoly
 * This content is released under the MIT License.
 **/

var LOG = require("./lib/LOG.js");

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
      LOG("building rule:", regexp, "->", name);
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
      LOG("terminating accumulator:", currentAccumulator.methodName);
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
          LOG("current accumulator:", accumulator.methodName);
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
Rule.addAccumulator("parseColumns", require("./lib/parseColumns.js"));

/**
 * This accumulator will store a table by detecting its columns, given their count.
 **/
Rule.addAccumulator("parseTable", require("./lib/parseTable.js"));

module.exports = Rule;
