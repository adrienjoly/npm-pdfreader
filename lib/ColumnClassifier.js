/**
 * ColumnClassifier: class that clusters an array of numbers, given the expected number of clusters,
 *   and returns a classifier function. This class is used by the parseTable accumulator, for detecting
 *   columns, based on the x-coordinates of the text contained in its cells.
 * @author Adrien Joly, http://github.com/adrienjoly
 * This content is released under the MIT License.
 **/

function ColumnClassifier(){};

/**
 * cluster(): clusters an array of numbers, given the expected number of clusters.
 * arr: array of numbers (they will be sorted)
 * nbClusters: expected number of clusters
 * => returns the ColumnClassifier instance.
 **/
ColumnClassifier.prototype.cluster = function(arr, nbClusters){
  this.clusters = [[]];
  // prepare data
  arr.sort(function(a, b){
    return a - b;
  });
  var delta = (arr[arr.length - 1] - arr[0]) / nbClusters;
  var threshold = delta / 2;
  // cluster values
  var prevVal = arr[0],
      cluster = 0;
  for (var i in arr) {
    if (Math.abs(arr[i] - prevVal) >= threshold) {
      cluster++;
      this.clusters[cluster] = [];
      prevVal = arr[i];
    }
    this.clusters[cluster].push(arr[i]);
  }
  return this;
};

/**
 * getClassifier(): makes a classifier, based on the data provided to the last call of cluster().
 * => returns a function that takes a number, and returns the number of its corresponding column.
 **/
ColumnClassifier.prototype.getClassifier = function(){
  var clusters = this.clusters.map(function(c){
    return Math.max.apply(Math, c);
  });
  return function classify(x){
    for (var i=0; i<clusters.length; ++i)
      if (x <= clusters[i])
        return i;
  }
};

module.exports = ColumnClassifier;
