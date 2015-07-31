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
        var medbookGraphData = config["medbookGraphData"];
        var graphDataObj = new graphData.graphData();
        graphDataObj.readMedbookGraphData(medbookGraphData);

        // event data
        var eventAlbum = new eventData.OD_eventAlbum();

        // clnical data
        // medbookDataLoader.getClinicalData('data/subtype.tab', eventAlbum);

        // medbookDataLoader.getExpressionData('data/expression.tab', eventAlbum);
        // medbookDataLoader.getViperData('data/viper.tab', eventAlbum);

        var ringsList = [];

        // expression data
        if (utils.hasOwnProperty(config, "medbookExprData")) {
            medbookDataLoader.mongoExpressionData(config["medbookExprData"], eventAlbum);
            // eventAlbum.eventwiseMedianRescaling();
            // eventAlbum.samplewiseMedianRescaling();
            ringsList.push("expression data");
        }

        // circle map generator
        var cmg = new circleMapGenerator.circleMapGenerator(eventAlbum, {
            // "ringsList" : ["core_subtype", "expression data", 'viper data'],
            // "orderFeature" : ["expression data"]
            "ringsList" : ringsList
        });

        cmGraph.buildCircleMapGraph(config["containerDiv"], graphDataObj, cmg, config["circleDataLoaded"]);
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
            callback : function(key, options) {
                // default callback
                var elem = this[0];
                console.log('elem', elem);
            },
            build : function($trigger, contextmenuEvent) {
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
            callback : function(key, options) {
                // default callback
                var elem = this[0];
                console.log('elem', elem);
            },
            build : function($trigger, contextmenuEvent) {
                var circleMapSvgElem = utils.extractFromJq($trigger).getElementsByTagName("svg")[0];
                var nodeName = circleMapSvgElem.getAttribute("name");
                var nodeType = circleMapSvgElem.getAttribute("nodeType");
                var items = {
                    'title' : {
                        name : function() {
                            return nodeType + ": " + nodeName;
                        },
                        icon : null,
                        disabled : false
                        // ,
                        // callback : function(key, opt) {
                        // }
                    },
                    "sep1" : "---------",
                    "toggle_size" : {
                        name : function() {
                            return "toggle node size";
                        },
                        icon : null,
                        disabled : false,
                        callback : function(key, opt) {
                            if (circleDataLoaded) {
                                // var circleMapSvgElem = document.getElementById('circleMapSvg' + d['name']);
                                var circleMapGElement = circleMapSvgElem.getElementsByClassName("circleMapG");
                                var scale = circleMapGElement[0].getAttribute("transform");
                                if (scale === cmGraph.smallScale) {
                                    circleMapGElement[0].setAttributeNS(null, 'transform', cmGraph.largeScale);
                                } else {
                                    circleMapGElement[0].setAttributeNS(null, 'transform', cmGraph.smallScale);
                                }
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
                            var transparent = 0.3;
                            var opacity = circleMapSvgElem.getAttribute("opacity");
                            var newOpacity = (opacity == transparent) ? 1 : transparent;
                            utils.setElemAttributes(circleMapSvgElem, {
                                "opacity" : newOpacity
                            });
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
        var windowWidth = 0.8 * window.innerWidth;
        var windowHeight = 1.0 * window.innerHeight;

        cmGraph.svgElem = d3.select(cmGraph.containerDivElem).append("svg").attr({
            'width' : windowWidth,
            'height' : windowHeight,
            'id' : 'circleMaps'
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

        // for d3 layout and rendering
        cmGraph.force = d3.layout.force().size([windowWidth, windowHeight]).linkDistance(d3_config['linkDistance']).linkStrength(d3_config['linkStrength']).friction(d3_config['friction']).gravity(d3_config['gravity']);
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
            var svgGElem = cmGraph.circleMapGeneratorObj.generateCircleMapSvgGElem(feature, radius, interactive);
            svgGElem.setAttributeNS(null, 'transform', cmGraph.smallScale);
            this.appendChild(svgGElem);
        });
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
        });

        linkSelection.style('marker-end', function(d, i) {
            var type = d.relation;
            if (utils.beginsWith(type, "-") && utils.endsWith(type, ">")) {
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

        /**
         * Get style properties for use as link decorations.
         * @param {Object} relationType
         */
        var getLinkDecorations = function(relationType) {
            var styles = {};
            // marker-end
            if (utils.beginsWith(relationType, "-") && utils.endsWith(relationType, ">")) {
                styles["marker-end"] = "url(#Triangle)";
            } else if (utils.beginsWith(relationType, "-") && utils.endsWith(relationType, "|")) {
                styles["marker-end"] = "url(#Bar)";
            }
            // stroke-dasharray
            if (utils.beginsWith(relationType, "-a")) {
                styles["stroke-dasharray"] = "6,3";
            }
            return styles;
        };

        // mouse events for links - thicken on mouseover
        linkSelection.on('mouseover', function(d, i) {
            // mouseover event for link
            var linkElement = document.getElementById('link' + i);
            var decorations = getLinkDecorations(d.relation);
            var styleString = 'stroke-width:' + (d.value * 3) + ' ; stroke:' + cmGraph.colorMapper(d.relation);

            for (var key in decorations) {
                var val = decorations[key];
                styleString = styleString + ";" + key + ":" + val;
            }

            linkElement.setAttributeNS(null, 'style', styleString);
        }).on('mouseout', function(d, i) {
            // mouseout event for link
            var linkElement = document.getElementById('link' + i);
            var decorations = getLinkDecorations(d.relation);
            var styleString = 'stroke-width:' + d.value + ' ; stroke:' + cmGraph.colorMapper(d.relation);

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

                // TODO highlight connecting edges
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
        });

        // node labels
        nodeSelection.append("svg:text").attr("text-anchor", "middle").attr('dy', "2.7em").text(function(d) {
            return d.name;
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
            if (force.alpha() < maxAlpha) {
                console.log("stop layout with alpha=" + force.alpha());

                d3.selectAll(".node").each(function(d, i) {
                    d.fixed = true;
                });

                force.stop();
            }
        });

        // set the nodes and links
        force.nodes(graph.nodes).links(graph.links);

        // start the layout
        force.start();
    };

})(circleMapGraph);
