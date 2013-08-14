var svgNamespaceUri = 'http://www.w3.org/2000/svg';

var width = 960, height = 500;

var metaData = null;
var metaDataUrl = "data/metaDataJson";

var circleData = null;
var dataUrl = "data/dataJson";

var query = null;
var queryUrl = "data/queryJson";

// svg element that contains the graph
var svg = d3.select("body").append("svg").attr({
    'width' : width,
    'height' : height,
    'id' : 'circleMaps'
});

d3.json(metaDataUrl, function(error, data) {
    metaData = data;
    console.log("number of metaData --> " + Object.keys(metaData).length);
    d3.json(dataUrl, function(error, data) {
        circleData = data;
        console.log("number of circleData --> " + Object.keys(circleData).length);
        d3.json(queryUrl, function(error, data) {
            query = data;
            console.log("number of query --> " + Object.keys(query).length);
            var cmg = new circleMapGenerator(metaData, circleData, query);
            var queryFeatures = cmg.getQueryFeatures();

            for (var i in queryFeatures) {
                var feature = queryFeatures[i];
                var circleMapGroupElement = cmg.drawCircleMap(feature, svg);

                // random position
                var x = Math.floor(Math.random() * (width - 200));
                var y = Math.floor(Math.random() * (height - 200));
                circleMapGroupElement.attr({
                    transform : 'translate(' + x + ',' + y + ')'
                });
            }
        });
    });
});
