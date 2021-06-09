var data = clearObs.map(unmixed);
print ('unmix results',data);

var BS = data.select('BS');
var PV = data.select('PV');
var DA = data.select('DA');
var IS = data.select('IS');
var NPV = data.select('NPV');
var V = data.select('V');


var lag = function(leftCollection, rightCollection) {
  var filter = ee.Filter.and(
    ee.Filter.equals({
      leftField: 'doy', 
      rightField: 'doy'
    }),
    ee.Filter.lessThan({
      leftField: 'system:time_start1', 
      rightField: 'system:time_start1'
  }));
  
  return ee.Join.saveAll({
    matchesKey: 'after',
    measureKey: 'delta_t',
    ordering: 'system:time_start', 
    ascending: false, 
  }).apply({
    primary: leftCollection, 
    secondary: rightCollection, 
    condition: filter
  });
};

var joined = lag(PV, PV);
print (joined)


//print ("---------------------------Seasonal M-K--------------------------------");
//----------------------------------kendall--------------------------------------
var sign = function(i, j) { // i and j are images
  return ee.Image(j).neq(i) // Zero case
      .multiply(ee.Image(j).subtract(i).clamp(-1, 1)).int();
};

var kendall = ee.ImageCollection(joined.map(function(current) {
  var afterCollection = ee.ImageCollection.fromImages(current.get('after'));
  return afterCollection.map(function(image) {
    return ee.Image(sign(current, image)).unmask(0);
  });
}).flatten()).reduce('sum', 2);
print (kendall);
//----------------------------------Seasonal Sen Slope--------------------------------------
var slope = function(i, j) { // i and j are images
  var dstamp = ee.Date(ee.Image(j).get('system:time_start'));
  var ddiff = dstamp.difference(ee.Date(ee.Image(i).get('system:time_start')), 'year');
  return ee.Image(j).subtract(i)
      .divide(ddiff)
      .float();
};

var slopes = ee.ImageCollection(joined.map(function(current) {
  var afterCollection = ee.ImageCollection.fromImages(current.get('after'));
  return afterCollection.map(function(image) {
      return ee.Image(slope(current, image));
  });
}).flatten());

var sensSlope = slopes.reduce(ee.Reducer.median(),4);
var EP_sensSlope = sensSlope.multiply(10000).toInt32();
print (EP_sensSlope);
//-----------------------------------Z-------------------------------------------
// Values that are in a group (ties).  Set all else to zero.

var smoothed = data.select('PV');
var groups = smoothed.map(function(i) {
  var matches = smoothed.map(function(j) {
    return i.eq(j); // i and j are images.
  }).sum();
  return i.multiply(matches.gt(1));
});

print (groups);
// Compute tie group sizes in a sequence.  The first group is discarded.
var group = function(array) {
  var length = array.arrayLength(0);
  // Array of indices.  These are 1-indexed.
  var indices = ee.Image([1])
      .arrayRepeat(0, length)
      .arrayAccum(0, ee.Reducer.sum())
      .toArray(1);
  var sorted = array.arraySort();
  var left = sorted.arraySlice(0, 1);
  var right = sorted.arraySlice(0, 0, -1);
  // Indices of the end of runs.
  var mask = left.neq(right)
  // Always keep the last index, the end of the sequence.
      .arrayCat(ee.Image(ee.Array([[1]])), 0);
  var runIndices = indices.arrayMask(mask);
  // Subtract the indices to get run lengths.
  var groupSizes = runIndices.arraySlice(0, 1)
      .subtract(runIndices.arraySlice(0, 0, -1));
  return groupSizes;
};

// See equation 2.6 in Sen (1968).
var factors = function(image) {
  return image.expression('b() * (b() - 1) * (b() * 2 + 5)');
};

var groupSizes = group(groups.toArray());
var groupFactors = factors(groupSizes);
var groupFactorSum = groupFactors.arrayReduce('sum', [0])
      .arrayGet([0, 0]);


var count = ee.Image(19);

var factors = function(image) {
  return image.expression('b() * (b() - 1) * (b() * 2 + 5)');
};
var kendallVariance = factors(count).multiply(12)


// Compute Z-statistics.
var zero = kendall.multiply(kendall.eq(0));
var pos = kendall.multiply(kendall.gt(0)).subtract(1);
var neg = kendall.multiply(kendall.lt(0)).add(1);

var z = zero
    .add(pos.divide(kendallVariance.sqrt()))
    .add(neg.divide(kendallVariance.sqrt()));
var EP_z = z.multiply(10000).toInt32();
print (EP_z)