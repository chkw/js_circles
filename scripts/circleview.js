/**
 * @param width
 * @param height
 * @param metaDataObj
 * @param dataObj
 * @param queryDataObj
 */
jQuery.fn.circleMapViewer = function circleMapViewer(width, height, metaDataObj, dataObj, queryDataObj) {

    // TODO main section

    var metaData = metaDataObj;
    var data = dataObj;
    var queryData = queryDataObj;

    // logData();

    var queryFeatures = getQueryFeatures().slice(0, 19);
    console.log("num query features: " + queryFeatures.length);
    console.log(queryFeatures.toString());

    var sortedSamples = getSortedSamples(queryFeatures[0], getDatasetNames());

    this.each(function() {
        var svg = d3.select(this).append('svg').attr({
            'id' : 'circleMaps',
            'width' : width,
            'height' : height
        });
    });

    var circleMapsSvgElement = d3.select('#circleMaps');

    // draw circleMaps
    queryFeatures.forEach(function(val, idx, arr) {
        var feature = val;
        drawCircleMap(feature, sortedSamples, circleMapsSvgElement);
    });

    // select circleMaps
    var selectionSize = selectAllCircleMaps().size();
    console.log("number selected --> " + selectionSize);

    randomElementLayout(selectAllCircleMaps(), width, height);

    /**
     * Position the elements randomly.
     */
    function randomElementLayout(elementSelection, maxX, maxY) {
        elementSelection.each(function(d, i) {
            var x = Math.floor(Math.random() * maxX);
            var y = Math.floor(Math.random() * maxY);
            this.setAttribute("transform", "translate(" + x + "," + y + ")");
        });
    }

    /**
     * Select all elements with the class "circleMap".
     */
    function selectAllCircleMaps() {
        return d3.selectAll(".circleMap");
    }

    /**
     * get an array of dataset names from the metadata
     */
    function getDatasetNames() {
        return Object.keys(metaData);
    }

    /**
     * Get the query features.
     */
    function getQueryFeatures() {
        if ("features" in queryData) {
            return queryData["features"];
        } else {
            return new Array();
        }
    }

    /**
     * log the object attributes to console
     */
    function logData() {
        console.log("metaData is " + JSON.stringify(metaData));
        console.log("data is " + JSON.stringify(data));
        console.log("queryData is " + JSON.stringify(queryData));
    }

    /**
     * get all sampleIDs from the metadata
     */
    function getSampleNames() {
        var namesSet = d3.set();
        var datasetNames = getDatasetNames();
        datasetNames.forEach(function(val, idx, arr) {
            var datasetName = val;
            var sampleNames = metaData[datasetName]['sampleNames'].split(",");
            sampleNames.forEach(function(val, idx, arr) {
                var name = val;
                namesSet.add(name);
            });
        });
        return namesSet.values();
    }

    /**
     * get sample names in sorted order
     */
    function getSortedSamples(sortingFeature, dataSortingOrder) {
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
                var ringData = getRingData(datasetName, sortingFeature);
                var score;
                if (ringData == null) {
                    score = null;
                } else {
                    score = ringData[id];
                }
                sampleObj["scores"].push(score);
            });
        });

        sampleObjects.sort(compareSampleObjects);

        var sortedSampleNames = sampleObjects.map(function(val, idx, arr) {
            var sampleObj = val;
            var name = sampleObj["id"];
            return name;
        });

        /**
         * comparison function
         */
        function compareSampleObjects(a, b) {
            var scoresA = a["scores"];
            var scoresB = b["scores"];

            if (scoresA.length != scoresB.length) {
                console.log(a["id"] + " and " + b["id"] + " have different number of scores.")
                return 0;
            }

            for (var i = 0; i < scoresA.length; i++) {
                // convert to numbers
                var scoreA = parseFloat(scoresA[i]);
                var scoreB = parseFloat(scoresB[i]);

                // handle non-numericals
                // As per IEEE-754 spec, a nan checked for equality against itself will be unequal (in other words, nan != nan)
                // ref: http://kineme.net/Discussion/DevelopingCompositions/CheckifnumberNaNjavascriptpatch
                if (scoreA != scoreA || scoreB != scoreB) {
                    if (scoreA != scoreA && scoreB != scoreB) {
                        continue;
                    } else if (scoreA != scoreA) {
                        return -1;
                    } else if (scoreB != scoreB) {
                        return 1;
                    }
                }

                if (scoreA < scoreB) {
                    return -1;
                }
                if (scoreA > scoreB) {
                    return 1;
                } else {
                    continue;
                }
            }
            // Reach this if the score vectors are identical.
            return 0;
        };
        return sortedSampleNames;
    }

    /**
     * get the data for a ring
     * @param {Object} dataName
     * @param {Object} feature
     */
    function getRingData(dataName, feature) {
        if ( dataName in data) {
            if ( feature in data[dataName]) {
                return data[dataName][feature];
            } else
                return null;
        } else
            return null;
    }

    /**
     * convert an rgb component to hex value
     * @param {Object} c
     */
    function rgbComponentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    /**
     * convert rgb color code to hex
     * @param {Object} r
     * @param {Object} g
     * @param {Object} b
     */
    function rgbToHex(r, g, b) {
        return "#" + rgbComponentToHex(r) + rgbComponentToHex(g) + rgbComponentToHex(b);
    }

    /**
     * linear interpolation
     * @param {Object} percent
     * @param {Object} minVal
     * @param {Object} maxVal
     */
    function linearInterpolation(percent, minVal, maxVal) {
        return ((maxVal - minVal) * percent) + minVal;
    }

    /**
     * get a color for a score
     * @param {Object} score
     * @param {Object} dataName
     */
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

    /**
     * create an svg arc via d3.js
     * @param {Object} innerRadius
     * @param {Object} outerRadius
     * @param {Object} startDegrees
     * @param {Object} endDegrees
     */
    function createArc(innerRadius, outerRadius, startDegrees, endDegrees) {
        var arc = d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius).startAngle(startDegrees * (Math.PI / 180)).endAngle(endDegrees * (Math.PI / 180))
        return arc;
    }

    /**
     * draw a CircleMap via d3.js
     * @param {Object} feature
     * @param {Object} sortedSamples
     * @param {Object} svgTagElement
     */
    function drawCircleMap(feature, sortedSamples, svgTagElement) {
        var fullRadius = 100;

        var numDatasets = Object.keys(data).length;

        // +1 for the center
        var ringThickness = fullRadius / (numDatasets + 1);
        var innerRadius = ringThickness;

        var degreeIncrements = 360 / sortedSamples.length;

        // arc paths will be added to this SVG group
        var circleMapGroup = svgTagElement.append("g").attr("id", feature).attr("class", "circleMap").attr("transform", "translate(150,110)");

        // iterate over rings
        Object.keys(data).forEach(function(val, idx, arr) {
            var dataName = val;

            var ringData = getRingData(dataName, feature);
            if (ringData == null) {
                // draw a grey ring for no data.
                var arc = createArc(innerRadius, innerRadius + ringThickness, 0, 360);
                circleMapGroup.append("path").attr("d", arc).attr("fill", "grey");
            } else {
                var startDegrees = 0;
                sortedSamples.forEach(function(val, idx, arr) {
                    var sampleName = val;
                    var hexColor = "grey";
                    if ( sampleName in ringData) {
                        var score = ringData[sampleName];
                        hexColor = getHexColor(score, dataName);
                    }

                    var arc = createArc(innerRadius, innerRadius + ringThickness, startDegrees, startDegrees + degreeIncrements);
                    circleMapGroup.append("path").attr("d", arc).attr("fill", hexColor);

                    // clockwise from 12 o clock
                    startDegrees = startDegrees + degreeIncrements;
                });
            }

            innerRadius = innerRadius + ringThickness;
        });

        // add a label
        circleMapGroup.append("svg:text").attr("text-anchor", "middle").attr('dy', ".35em").text(feature);

        return circleMapGroup;
    }

    return this;
}

