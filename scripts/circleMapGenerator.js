/**
 * circleMapGenerator.js
 * ChrisW
 *
 * Draw CircleMaps in SVG elements.
 * Requires:
 * 1) static.js
 * 2) jStat.js
 * 3) OD_eventData.js
 * 4) D3.js
 */

// TODO new constructor should take parameters: OD_eventData, queryData
function circleMapGenerator_2(eventAlbum, queryData) {
    this.eventAlbum = eventAlbum.fillInMissingSamples();
    this.queryData = queryData;

    this.eventStats = {};
    var eventIdsByGroup = this.eventAlbum.getEventIdsByType();
    for (var group in eventIdsByGroup) {
        var eventIds = eventIdsByGroup[group];
        for (var i = 0; i < eventIds.length; i++) {
            var eventId = eventIds[i];
            var eventObj = this.eventAlbum.getEvent(eventId);
            if (eventObj.metadata.allowedValues !== 'numeric') {
                continue;
            }
            this.eventStats[eventId] = eventObj.data.getStats();
        }
    }
    console.log(this.eventStats);

    /**
     * Get the query features... these should match up with eventIDs in the eventAlbum
     */
    this.getQueryFeatures = function() {
        if ("features" in this.queryData) {
            return this.queryData["features"];
        } else {
            return new Array();
        }
    };

    /**
     * get the names of data sets from the eventAlbum, grouped by datatype
     */
    this.getDatasetNames = function() {
        return this.eventAlbum.getEventIdsByType();
    };

    /**
     * log the object attributes to console
     */
    this.logData = function() {
        console.log(this);
    };

    /**
     * get all sampleIDs from the eventAlbum
     */
    this.getSampleNames = function() {
        return this.eventAlbum.getAllSampleIds();
    };

    /**
     * get the data for a ring.  The return object are sample values keyed on sampleId.
     * @param {Object} eventId
     */
    this.getRingData = function(eventId) {
        var id = eventId;
        var eventObj = this.eventAlbum.getEvent(id);

        // event not found
        if (eventObj == null) {
            return null;
        } else {
            var result = {};
            var eventData = eventObj.data.getData();
            for (var i = 0; i < eventData.length; i++) {
                var sampleData = eventData[i];
                result[sampleData['id']] = sampleData['val'];
            }
            return result;
        }
    };

    /**
     * Get a sorted list of sampleIds
     */
    this.getSortedSamples = function(sortingSteps) {
        var sortedSampleIds = this.eventAlbum.multisortSamples(sortingSteps);
        return sortedSampleIds;
    };

    // get sorted samples
    var ss = new eventData.sortingSteps();
    ss.addStep(this.getQueryFeatures()[0]);
    this.sortedSamples = this.getSortedSamples(ss);

    /**
     * get a color for a score
     * @param {Object} score
     * @param {Object} cohortMin
     * @param {Object} cohortMax
     */
    function getHexColor(score, cohortMin, cohortMax) {
        if (! utils.isNumerical(score)) {
            return "grey";
        }
        var isPositive = (score >= 0) ? true : false;

        var maxR = 255;
        var maxG = 0;
        var maxB = 0;

        var minR = 255;
        var minG = 255;
        var minB = 255;

        var normalizedScore = (score / cohortMax);

        if (!isPositive) {
            maxR = 0;
            maxG = 0;
            maxB = 255;

            minR = 255;
            minG = 255;
            minB = 255;

            normalizedScore = (score / cohortMin);
        }

        var newR = utils.linearInterpolation(normalizedScore, minR, maxR);
        var newG = utils.linearInterpolation(normalizedScore, minG, maxG);
        var newB = utils.linearInterpolation(normalizedScore, minB, maxB);

        var hexColor = utils.rgbToHex(Math.floor(newR), Math.floor(newG), Math.floor(newB));

        return hexColor;
    }

    /**
     * create an svg arc via d3.js
     * @param {Object} innerRadius
     * @param {Object} outerRadius
     * @param {Object} startDegrees
     * @param {Object} endDegrees
     */
    function createD3Arc(innerRadius, outerRadius, startDegrees, endDegrees) {
        var arc = d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius).startAngle(startDegrees * (Math.PI / 180)).endAngle(endDegrees * (Math.PI / 180));
        return arc;
    }

    /**
     * draw a CircleMap via d3.js
     * @param {Object} feature
     * @param {Object} d3SvgTagElement
     */
    this.drawCircleMap = function(feature, d3SvgTagElement) {
        var fullRadius = 100;

        var expressionEventIds = this.eventAlbum.getEventIdsByType()['expression data'];
        var numDatasets = expressionEventIds.length;
        numDatasets = 1;

        // +1 for the center
        var ringThickness = fullRadius / (numDatasets + 1);
        var innerRadius = ringThickness;

        var degreeIncrements = 360 / this.sortedSamples.length;

        // arc paths will be added to this SVG group
        var circleMapSvgElement = d3SvgTagElement.append('svg').attr({
            id : 'circleMapSvg' + feature,
            'class' : 'circleMapSvg',
            name : feature
        });
        var circleMapGroup = circleMapSvgElement.append('g').attr({
            'class' : 'circleMapG'
        });

        // iterate over rings

        // var datasetNames = expressionEventIds;
        // for (var i in datasetNames) {
        var dataName = feature + '_mRNA';
        var ringData = this.getRingData(feature + '_mRNA');
        var eventStats = this.eventStats[dataName];
        if (ringData == null) {
            // draw a grey ring for no data.
            var arc = createD3Arc(innerRadius, innerRadius + ringThickness, 0, 360);
            circleMapGroup.append("path").attr("d", arc).attr("fill", "grey");
        } else {
            var startDegrees = 0;
            this.sortedSamples.forEach(function(val, idx, arr) {
                var sampleName = val;
                var hexColor = "grey";
                if ( sampleName in ringData) {
                    var score = ringData[sampleName];
                    hexColor = getHexColor(score, eventStats['min'], eventStats['max']);
                }

                var arc = createD3Arc(innerRadius, innerRadius + ringThickness, startDegrees, startDegrees + degreeIncrements);
                circleMapGroup.append("path").attr("d", arc).attr("fill", hexColor);

                // clockwise from 12 o clock
                startDegrees = startDegrees + degreeIncrements;
            });
        }

        innerRadius = innerRadius + ringThickness;
        // };

        // add a label
        // circleMapGroup.append("svg:text").attr("text-anchor", "middle").attr('dy', ".35em").text(feature);

        return circleMapSvgElement;
    };
};
/**
 * @param metaDataObj
 * @param dataObj
 * @param queryDataObj
 */
