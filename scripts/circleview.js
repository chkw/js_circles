jQuery.fn.circleMapViewer = function circleMapViewer(width, height, metaDataJsonText, dataJsonText, queryDataJsonText) {

    // TODO main section

    var metaData = jQuery.parseJSON(metaDataJsonText);
    var data = jQuery.parseJSON(dataJsonText);
    var queryData = jQuery.parseJSON(queryDataJsonText);

    // logData();

    var features = getFeatureNames();

    var sortedSamples = getSortedSamples(features[0], getDatasetNames());

    this.each(function() {
        var svg = d3.select(this).append('svg').attr('id', 'circles').attr('width', width).attr('height', height);
    });

    var mainSvgElement = d3.select('#circles');

    features.forEach(function(val, idx, arr) {
        var feature = val;
        drawCircleMap(feature, sortedSamples, mainSvgElement);
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

    // TODO get sample names in sorted order
    function getSortedSamples(sortingFeature, dataSortingOrder) {
        console.log("sortingFeature --> " + sortingFeature + "\ndataSortingOrder --> " + dataSortingOrder);

        var sampleObjects = new Array();
        var allSampleIds = getSampleNames();
        allSampleIds.forEach(function(val, idx, arr) {
            var id = val;
            var sampleObj = new Object();
            sampleObjects.push(sampleObj);
            sampleObj["id"] = id;
            sampleObj["scores"] = new Array();

            dataSortingOrder.forEach(function(val, idx, arr) {
                var datasetName = val;
                var score = getRingData(datasetName, sortingFeature)[id];
                sampleObj["scores"].push(score);
            });

        });

        sampleObjects.sort(compareSampleObjects);

        var sortedSampleNames = sampleObjects.map(function(val, idx, arr) {
            var sampleObj = val;
            var name = sampleObj["id"];
            return name;
        });

        // TODO comparison function
        function compareSampleObjects(a, b) {
            var scoresA = a["scores"].slice();
            var scoresB = b["scores"].slice();

            if (scoresA.length != scoresB.length) {
                console.log(a["id"] + " and " + b["id"] + " have different number of scores.")
                return 0;
            }

            for (var i = 0; i < scoresA.length; i++) {
                var scoreA = +scoresA[i];
                var scoreB = +scoresB[i];

                if (scoreA < scoreB) {
                    return -1;
                }
                if (scoreA > scoreB) {
                    return 1;
                } else {
                    return 0;
                }
            }
        };

        return sortedSampleNames;
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

        var minR = 255;
        var minG = 255;
        var minB = 255;

        var normalizedScore = (score / metaData[dataName].cohortMax);

        if (!isPositive) {
            maxR = 0;
            maxG = 0;
            maxB = 255;

            minR = 255;
            minG = 255;
            minB = 255;

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

    // TODO draw a CircleMap via d3.js
    function drawCircleMap(feature, sortedSamples, svgTagElement) {
        var fullRadius = 100;

        var numDatasets = Object.keys(data).length;

        // +1 for the center
        var ringThickness = fullRadius / (numDatasets + 1);
        var innerRadius = ringThickness;

        var degreeIncrements = 360 / sortedSamples.length;

        // arc paths will be added to this SVG group
        var circleMapGroup = svgTagElement.append("g").attr("id", feature).attr("transform", "translate(150,110)");

        // add a label
        circleMapGroup.append("svg:text").attr("text-anchor", "middle").attr('dy', ".35em").text(feature);

        // iterate over rings
        Object.keys(data).forEach(function(val, idx, arr) {
            var dataName = val;

            var ringData = getRingData(dataName, feature);

            var startDegrees = 0;
            sortedSamples.forEach(function(val, idx, arr) {
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

    return this;
}

