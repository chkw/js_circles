/**
 * circleMapGraph.js
 * chrisw
 *
 * Draw CircleMap network graph
 * requires:
 * 1) jquery
 * 2) jquery-contexmenu <https://medialize.github.io/jQuery-contextMenu/>
 * 3) d3.js
 * 4) jstat
 * 5) utils.js
 * 6) OD_eventData
 * 7) graphData
 * 8) medbook_data_load
 * 9) circleMapGenerator
 * 10) WebCola layout package <https://github.com/tgdwyer/WebCola>
 * 11) underscore
 */

// http://bl.ocks.org/mbostock/929623 shows a nice way to build a graph with intuitive controls.
// bl.ocks.org/rkirsling/5001347

// expose utils to meteor
u = ( typeof u === "undefined") ? utils : u;
// expose circleMapGraph to meteor
circleMapGraph = ( typeof circleMapGraph === "undefined") ? {} : circleMapGraph;
// var circleMapGraph = circleMapGraph || {};
(function(cmGraph) {"use strict";

    var htmlUri = utils.htmlUri;
    var svgNamespaceUri = utils.svgNamespaceUri;
    var xlinkUri = utils.xlinkUri;

    var sbgn_config = {
        'macromoleculeTypes' : ['macromolecule', 'protein', 'gene', 'mrna', 'mirna', 'shrna', 'dna', 'transcription factor'],
        'nucleicAcidFeatureTypes' : ['nucleic acid feature', 'promoter'],
        'unspecifiedEntityTypes' : ['unspecified entity', 'family', 'abstract'],
        'simpleChemicalTypes' : ['simple chemical', 'small molecule'],
        'perturbingAgentTypes' : ['perturbing agent'],
        'complexTypes' : ['complex'],
        'selectableEntityTypes' : ['unspecified entity', 'protein', 'gene', 'mRNA', 'miRNA', 'nucleic acid feature', 'small molecule', 'perturbing agent', 'complex'],
        'edgeTypeOptions' : ['stop adding edges', 'positive regulation', 'negative regulation', 'activate transcription', 'inhibit transcription', 'component of', 'member of'],
        'edgeTypeSymbols' : ['stop adding edges', '-a>', '-a|', '-t>', '-t|', 'component>', 'member>']
    };

    var d3_config = {
        // vars for d3.layout.force
        'linkDistance' : 120,
        'linkStrength' : 0.2,
        'friction' : 0.8,
        'charge' : -500,
        'gravity' : 0.03,
        'nodeRadius' : 20
    };

    cmGraph.largeScale = 'scale(2)';
    cmGraph.smallScale = 'scale(0.3)';

    cmGraph.containerDivElem = null;
    cmGraph.graphDataObj = null;
    cmGraph.circleMapGeneratorObj = null;
    cmGraph.circleMapMode = false;

    cmGraph.svgElem = null;
    cmGraph.colorMapper = null;
    cmGraph.force = null;

    cmGraph.setNewCircleMapGeneratorSettings = function(newSettings) {
        for (var key in newSettings) {
            cmGraph.circleMapGeneratorObj.cmgParams[key] = newSettings[key];
        }
        cmGraph.circleMapGeneratorObj.sortSamples();
    };

    cmGraph.build = function(config) {
        // graph data
        var graphDataObj = new graphData.graphData();
        if (config.hasOwnProperty("medbookGraphData")) {
            var medbookGraphData = config["medbookGraphData"];
            graphDataObj.readMedbookGraphData(medbookGraphData);
        } else if (config.hasOwnProperty("sifGraphData")) {
            var sifGraphData = config["sifGraphData"];
            graphDataObj.readSif(sifGraphData);
        }

        // event data
        var eventAlbum;
        if (utils.hasOwnProperty(config, "eventAlbum")) {
            eventAlbum = config["eventAlbum"];
        } else {
            eventAlbum = new eventData.OD_eventAlbum();
        }

        // ring ordering
        var ringsList;
        if (utils.hasOwnProperty(config, "ringsList")) {
            ringsList = config["ringsList"];
        } else {
            ringsList = [];
        }

        // node center scores is a dict of nodeName:score
        var centerScores;
        if (utils.hasOwnProperty(config, "centerScores")) {
            centerScores = config["centerScores"];
            console.log("centerScores", centerScores);
        } else {
            centerScores = {};
        }

        // expression data
        if (utils.hasOwnProperty(config, "medbookExprData")) {
            medbookDataLoader.mongoExpressionData(config["medbookExprData"], eventAlbum);
            ringsList.push("expression data");
        }

        // medbookViperSignaturesData
        if (utils.hasOwnProperty(config, "medbookViperSignaturesData")) {
            var medbookViperSignaturesData = config["medbookViperSignaturesData"];
            // console.log("medbookViperSignaturesData", medbookViperSignaturesData);
            medbookDataLoader.mongoViperSignaturesData(medbookViperSignaturesData, eventAlbum);
            ringsList.push("viper data");
        }

        // new circle map generator
        var cmg = new circleMapGenerator.circleMapGenerator(eventAlbum, {
            // "ringsList" : ["core_subtype", "expression data", 'viper data'],
            // "orderFeature" : ["expression data"]
            "ringsList" : ringsList,
            "centerScores" : centerScores
        });

        var circleDataLoaded;
        if (ringsList.length < 1) {
            circleDataLoaded = false;
        } else {
            circleDataLoaded = config["circleDataLoaded"];
        }

        cmGraph.buildCircleMapGraph(config["containerDiv"], graphDataObj, cmg, circleDataLoaded);
    };

    /**
     * One method call to build the graph
     */
    cmGraph.buildCircleMapGraph = function(containerDivElem, graphDataObj, circleMapGeneratorObj, circleMapMode) {
        // set object properties
        cmGraph.containerDivElem = containerDivElem;
        cmGraph.graphDataObj = graphDataObj;
        cmGraph.circleMapGeneratorObj = circleMapGeneratorObj;
        cmGraph.circleMapMode = circleMapMode;

        cmGraph.setup();

        // render graph
        var svg = cmGraph.svgElem;
        var force = cmGraph.force;
        var graph = cmGraph.graphDataObj;
        var cmg = cmGraph.circleMapGeneratorObj;
        var circleDataLoaded = cmGraph.circleMapMode;
        cmGraph.renderGraph(svg, force, graph, cmg, circleDataLoaded);
    };

    /**
     * Initialization steps
     */
    cmGraph.setup = function() {
        // context menu
        // uses medialize's jQuery-contextMenu
        $.contextMenu({
            selector : ".circleMapRingG",
            trigger : 'right',
            // trigger : 'left',
            callback : function(key, options) {
                // default callback
                var elem = this[0];
                console.log('elem', elem);
            },
            build : function($trigger, contextmenuEvent) {
                console.log("context menu for circleMapRingG");
                var circleMapRingGelem = utils.extractFromJq($trigger);
                var circleMapGelem = circleMapRingGelem.parentNode;
                var node = circleMapGelem.getAttribute("feature");
                var datasetName = circleMapRingGelem.getAttribute("ringName");
                var items = {
                    'title' : {
                        name : function() {
                            return "ring: " + datasetName + " for " + node;
                        },
                        icon : null,
                        disabled : true
                        // ,
                        // callback : function(key, opt) {
                        // }
                    },
                    "sep1" : "---------",
                    "sort_samples" : {
                        name : function() {
                            return "sort samples by this ring";
                        },
                        icon : null,
                        disabled : false,
                        callback : function(key, opt) {
                            // clear circlemaps
                            cmGraph.clearCircleMaps();

                            // Sorting is performed via eventAlbum.multisortSamples().
                            // It uses sortingStep objects to specify the events on which to base the sort.

                            // Using something like "SUZ12" and "expression data" sort by SUZ12_mRNA event.

                            // set sorting ring
                            var orderFeature = cmGraph.circleMapGeneratorObj.eventAlbum.getSuffixedEventId(node, datasetName);

                            // if no suffix added, then use datatype as orderFeature (e.g. a categorical clinical feature)
                            orderFeature = (orderFeature === node) ? datasetName : orderFeature;
                            cmGraph.setNewCircleMapGeneratorSettings({
                                "orderFeature" : orderFeature,
                                "sortingRing" : [datasetName]
                            });

                            // attach new circlemaps
                            cmGraph.attachCircleMaps();
                        }
                    }
                };
                return {
                    'items' : items
                };
            }
        });

        $.contextMenu({
            selector : ".node",
            trigger : 'right',
            // trigger : 'left',
            callback : function(key, options) {
                // default callback
                var elem = this[0];
                console.log('elem', elem);
            },
            build : function($trigger, contextmenuEvent) {
                console.log("context menu for node");
                var circleMapSvgElem = utils.extractFromJq($trigger).getElementsByTagName("svg")[0];
                var nodeName = circleMapSvgElem.getAttribute("name");
                var nodeType = circleMapSvgElem.getAttribute("nodeType");
                var items = {
                    'title' : {
                        name : function() {
                            return nodeType + ": " + nodeName;
                        },
                        icon : null,
                        disabled : function(key, opt) {
                            var disabled = (nodeType === "protein") ? false : true;
                            return disabled;
                        },
                        callback : function(key, opt) {
                            // TODO link-out to PatientCare geneReport
                            console.log("nodeName", nodeName);
                            window.open("/PatientCare/geneReport/" + nodeName, "_parent");
                        }
                    },
                    "sep1" : "---------",
                    "toggle_size" : {
                        name : function() {
                            return "toggle node size";
                        },
                        icon : null,
                        disabled : false,
                        callback : function(key, opt) {
                            if (cmGraph.circleMapMode) {
                                // var circleMapSvgElem = document.getElementById('circleMapSvg' + d['name']);
                                var circleMapGElement = circleMapSvgElem.getElementsByClassName("circleMapG")[0];
                                var d3circleMapGElement = d3.select(circleMapGElement);
                                var zoomed = d3circleMapGElement.attr("zoomed");
                                var newScale;
                                if (_.isNull(zoomed) || zoomed === "false") {
                                    newScale = cmGraph.largeScale;
                                    d3circleMapGElement.attr("zoomed", "true");
                                } else {
                                    newScale = cmGraph.smallScale;
                                    d3circleMapGElement.attr("zoomed", "false");
                                }
                                d3circleMapGElement.transition().duration(300).attr('transform', newScale);
                            }
                        }
                    },
                    "pin_fold" : {
                        name : "pinning",
                        items : {
                            'toggle_pin' : {
                                name : function() {
                                    return "toggle pin this node";
                                },
                                icon : null,
                                disabled : false,
                                callback : function(key, opt) {
                                    d3.select(utils.extractFromJq($trigger)).each(function(d, i) {
                                        d.fixed = !d.fixed;
                                    });
                                }
                            },
                            'pin_all' : {
                                name : "pin all nodes",
                                icon : null,
                                disabled : false,
                                callback : function(key, opt) {
                                    d3.selectAll(".node").each(function(d, i) {
                                        d.fixed = true;
                                    });
                                    cmGraph.force.stop();
                                }
                            },
                            'free_all' : {
                                name : "unpin all nodes",
                                icon : null,
                                disabled : false,
                                callback : function(key, opt) {
                                    d3.selectAll(".node").each(function(d, i) {
                                        d.fixed = false;
                                    });
                                    cmGraph.force.start();
                                }
                            },
                            "neighbors_test" : {
                                name : "unpin neighbors",
                                icon : null,
                                disabled : false,
                                callback : function(key, opt) {
                                    var nodeDataObjs = cmGraph.graphDataObj.getNeighbors(nodeName, 1);
                                    for (var i = 0, length = nodeDataObjs.length; i < length; i++) {
                                        nodeDataObjs[i].fixed = false;
                                    }
                                }
                            }
                        }
                    },

                    'toggle_opacity' : {
                        name : "toggle opacity",
                        icon : null,
                        disabled : false,
                        callback : function(key, opt) {
                            var circleMapGElement = circleMapSvgElem.getElementsByClassName("circleMapG")[0];
                            var d3circleMapGElement = d3.select(circleMapGElement);

                            var isTransparent = d3circleMapGElement.attr("isTransparent");
                            var newOpacity;
                            if (_.isNull(isTransparent) || isTransparent === "false") {
                                if (_.isNull(isTransparent)) {
                                    d3circleMapGElement.attr("opacity", 1);
                                }
                                newOpacity = 0.3;
                                d3circleMapGElement.attr("isTransparent", "true");
                            } else {
                                newOpacity = 1;
                                d3circleMapGElement.attr("isTransparent", "false");
                            }
                            d3circleMapGElement.transition().duration(500).attr("opacity", newOpacity);
                        }
                    }
                };
                return {
                    'items' : items
                };
            }
        });

        // clear container div element
        utils.removeChildElems(cmGraph.containerDivElem);

        // outer SVG element
        var windowWidth = window.innerWidth;
        var windowHeight = window.innerHeight;

        cmGraph.svgElem = d3.select(cmGraph.containerDivElem).append("svg").attr({
            // TODO need to get better dimensions
            'width' : windowWidth,
            'height' : windowHeight,
            'id' : 'circleMaps'
        });

        // styling the outer svg element
        cmGraph.svgElem.style({
            "font-family" : "Verdana",
            "background-color" : "#FFF",
            "-webkit-user-select" : "none",
            "-moz-user-select" : "none",
            "-ms-user-select" : "none",
            "-o-user-select" : "none",
            "user-select" : "none"
        });

        // http://www.w3.org/TR/SVG/painting.html#MarkerElement
        var defsElem = cmGraph.svgElem.append('defs');
        cmGraph.addMarkerDefs(defsElem);

        cmGraph.svgElem.append('g').attr({
            id : 'linkLayer'
        });
        cmGraph.svgElem.append('g').attr({
            id : 'nodeLayer'
        });

        // for d3 color mapping.
        cmGraph.colorMapper = d3.scale.category10();
        // preset color mapping for paradigm relations
        var paradigmRelations = ["-t|", "-t>", "-a|", "-a>", "component>", "member>"];
        _.each(paradigmRelations, function(relation) {
            cmGraph.colorMapper(relation);
        });

        // for d3 layout and rendering
        // cmGraph.force = d3.layout.force().size([windowWidth, windowHeight]).linkDistance(d3_config['linkDistance']).linkStrength(d3_config['linkStrength']).friction(d3_config['friction']).gravity(d3_config['gravity']);

        // using cola layout package with d3 adapter
        // var d3cola = cola.d3adaptor().linkDistance(30).size([width, height]);
        cmGraph.force = cola.d3adaptor().linkDistance(d3_config['linkDistance']).size([windowWidth, windowHeight]);

        // add legend node
        cmGraph.graphDataObj.addNode({
            "name" : "legend",
            "group" : "legend",
            // to set starting position, set fixed to true and provide (x,y)
            "fixed" : true,
            "x" : 50,
            "y" : 50
        });

        var legendG = document.createElementNS(utils.svgNamespaceUri, 'g');
        utils.setElemAttributes(legendG, {
            "id" : "legendG"
        });

        cmGraph.svgElem.append(function() {
            return legendG;
        });

        var d3LegendG = d3.select(legendG);

        var legendBackground = d3LegendG.append("rect").attr({
            "id" : "legendBackground"
            // ,
            // "width" : 20,
            // "height" : 20
        }).style({
            "stroke-width" : 0.5,
            "stroke" : "black",
            "fill" : "white"
        });

        var relations = cmGraph.graphDataObj.getRelations();
        _.each(relations, function(relation, index) {
            var y = 10 + 25 * index;
            var x = 0;
            var length = 75;
            var lineElem = d3LegendG.append("line").attr({
                "x1" : x,
                "y1" : y,
                "x2" : x + length,
                "y2" : y
            });
            var decorations = cmGraph.getLinkDecorations(relation, 3);
            lineElem.style(decorations);

            var textElem = d3LegendG.append("text").attr({
                "x" : x + length,
                "y" : y,
                "dx" : "1em",
                "dy" : "0.3em",
                "text-anchor" : "start"
            }).style({
                "stroke" : "darkslategrey",
                "fill" : "darkslategrey",
                "overflow" : "visible"
            }).text(function() {
                var displayNames = {
                    "-t|" : "inhibit transcription",
                    "-t>" : "activate transcription",
                    "-a|" : "inhibit activity",
                    "-a>" : "activate activity",
                    "component>" : "component",
                    "member>" : "member"
                };
                var displayName = displayNames[relation];
                if (_.isUndefined(displayName)) {
                    return relation;
                } else {
                    return displayName;
                }
            });
        });

        // set dimensions
        // element must be attached to the document to get brect
        var brect = legendG.getBoundingClientRect();
        legendBackground.attr({
            "width" : brect.width,
            "height" : brect.height
        });

        // dragging
        var drag = d3.behavior.drag();
        d3LegendG.call(drag);

        drag.origin(function() {
            // d3.event.sourceEvent.preventDefault();
            // d3.event.sourceEvent.stopPropagation();
            var d3Mouse = d3.mouse(cmGraph.svgElem.node());
            var origin = {
                "x" : d3Mouse[0],
                "y" : d3Mouse[1]
            };
            return origin;
        });

        drag.on("drag", function() {
            d3.event.sourceEvent.preventDefault();
            d3.event.sourceEvent.stopPropagation();
            var d3Mouse = d3.mouse(cmGraph.svgElem.node());
            var x = d3Mouse[0];
            var y = d3Mouse[1];
            d3LegendG.attr({
                "transform" : "translate(" + x + "," + y + ")"
            });
        });
    };

    // addMarkerDefs
    // SVG 2 may allow setting fill="context-stroke" to match parent element
    // https://svgwg.org/svg2-draft/painting.html#VertexMarkerProperties
    cmGraph.addMarkerDefs = function(d3svgDefsElem) {
        var offset = 34;

        var marker = d3svgDefsElem.append("marker").attr({
            id : "Triangle",
            viewBox : "0 0 10 10",
            refX : 10 + offset,
            refY : "5",
            // markerUnits : "strokeWidth",
            markerUnits : "userSpaceOnUse",
            markerWidth : "9",
            markerHeight : "9",
            orient : "auto"
        });
        marker.append("path").attr({
            d : "M 0 0 L 10 5 L 0 10 z"
        });

        marker = d3svgDefsElem.append("marker").attr({
            id : "Bar",
            viewBox : "0 0 10 10",
            refX : 3 + offset,
            refY : "5",
            // markerUnits : "strokeWidth",
            markerUnits : "userSpaceOnUse",
            markerWidth : "9",
            markerHeight : "9",
            orient : "auto"
        });
        marker.append("path").attr({
            d : "M 0 0 L 0 10 L 3 10 L 3 0 z"
        });

        marker = d3svgDefsElem.append("marker").attr({
            id : "Circle",
            viewBox : "0 0 10 10",
            refX : 10 + offset,
            refY : "5",
            // markerUnits : "strokeWidth",
            markerUnits : "userSpaceOnUse",
            markerWidth : "9",
            markerHeight : "9",
            orient : "auto"
        });
        marker.append("circle").attr({
            cx : 5,
            cy : 5,
            r : 5
        });
    };

    /**
     *Draw circleMap SVGs and attach to the node layer.
     */
    cmGraph.drawCircleMaps = function(nodeNames, d3SvgNodeLayer, radius, additionalInteraction) {
        for (var i in nodeNames) {
            var feature = nodeNames[i];
            var circleMapElement = cmGraph.circleMapGeneratorObj.drawCircleMap(feature, d3SvgNodeLayer, radius, additionalInteraction);
        }
    };

    /**
     * Remove all circleMap SVG group elements.
     */
    cmGraph.clearCircleMaps = function() {
        d3.select('#nodeLayer').selectAll('.circleMapG').remove();
    };

    cmGraph.attachCircleMaps = function() {
        var svgNodeLayer = d3.select('#nodeLayer');
        var radius = 100;
        var interactive = true;
        var circleMapSvgSelection = svgNodeLayer.selectAll(".node").selectAll(".circleMapSvg");
        circleMapSvgSelection.each(function(d, i) {
            var feature = d.name;
            var svgGElem = cmGraph.circleMapGeneratorObj.generateCircleMapSvgGElemWrapper(feature, radius, interactive);
            svgGElem.setAttributeNS(null, 'transform', cmGraph.smallScale);
            this.appendChild(svgGElem);
        });
    };

    /**
     * Get style properties for use as link decorations.
     * @param {Object} relationType
     */
    cmGraph.getLinkDecorations = function(relationType, value) {
        var styles = {};
        // marker-end
        if (utils.beginsWith(relationType, "-") && utils.endsWith(relationType, ">")) {
            styles["marker-end"] = "url(#Triangle)";
        } else if (utils.beginsWith(relationType, "-") && utils.endsWith(relationType, "|")) {
            styles["marker-end"] = "url(#Bar)";
        } else if (utils.beginsWith(relationType, "component") && utils.endsWith(relationType, ">")) {
            styles["marker-end"] = "url(#Circle)";
        }
        // stroke-dasharray
        if (utils.beginsWith(relationType, "-a")) {
            styles["stroke-dasharray"] = "6,3";
        }

        styles["stroke"] = cmGraph.colorMapper(relationType);
        styles["stroke-width"] = (value);
        styles["stroke-opacity"] = 0.6;

        return styles;
    };

    // requires svg, force, graph, cmg, circleDataLoaded, and various constants
    cmGraph.renderGraph = function(svg, force, graph, cmg, circleDataLoaded) {

        // clear the current graph
        var removedLinks = svg.selectAll(".link").remove();
        var removedNodes = svg.selectAll(".node").remove();

        if (graph.nodes.length < 1) {
            return;
        }

        // reset circleMapSvg class elements by creating circleMap elements for each query feature.
        var svgNodeLayer = svg.select('#nodeLayer');
        var nodeNames = graph.getAllNodeNames();
        if (circleDataLoaded) {
            cmGraph.drawCircleMaps(nodeNames, svgNodeLayer, 100, true);
        }

        // links
        var svgLinkLayer = svg.select('#linkLayer');
        var linkSelection = svgLinkLayer.selectAll(".link").data(graph.links).enter().append("line").attr('id', function(d, i) {
            return 'link' + i;
        }).attr({
            'class' : "link"
        }).style("stroke", function(d) {
            return cmGraph.colorMapper(d.relation);
        }).style("stroke-opacity", ".6");

        // initial setting of decoration styles
        linkSelection.style('marker-end', function(d, i) {
            var type = d.relation;
            if (type === "component>") {
                return "url(#Circle)";
            } else if (utils.beginsWith(type, "-") && utils.endsWith(type, ">")) {
                return "url(#Triangle)";
            } else if (utils.beginsWith(type, "-") && utils.endsWith(type, "|")) {
                return "url(#Bar)";
            } else {
                return null;
            }
        });

        linkSelection.style("stroke-width", function(d) {
            return d.value;
        });

        // http://www.w3.org/TR/SVG/painting.html#StrokeProperties
        linkSelection.style("stroke-dasharray", function(d, i) {
            var type = d.relation;
            if (utils.beginsWith(type, "-a")) {
                return "6,3";
            } else {
                return null;
            }
        });

        // mouse events for links - thicken on mouseover
        linkSelection.on('mouseover', function(d, i) {
            // mouseover event for link
            var linkElement = document.getElementById('link' + i);
            var decorations = cmGraph.getLinkDecorations(d.relation, d.value * 3);
            var styleString = "";

            for (var key in decorations) {
                var val = decorations[key];
                styleString = styleString + ";" + key + ":" + val;
            }

            linkElement.setAttributeNS(null, 'style', styleString);
        }).on('mouseout', function(d, i) {
            // mouseout event for link
            var linkElement = document.getElementById('link' + i);
            var decorations = cmGraph.getLinkDecorations(d.relation, d.value);
            var styleString = "";

            for (var key in decorations) {
                var val = decorations[key];
                styleString = styleString + ";" + key + ":" + val;
            }

            linkElement.setAttributeNS(null, 'style', styleString);
        });

        // nodes
        var nodeSelection = svgNodeLayer.selectAll(".node").data(graph.nodes).enter().append("g").attr('class', function(d, i) {
            return "node " + d.name + ' ' + d.group;
        });

        if (circleDataLoaded) {
            // mouse events for circleMap nodes
            nodeSelection.each(function(d) {
                // add attribute to the node data
                var circleMapSvgElement = document.getElementById('circleMapSvg' + d['name']);
                circleMapSvgElement.setAttributeNS(null, "nodeType", d.group);
                var circleMapGElement = circleMapSvgElement.getElementsByClassName("circleMapG");
                circleMapGElement[0].setAttributeNS(null, 'transform', cmGraph.smallScale);
            }).on('mouseover', function(d, i) {
                // mouseover event for node

                // pull node to front
                var circleMapSvgElement = document.getElementById('circleMapSvg' + d['name']);
                var nodeGelem = circleMapSvgElement.parentNode;
                utils.pullElemToFront(nodeGelem);
            });
        } else {
            // mouse events for sbgn nodes
            nodeSelection.on('mouseover', function(d, i) {
                // mouseover event for node
                var nodeElement = document.getElementsByClassName("node " + d.name + ' ' + d.group);
                var nodeSbgnElement = nodeElement[0].getElementsByClassName('sbgn');
                nodeSbgnElement[0].setAttributeNS(null, 'style', 'stroke-width:4;fill:' + cmGraph.colorMapper(d.group));
            }).on('mouseout', function(d, i) {
                // mouseout event for node
                var nodeElement = document.getElementsByClassName("node " + d.name + ' ' + d.group);
                var nodeSbgnElement = nodeElement[0].getElementsByClassName('sbgn');
                nodeSbgnElement[0].setAttributeNS(null, 'style', 'stroke-width:1;fill:' + cmGraph.colorMapper(d.group));
            });
        }
        nodeSelection.call(force.drag);

        // node visualization
        var opacityVal = 0.6;
        nodeSelection.append(function(d) {
            var nodeName = d['name'];
            if (d.group === undefined) {
                console.log("d", d);
            }
            var type = d.group.toString().toLowerCase();
            if ((circleDataLoaded ) && (nodeNames.indexOf(nodeName) >= 0)) {
                // circleMap
                var stagedElement = document.getElementById('circleMapSvg' + nodeName);
                return stagedElement;
            } else if (sbgn_config['nucleicAcidFeatureTypes'].indexOf(type) != -1) {
                var newElement = document.createElementNS(svgNamespaceUri, 'path');
                newElement.setAttributeNS(null, 'class', 'sbgn');
                var path = utils.bottomRoundedRectSvgPath(-20, -15, 40, 30, 10);
                newElement.setAttributeNS(null, 'd', path);
                newElement.setAttributeNS(null, 'opacity', opacityVal);
                newElement.setAttributeNS(null, 'stroke', 'black');
                return newElement;
            } else if (sbgn_config['macromoleculeTypes'].indexOf(type) != -1) {
                var newElement = document.createElementNS(svgNamespaceUri, 'path');
                newElement.setAttributeNS(null, 'class', 'sbgn');
                var path = utils.allRoundedRectSvgPath(-20, -15, 40, 30, 10);
                newElement.setAttributeNS(null, 'd', path);
                newElement.setAttributeNS(null, 'opacity', opacityVal);
                newElement.setAttributeNS(null, 'stroke', 'black');
                return newElement;
            } else if (sbgn_config['simpleChemicalTypes'].indexOf(type) != -1) {
                // circle
                var newElement = document.createElementNS(svgNamespaceUri, 'circle');
                newElement.setAttributeNS(null, 'class', 'sbgn');
                newElement.setAttributeNS(null, 'r', nodeRadius);
                newElement.setAttributeNS(null, 'opacity', opacityVal);
                newElement.setAttributeNS(null, 'stroke', 'black');
                return newElement;
            } else if (sbgn_config['complexTypes'].indexOf(type) != -1) {
                var newElement = document.createElementNS(svgNamespaceUri, 'path');
                newElement.setAttributeNS(null, 'class', 'sbgn');
                var path = utils.allAngledRectSvgPath(-50, -30, 100, 60);
                newElement.setAttributeNS(null, 'd', path);
                newElement.setAttributeNS(null, 'opacity', opacityVal);
                newElement.setAttributeNS(null, 'stroke', 'black');
                return newElement;
            } else {
                // unspecified entity
                var newElement = document.createElementNS(svgNamespaceUri, 'ellipse');
                newElement.setAttributeNS(null, 'class', 'sbgn');
                newElement.setAttributeNS(null, 'cx', 0);
                newElement.setAttributeNS(null, 'cy', 0);
                newElement.setAttributeNS(null, 'rx', 1.5 * d3_config['nodeRadius']);
                newElement.setAttributeNS(null, 'ry', 0.75 * d3_config['nodeRadius']);
                newElement.setAttributeNS(null, 'opacity', opacityVal);
                newElement.setAttributeNS(null, 'stroke', 'black');
                return newElement;
            }
        }).style("fill", function(d) {
            return cmGraph.colorMapper(d.group);
        }).style("overflow", "visible");

        // node labels
        // var textdy = "2.7em";
        var textdy = "3em";
        nodeSelection.append("svg:text").attr("text-anchor", "middle").attr('dy', textdy).text(function(d) {
            return d.name;
        }).style({
            "stroke" : "darkslategrey",
            "fill" : "darkslategrey"
        });

        // edge tooltips
        linkSelection.append("title").text(function(d) {
            var sourceNode = cmGraph.graphDataObj.nodes[d.source];
            var targetNode = cmGraph.graphDataObj.nodes[d.target];
            var label = sourceNode.name + " " + d.relation + " " + targetNode.name;
            return label;
        });

        // tick handler repositions graph elements
        force.on("tick", function() {
            var maxAlpha = 0.03;

            // position limits
            var offset = 20;

            var minX = 0 + offset;
            var minY = 0 + offset;

            var maxX = parseFloat(cmGraph.svgElem.attr("width")) - offset;
            var maxY = parseFloat(cmGraph.svgElem.attr("height")) - offset;

            nodeSelection.attr("transform", function(d) {
                d.x = utils.rangeLimit(d.x, minX, maxX);
                d.y = utils.rangeLimit(d.y, minY, maxY);
                return 'translate(' + d.x + ',' + d.y + ')';
            });

            linkSelection.attr("x1", function(d) {
                return d.source.x;
            }).attr("y1", function(d) {
                return d.source.y;
            }).attr("x2", function(d) {
                return d.target.x;
            }).attr("y2", function(d) {
                return d.target.y;
            });

            // don't run the layout indefinitely
            // if (force.alpha() < maxAlpha) {
            // console.log("stop layout with alpha=" + force.alpha());
            //
            // d3.selectAll(".node").each(function(d, i) {
            // d.fixed = true;
            // });
            //
            // force.stop();
            // }
        });

        // set the nodes and links
        force.nodes(graph.nodes).links(graph.links);

        // start the layout
        force.start();
    };

})(circleMapGraph);
