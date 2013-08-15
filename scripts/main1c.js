var svgNamespaceUri = 'http://www.w3.org/2000/svg';
var xlinkUri = 'http://www.w3.org/1999/xlink';

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

/**
 * Assign random position such that entire element is contained within specified boundary.
 * @param {Object} element
 * @param {Object} elementWidth
 * @param {Object} elementHeight
 * @param {Object} maxX
 * @param {Object} maxY
 */
function gElementRandomTranslate(element, elementWidth, elementHeight, maxX, maxY) {
    var x = Math.floor(Math.random() * (maxX - (2 * elementWidth))) + elementWidth;
    var y = Math.floor(Math.random() * (maxY - (2 * elementHeight))) + elementHeight;
    element.attr({
        transform : 'translate(' + x + ',' + y + ')'
    });
}

function elementRandomPosition(element, maxX, maxY) {
    var elementWidth = 100;
    var elementHeight = 100;
    var x = Math.floor(Math.random() * (maxX - (2 * elementWidth)));
    var y = Math.floor(Math.random() * (maxY - (2 * elementHeight)));
    element.attr({
        'x' : x,
        'y' : y
    });
}

d3.json(metaDataUrl, function(error, data) {
    metaData = data;
    console.log("number of metaData --> " + Object.keys(metaData).length);
    d3.json(dataUrl, function(error, data) {
        circleData = data;
        console.log("number of circleData --> " + Object.keys(circleData).length);
        d3.json(queryUrl, function(error, data) {
            query = data;
            console.log("number of query --> " + Object.keys(query).length);

            // prepare generator for creating SVG:g elements.
            var cmg = new circleMapGenerator(metaData, circleData, query);

            // create circleMap elements for each query feature.
            var queryFeatures = cmg.getQueryFeatures();
            for (var i in queryFeatures) {
                var feature = queryFeatures[i];
                var circleMapElement = cmg.drawCircleMap(feature, svg);

                // gElementRandomTranslate(circleMapElement, 100, 100, width, height);
                elementRandomPosition(circleMapElement, width, height);
            }
        });
    });
});
