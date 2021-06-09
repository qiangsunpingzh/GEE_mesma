var region = 
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
var BS1 = ee.Dictionary({'BS':[0.1253486211,0.1897461621,0.2347879176,0.2646117442,0.3508608602,0.4680342695,0.3697959973]});
var BS2 = ee.Dictionary({'BS':[0.1067543845,0.209502605,0.345139958,0.4858009159,0.6115810887,0.6632883065,0.5983615199]});
var PV1 = ee.Dictionary({'PV':[0.02526543216,0.07658417556,0.04441448816,0.5672690317,0.4527670522,0.2592240325,0.09977018683]});
var PV2 = ee.Dictionary({'PV':[0.01531956394,0.04080250014,0.02217150575,0.333131227,0.3261986738,0.1617479526,0.05680805577]});
var PV3 = ee.Dictionary({'PV':[0.0453825428,0.09459068085,0.0652876767,0.6384008371,0.5109731988,0.257439633,0.09406175905]});
var NPV2 = ee.Dictionary({'NPV':[0.15994883,0.178907911,0.16751889,0.287491744,0.378840047,0.443645636,0.12631864]});
var NPV1 = ee.Dictionary({'NPV':[0.037921285,0.067573181,0.04480871,0.117894139,0.17,0.222686155,0.105450626]});
var IS1 = ee.Dictionary({'IS':[0.9201611212,0.9378032828,0.9496839502,0.8712206585,0.4991466195,0.1198564529,0.04469434526]});
var DA1 = ee.Dictionary({'DA':[0.02425163363,0.03812893875,0.04603752325,0.05993097907,0.04925137712,0.04462972653,0.02928406193]});

