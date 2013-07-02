jQuery.fn.circleMapViewer = function circleMapViewer(width, height, metaDataJsonText, dataJsonText, queryDataJsonText) {

    // TODO main section

    var metaData = jQuery.parseJSON(metaDataJsonText);
    var data = jQuery.parseJSON(dataJsonText);
    var queryData = jQuery.parseJSON(queryDataJsonText);

    // logData();

    var features = getFeatureNames();

    this.each(function() {
        var svg = d3.select(this).append('svg').attr('id', 'circles').attr('width', width).attr('height', height);
    });

    var mainSvgElement = d3.select('#circles');

    features.forEach(function(val, idx, arr) {
        var feature = val;
        drawRing(feature, mainSvgElement);
    });

    // TODO get an array of dataset names from the metadata
    function getDatasetNames() {
        return Object.keys(metaData);
    }

    // TODO get an array of features from the data
    function getFeatureNames() {
        var result = new Object();
        getDatasetNames().forEach(function(val, idx, arr) {
            var datasetName = val;
            var datasetObject = data[datasetName];
            Object.keys(datasetObject).forEach(function(val, idx, arr) {
                var feature = val;
                // This may break if feature name matches a prototype attribute.
                result[feature] = 0;
            });
        });
        return Object.keys(result);
    }

    // TODO log the object attributes to console
    function logData() {
        console.log("metaData is " + JSON.stringify(metaData));
        console.log("data is " + JSON.stringify(data));
        console.log("queryData is " + JSON.stringify(queryData));
    }

    // TODO get all sampleIDs from the metadata
    function getSampleNames() {
        var result = new Array();
        var datasetNames = getDatasetNames();
        datasetNames.forEach(function(val, idx, arr) {
            var datasetName = val;
            var sampleNames = metaData[datasetName]['sampleNames'].split(",");
            sampleNames.forEach(function(val, idx, arr) {
                var name = val;
                result[name] = 0;
            });
        });
        return Object.keys(result);
    }

    // TODO get the data for a ring
    function getRingData(dataName, feature) {
        var ringData = data[dataName][feature];
        return ringData;
    }

    // TODO convert an rgb component to hex value
    function rgbComponentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    // TODO convert rgb color code to hex
    function rgbToHex(r, g, b) {
        return "#" + rgbComponentToHex(r) + rgbComponentToHex(g) + rgbComponentToHex(b);
    }

    // TODO linear interpolation
    function linearInterpolation(percent, minVal, maxVal) {
        return ((maxVal - minVal) * percent) + minVal;
    }

    // TODO get a color for a score
    function getHexColor(score, dataName) {
        var isPositive = (score >= 0) ? true : false;

        var maxR = 255;
        var maxG = 0;
        var maxB = 0;

        var minR = 0;
        var minG = 0;
        var minB = 0;

        var normalizedScore = (score / metaData[dataName].cohortMax);

        if (!isPositive) {
            maxR = 0;
            maxG = 0;
            maxB = 255;

            minR = 0;
            minG = 0;
            minB = 0;

            normalizedScore = (score / metaData[dataName].cohortMin);
        }

        var newR = linearInterpolation(normalizedScore, minR, maxR);
        var newG = linearInterpolation(normalizedScore, minG, maxG);
        var newB = linearInterpolation(normalizedScore, minB, maxB);

        var hexColor = rgbToHex(Math.floor(newR), Math.floor(newG), Math.floor(newB));

        return hexColor;
    }

    // TODO create an svg arc via d3.js
    function createArc(innerRadius, outerRadius, startDegrees, endDegrees) {
        var arc = d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius).startAngle(startDegrees * (Math.PI / 180)).endAngle(endDegrees * (Math.PI / 180))
        return arc;
    }

    // TODO draw a ring via d3.js
    function drawRing(feature, svgTagElement) {
        var fullRadius = 100;

        var numDatasets = Object.keys(data).length;

        // +1 for the center
        var ringThickness = fullRadius / (numDatasets + 1);
        var innerRadius = ringThickness;

        var sampleNames = getSampleNames();

        sampleNames.sort(reorderDataSamples);

        sampleNames.forEach(function(val) {
            console.log(val);
        });

        var degreeIncrements = 360 / sampleNames.length;

        // arc paths will be added to this SVG group
        var circleMapGroup = svgTagElement.append("g").attr("id", feature).attr("transform", "translate(150,110)");

        // add a label
        circleMapGroup.append("svg:text").attr("text-anchor", "middle").attr('dy', ".35em").text(feature);

        // iterate over rings
        Object.keys(data).forEach(function(val, idx, arr) {
            var dataName = val;
            feature = Object.keys(data[dataName])[0]

            var ringData = getRingData(dataName, feature);

            var startDegrees = 0;
            sampleNames.forEach(function(val, idx, arr) {
                var sampleName = val;
                var score = ringData[sampleName];
                var hexColor = getHexColor(score, dataName);

                var arc = createArc(innerRadius, innerRadius + ringThickness, startDegrees, startDegrees + degreeIncrements);
                circleMapGroup.append("path").attr("d", arc).attr("fill", hexColor);

                // clockwise from 12 o clock
                startDegrees = startDegrees + degreeIncrements;
            });
        });
        return circleMapGroup;
    }

    // TODO get an ordering for sampleIDs
    function reorderDataSamples(a, b) {
        // console.log("a:" + a + " b:" + b + " orderFeature:" + orderFeature + " orderRing:" + orderRing);
        if (a < b) {
            return -1;
        }
        if (a > b) {
            return 1;
        }
        if (a == b) {
            return 0;
        }
    }

    return this;
}

