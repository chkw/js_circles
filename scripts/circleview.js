jQuery.fn.circleMapViewer = function circleMapViewer(width, height, metaDataJsonText, dataJsonText, queryDataJsonText) {

    // TODO main section

    var metaData = jQuery.parseJSON(metaDataJsonText);
    var data = jQuery.parseJSON(dataJsonText);
    var queryData = jQuery.parseJSON(queryDataJsonText);

    this.each(function() {
        console.log("in this.each");
        var svg = d3.select(this).append('svg').attr('id', 'circles').attr('width', width).attr('height', height);
    });

    var mainSvgElement = d3.select('#circles');

    drawRing(null);

    // TODO get an array of dataset names from the metadata
    function getDatasetNames() {
        return Object.keys(metaData);
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
        for (var datasetName in datasetNames) {
            var sampleNames = metaData[datasetNames[datasetName]].sampleNames.split(",");
            for (var name in sampleNames) {
                result[sampleNames[name]] = 0;
            }
        }
        return Object.keys(result);
    }

    // TODO create an svg arc via d3.js
    function getRingData(innerRadius, outerRadius, startDegrees, endDegrees) {
        var arc = d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius).startAngle(startDegrees * (Math.PI / 180)).endAngle(endDegrees * (Math.PI / 180))
        return arc;
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
    function drawRing(feature) {
        var innerRadius = 30;
        var ringThickness = 30;
        var startDegrees = 0;
        var degreeIncrements = 360 / getSampleNames().length;

        var vis = mainSvgElement.append('svg').append("g").attr("id", feature);

        var dataName = Object.keys(data)[0];
        feature = Object.keys(data[dataName])[0]

        var ringData = getRingData(dataName, feature);

        var sampleNames = getSampleNames();
        for (var sampleID in sampleNames) {
            var sampleName = sampleNames[sampleID];
            var score = ringData[sampleName];
            var hexColor = getHexColor(score, dataName);

            var arc = createArc(innerRadius, innerRadius + ringThickness, startDegrees, startDegrees + degreeIncrements);

            vis.append("path").attr("d", arc).attr("transform", "translate(50,50)").style("fill", hexColor);

            startDegrees = startDegrees + degreeIncrements;
        }

        return null;
    }

    // TODO get an ordering for sampleIDs
    function reorderDataSamples(orderFeature, orderRing) {

        return null;
    }

    return this;
}
