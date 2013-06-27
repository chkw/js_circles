    function circleview(metaData, data, queryData) {
    this.metaData = jQuery.parseJSON(metaData);
    this.data = jQuery.parseJSON(data);
    this.queryData = jQuery.parseJSON(queryData);

    this.zeroColor = null;

    // TODO get an array of dataset names from the metadata
    this.getDatasetNames = function() {
        return Object.keys(this.metaData);
    }
    // TODO log the object attributes to console
    this.logData = function() {
        console.log("metaData is " + JSON.stringify(this.metaData));
        console.log("data is " + JSON.stringify(this.data));
        console.log("queryData is " + JSON.stringify(this.queryData));
    }
    // TODO get all sampleIDs from the metadata
    this.getSampleNames = function() {
        var result = new Array();
        var datasetNames = this.getDatasetNames();
        for (var datasetName in datasetNames) {
            var sampleNames = this.metaData[datasetNames[datasetName]].sampleNames.split(",");
            for (var name in sampleNames) {
                result[sampleNames[name]] = 0;
            }
        }
        return Object.keys(result);
    }
    // TODO create an svg arc via d3.js
    this.createArc = function(innerRadius, outerRadius, startDegrees, endDegrees) {
        var arc = d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius).startAngle(startDegrees * (Math.PI / 180)).endAngle(endDegrees * (Math.PI / 180))
        return arc;
    }
    // TODO get the data for a ring
    this.getRingData = function(dataName, feature) {
        var ringData = this.data[dataName][feature];
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
    this.getHexColor = function(score, dataName) {
        var isPositive = (score >= 0) ? true : false;

        var maxR = 255;
        var maxG = 0;
        var maxB = 0;

        var minR = 0;
        var minG = 0;
        var minB = 0;

        var normalizedScore = (score / this.metaData[dataName].cohortMax);

        if (!isPositive) {
            maxR = 0;
            maxG = 0;
            maxB = 255;

            minR = 0;
            minG = 0;
            minB = 0;

            normalizedScore = (score / this.metaData[dataName].cohortMin);
        }

        var newR = linearInterpolation(normalizedScore, minR, maxR);
        var newG = linearInterpolation(normalizedScore, minG, maxG);
        var newB = linearInterpolation(normalizedScore, minB, maxB);

        var hexColor = rgbToHex(Math.floor(newR), Math.floor(newG), Math.floor(newB));

        return hexColor;
    }
    // TODO draw a ring via d3.js
    this.drawRing = function(circleDiv,feature) {
        var innerRadius = 30;
        var ringThickness = 10;
        var startDegrees = 0;
        var degreeIncrements = 360 / this.getSampleNames().length;

        var vis = circleDiv.append("g").attr("id",feature);

        var dataName = Object.keys(this.data)[0];
        feature = Object.keys(this.data[dataName])[0]

        var ringData = this.getRingData(dataName, feature);

        var sampleNames = this.getSampleNames();
        for (var sampleID in sampleNames) {
            var sampleName = sampleNames[sampleID];
            var score = ringData[sampleName];
            var hexColor = this.getHexColor(score, dataName);

            var arc = this.createArc(innerRadius, innerRadius + ringThickness, startDegrees, startDegrees + degreeIncrements);

            vis.append("path").attr("d", arc).attr("transform", "translate(50,50)").style("fill", hexColor);

            startDegrees = startDegrees + degreeIncrements;
        }

        return null;
    }
    // TODO get an ordering for sampleIDs
    this.reorderDataSamples = function(orderFeature, orderRing) {

        return null;
    }
}
