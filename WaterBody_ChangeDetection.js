var roi = ee.FeatureCollection("FAO/GAUL_SIMPLIFIED_500m/2015/level2")
          .filter(ee.Filter.eq("ADM2_NAME", "Bangalore Urban"));

Map.centerObject(roi,10);
Map.addLayer(roi,{},'Bangalore Urban')
print(yearly);

var areas = [];

for (var year = 2000; year <= 2020; year++) {
  var waterYear = yearly.filter(ee.Filter.eq('year', year));
  var waterImage = waterYear.first();
  var waterImageYear = waterImage.eq(3).clip(roi);
  var area = waterImageYear.multiply(ee.Image.pixelArea()).rename('area').reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: roi,
    scale: 30,
    maxPixels: 1e9
  });

  areas.push({
    'Year': year,
    'Area (km^2)': ee.Number(area.get('area')).divide(1000000) // Convert to square kilometers
  });
}

print('Year-wise Areas:', areas);

var visParams = {
  min: 0,
  max: 1,
  palette: ['white', 'red']
};

//<---Loop for TimeSeries Chart--->\\

for (var year = 2000; year <= 2020; year++) {
  var waterYear = yearly.filter(ee.Filter.eq('year', year));
  var waterImage = waterYear.first();
  var waterImageYear = waterImage.eq(3).clip(roi);
  Map.addLayer(waterImageYear.selfMask(), visParams, 'Water ' + year);
}

//----> Calculate the area of water bodies
var calculateWaterArea = function(image) {
  // Calculate the area of water bodies using the pixel area
  var area = image.eq(3).multiply(ee.Image.pixelArea()).divide(1000000); // Convert to SqKm
  // Return the area image
  return area.set('system:time_start', image.get('system:time_start'));
};

var waterAreaCollection = yearly.map(calculateWaterArea)

var waterAreaChart = ui.Chart.image.seriesByRegion({
  imageCollection: waterAreaCollection,
  regions: roi,
  reducer: ee.Reducer.sum(),
  scale: 30,
  xProperty: 'system:time_start',
  seriesProperty: 'label'
}).setOptions({
  title: 'Permanent Water Area Over Time',
  hAxis: {title: 'Year'},
  vAxis: {title: 'Water Area (km^2)'},
});

print(waterAreaChart);