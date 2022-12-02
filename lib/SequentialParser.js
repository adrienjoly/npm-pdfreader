/**
 * Applies a list of simple actions to apply to each provided item, in order to accumulate field values.
 * Provides a list of parsed `fields`.
 * Calls `callback(error, this)` when all accumulators were processed, or when processing a null item.
 **/
export function SequentialParser(accumulators, callback) {
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
