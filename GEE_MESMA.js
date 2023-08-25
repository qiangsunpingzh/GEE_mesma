ar region = 
    /* color: #d63000 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-180, 80],
          [-180, -60],
          [180, -60],
          [180, 80]]], null, false);
//***********************************************************************
//DATASET: MCD43A4.006 MODIS Nadir BRDF-Adjusted Reflectance Daily 500m 
//         https://developers.google.com/earth-engine/datasets/catalog/MODIS_006_MCD43A4
//TIME: 2001/01-2019/12 A monthy data
//***********************************************************************

// NDVI
var addNDVI = function(image){
  var ndvi =image.expression(
      '(b1-b2)/(b1+b2)',
      {
        b1: image.select('Nadir_Reflectance_Band2').toFloat(), 
        b2: image.select('Nadir_Reflectance_Band1').toFloat()
      }).rename('ndvi');
  return image.addBands(ndvi);
};
//***********************************************************************
// The MCD43A4 dataset was then temporally aggregated to produce a monthly composited dataset 
// by taking the medium of all valid reflectance in Google Earth Engine (GEE) platform during 2001–2019
//***********************************************************************
var year = ee.List.sequence(2001, 2019); //2019
var monthydata = function(i){
  var yr = i;
  var month = ee.List.sequence(1, 12);//12
  var m = month.map(function(j){
    var m = j;
    var startDate= ee.Date.fromYMD(yr, m, 1);
    var endDate =  startDate.advance(1, "month");
    var modis = ee.ImageCollection('MODIS/006/MCD43A4')
                  .filterDate(startDate,endDate)
                  //.map(addNDVI)
                  //.qualityMosaic('ndvi')
                  .median()
                  .set("system:time_start",startDate);
    return modis;
  });
  return m;
};
var clearObs = ee.ImageCollection((year.map(monthydata)).flatten());
print (clearObs);

print ("-------------------------------MESMA------------------------------------");

// a zero image for each model result
var stimg = ee.Image([0.0,0.0,0.0,0.0,0.0]).rename(['DA','NPV','IS','BS','PV']).toInt16();

// A global EMs database

var PV1 = ee.Dictionary({'PV':[0.026408468,0.076322062,0.04662912,0.552538135,0.437645537,0.260140649,0.099975174]});
var PV2 = ee.Dictionary({'PV':[0.028110777,0.077798724,0.045718969,0.623049604,0.493402848,0.262534396,0.099991305]});
var PV3 = ee.Dictionary({'PV':[0.030215979,0.08566919,0.058638578,0.549627589,0.478326377,0.277151391,0.113148475]});
var PV4 = ee.Dictionary({'PV':[0.025647535,0.072929906,0.045497913,0.468603709,0.420975819,0.243090072,0.092289736]});

var IS1 = ee.Dictionary({'IS':[0.924466819,0.938402464,0.948988155,0.878188505,0.50731879,0.130517249,0.048781273]});
var IS2 = ee.Dictionary({'IS':[0.894102034,0.889473966,0.88220815,0.827582111,0.397434006,0.084593271,0.029267681]});

var DA1 = ee.Dictionary({'DA':[0.024251634,0.038128939,0.046037523,0.059930979,0.049251377,0.044629727,0.029284062]});
var DA2 = ee.Dictionary({'DA':[0.009592148,0.007826186,0.001260362,0.000379037,0.000597277,0.010365155,0.004269998]});

var NPV1 = ee.Dictionary({'NPV':[0.155078476,0.174047003,0.155848757,0.278557653,0.376950266,0.450802615,0.134369069]});
var NPV2 = ee.Dictionary({'NPV':[0.086870193,0.125779469,0.088213253,0.184826776,0.267280334,0.338532988,0.125851886]});
var NPV3 = ee.Dictionary({'NPV':[0.04421522,0.07089446,0.04344132,0.110965188,0.16741524,0.22048182,0.107744125]});

var BS1 = ee.Dictionary({'BS':[0.1573116,0.263072452,0.340194005,0.472395903,0.513153034,0.54672657,0.512903602]});
var BS2 = ee.Dictionary({'BS':[0.147103366,0.240725783,0.330601816,0.424608472,0.442472993,0.502955319,0.486239989]});
var BS3 = ee.Dictionary({'BS':[0.148291235,0.253283408,0.357496576,0.380341229,0.527180964,0.56649996,0.479689172]});
var BS4 = ee.Dictionary({'BS':[0.114897494,0.216845742,0.346514009,0.469516989,0.600553811,0.648530063,0.576058693]});

//************************************************************************************************************************
// endmember combinations based on selected endmember spectra, combination models, 
// including two-endmember model, three-endmember model and four-endmember model
//************************************************************************************************************************
var V = ee.List([PV1, PV2, PV3,PV4, NPV1, NPV2, NPV3, BS1, BS2, BS3, BS4, IS1, IS2, DA1, DA2]);
//print (V.size())
/**
var em2 = ee.List([]);
var em3 = ee.List([]);
var em4 = ee.List([]);
for (var i=0;i<15;i++) {
  var m1 = V.get(i);
  for (var j=i;j<15;j++) {
    var m2 = V.get(j);
    var em_2 = ee.Dictionary(m1).combine(ee.Dictionary(m2));
    var emC2 = ee.Algorithms.If({
        condition: ee.Algorithms.IsEqual(em_2.size(),2),
        trueCase: em_2,
        falseCase: 0
    });
    em2 = em2.add(emC2);
    for (var k=j;k<15;k++){
      var m3 = V.get(k);
      var em_3 = ee.Dictionary(m1).combine(ee.Dictionary(m2)).combine(ee.Dictionary(m3));
      var emC3 = ee.Algorithms.If({
        condition: ee.Algorithms.IsEqual(em_3.size(),3),
        trueCase: em_3,
        falseCase: 0
      });
      em3 = em3.add(emC3);
      for (var n=k;n<15;n++){
        var m4 = V.get(n);
        var em_4 = ee.Dictionary(m1).combine(ee.Dictionary(m2)).combine(ee.Dictionary(m3)).combine(ee.Dictionary(m4));
        var emC4 = ee.Algorithms.If({
        condition: ee.Algorithms.IsEqual(em_4.size(),4),
        trueCase: em_4,
        falseCase: 0
        })
        em4 = em4.add(emC4);
        }  
      }
    }
}
var EMlib2 = em2.removeAll([0]);
var EMlib3 = em3.removeAll([0]);
var EMlib4 = em4.removeAll([0]);
print (EMlib2.size())
print (EMlib3.size())
print (EMlib4.size())
*/



