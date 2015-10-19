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

    cmg.examplecmgParams = {
        // "sampleGroupSummarySwitch" : false,
        // "ignoreMissingSamples" : false,
        // "features" : ["PEG10_mRNA", "PFKFB4_mRNA", "PPARG_mRNA", "PRR5_mRNA", "REEP6_mRNA", "RUNX1T1_mRNA", "SELL_mRNA", "SERTAD1_mRNA", "SLC30A4_mRNA", "SPINK1_mRNA", "ST8SIA4_mRNA", "TEAD2_mRNA", "TMPRSS2_mRNA"],
        "features" : ['ABTB2_mRNA', 'APOBEC3F_mRNA', 'APP_mRNA', 'AR_mRNA', 'DZIP1_mRNA', 'EPAS1_mRNA', 'ERG_mRNA', 'ESR2_mRNA', 'FGD1_mRNA', 'FKBP9_mRNA', 'IL6_mRNA', 'MYOM2_mRNA', 'NCOA1_mRNA', 'P2RY10_mRNA', 'PPP2R5C_mRNA', 'PTGER3_mRNA', 'SLC16A1_mRNA', 'ST5_mRNA', 'TBC1D16_mRNA', 'TBX21_mRNA', 'TGFB1_mRNA', 'TGFB2_mRNA', 'UGDH_mRNA', 'USP20_mRNA', 'VEGFA_mRNA', 'ZFPM2_mRNA'],
        "ringsList" : ["core_subtype", "expression data", 'viper data'],
        "orderFeature" : ['core_subtype', "AR_mRNA"],
        "sortingRing" : "expression data"
        // "ringMergeSwitch" : false
    };

    // constructor should take parameters: OD_eventData, cmgParams
    // cmgParams includes ringsList and possibly centerScores
    // centerScores is an object of feature:score where score is taken to be a 0-centered normalized score.
    cmg.circleMapGenerator = function(eventAlbum, cmgParams) {
        this.eventAlbum = eventAlbum.fillInMissingSamples();
        this.cmgParams = cmgParams;

        // rescale expression data
        var exprRescalingData = this.eventAlbum.eventwiseMedianRescaling();

        var expressionColorMapper = utils.centeredRgbaColorMapper(false);
        if (exprRescalingData != null) {
            var minExpVal = exprRescalingData['minVal'];
            var maxExpVal = exprRescalingData['maxVal'];
            var expressionColorMapper = utils.centeredRgbaColorMapper(false, 0, minExpVal, maxExpVal);
        }

        this.eventStats = {};
        this.colorMappers = {};
        var eventIdsByGroup = this.eventAlbum.getEventIdsByType();
        for (var group in eventIdsByGroup) {
            var eventIds = eventIdsByGroup[group];
            for (var i = 0; i < eventIds.length; i++) {
                var eventId = eventIds[i];
                var eventObj = this.eventAlbum.getEvent(eventId);
                if (eventObj.metadata.datatype === 'expression data') {
                    // shared expression color mapper
                    this.colorMappers[eventId] = expressionColorMapper;
                } else if (!utils.isObjInArray(['numeric'], eventObj.metadata.allowedValues)) {
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
            if ("features" in this.cmgParams) {
                return this.cmgParams["features"];
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
            if (utils.hasOwnProperty(this.cmgParams, "orderFeature")) {
                var features = [].concat(this.cmgParams["orderFeature"]);
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

        function getHexColor(score, cohortMin, cohortMax) {
            if (_.isUndefined(score) || ! utils.isNumerical(score)) {
                return "grey";
            }

            cohortMin = (_.isNumber(cohortMin)) ? cohortMin : -1;
            cohortMax = (_.isNumber(cohortMax)) ? cohortMax : 1;

            var posColor = "red";
            var negColor = "blue";
            var zeroColor = "white";

            var colorMapper = d3.scale.linear();
            colorMapper.domain([cohortMin, 0, cohortMax]).range([negColor, zeroColor, posColor]);
            var returnColor = colorMapper(score);

            return returnColor;
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
            var ringsList = this.cmgParams['ringsList'];

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

            // white palete
            circleMapGroup.appendChild(utils.createSvgCircleElement(0, 0, fullRadius, {
                "fill" : "white"
            }));

            // node centers
            var fill;
            if (_.isUndefined(this.cmgParams["centerScores"]) || (_.keys(this.cmgParams["centerScores"]).length == 0 )) {
                // no node center
            } else {
                var centerScore = this.cmgParams["centerScores"][feature];
                if (_.isUndefined(centerScore)) {
                    // check if node center data exists
                    fill = "grey";
                } else {
                    // color center
                    fill = getHexColor(centerScore);
                }
                var centerCircleElem = utils.createSvgCircleElement(0, 0, ringThickness, {
                    "fill" : fill
                });
                // additional interactive features
                if (interactive) {
                    // tooltip for node center
                    if (_.isUndefined(centerScore)) {
                        centerScore = "N/A";
                    } else {
                        // use centerScore
                    }
                    var titleText = "node center score for " + feature + ": " + centerScore;
                    var titleElem = document.createElementNS(utils.svgNamespaceUri, "title");
                    titleElem.innerHTML = titleText;
                    centerCircleElem.appendChild(titleElem);
                }

                circleMapGroup.appendChild(centerCircleElem);
            }

            // iterate over rings
            for (var i = 0; i < ringsList.length; i++) {
                var ringName = ringsList[i];
                var dataName = null;

                // find data name suffix at runtime
                if ( ringName in this.eventAlbum.datatypeSuffixMapping && (this.eventAlbum.datatypeSuffixMapping[ringName] !== "")) {
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

                if (ringData == null) {
                    // draw a grey ring for no data.
                    var arc = createD3Arc(innerRadius, innerRadius + ringThickness, 0, 360);
                    var pathElem = document.createElementNS(utils.svgNamespaceUri, 'path');
                    utils.setElemAttributes(pathElem, {
                        'd' : arc(),
                        'fill' : 'grey'
                    });
                    ringGroupElem.appendChild(pathElem);

                    // tooltip for arc
                    var titleText = "no " + ringName + " scores";
                    var titleElem = document.createElementNS(utils.svgNamespaceUri, "title");
                    titleElem.innerHTML = titleText;
                    pathElem.appendChild(titleElem);

                } else {
                    var allowedValues = this.eventAlbum.getEvent(dataName).metadata.allowedValues;
                    var eventStats = this.eventStats[dataName];

                    var startDegrees = 0;
                    var colorMapper = this.colorMappers[ringName];
                    if (ringName === "expression data") {
                        var eventId = dataName;
                        colorMapper = this.colorMappers[eventId];
                    };
                    this.sortedSamples.forEach(function(val, idx, arr) {
                        var sampleName = val;
                        var hexColor;

                        var score = null;
                        if ( sampleName in ringData) {
                            var score = ringData[sampleName];
                            if ((eventStats != null) && (ringName !== "expression data")) {
                                // assign color for numerical data
                                hexColor = getHexColor(score, eventStats['min'], eventStats['max']);
                            } else {
                                // assign color categorical data
                                hexColor = colorMapper(score);
                            }
                        }

                        var arc = createD3Arc(innerRadius, innerRadius + ringThickness, startDegrees, startDegrees + degreeIncrements);
                        var pathElem = document.createElementNS(utils.svgNamespaceUri, 'path');

                        // TODO aaa
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
         * Generate an svg:group DOM element to be appended to an svg element.
         */
        this.generateCircleMapSvgGElem_legend = function(radius, interactive) {
            var feature = "legend";
            var interactive = interactive || false;
            var ringsList = this.cmgParams['ringsList'];

            var fullRadius = ( typeof radius === 'undefined') ? 100 : radius;

            // var expressionEventIds = this.eventAlbum.getEventIdsByType()['expression data'];
            var numDatasets = ringsList.length;

            // +1 for the center
            var ringThickness = fullRadius / (numDatasets + 1);
            var innerRadius = ringThickness;

            var usedAngles = [];

            // arc paths will be added to this SVG group
            var circleMapGroup = document.createElementNS(utils.svgNamespaceUri, 'g');
            utils.setElemAttributes(circleMapGroup, {
                'class' : 'circleMapG',
                "feature" : feature
            });

            // white palete
            circleMapGroup.appendChild(utils.createSvgCircleElement(0, 0, fullRadius, {
                "fill" : "white"
            }));

            // node centers
            var fill;
            if (_.isUndefined(this.cmgParams["centerScores"]) || (_.keys(this.cmgParams["centerScores"]).length == 0 )) {
                // no node center
            } else {
                var centerScore = this.cmgParams["centerScores"][feature];
                if (_.isUndefined(centerScore)) {
                    // check if node center data exists
                    fill = "grey";
                } else {
                    // color center
                    fill = getHexColor(centerScore);
                }
                var centerCircleElem = utils.createSvgCircleElement(0, 0, ringThickness, {
                    "fill" : fill
                });
                // additional interactive features
                if (interactive) {
                    // tooltip for node center
                    if (_.isUndefined(centerScore)) {
                        centerScore = "N/A";
                    } else {
                        // use centerScore
                    }
                    var titleText = "node center score for " + feature + ": " + centerScore;
                    var titleElem = document.createElementNS(utils.svgNamespaceUri, "title");
                    titleElem.innerHTML = titleText;
                    centerCircleElem.appendChild(titleElem);
                }

                circleMapGroup.appendChild(centerCircleElem);
            }

            /**
             * convert radial position to x,y position.
             s             */
            var radialPos2xyPos = function(radius, angle) {
                var pos = {
                    "x" : 0,
                    "y" : 0
                };

                var radians = utils.toRadians(angle);
                var oppo = radius * Math.sin(radians);
                var adj = radius * Math.cos(radians);

                pos["x"] = oppo;
                pos["y"] = adj;

                return pos;
            };

            // TODO addLegendScoreArcs
            var addLegendScoreArcs = function(scores, ringGroupElem, colorMapper, innerRadius, ringThickness, additionalPathElemAttribs) {
                var startDegrees = 0;
                var degreeIncrements = 360 / scores.length;
                var pathElemAttribs = (_.isUndefined(additionalPathElemAttribs)) ? {} : additionalPathElemAttribs;

                _.each(scores, function(score) {
                    // arc
                    var color = colorMapper(score);
                    var arc = createD3Arc(innerRadius, innerRadius + ringThickness, startDegrees, startDegrees + degreeIncrements);
                    var pathElem = document.createElementNS(utils.svgNamespaceUri, 'path');

                    pathElemAttribs["d"] = arc();
                    pathElemAttribs["fill"] = color;

                    utils.setElemAttributes(pathElem, pathElemAttribs);
                    ringGroupElem.appendChild(pathElem);

                    var labelGroupElem = document.createElementNS(utils.svgNamespaceUri, 'g');
                    ringGroupElem.appendChild(labelGroupElem);

                    // label swatch
                    var angle = startDegrees + (degreeIncrements / 2);
                    while (_.contains(usedAngles, angle)) {
                        angle = (angle + 3);
                    }
                    usedAngles.push(angle);

                    var xyPos1 = radialPos2xyPos(innerRadius + (ringThickness * (2 / 3)), angle);

                    var xyPos = radialPos2xyPos(innerRadius + (80), angle);
                    // var testElem = utils.createSvgRectElement(xyPos["x"] - 4.5, -xyPos["y"] - 4.5, 0, 0, 9, 9, {
                    // "fill" : color
                    // // "stroke" : "black"
                    // });
                    // labelGroupElem.appendChild(testElem);

                    // label line
                    var lineElem = document.createElementNS(utils.svgNamespaceUri, 'line');
                    var lineAttribs = {
                        "stroke" : "black",
                        "x1" : xyPos1["x"],
                        "y1" : -xyPos1["y"],
                        "x2" : xyPos["x"],
                        "y2" : -xyPos["y"]
                    };
                    utils.setElemAttributes(lineElem, lineAttribs);
                    labelGroupElem.appendChild(lineElem);

                    // label text
                    var legendLabelElem = document.createElementNS(utils.svgNamespaceUri, 'text');
                    var labelAttribs = {
                        "fill" : "#3CB371",
                        // "fill" : "mediumseagreen",
                        "font-size" : "8",
                        "dx" : xyPos["x"],
                        "dy" : -xyPos["y"]
                    };
                    if (xyPos["x"] < 0) {
                        labelAttribs["text-anchor"] = "end";
                    }
                    utils.setElemAttributes(legendLabelElem, labelAttribs);
                    legendLabelElem.innerHTML = score;
                    labelGroupElem.appendChild(legendLabelElem);

                    // additional interactive features
                    // tooltip for arc
                    // score = (utils.isNumerical(score)) ? score.toFixed(3) : score;
                    var titleText = score + " value for " + ringName + " data";
                    var titleElem = document.createElementNS(utils.svgNamespaceUri, "title");
                    titleElem.innerHTML = titleText;
                    pathElem.appendChild(titleElem);

                    // clockwise from 12 o clock
                    startDegrees = startDegrees + degreeIncrements;
                });
            };

            // iterate over rings
            for (var i = 0; i < ringsList.length; i++) {
                var ringName = ringsList[i];
                var dataName = null;

                // find data name suffix at runtime
                if ( ringName in this.eventAlbum.datatypeSuffixMapping && (this.eventAlbum.datatypeSuffixMapping[ringName] !== "")) {
                    dataName = feature + this.eventAlbum.datatypeSuffixMapping[ringName];
                } else {
                    dataName = ringName;
                }

                var ringGroupElem = document.createElementNS(utils.svgNamespaceUri, 'g');
                utils.setElemAttributes(ringGroupElem, {
                    'class' : 'circleMapRingG ' + ringName,
                    'ringName' : ringName,
                    'dataName' : dataName
                });
                circleMapGroup.appendChild(ringGroupElem);

                var ringData = this.getRingData(dataName);

                // determine numeric, categoric, mutation, etc.
                var eventObj = this.eventAlbum.getEvent(dataName);
                if (_.isUndefined(eventObj)) {
                    // console.log("no eventObj for", dataName);
                    // var sampleNum = this.sortedSamples.length;
                    var sampleNum = 20;

                    var simulatedScores = [-1, 0, 1];
                    for (var k = 1, lengthk = sampleNum / 2; k < lengthk; k++) {
                        var simulatedScore = k * (1 / lengthk);
                        simulatedScore = simulatedScore.toPrecision(2);
                        simulatedScores.push(simulatedScore);
                        simulatedScores.push(-1 * simulatedScore);
                    }
                    simulatedScores = simulatedScores.sort(function(a, b) {
                        return (a - b);
                    });

                    addLegendScoreArcs(simulatedScores, ringGroupElem, getHexColor, innerRadius, ringThickness);
                } else {
                    // console.log("got an eventObj for", dataName);
                    var scores = eventObj.data.getValues(true);
                    var colorMapper = this.colorMappers[dataName];

                    addLegendScoreArcs(scores, ringGroupElem, colorMapper, innerRadius, ringThickness);
                }

                innerRadius = innerRadius + ringThickness;
            }

            // reorder placement of circleMapRingG elems
            _.each(ringsList.reverse(), function(ringName) {
                // console.log("ringName", ringName);
                var elem = circleMapGroup.getElementsByClassName(ringName)[0];
                utils.pullElemToFront(elem);
            });

            return circleMapGroup;
        };

        /**
         * Wrapper for building SVGs
         */
        this.generateCircleMapSvgGElemWrapper = function(feature, radius, interactive) {
            var svgGElem;
            if (feature === "legend") {
                svgGElem = this.generateCircleMapSvgGElem_legend(radius, interactive);
            } else {
                svgGElem = this.generateCircleMapSvgGElem(feature, radius, interactive);
            }
            return svgGElem;
        };

        /**
         *Get a data URI for the circleMap svg.
         */
        this.getCircleMapDataUri = function(feature) {
            var radius = 100;

            var svgGElem = this.generateCircleMapSvgGElemWrapper(feature, radius);

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
            var svgGElem = this.generateCircleMapSvgGElemWrapper(feature, radius, interactive);

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
