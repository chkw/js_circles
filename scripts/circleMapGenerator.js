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

var circleMapGenerator = {};
(function(cmg) {"use strict";

    cmg.exampleQueryData = {
        // "sampleGroupSummarySwitch" : false,
        // "ignoreMissingSamples" : false,
        // "features" : ["PEG10_mRNA", "PFKFB4_mRNA", "PPARG_mRNA", "PRR5_mRNA", "REEP6_mRNA", "RUNX1T1_mRNA", "SELL_mRNA", "SERTAD1_mRNA", "SLC30A4_mRNA", "SPINK1_mRNA", "ST8SIA4_mRNA", "TEAD2_mRNA", "TMPRSS2_mRNA"],
        "features" : ['ABTB2_mRNA', 'APOBEC3F_mRNA', 'APP_mRNA', 'AR_mRNA', 'DZIP1_mRNA', 'EPAS1_mRNA', 'ERG_mRNA', 'ESR2_mRNA', 'FGD1_mRNA', 'FKBP9_mRNA', 'IL6_mRNA', 'MYOM2_mRNA', 'NCOA1_mRNA', 'P2RY10_mRNA', 'PPP2R5C_mRNA', 'PTGER3_mRNA', 'SLC16A1_mRNA', 'ST5_mRNA', 'TBC1D16_mRNA', 'TBX21_mRNA', 'TGFB1_mRNA', 'TGFB2_mRNA', 'UGDH_mRNA', 'USP20_mRNA', 'VEGFA_mRNA', 'ZFPM2_mRNA'],
        "ringsList" : ["core_subtype", "expression data", 'viper data'],
        "orderFeature" : ['core_subtype', "AR_mRNA"],
        "sortingRing" : "expression data"
        // "ringMergeSwitch" : false
    };

    // constructor should take parameters: OD_eventData, queryData
    cmg.circleMapGenerator = function(eventAlbum, queryData) {
        this.eventAlbum = eventAlbum.fillInMissingSamples();
        this.queryData = queryData;

        this.eventStats = {};
        this.colorMappers = {};
        var eventIdsByGroup = this.eventAlbum.getEventIdsByType();
        for (var group in eventIdsByGroup) {
            var eventIds = eventIdsByGroup[group];
            for (var i = 0; i < eventIds.length; i++) {
                var eventId = eventIds[i];
                var eventObj = this.eventAlbum.getEvent(eventId);
                if (!utils.isObjInArray(['numeric'], eventObj.metadata.allowedValues)) {
                    // define a discrete color mapper
                    this.colorMappers[eventId] = d3.scale.category10();
                } else {
                    this.eventStats[eventId] = eventObj.data.getStats();
                }
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
         * sort samples
         */
        this.sortSamples = function() {
            // get sorted samples
            var ss = new eventData.sortingSteps();
            if (utils.hasOwnProperty(this.queryData, "orderFeature")) {
                var features = [].concat(this.queryData["orderFeature"]);
                features.reverse();
                for (var i = 0; i < features.length; i++) {
                    ss.addStep(features[i]);
                }
            } else {
                ss.addStep(this.getQueryFeatures()[0]);
            }
            // console.log('ring sorting steps', ss);
            this.sortedSamples = this.eventAlbum.multisortSamples(ss);
        };

        this.sortSamples();

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

            newR = utils.rangeLimit(newR, 0, 255);
            newG = utils.rangeLimit(newG, 0, 255);
            newB = utils.rangeLimit(newB, 0, 255);

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

        var testCallback = function(pathElem) {
            var ringGroupElem = pathElem.parentNode;
            var circleMapGroupElem = ringGroupElem.parentNode;
            var ringName = ringGroupElem.getAttribute("ringName");
            var feature = circleMapGroupElem.getAttribute("feature");
            console.log("clicked pathElem: " + ringName + " for " + feature);
        };

        /**
         * Generate an svg:group DOM element to be appended to an svg element.
         */
        this.generateCircleMapSvgGElem = function(feature, radius, interactive) {
            var interactive = interactive || false;
            var ringsList = this.queryData['ringsList'];

            var fullRadius = ( typeof radius === 'undefined') ? 100 : radius;

            // var expressionEventIds = this.eventAlbum.getEventIdsByType()['expression data'];
            var numDatasets = ringsList.length;

            // +1 for the center
            var ringThickness = fullRadius / (numDatasets + 1);
            var innerRadius = ringThickness;

            var degreeIncrements = 360 / this.sortedSamples.length;

            // arc paths will be added to this SVG group
            var circleMapGroup = document.createElementNS(utils.svgNamespaceUri, 'g');
            utils.setElemAttributes(circleMapGroup, {
                'class' : 'circleMapG',
                "feature" : feature
            });

            // white center
            circleMapGroup.appendChild(utils.createSvgCircleElement(0, 0, innerRadius, {
                "fill" : "white"
            }));

            var legendColorMapper;

            // iterate over rings
            for (var i = 0; i < ringsList.length; i++) {
                var ringName = ringsList[i];
                var dataName = null;

                // find data name suffix at runtime
                if ( ringName in this.eventAlbum.datatypeSuffixMapping) {
                    dataName = feature + this.eventAlbum.datatypeSuffixMapping[ringName];
                } else {
                    dataName = ringName;
                }

                var ringGroupElem = document.createElementNS(utils.svgNamespaceUri, 'g');
                utils.setElemAttributes(ringGroupElem, {
                    'class' : 'circleMapRingG',
                    'ringName' : ringName,
                    'dataName' : dataName
                });
                circleMapGroup.appendChild(ringGroupElem);

                var ringData = this.getRingData(dataName);

                if (feature.toLowerCase() === 'legend') {
                    if ( typeof legendColorMapper === 'undefined') {
                        legendColorMapper = d3.scale.category10();
                    }
                    var arc = createD3Arc(innerRadius, innerRadius + ringThickness, 0, 360);
                    var pathElem = document.createElementNS(utils.svgNamespaceUri, 'path');
                    utils.setElemAttributes(pathElem, {
                        'd' : arc(),
                        'fill' : legendColorMapper(dataName)
                    });
                    ringGroupElem.appendChild(pathElem);
                } else if (ringData == null) {
                    // draw a grey ring for no data.
                    var arc = createD3Arc(innerRadius, innerRadius + ringThickness, 0, 360);
                    var pathElem = document.createElementNS(utils.svgNamespaceUri, 'path');
                    utils.setElemAttributes(pathElem, {
                        'd' : arc(),
                        'fill' : 'grey'
                    });
                    ringGroupElem.appendChild(pathElem);

                    // tooltip for arc
                    var titleText = "no data";
                    var titleElem = document.createElementNS(utils.svgNamespaceUri, "title");
                    titleElem.innerHTML = titleText;
                    pathElem.appendChild(titleElem);

                } else {
                    var allowedValues = this.eventAlbum.getEvent(dataName).metadata.allowedValues;
                    var eventStats = this.eventStats[dataName];

                    var startDegrees = 0;
                    var colorMapper = this.colorMappers[ringName];
                    this.sortedSamples.forEach(function(val, idx, arr) {
                        var sampleName = val;
                        var hexColor = "grey";

                        var score = null;
                        if ( sampleName in ringData) {
                            var score = ringData[sampleName];
                            if (eventStats != null) {
                                // assign color for numerical data
                                hexColor = getHexColor(score, eventStats['min'], eventStats['max']);
                                // hexColor = getHexColor(score, -1.0, 1.0);
                            } else {
                                // assign color categorical data
                                hexColor = colorMapper(score);
                            }
                        }

                        var arc = createD3Arc(innerRadius, innerRadius + ringThickness, startDegrees, startDegrees + degreeIncrements);
                        var pathElem = document.createElementNS(utils.svgNamespaceUri, 'path');

                        utils.setElemAttributes(pathElem, {
                            'd' : arc(),
                            'fill' : hexColor,
                            'sampleName' : sampleName,
                            'score' : score
                        });

                        // additional interactive features
                        if (interactive) {
                            // tooltip for arc
                            score = (utils.isNumerical(score)) ? score.toFixed(3) : score;
                            var titleText = "sample " + sampleName + "'s " + ringName + " score for " + feature + " is " + score + ".";
                            var titleElem = document.createElementNS(utils.svgNamespaceUri, "title");
                            titleElem.innerHTML = titleText;
                            pathElem.appendChild(titleElem);

                            pathElem.onclick = function() {
                                testCallback(this);
                            };
                        }

                        ringGroupElem.appendChild(pathElem);

                        // clockwise from 12 o clock
                        startDegrees = startDegrees + degreeIncrements;
                    });
                }

                innerRadius = innerRadius + ringThickness;
            }

            // add a label
            // circleMapGroup.append("svg:text").attr("text-anchor", "middle").attr('dy', ".35em").text(feature);

            return circleMapGroup;
        };

        /**
         *Get a data URI for the circleMap svg.
         */
        this.getCircleMapDataUri = function(feature) {
            var radius = 100;

            var svgGElem = this.generateCircleMapSvgGElem(feature, radius);

            var svgTagOpen = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (-1 * radius) + ' ' + (-1 * radius) + ' ' + (2 * radius) + ' ' + (2 * radius) + '">';
            var stringifiedSvg = svgTagOpen + svgGElem.outerHTML + '</svg>';

            var dataURI = 'data:image/svg+xml;utf8,' + encodeURIComponent(stringifiedSvg);

            return dataURI;
        };

        /**
         * This is the only outward-facing method in this object.
         * draws a CircleMap via d3.js.
         * handles multiple rings.
         * @param {Object} feature
         * @param {Object} d3SvgTagElement
         * @param {Object} radius
         * @param {Object} interactive  boolean to include additional interactive features
         */
        this.drawCircleMap = function(feature, d3SvgTagElement, radius, interactive) {
            var interactive = interactive || true;
            var radius = radius || 100;
            var svgGElem = this.generateCircleMapSvgGElem(feature, radius, interactive);

            var svgElem = document.createElementNS(utils.svgNamespaceUri, 'svg');
            // svgElem.setAttributeNS('null', 'xmlns', 'http://www.w3.org/2000/svg');
            utils.setElemAttributes(svgElem, {
                // 'xmlns' : utils.svgNamespaceUri,
                // 'viewBox' : (-1 * fullRadius) + ' ' + (-1 * fullRadius) + ' ' + (2 * fullRadius) + ' ' + (2 * fullRadius),
                'id' : 'circleMapSvg' + feature,
                'class' : 'circleMapSvg',
                'name' : feature
            });
            svgElem.appendChild(svgGElem);

            utils.extractFromD3(d3SvgTagElement).appendChild(svgElem);

            return svgElem;
        };
    };

})(circleMapGenerator);