//*******************************another arrroaches for combination models********************************************
// two-endmember model(88)
var EMlib2 = ee.List([BS1.combine(PV1),BS1.combine(PV2),BS1.combine(PV3),BS1.combine(PV4),BS1.combine(NPV1),BS1.combine(NPV2),BS1.combine(IS1),BS1.combine(IS2),BS1.combine(NPV3),
                      BS2.combine(PV1),BS2.combine(PV2),BS2.combine(PV3),BS2.combine(PV4),BS2.combine(NPV1),BS2.combine(NPV2),BS2.combine(IS1),BS2.combine(IS2),BS2.combine(NPV3),
                      BS3.combine(PV1),BS3.combine(PV2),BS3.combine(PV3),BS3.combine(PV4),BS3.combine(NPV1),BS3.combine(NPV2),BS3.combine(IS1),BS3.combine(IS2),BS3.combine(NPV3),
                      BS4.combine(PV1),BS4.combine(PV2),BS4.combine(PV3),BS4.combine(PV4),BS4.combine(NPV1),BS4.combine(NPV2),BS4.combine(IS1),BS4.combine(IS2),BS4.combine(NPV3),
                      PV1.combine(NPV1),PV1.combine(NPV2),PV1.combine(NPV3),PV1.combine(IS1),PV1.combine(IS2),PV2.combine(NPV1),PV2.combine(NPV2),PV2.combine(NPV3),PV2.combine(IS1),PV2.combine(IS2),
                      PV3.combine(NPV1),PV3.combine(NPV2),PV3.combine(NPV3),PV3.combine(IS1),PV3.combine(IS2),PV4.combine(NPV1),PV4.combine(NPV2),PV4.combine(NPV3),PV4.combine(IS1),PV4.combine(IS2),
                      NPV1.combine(IS1),NPV1.combine(IS2),NPV2.combine(IS1),NPV2.combine(IS2),NPV3.combine(IS1),NPV3.combine(IS2),
                      BS1.combine(DA1),BS2.combine(DA1),BS3.combine(DA1),BS4.combine(DA1),PV1.combine(DA1),PV2.combine(DA1),PV3.combine(DA1),PV4.combine(DA1),NPV1.combine(DA1),NPV2.combine(DA1),NPV3.combine(DA1),IS1.combine(DA1),IS2.combine(DA1),
                      BS1.combine(DA2),BS2.combine(DA2),BS3.combine(DA2),BS4.combine(DA2),PV1.combine(DA2),PV2.combine(DA2),PV3.combine(DA2),PV4.combine(DA2),NPV1.combine(DA2),NPV2.combine(DA2),NPV3.combine(DA2),IS1.combine(DA2),IS2.combine(DA2)
                      ]);