function circleMapGenerator(metaDataObj, dataObj, queryDataObj) {

    this.metaData = metaDataObj;
    this.data = dataObj;
    this.queryData = queryDataObj;

    // logData();

    /**
     * Get the query features.
     */
    this.getQueryFeatures = function() {
        if ("features" in this.queryData) {
            return this.queryData["features"];
        } else {
            return new Array();
        }
    };
    /**
     * get an array of dataset names from the metadata
     */
    this.getDatasetNames = function() {
        return Object.keys(this.metaData);
    };
    /**
     * log the object attributes to console
     */
    this.logData = function() {
        console.log("metaData is " + JSON.stringify(this.metaData));
        console.log("data is " + JSON.stringify(this.data));
        console.log("queryData is " + JSON.stringify(this.queryData));
    };
    /**
     * get all sampleIDs from the metadata
     */
    this.getSampleNames = function() {
        var namesSet = d3.set();
        var datasetNames = this.getDatasetNames();
        datasetNames.forEach(function(val, idx, arr) {
            var datasetName = val;
            var sampleNames = this.metaData[datasetName]['sampleNames'].split(",");
            sampleNames.forEach(function(val, idx, arr) {
                var name = val;
                namesSet.add(name);
            });
        });
        return namesSet.values();
    };
    /**
     * get the data for a ring
     * @param {Object} dataName
     * @param {Object} feature
     */
    this.getRingData = function(dataName, feature) {
        if ( dataName in this.data) {
            if ( feature in this.data[dataName]) {
                var result = this.data[dataName][feature];
                return result;
            } else {
                return null;
            }
        } else {
            return null;
        }
    };
    /**
     * get sample names in sorted order
     */
    this.getSortedSamples = function(sortingFeature, dataSortingOrder) {
        var sampleObjects = new Array();
        var allSampleIds = this.getSampleNames();

        for (var i in allSampleIds) {
            var id = allSampleIds[i];
            var sampleObj = new Object();
            sampleObjects.push(sampleObj);
            sampleObj["id"] = id;
            sampleObj["scores"] = new Array();

            for (var j in dataSortingOrder) {
                var datasetName = dataSortingOrder[j];
                var ringData = this.getRingData(datasetName, sortingFeature);
                var score;
                if (ringData == null) {
                    score = null;
                } else {
                    score = ringData[id];
                }
                sampleObj["scores"].push(score);
            }

        }

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
                console.log(a["id"] + " and " + b["id"] + " have different number of scores.");
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
    };

    this.sortedSamples = this.getSortedSamples(this.getQueryFeatures().slice(0, 1), this.getDatasetNames());

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

        var normalizedScore = (score / this.metaData[dataName].cohortMax);

        if (!isPositive) {
            maxR = 0;
            maxG = 0;
            maxB = 255;

            minR = 255;
            minG = 255;
            minB = 255;

            normalizedScore = (score / this.metaData[dataName].cohortMin);
        }

        var newR = utils.linearInterpolation(normalizedScore, minR, maxR);
        var newG = utils.linearInterpolation(normalizedScore, minG, maxG);
        var newB = utils.linearInterpolation(normalizedScore, minB, maxB);

        var hexColor = utils.rgbToHex(Math.floor(newR), Math.floor(newG), Math.floor(newB));

        return hexColor;
    }

    /**
     * create an svg arc via d3.js
     * @param {Object} innerRadius
     * @param {Object} outerRadius
     * @param {Object} startDegrees
     * @param {Object} endDegrees
     */
    function createD3Arc(innerRadius, outerRadius, startDegrees, endDegrees) {
        var arc = d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius).startAngle(startDegrees * (Math.PI / 180)).endAngle(endDegrees * (Math.PI / 180));
        return arc;
    }

    /**
     * draw a CircleMap via d3.js
     * @param {Object} feature
     * @param {Object} d3SvgTagElement
     */
    this.drawCircleMap = function(feature, d3SvgTagElement) {
        var fullRadius = 100;

        var numDatasets = Object.keys(this.data).length;

        // +1 for the center
        var ringThickness = fullRadius / (numDatasets + 1);
        var innerRadius = ringThickness;

        var degreeIncrements = 360 / this.sortedSamples.length;

        // arc paths will be added to this SVG group
        var circleMapSvgElement = d3SvgTagElement.append('svg').attr({
            id : 'circleMapSvg' + feature,
            'class' : 'circleMapSvg',
            name : feature
        });
        var circleMapGroup = circleMapSvgElement.append('g').attr({
            'class' : 'circleMapG'
        });

        // iterate over rings

        var datasetNames = Object.keys(this.data);
        for (var i in datasetNames) {
            var dataName = datasetNames[i];
            var ringData = this.getRingData(dataName, feature);
            if (ringData == null) {
                // draw a grey ring for no data.
                var arc = createD3Arc(innerRadius, innerRadius + ringThickness, 0, 360);
                circleMapGroup.append("path").attr("d", arc).attr("fill", "grey");
            } else {
                var startDegrees = 0;
                this.sortedSamples.forEach(function(val, idx, arr) {
                    var sampleName = val;
                    var hexColor = "grey";
                    if ( sampleName in ringData) {
                        var score = ringData[sampleName];
                        hexColor = getHexColor(score, dataName);
                    }

                    var arc = createD3Arc(innerRadius, innerRadius + ringThickness, startDegrees, startDegrees + degreeIncrements);
                    circleMapGroup.append("path").attr("d", arc).attr("fill", hexColor);

                    // clockwise from 12 o clock
                    startDegrees = startDegrees + degreeIncrements;
                });
            }

            innerRadius = innerRadius + ringThickness;
        };

        // add a label
        // circleMapGroup.append("svg:text").attr("text-anchor", "middle").attr('dy', ".35em").text(feature);

        return circleMapSvgElement;
    };
}

