//*********************************************************************
// data is unmixed results with properties, for example 
// doy: 0
// system:index: 0
// system:time_start: 978307200000
// system:time_start1: Date (2001-01-01 00:00:00)
//**********************************************************************

var data = clearObs.map(unmixed);
print ('unmix results',data);

var BS = data.select('BS');
var PV = data.select('PV');
var DA = data.select('DA');
var IS = data.select('IS');
var NPV = data.select('NPV');

//*******************************************************************************
// This is join function that using filter about same month and different years.
// we can set image which has the same month and all sbsequent years as properties
// and ahicve 216 (228-12) images as imageCollection
//*******************************************************************************

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
    ordering: 'system:time_start1', 
    ascending: true, 
  }).apply({
    primary: leftCollection, 
    secondary: rightCollection, 
    condition: filter
  });
};


var joined = lag(IS, IS);
print (joined)

//----------------------------------Seasonal Sen Slope------------------------------
//*******************************************************************************
// This is function for estimates of Seasonal Sen Slope using based on jioned ImageCollection
//*******************************************************************************
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

//--------------------------------Seasonal M-K-----------------------------------
//----------------------------------kendall--------------------------------------
//*******************************************************************************
// The kendall of seasonal m-k test can be interpreted as 
// the sum of the kendall of the ordinary m-k test for different monthly time series (n=19)
//*******************************************************************************
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

//-----------------------------------Z-------------------------------------------
//*******************************************************************************
// This is a simple algorithm considering the group (ties), however, 
// often accompanied bymemory error issues because of large number of operations
//*******************************************************************************
// First, generating a time series for each month  from endmember fractions
var datalist = data.toList(228)
var yr = ee.List.sequence(0, 11, 1)
var list = function(i){
  var doy = ee.List.sequence(0, 216,12)
  var data = doy.map(function(j){
    return datalist.get(ee.Number(j).add(ee.Number(i)))
  })
  return data
}
var monthgroup = yr.map(list)
print (monthgroup)


// Secdond, counting kendallvariance for each time series of given month
// the algorithm 
var groups_month = function(m){
  // each endmember
  var smoothed = ee.ImageCollection.fromImages(monthgroup.get(m)).select('IS'); 
  //a function about values that are in a group (ties) for each time series of a given month
  var groups = smoothed.map(function(i) {
  var matches = smoothed.map(function(j) {
    return i.eq(j); // i and j are images.
  }).sum();
  return i.multiply(matches.gt(1));
  }); 
  
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
  
  var factors = function(image) {
  return image.expression('b() * (b() - 1) * (b() * 2 + 5)');
  };

  var groupSizes = group(groups.toArray());
  var groupFactors = factors(groupSizes);
  var groupFactorSum = groupFactors.arrayReduce('sum', [0])
      .arrayGet([0, 0]);
  
  var count = ee.Image(19);

  var kendallvariance = factors(count)
    .subtract(groupFactorSum)
    .divide(18)
    .float();
  return kendallvariance; 
};

var kendallVariance = yr.map(groups_month)
kendallVariance = ee.ImageCollection.fromImages(kendallVariance).sum()
print (kendallVariance);

/**
//*********************************************************************
// This is a simple algorithm without considering the group (ties)
//**********************************************************************
var count = ee.Image(19);
var factors = function(image) {
  return image.expression('b() * (b() - 1) * (b() * 2 + 5)');
};
var kendallVariance = factors(count).multiply(12)
*/
//*********************************************************************
// This is a algorithm for computing Z-statistics.
//**********************************************************************

var zero = kendall.multiply(kendall.eq(0));
var pos = kendall.multiply(kendall.gt(0)).subtract(1);
var neg = kendall.multiply(kendall.lt(0)).add(1);

var z = zero
    .add(pos.divide(kendallVariance.sqrt()))
    .add(neg.divide(kendallVariance.sqrt()));
var EP_z = z.multiply(10000).toInt32();
print (EP_z)