print (EMlib2.size())                      
// three-endmember model(252)
var EMlib3 = ee.List([BS1.combine(PV1).combine(NPV1),BS1.combine(PV2).combine(NPV1),BS1.combine(PV3).combine(NPV1),BS1.combine(PV4).combine(NPV1),
                      BS1.combine(PV1).combine(NPV2),BS1.combine(PV2).combine(NPV2),BS1.combine(PV3).combine(NPV2),BS1.combine(PV4).combine(NPV2),
                      BS1.combine(PV1).combine(NPV3),BS1.combine(PV2).combine(NPV3),BS1.combine(PV3).combine(NPV3),BS1.combine(PV4).combine(NPV3),
                      BS2.combine(PV1).combine(NPV1),BS2.combine(PV2).combine(NPV1),BS2.combine(PV3).combine(NPV1),BS2.combine(PV4).combine(NPV1),
                      BS2.combine(PV1).combine(NPV2),BS2.combine(PV2).combine(NPV2),BS2.combine(PV3).combine(NPV2),BS2.combine(PV4).combine(NPV2),
                      BS2.combine(PV1).combine(NPV3),BS2.combine(PV2).combine(NPV3),BS2.combine(PV3).combine(NPV3),BS2.combine(PV4).combine(NPV3),
                      BS3.combine(PV1).combine(NPV1),BS3.combine(PV2).combine(NPV1),BS3.combine(PV3).combine(NPV1),BS3.combine(PV4).combine(NPV1),
                      BS3.combine(PV1).combine(NPV2),BS3.combine(PV2).combine(NPV2),BS3.combine(PV3).combine(NPV2),BS3.combine(PV4).combine(NPV2),
                      BS3.combine(PV1).combine(NPV3),BS3.combine(PV2).combine(NPV3),BS3.combine(PV3).combine(NPV3),BS3.combine(PV4).combine(NPV3),
                      BS4.combine(PV1).combine(NPV1),BS4.combine(PV2).combine(NPV1),BS4.combine(PV3).combine(NPV1),BS4.combine(PV4).combine(NPV1),
                      BS4.combine(PV1).combine(NPV2),BS4.combine(PV2).combine(NPV2),BS4.combine(PV3).combine(NPV2),BS4.combine(PV4).combine(NPV2),
                      BS4.combine(PV1).combine(NPV3),BS4.combine(PV2).combine(NPV3),BS4.combine(PV3).combine(NPV3),BS4.combine(PV4).combine(NPV3),
                      BS1.combine(PV1).combine(IS1),BS1.combine(PV1).combine(IS2),BS1.combine(PV2).combine(IS1),BS1.combine(PV2).combine(IS2),BS1.combine(PV3).combine(IS1),BS1.combine(PV3).combine(IS2),BS1.combine(PV4).combine(IS1),BS1.combine(PV4).combine(IS2),
                      BS2.combine(PV1).combine(IS1),BS2.combine(PV1).combine(IS2),BS2.combine(PV2).combine(IS1),BS2.combine(PV2).combine(IS2),BS2.combine(PV3).combine(IS1),BS2.combine(PV3).combine(IS2),BS2.combine(PV4).combine(IS1),BS2.combine(PV4).combine(IS2),
                      BS3.combine(PV1).combine(IS1),BS3.combine(PV1).combine(IS2),BS3.combine(PV2).combine(IS1),BS3.combine(PV2).combine(IS2),BS3.combine(PV3).combine(IS1),BS3.combine(PV3).combine(IS2),BS3.combine(PV4).combine(IS1),BS3.combine(PV4).combine(IS2),
                      BS4.combine(PV1).combine(IS1),BS4.combine(PV1).combine(IS2),BS4.combine(PV2).combine(IS1),BS4.combine(PV2).combine(IS2),BS4.combine(PV3).combine(IS1),BS4.combine(PV3).combine(IS2),BS4.combine(PV4).combine(IS1),BS4.combine(PV4).combine(IS2),
                      BS1.combine(PV1).combine(DA1),BS1.combine(PV1).combine(DA2),BS1.combine(PV2).combine(DA1),BS1.combine(PV2).combine(DA2),BS1.combine(PV3).combine(DA1),BS1.combine(PV3).combine(DA2),BS1.combine(PV4).combine(DA1),BS1.combine(PV4).combine(DA2),
                      BS2.combine(PV1).combine(DA1),BS2.combine(PV1).combine(DA2),BS2.combine(PV2).combine(DA1),BS2.combine(PV2).combine(DA2),BS2.combine(PV3).combine(DA1),BS2.combine(PV3).combine(DA2),BS2.combine(PV4).combine(DA1),BS2.combine(PV4).combine(DA2),
                      BS3.combine(PV1).combine(DA1),BS3.combine(PV1).combine(DA2),BS3.combine(PV2).combine(DA1),BS3.combine(PV2).combine(DA2),BS3.combine(PV3).combine(DA1),BS3.combine(PV3).combine(DA2),BS3.combine(PV4).combine(DA1),BS3.combine(PV4).combine(DA2),
                      BS4.combine(PV1).combine(DA1),BS4.combine(PV1).combine(DA2),BS4.combine(PV2).combine(DA1),BS4.combine(PV2).combine(DA2),BS4.combine(PV3).combine(DA1),BS4.combine(PV3).combine(DA2),BS4.combine(PV4).combine(DA1),BS4.combine(PV4).combine(DA2),
                      BS1.combine(NPV1).combine(IS1),BS1.combine(NPV2).combine(IS1),BS1.combine(NPV3).combine(IS1),BS2.combine(NPV1).combine(IS1),BS2.combine(NPV2).combine(IS1),BS2.combine(NPV2).combine(IS1),
                      BS1.combine(NPV1).combine(IS2),BS1.combine(NPV2).combine(IS2),BS1.combine(NPV3).combine(IS2),BS2.combine(NPV1).combine(IS2),BS2.combine(NPV2).combine(IS2),BS2.combine(NPV2).combine(IS2),
                      BS3.combine(NPV1).combine(IS1),BS3.combine(NPV2).combine(IS1),BS3.combine(NPV3).combine(IS1),BS3.combine(NPV1).combine(IS1),BS3.combine(NPV2).combine(IS1),BS3.combine(NPV2).combine(IS1),
                      BS4.combine(NPV1).combine(IS2),BS4.combine(NPV2).combine(IS2),BS4.combine(NPV3).combine(IS2),BS4.combine(NPV1).combine(IS2),BS4.combine(NPV2).combine(IS2),BS4.combine(NPV2).combine(IS2),
                      BS1.combine(NPV1).combine(DA1),BS1.combine(NPV2).combine(DA1),BS1.combine(NPV3).combine(DA1),BS2.combine(NPV1).combine(DA1),BS2.combine(NPV2).combine(DA1),BS2.combine(NPV2).combine(DA1),
                      BS1.combine(NPV1).combine(DA2),BS1.combine(NPV2).combine(DA2),BS1.combine(NPV3).combine(DA2),BS2.combine(NPV1).combine(DA2),BS2.combine(NPV2).combine(DA2),BS2.combine(NPV2).combine(DA2),
                      BS3.combine(NPV1).combine(DA1),BS3.combine(NPV2).combine(DA1),BS3.combine(NPV3).combine(DA1),BS4.combine(NPV1).combine(DA1),BS4.combine(NPV2).combine(DA1),BS4.combine(NPV2).combine(DA1),
                      BS3.combine(NPV1).combine(DA2),BS3.combine(NPV2).combine(DA2),BS3.combine(NPV3).combine(DA2),BS4.combine(NPV1).combine(DA2),BS4.combine(NPV2).combine(DA2),BS4.combine(NPV2).combine(DA2),
                      BS1.combine(IS1).combine(DA1),BS2.combine(IS1).combine(DA1),BS3.combine(IS1).combine(DA1),BS4.combine(IS1).combine(DA1),
                      BS1.combine(IS1).combine(DA2),BS2.combine(IS1).combine(DA2),BS3.combine(IS1).combine(DA2),BS4.combine(IS1).combine(DA2),
                      BS1.combine(IS2).combine(DA1),BS2.combine(IS2).combine(DA1),BS3.combine(IS2).combine(DA1),BS4.combine(IS2).combine(DA1),
                      BS1.combine(IS2).combine(DA2),BS2.combine(IS2).combine(DA2),BS3.combine(IS2).combine(DA2),BS4.combine(IS2).combine(DA2),
                      PV1.combine(NPV1).combine(IS1),PV1.combine(NPV2).combine(IS1),PV1.combine(NPV3).combine(IS1),PV1.combine(NPV1).combine(IS2),PV1.combine(NPV2).combine(IS2),PV1.combine(NPV3).combine(IS2),
                      PV2.combine(NPV1).combine(IS1),PV2.combine(NPV2).combine(IS1),PV2.combine(NPV3).combine(IS1),PV2.combine(NPV1).combine(IS2),PV2.combine(NPV2).combine(IS2),PV2.combine(NPV3).combine(IS2),
                      PV3.combine(NPV1).combine(IS1),PV3.combine(NPV2).combine(IS1),PV3.combine(NPV3).combine(IS1),PV3.combine(NPV1).combine(IS2),PV3.combine(NPV2).combine(IS2),PV3.combine(NPV3).combine(IS2),
                      PV4.combine(NPV1).combine(IS1),PV4.combine(NPV2).combine(IS1),PV4.combine(NPV3).combine(IS1),PV4.combine(NPV1).combine(IS2),PV4.combine(NPV2).combine(IS2),PV4.combine(NPV3).combine(IS2),
                      PV1.combine(NPV1).combine(DA1),PV1.combine(NPV2).combine(DA1),PV1.combine(NPV3).combine(DA1),PV1.combine(NPV1).combine(DA2),PV1.combine(NPV2).combine(DA2),PV1.combine(NPV3).combine(DA2),
                      PV2.combine(NPV1).combine(DA1),PV2.combine(NPV2).combine(DA1),PV2.combine(NPV3).combine(DA1),PV2.combine(NPV1).combine(DA2),PV2.combine(NPV2).combine(DA2),PV2.combine(NPV3).combine(DA2),
                      PV3.combine(NPV1).combine(DA1),PV3.combine(NPV2).combine(DA1),PV3.combine(NPV3).combine(DA1),PV3.combine(NPV1).combine(DA2),PV3.combine(NPV2).combine(DA2),PV3.combine(NPV3).combine(DA2),
                      PV4.combine(NPV1).combine(DA1),PV4.combine(NPV2).combine(DA1),PV4.combine(NPV3).combine(DA1),PV4.combine(NPV1).combine(DA2),PV4.combine(NPV2).combine(DA2),PV4.combine(NPV3).combine(DA2),
                      PV1.combine(IS1).combine(DA1),PV2.combine(IS1).combine(DA1),PV3.combine(IS1).combine(DA1),PV4.combine(IS1).combine(DA1),
                      PV1.combine(IS1).combine(DA2),PV2.combine(IS1).combine(DA2),PV3.combine(IS1).combine(DA2),PV4.combine(IS1).combine(DA2),
                      PV1.combine(IS2).combine(DA1),PV2.combine(IS2).combine(DA1),PV3.combine(IS2).combine(DA1),PV4.combine(IS2).combine(DA1),
                      PV1.combine(IS2).combine(DA2),PV2.combine(IS2).combine(DA2),PV3.combine(IS2).combine(DA2),PV4.combine(IS2).combine(DA2),
                      NPV1.combine(IS1).combine(DA1),NPV2.combine(IS1).combine(DA1),NPV3.combine(IS1).combine(DA1),
                      NPV1.combine(IS1).combine(DA2),NPV2.combine(IS1).combine(DA2),NPV3.combine(IS1).combine(DA2),
                      NPV1.combine(IS2).combine(DA2),NPV2.combine(IS2).combine(DA2),NPV3.combine(IS2).combine(DA2),
                      NPV1.combine(IS2).combine(DA1),NPV2.combine(IS2).combine(DA1),NPV3.combine(IS2).combine(DA1)
                      ]);