//************************************************************************************************************************
// endmember combinations based on selected endmember spectra, 122 combination models, 
// including two-endmember model (31), three-endmember model (51) and four-endmember model (40)
//************************************************************************************************************************
var V = ee.List([PV1, PV2, PV3, NPV1, NPV2, BS1, BS2, IS1, DA1]);
var em2 = ee.List([]);
var em3 = ee.List([]);
var em4 = ee.List([]);
for (var i=0;i<9;i++) {
  var m1 = V.get(i);
  for (var j=i;j<9;j++) {
    var m2 = V.get(j);
    var em_2 = ee.Dictionary(m1).combine(ee.Dictionary(m2));
    var emC2 = ee.Algorithms.If({
        condition: ee.Algorithms.IsEqual(em_2.size(),2),
        trueCase: em_2,
        falseCase: 0
    });
    em2 = em2.add(emC2);
    for (var k=j;k<9;k++){
      var m3 = V.get(k);
      var em_3 = ee.Dictionary(m1).combine(ee.Dictionary(m2)).combine(ee.Dictionary(m3));
      var emC3 = ee.Algorithms.If({
        condition: ee.Algorithms.IsEqual(em_3.size(),3),
        trueCase: em_3,
        falseCase: 0
      });
      em3 = em3.add(emC3);
      
      
      for (var n=k;n<9;n++){
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

/**
//*******************************another arrroaches for 122 combination models********************************************
// two-endmember model(31)
var EMlib2 = ee.List([BS1.combine(PV1),BS1.combine(PV2),BS1.combine(PV3),BS1.combine(NPV1),BS1.combine(NPV2),BS1.combine(IS1),
                      BS2.combine(PV1),BS2.combine(PV2),BS2.combine(PV3),BS2.combine(NPV1),BS2.combine(NPV2),BS2.combine(IS1),
                      PV1.combine(NPV1),PV1.combine(NPV2),PV1.combine(IS1),PV2.combine(NPV1),PV2.combine(NPV2),PV2.combine(IS1),
                      PV3.combine(NPV1),PV3.combine(NPV2),PV3.combine(IS1),NPV1.combine(IS1),NPV2.combine(IS1),
                      BS1.combine(DA1),BS2.combine(DA1),PV1.combine(DA1),PV2.combine(DA1),PV3.combine(DA1),NPV1.combine(DA1),NPV2.combine(DA1),IS1.combine(DA1)
                      ]);
//print (EMlib2.length())                      
// three-endmember model(51)
var EMlib3 = ee.List([BS1.combine(PV1).combine(NPV1),BS1.combine(PV2).combine(NPV1),BS1.combine(PV3).combine(NPV1),BS1.combine(PV2).combine(NPV1),BS1.combine(PV2).combine(NPV2),BS1.combine(PV3).combine(NPV2),
                      BS2.combine(PV1).combine(NPV1),BS2.combine(PV2).combine(NPV1),BS2.combine(PV3).combine(NPV1),BS2.combine(PV2).combine(NPV1),BS2.combine(PV2).combine(NPV2),BS2.combine(PV3).combine(NPV2),
                      BS1.combine(PV1).combine(IS1),BS1.combine(PV2).combine(IS1),BS1.combine(PV3).combine(IS1),BS2.combine(PV1).combine(IS1),BS2.combine(PV2).combine(IS1),BS2.combine(PV3).combine(IS1),
                      BS1.combine(PV1).combine(DA1),BS1.combine(PV2).combine(DA1),BS1.combine(PV3).combine(DA1),BS2.combine(PV1).combine(DA1),BS2.combine(PV2).combine(DA1),BS2.combine(PV3).combine(DA1),
                      BS1.combine(NPV1).combine(IS1),BS1.combine(NPV2).combine(IS1),BS2.combine(NPV1).combine(IS1),BS2.combine(NPV2).combine(IS1),
                      BS1.combine(NPV1).combine(DA1),BS1.combine(NPV2).combine(DA1),BS2.combine(NPV1).combine(DA1),BS2.combine(NPV2).combine(DA1),
                      BS1.combine(IS1).combine(DA1),BS2.combine(IS1).combine(DA1),
                      PV1.combine(NPV1).combine(IS1),PV1.combine(NPV2).combine(IS1),PV2.combine(NPV1).combine(IS1),PV2.combine(NPV2).combine(IS1),PV3.combine(NPV1).combine(IS1),PV3.combine(NPV2).combine(IS1),
                      PV1.combine(NPV1).combine(DA1),PV1.combine(NPV2).combine(DA1),PV2.combine(NPV1).combine(DA1),PV2.combine(NPV2).combine(DA1),PV3.combine(NPV1).combine(DA1),PV3.combine(NPV2).combine(DA1),
                      PV1.combine(IS1).combine(DA1),PV2.combine(IS1).combine(DA1),PV3.combine(IS1).combine(DA1),
                      NPV1.combine(IS1).combine(DA1),NPV2.combine(IS1).combine(DA1),
                      ]);
//print (EMlib3.length())    
// four-endmember model(12)
var EMlib4 = ee.List([BS1.combine(PV1).combine(NPV1).combine(IS1),BS2.combine(PV1).combine(NPV1).combine(IS1),
                      BS1.combine(PV2).combine(NPV1).combine(IS1),BS2.combine(PV2).combine(NPV1).combine(IS1),
                      BS1.combine(PV3).combine(NPV1).combine(IS1),BS2.combine(PV3).combine(NPV1).combine(IS1),
                      BS1.combine(PV1).combine(NPV2).combine(IS1),BS2.combine(PV1).combine(NPV2).combine(IS1),
                      BS1.combine(PV2).combine(NPV2).combine(IS1),BS2.combine(PV2).combine(NPV2).combine(IS1),
                      BS1.combine(PV3).combine(NPV2).combine(IS1),BS2.combine(PV3).combine(NPV2).combine(IS1),
                      BS1.combine(PV1).combine(NPV1).combine(DA1),BS2.combine(PV1).combine(NPV1).combine(DA1),
                      BS1.combine(PV2).combine(NPV1).combine(DA1),BS2.combine(PV2).combine(NPV1).combine(DA1),
                      BS1.combine(PV3).combine(NPV1).combine(DA1),BS2.combine(PV3).combine(NPV1).combine(DA1),
                      BS1.combine(PV1).combine(NPV2).combine(DA1),BS2.combine(PV1).combine(NPV2).combine(DA1),
                      BS1.combine(PV2).combine(NPV2).combine(DA1),BS2.combine(PV2).combine(NPV2).combine(DA1),
                      BS1.combine(PV3).combine(NPV2).combine(DA1),BS2.combine(PV3).combine(NPV2).combine(DA1),
                      PV1.combine(NPV1).combine(IS1).combine(DA1),PV1.combine(NPV2).combine(IS1).combine(DA1),
                      PV2.combine(NPV1).combine(IS1).combine(DA1),PV2.combine(NPV2).combine(IS1).combine(DA1),
                      PV3.combine(NPV1).combine(IS1).combine(DA1),PV3.combine(NPV2).combine(IS1).combine(DA1),
                      BS1.combine(PV1).combine(DA1).combine(IS1),BS2.combine(PV1).combine(DA1).combine(IS1),
                      BS1.combine(PV2).combine(DA1).combine(IS1),BS2.combine(PV2).combine(DA1).combine(IS1),
                      BS1.combine(PV3).combine(DA1).combine(IS1),BS2.combine(PV3).combine(DA1).combine(IS1),
                      BS1.combine(NPV1).combine(DA1).combine(IS1),BS2.combine(NPV1).combine(DA1).combine(IS1),
                      BS1.combine(NPV2).combine(DA1).combine(IS1),BS2.combine(NPV2).combine(DA1).combine(IS1)
                      ]);
//print (EMlib4.length())
*/

var em_lib = (EMlib2.cat(EMlib3)).cat(EMlib4);
print (em_lib.length())

var bands = ['Nadir_Reflectance_Band3', 'Nadir_Reflectance_Band4','Nadir_Reflectance_Band1','Nadir_Reflectance_Band2',
      'Nadir_Reflectance_Band5','Nadir_Reflectance_Band6','Nadir_Reflectance_Band7']
// mesma function and transform to int16 with factor 0.0001.
var mesma = function(image) {
    var date = ee.Date(image.get('system:time_start')).format('yyyy-MM-dd');
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
  
  return unmixed_result.set('system:time_start',date);  
};


// LSMA for masked dataset
var data = clearObs.map(mesma);
print (data)