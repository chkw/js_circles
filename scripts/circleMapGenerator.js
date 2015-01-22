/**
 * circleMapGenerator.js
 * ChrisW
 *
 * Draw CircleMaps in SVG elements.
 * Requires:
 * 1) utils.js
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
            if (utils.isObjInArray(['numeric', 'expression data'], eventObj.metadata.allowedValues)) {
                continue;
            }
            this.eventStats[eventId] = eventObj.data.getStats();
        }
    }

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
    if (utils.hasOwnProperty(this.queryData, "orderFeature")) {
        var features = [].concat(this.queryData["orderFeature"]);
        for (var i = 0; i < features.length; i++) {
            ss.addStep(features[i]);
        }
    } else {
        ss.addStep(this.getQueryFeatures()[0]);
    }
    console.log('ss', ss);
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
    this.drawCircleMap_old = function(feature, d3SvgTagElement) {
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

    /**
     * draw a CircleMap via d3.js.  This one handles multiple rings.
     * @param {Object} feature
     * @param {Object} d3SvgTagElement
     */
    this.drawCircleMap = function(feature, d3SvgTagElement) {
        // TODO get list of rings (ringData)
        var ringsList = this.queryData['ringsList'];

        var fullRadius = 100;

        var expressionEventIds = this.eventAlbum.getEventIdsByType()['expression data'];
        var numDatasets = ringsList.length;

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
        for (var i = 0; i < ringsList.length; i++) {
            var ringName = ringsList[i];

            var dataName = (ringName === 'expression data') ? (feature + '_mRNA') : ringName;
            var ringData = this.getRingData(dataName);

            // TODO qqq

            // var dataName = feature + '_mRNA';
            // var ringData = this.getRingData(feature + '_mRNA');
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
                        // assign color for numerical data
                        hexColor = getHexColor(score, eventStats['min'], eventStats['max']);

                        // TODO assign color cagetorical data
                    }

                    var arc = createD3Arc(innerRadius, innerRadius + ringThickness, startDegrees, startDegrees + degreeIncrements);
                    circleMapGroup.append("path").attr("d", arc).attr("fill", hexColor);

                    // clockwise from 12 o clock
                    startDegrees = startDegrees + degreeIncrements;
                });
            }

            innerRadius = innerRadius + ringThickness;
        }

        // add a label
        // circleMapGroup.append("svg:text").attr("text-anchor", "middle").attr('dy', ".35em").text(feature);

        return circleMapSvgElement;
    };
};