print (EMlib3.length())    
// four-endmember model(352)
var EMlib4 = ee.List([BS1.combine(PV1).combine(NPV1).combine(IS1),BS2.combine(PV1).combine(NPV1).combine(IS1),BS3.combine(PV1).combine(NPV1).combine(IS1),BS4.combine(PV1).combine(NPV1).combine(IS1),
                      BS1.combine(PV2).combine(NPV1).combine(IS1),BS2.combine(PV2).combine(NPV1).combine(IS1),BS3.combine(PV2).combine(NPV1).combine(IS1),BS4.combine(PV2).combine(NPV1).combine(IS1),
                      BS1.combine(PV3).combine(NPV1).combine(IS1),BS2.combine(PV3).combine(NPV1).combine(IS1),BS3.combine(PV3).combine(NPV1).combine(IS1),BS4.combine(PV3).combine(NPV1).combine(IS1),
                      BS1.combine(PV4).combine(NPV1).combine(IS1),BS2.combine(PV4).combine(NPV1).combine(IS1),BS3.combine(PV4).combine(NPV1).combine(IS1),BS4.combine(PV4).combine(NPV1).combine(IS1),
                      BS1.combine(PV1).combine(NPV2).combine(IS1),BS2.combine(PV1).combine(NPV2).combine(IS1),BS3.combine(PV1).combine(NPV2).combine(IS1),BS4.combine(PV1).combine(NPV2).combine(IS1),
                      BS1.combine(PV2).combine(NPV2).combine(IS1),BS2.combine(PV2).combine(NPV2).combine(IS1),BS3.combine(PV2).combine(NPV2).combine(IS1),BS4.combine(PV2).combine(NPV2).combine(IS1),
                      BS1.combine(PV3).combine(NPV2).combine(IS1),BS2.combine(PV3).combine(NPV2).combine(IS1),BS3.combine(PV3).combine(NPV2).combine(IS1),BS4.combine(PV3).combine(NPV2).combine(IS1),
                      BS1.combine(PV4).combine(NPV2).combine(IS1),BS2.combine(PV4).combine(NPV2).combine(IS1),BS3.combine(PV4).combine(NPV2).combine(IS1),BS4.combine(PV4).combine(NPV2).combine(IS1),
                      BS1.combine(PV1).combine(NPV3).combine(IS1),BS2.combine(PV1).combine(NPV3).combine(IS1),BS3.combine(PV1).combine(NPV3).combine(IS1),BS4.combine(PV1).combine(NPV3).combine(IS1),
                      BS1.combine(PV2).combine(NPV3).combine(IS1),BS2.combine(PV2).combine(NPV3).combine(IS1),BS3.combine(PV2).combine(NPV3).combine(IS1),BS4.combine(PV2).combine(NPV3).combine(IS1),
                      BS1.combine(PV3).combine(NPV3).combine(IS1),BS2.combine(PV3).combine(NPV3).combine(IS1),BS3.combine(PV3).combine(NPV3).combine(IS1),BS4.combine(PV3).combine(NPV3).combine(IS1),
                      BS1.combine(PV4).combine(NPV3).combine(IS1),BS2.combine(PV4).combine(NPV3).combine(IS1),BS3.combine(PV4).combine(NPV3).combine(IS1),BS4.combine(PV4).combine(NPV3).combine(IS1),
                      BS1.combine(PV1).combine(NPV1).combine(IS2),BS2.combine(PV1).combine(NPV1).combine(IS2),BS3.combine(PV1).combine(NPV1).combine(IS2),BS4.combine(PV1).combine(NPV1).combine(IS2),
                      BS1.combine(PV2).combine(NPV1).combine(IS2),BS2.combine(PV2).combine(NPV1).combine(IS2),BS3.combine(PV2).combine(NPV1).combine(IS2),BS4.combine(PV2).combine(NPV1).combine(IS2),
                      BS1.combine(PV3).combine(NPV1).combine(IS2),BS2.combine(PV3).combine(NPV1).combine(IS2),BS3.combine(PV3).combine(NPV1).combine(IS2),BS4.combine(PV3).combine(NPV1).combine(IS2),
                      BS1.combine(PV4).combine(NPV1).combine(IS2),BS2.combine(PV4).combine(NPV1).combine(IS2),BS3.combine(PV4).combine(NPV1).combine(IS2),BS4.combine(PV4).combine(NPV1).combine(IS2),
                      BS1.combine(PV1).combine(NPV2).combine(IS2),BS2.combine(PV1).combine(NPV2).combine(IS2),BS3.combine(PV1).combine(NPV2).combine(IS2),BS4.combine(PV1).combine(NPV2).combine(IS2),
                      BS1.combine(PV2).combine(NPV2).combine(IS2),BS2.combine(PV2).combine(NPV2).combine(IS2),BS3.combine(PV2).combine(NPV2).combine(IS2),BS4.combine(PV2).combine(NPV2).combine(IS2),
                      BS1.combine(PV3).combine(NPV2).combine(IS2),BS2.combine(PV3).combine(NPV2).combine(IS2),BS3.combine(PV3).combine(NPV2).combine(IS2),BS4.combine(PV3).combine(NPV2).combine(IS2),
                      BS1.combine(PV4).combine(NPV2).combine(IS2),BS2.combine(PV4).combine(NPV2).combine(IS2),BS3.combine(PV4).combine(NPV2).combine(IS2),BS4.combine(PV4).combine(NPV2).combine(IS2),
                      BS1.combine(PV1).combine(NPV3).combine(IS2),BS2.combine(PV1).combine(NPV3).combine(IS2),BS3.combine(PV1).combine(NPV3).combine(IS2),BS4.combine(PV1).combine(NPV3).combine(IS2),
                      BS1.combine(PV2).combine(NPV3).combine(IS2),BS2.combine(PV2).combine(NPV3).combine(IS2),BS3.combine(PV2).combine(NPV3).combine(IS2),BS4.combine(PV2).combine(NPV3).combine(IS2),
                      BS1.combine(PV3).combine(NPV3).combine(IS2),BS2.combine(PV3).combine(NPV3).combine(IS2),BS3.combine(PV3).combine(NPV3).combine(IS2),BS4.combine(PV3).combine(NPV3).combine(IS2),
                      BS1.combine(PV4).combine(NPV3).combine(IS2),BS2.combine(PV4).combine(NPV3).combine(IS2),BS3.combine(PV4).combine(NPV3).combine(IS2),BS4.combine(PV4).combine(NPV3).combine(IS2),
                      BS1.combine(PV1).combine(NPV1).combine(DA1),BS2.combine(PV1).combine(NPV1).combine(DA1),BS3.combine(PV1).combine(NPV1).combine(DA1),BS4.combine(PV1).combine(NPV1).combine(DA1),
                      BS1.combine(PV2).combine(NPV1).combine(DA1),BS2.combine(PV2).combine(NPV1).combine(DA1),BS3.combine(PV2).combine(NPV1).combine(DA1),BS4.combine(PV2).combine(NPV1).combine(DA1),
                      BS1.combine(PV3).combine(NPV1).combine(DA1),BS2.combine(PV3).combine(NPV1).combine(DA1),BS3.combine(PV3).combine(NPV1).combine(DA1),BS4.combine(PV3).combine(NPV1).combine(DA1),
                      BS1.combine(PV4).combine(NPV1).combine(DA1),BS2.combine(PV4).combine(NPV1).combine(DA1),BS3.combine(PV4).combine(NPV1).combine(DA1),BS4.combine(PV4).combine(NPV1).combine(DA1),
                      BS1.combine(PV1).combine(NPV2).combine(DA1),BS2.combine(PV1).combine(NPV2).combine(DA1),BS3.combine(PV1).combine(NPV2).combine(DA1),BS4.combine(PV1).combine(NPV2).combine(DA1),
                      BS1.combine(PV2).combine(NPV2).combine(DA1),BS2.combine(PV2).combine(NPV2).combine(DA1),BS3.combine(PV2).combine(NPV2).combine(DA1),BS4.combine(PV2).combine(NPV2).combine(DA1),
                      BS1.combine(PV3).combine(NPV2).combine(DA1),BS2.combine(PV3).combine(NPV2).combine(DA1),BS3.combine(PV3).combine(NPV2).combine(DA1),BS4.combine(PV3).combine(NPV2).combine(DA1),
                      BS1.combine(PV4).combine(NPV2).combine(DA1),BS2.combine(PV4).combine(NPV2).combine(DA1),BS3.combine(PV4).combine(NPV2).combine(DA1),BS4.combine(PV4).combine(NPV2).combine(DA1),
                      BS1.combine(PV1).combine(NPV3).combine(DA1),BS2.combine(PV1).combine(NPV3).combine(DA1),BS3.combine(PV1).combine(NPV3).combine(DA1),BS4.combine(PV1).combine(NPV3).combine(DA1),
                      BS1.combine(PV2).combine(NPV3).combine(DA1),BS2.combine(PV2).combine(NPV3).combine(DA1),BS3.combine(PV2).combine(NPV3).combine(DA1),BS4.combine(PV2).combine(NPV3).combine(DA1),
                      BS1.combine(PV3).combine(NPV3).combine(DA1),BS2.combine(PV3).combine(NPV3).combine(DA1),BS3.combine(PV3).combine(NPV3).combine(DA1),BS4.combine(PV3).combine(NPV3).combine(DA1),
                      BS1.combine(PV4).combine(NPV3).combine(DA1),BS2.combine(PV4).combine(NPV3).combine(DA1),BS3.combine(PV4).combine(NPV3).combine(DA1),BS4.combine(PV4).combine(NPV3).combine(DA1),
                      BS1.combine(PV1).combine(NPV1).combine(DA2),BS2.combine(PV1).combine(NPV1).combine(DA2),BS3.combine(PV1).combine(NPV1).combine(DA2),BS4.combine(PV1).combine(NPV1).combine(DA2),
                      BS1.combine(PV2).combine(NPV1).combine(DA2),BS2.combine(PV2).combine(NPV1).combine(DA2),BS3.combine(PV2).combine(NPV1).combine(DA2),BS4.combine(PV2).combine(NPV1).combine(DA2),
                      BS1.combine(PV3).combine(NPV1).combine(DA2),BS2.combine(PV3).combine(NPV1).combine(DA2),BS3.combine(PV3).combine(NPV1).combine(DA2),BS4.combine(PV3).combine(NPV1).combine(DA2),
                      BS1.combine(PV4).combine(NPV1).combine(DA2),BS2.combine(PV4).combine(NPV1).combine(DA2),BS3.combine(PV4).combine(NPV1).combine(DA2),BS4.combine(PV4).combine(NPV1).combine(DA2),
                      BS1.combine(PV1).combine(NPV2).combine(DA2),BS2.combine(PV1).combine(NPV2).combine(DA2),BS3.combine(PV1).combine(NPV2).combine(DA2),BS4.combine(PV1).combine(NPV2).combine(DA2),
                      BS1.combine(PV2).combine(NPV2).combine(DA2),BS2.combine(PV2).combine(NPV2).combine(DA2),BS3.combine(PV2).combine(NPV2).combine(DA2),BS4.combine(PV2).combine(NPV2).combine(DA2),
                      BS1.combine(PV3).combine(NPV2).combine(DA2),BS2.combine(PV3).combine(NPV2).combine(DA2),BS3.combine(PV3).combine(NPV2).combine(DA2),BS4.combine(PV3).combine(NPV2).combine(DA2),
                      BS1.combine(PV4).combine(NPV2).combine(DA2),BS2.combine(PV4).combine(NPV2).combine(DA2),BS3.combine(PV4).combine(NPV2).combine(DA2),BS4.combine(PV4).combine(NPV2).combine(DA2),
                      BS1.combine(PV1).combine(NPV3).combine(DA2),BS2.combine(PV1).combine(NPV3).combine(DA2),BS3.combine(PV1).combine(NPV3).combine(DA2),BS4.combine(PV1).combine(NPV3).combine(DA2),
                      BS1.combine(PV2).combine(NPV3).combine(DA2),BS2.combine(PV2).combine(NPV3).combine(DA2),BS3.combine(PV2).combine(NPV3).combine(DA2),BS4.combine(PV2).combine(NPV3).combine(DA2),
                      BS1.combine(PV3).combine(NPV3).combine(DA2),BS2.combine(PV3).combine(NPV3).combine(DA2),BS3.combine(PV3).combine(NPV3).combine(DA2),BS4.combine(PV3).combine(NPV3).combine(DA2),
                      BS1.combine(PV4).combine(NPV3).combine(DA2),BS2.combine(PV4).combine(NPV3).combine(DA2),BS3.combine(PV4).combine(NPV3).combine(DA2),BS4.combine(PV4).combine(NPV3).combine(DA2),
                      BS1.combine(PV1).combine(DA1).combine(IS1),BS2.combine(PV1).combine(DA1).combine(IS1),BS3.combine(PV1).combine(DA1).combine(IS1),BS4.combine(PV1).combine(DA1).combine(IS1),
                      BS1.combine(PV2).combine(DA1).combine(IS1),BS2.combine(PV2).combine(DA1).combine(IS1),BS3.combine(PV2).combine(DA1).combine(IS1),BS4.combine(PV2).combine(DA1).combine(IS1),
                      BS1.combine(PV3).combine(DA1).combine(IS1),BS2.combine(PV3).combine(DA1).combine(IS1),BS3.combine(PV3).combine(DA1).combine(IS1),BS4.combine(PV3).combine(DA1).combine(IS1),
                      BS1.combine(PV4).combine(DA1).combine(IS1),BS2.combine(PV4).combine(DA1).combine(IS1),BS3.combine(PV4).combine(DA1).combine(IS1),BS4.combine(PV4).combine(DA1).combine(IS1),
                      BS1.combine(PV1).combine(DA1).combine(IS2),BS2.combine(PV1).combine(DA1).combine(IS2),BS3.combine(PV1).combine(DA1).combine(IS2),BS4.combine(PV1).combine(DA1).combine(IS2),
                      BS1.combine(PV2).combine(DA1).combine(IS2),BS2.combine(PV2).combine(DA1).combine(IS2),BS3.combine(PV2).combine(DA1).combine(IS2),BS4.combine(PV2).combine(DA1).combine(IS2),
                      BS1.combine(PV3).combine(DA1).combine(IS2),BS2.combine(PV3).combine(DA1).combine(IS2),BS3.combine(PV3).combine(DA1).combine(IS2),BS4.combine(PV3).combine(DA1).combine(IS2),
                      BS1.combine(PV4).combine(DA1).combine(IS2),BS2.combine(PV4).combine(DA1).combine(IS2),BS3.combine(PV4).combine(DA1).combine(IS2),BS4.combine(PV4).combine(DA1).combine(IS2),
                      BS1.combine(PV1).combine(DA2).combine(IS1),BS2.combine(PV1).combine(DA2).combine(IS1),BS3.combine(PV1).combine(DA2).combine(IS1),BS4.combine(PV1).combine(DA2).combine(IS1),
                      BS1.combine(PV2).combine(DA2).combine(IS1),BS2.combine(PV2).combine(DA2).combine(IS1),BS3.combine(PV2).combine(DA2).combine(IS1),BS4.combine(PV2).combine(DA2).combine(IS1),
                      BS1.combine(PV3).combine(DA2).combine(IS1),BS2.combine(PV3).combine(DA2).combine(IS1),BS3.combine(PV3).combine(DA2).combine(IS1),BS4.combine(PV3).combine(DA2).combine(IS1),
                      BS1.combine(PV4).combine(DA2).combine(IS1),BS2.combine(PV4).combine(DA2).combine(IS1),BS3.combine(PV4).combine(DA2).combine(IS1),BS4.combine(PV4).combine(DA2).combine(IS1),
                      BS1.combine(PV1).combine(DA2).combine(IS2),BS2.combine(PV1).combine(DA2).combine(IS2),BS3.combine(PV1).combine(DA2).combine(IS2),BS4.combine(PV1).combine(DA2).combine(IS2),
                      BS1.combine(PV2).combine(DA2).combine(IS2),BS2.combine(PV2).combine(DA2).combine(IS2),BS3.combine(PV2).combine(DA2).combine(IS2),BS4.combine(PV2).combine(DA2).combine(IS2),
                      BS1.combine(PV3).combine(DA2).combine(IS2),BS2.combine(PV3).combine(DA2).combine(IS2),BS3.combine(PV3).combine(DA2).combine(IS2),BS4.combine(PV3).combine(DA2).combine(IS2),
                      BS1.combine(PV4).combine(DA2).combine(IS2),BS2.combine(PV4).combine(DA2).combine(IS2),BS3.combine(PV4).combine(DA2).combine(IS2),BS4.combine(PV4).combine(DA2).combine(IS2),
                      BS1.combine(NPV1).combine(DA1).combine(IS1),BS2.combine(NPV1).combine(DA1).combine(IS1),BS3.combine(NPV1).combine(DA1).combine(IS1),BS4.combine(NPV1).combine(DA1).combine(IS1),
                      BS1.combine(NPV2).combine(DA1).combine(IS1),BS2.combine(NPV2).combine(DA1).combine(IS1),BS3.combine(NPV2).combine(DA1).combine(IS1),BS4.combine(NPV2).combine(DA1).combine(IS1),
                      BS1.combine(NPV3).combine(DA1).combine(IS1),BS2.combine(NPV3).combine(DA1).combine(IS1),BS3.combine(NPV3).combine(DA1).combine(IS1),BS4.combine(NPV3).combine(DA1).combine(IS1),
                      BS1.combine(NPV1).combine(DA2).combine(IS1),BS2.combine(NPV1).combine(DA2).combine(IS1),BS3.combine(NPV1).combine(DA2).combine(IS1),BS4.combine(NPV1).combine(DA2).combine(IS1),
                      BS1.combine(NPV2).combine(DA2).combine(IS1),BS2.combine(NPV2).combine(DA2).combine(IS1),BS3.combine(NPV2).combine(DA2).combine(IS1),BS4.combine(NPV2).combine(DA2).combine(IS1),
                      BS1.combine(NPV3).combine(DA2).combine(IS1),BS2.combine(NPV3).combine(DA2).combine(IS1),BS3.combine(NPV3).combine(DA2).combine(IS1),BS4.combine(NPV3).combine(DA2).combine(IS1),
                      BS1.combine(NPV1).combine(DA1).combine(IS2),BS2.combine(NPV1).combine(DA1).combine(IS2),BS3.combine(NPV1).combine(DA1).combine(IS2),BS4.combine(NPV1).combine(DA1).combine(IS2),
                      BS1.combine(NPV2).combine(DA1).combine(IS2),BS2.combine(NPV2).combine(DA1).combine(IS2),BS3.combine(NPV2).combine(DA1).combine(IS2),BS4.combine(NPV2).combine(DA1).combine(IS2),
                      BS1.combine(NPV3).combine(DA1).combine(IS2),BS2.combine(NPV3).combine(DA1).combine(IS2),BS3.combine(NPV3).combine(DA1).combine(IS2),BS4.combine(NPV3).combine(DA1).combine(IS2),
                      BS1.combine(NPV1).combine(DA2).combine(IS2),BS2.combine(NPV1).combine(DA2).combine(IS2),BS3.combine(NPV1).combine(DA2).combine(IS2),BS4.combine(NPV1).combine(DA2).combine(IS2),
                      BS1.combine(NPV2).combine(DA2).combine(IS2),BS2.combine(NPV2).combine(DA2).combine(IS2),BS3.combine(NPV2).combine(DA2).combine(IS2),BS4.combine(NPV2).combine(DA2).combine(IS2),
                      BS1.combine(NPV3).combine(DA2).combine(IS2),BS2.combine(NPV3).combine(DA2).combine(IS2),BS3.combine(NPV3).combine(DA2).combine(IS2),BS4.combine(NPV3).combine(DA2).combine(IS2),
                      PV1.combine(NPV1).combine(IS1).combine(DA1),PV1.combine(NPV2).combine(IS1).combine(DA1),PV1.combine(NPV3).combine(IS1).combine(DA1),
                      PV2.combine(NPV1).combine(IS1).combine(DA1),PV2.combine(NPV2).combine(IS1).combine(DA1),PV2.combine(NPV3).combine(IS1).combine(DA1),
                      PV3.combine(NPV1).combine(IS1).combine(DA1),PV3.combine(NPV2).combine(IS1).combine(DA1),PV3.combine(NPV3).combine(IS1).combine(DA1),
                      PV4.combine(NPV1).combine(IS1).combine(DA1),PV4.combine(NPV2).combine(IS1).combine(DA1),PV4.combine(NPV3).combine(IS1).combine(DA1),
                      PV1.combine(NPV1).combine(IS2).combine(DA1),PV1.combine(NPV2).combine(IS2).combine(DA1),PV1.combine(NPV3).combine(IS2).combine(DA1),
                      PV2.combine(NPV1).combine(IS2).combine(DA1),PV2.combine(NPV2).combine(IS2).combine(DA1),PV2.combine(NPV3).combine(IS2).combine(DA1),
                      PV3.combine(NPV1).combine(IS2).combine(DA1),PV3.combine(NPV2).combine(IS2).combine(DA1),PV3.combine(NPV3).combine(IS2).combine(DA1),
                      PV4.combine(NPV1).combine(IS2).combine(DA1),PV4.combine(NPV2).combine(IS2).combine(DA1),PV4.combine(NPV3).combine(IS2).combine(DA1),
                      PV1.combine(NPV1).combine(IS1).combine(DA2),PV1.combine(NPV2).combine(IS1).combine(DA2),PV1.combine(NPV3).combine(IS1).combine(DA2),
                      PV2.combine(NPV1).combine(IS1).combine(DA2),PV2.combine(NPV2).combine(IS1).combine(DA2),PV2.combine(NPV3).combine(IS1).combine(DA2),
                      PV3.combine(NPV1).combine(IS1).combine(DA2),PV3.combine(NPV2).combine(IS1).combine(DA2),PV3.combine(NPV3).combine(IS1).combine(DA2),
                      PV4.combine(NPV1).combine(IS1).combine(DA2),PV4.combine(NPV2).combine(IS1).combine(DA2),PV4.combine(NPV3).combine(IS1).combine(DA2),
                      PV1.combine(NPV1).combine(IS2).combine(DA2),PV1.combine(NPV2).combine(IS2).combine(DA2),PV1.combine(NPV3).combine(IS2).combine(DA2),
                      PV2.combine(NPV1).combine(IS2).combine(DA2),PV2.combine(NPV2).combine(IS2).combine(DA2),PV2.combine(NPV3).combine(IS2).combine(DA2),
                      PV3.combine(NPV1).combine(IS2).combine(DA2),PV3.combine(NPV2).combine(IS2).combine(DA2),PV3.combine(NPV3).combine(IS2).combine(DA2),
                      PV4.combine(NPV1).combine(IS2).combine(DA2),PV4.combine(NPV2).combine(IS2).combine(DA2),PV4.combine(NPV3).combine(IS2).combine(DA2)
                      ]);
print (EMlib4.length())

var em_lib = (EMlib2.cat(EMlib3)).cat(EMlib4);
print (em_lib)

var bands = ['Nadir_Reflectance_Band3', 'Nadir_Reflectance_Band4','Nadir_Reflectance_Band1','Nadir_Reflectance_Band2',
      'Nadir_Reflectance_Band5','Nadir_Reflectance_Band6','Nadir_Reflectance_Band7']
// mesma function and transform to int16 with factor 0.0001.
var mesma = function(image) {
    var doy = ee.Date(image.get('system:time_start')).getRelative('month', 'year');
    var date = ee.Date(image.get('system:time_start'));
    var ks = ee.Image(image.select(bands)).multiply(0.0001);
    var ummixed = function(i){
      var id = ee.Image(em_lib.indexOf(i)).rename('id');
      var em_key = ee.Dictionary(i).keys();
      var em_value = ee.Dictionary(i).values(em_key);
      var em = ee.Image(ee.Array(em_value).transpose());
      
      var col = ks.unmix(em_value,true,true).rename(em_key);
      var colarray = col.toArray().toArray(1);
      var REcon = em.matrixMultiply(colarray)
      .arrayProject([0])
      .arrayFlatten(
      [['Nadir_Reflectance_Band3', 'Nadir_Reflectance_Band4','Nadir_Reflectance_Band1','Nadir_Reflectance_Band2',
      'Nadir_Reflectance_Band5','Nadir_Reflectance_Band6','Nadir_Reflectance_Band7']]);
      var ks1 = ks.subtract(REcon);
      // rmse is changed to a negative number for qualityMosaic with lowest RMSE
      var rmse = ks1.expression(
      '-sqrt((b1*b1+b2*b2+b3*b3+b4*b4+b5*b5+b6*b6+b7*b7)/7)',
      {
        b1: ks1.select('Nadir_Reflectance_Band3'), 
        b2: ks1.select('Nadir_Reflectance_Band4'), 
        b3: ks1.select('Nadir_Reflectance_Band1'),
        b4: ks1.select('Nadir_Reflectance_Band2'), 
        b5: ks1.select('Nadir_Reflectance_Band5'), 
        b6: ks1.select('Nadir_Reflectance_Band6'), 
        b7: ks1.select('Nadir_Reflectance_Band7')
      }).rename('rmse');
      var sma = col.addBands(rmse).multiply(10000).addBands(id).toInt16(); 
      var mesma = stimg.addBands({
          srcImg:sma,
          overwrite:true
          });
      return mesma; 
    };
  var unmixed_result =  em_lib.map(ummixed);
  unmixed_result = ee.ImageCollection(unmixed_result).qualityMosaic('rmse');
  
  return unmixed_result.set('system:time_start1',date).set('system:time_start',date.millis()).set('doy',doy);  
};


// LSMA for masked dataset
var data = clearObs.map(mesma);
print (data)