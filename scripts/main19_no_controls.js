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

var circleMapGraph = circleMapGraph || {};
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

    cmGraph.containerDivElem = null;
    cmGraph.graphDataObj = null;
    cmGraph.circleMapGeneratorObj = null;
    cmGraph.circleMapMode = false;

    cmGraph.svgElem = null;
    cmGraph.colorMapper = null;
    cmGraph.force = null;

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
                var items = {
                    'title' : {
                        name : function() {
                            return "node: " + nodeName;
                        },
                        icon : null,
                        disabled : false
                        // ,
                        // callback : function(key, opt) {
                        // }
                    },
                    "sep1" : "---------",
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
        var windowHeight = 0.8 * window.innerHeight;

        cmGraph.svgElem = d3.select(cmGraph.containerDivElem).append("svg").attr({
            'width' : windowWidth,
            'height' : windowHeight,
            'id' : 'circleMaps'
        });
        cmGraph.svgElem.append('g').attr({
            id : 'linkLayer'
        });
        cmGraph.svgElem.append('g').attr({
            id : 'nodeLayer'
        });

        // for d3 color mapping.
        cmGraph.colorMapper = d3.scale.category20();

        // for d3 layout and rendering
        cmGraph.force = d3.layout.force().size([windowWidth, windowHeight]).linkDistance(d3_config['linkDistance']).linkStrength(d3_config['linkStrength']).friction(d3_config['friction']).gravity(d3_config['gravity']);
    };

    // requires svg, force, graph, cmg, circleDataLoaded, and various constants
    cmGraph.renderGraph = function(svg, force, graph, cmg, circleDataLoaded) {"use strict";

        var largeScale = 'scale(2)';
        var smallScale = 'scale(0.2)';

        // var largeScale = 'scale(1)';
        // var smallScale = 'scale(1)';

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
            for (var i in nodeNames) {
                var feature = nodeNames[i];
                var circleMapElement = cmg.drawCircleMap(feature, svgNodeLayer);
            }
        }

        // links
        // TODO add markers here?
        var svgLinkLayer = svg.select('#linkLayer');
        var linkSelection = svgLinkLayer.selectAll(".link").data(graph.links).enter().append("line").attr('id', function(d, i) {
            return 'link' + i;
        }).attr({
            'class' : "link"
        }).style("stroke", function(d) {
            return cmGraph.colorMapper(d.relation);
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
            linkElement.setAttributeNS(null, 'style', 'stroke-width:' + (d.value * 3) + ' ; stroke:' + cmGraph.colorMapper(d.relation));
        }).on('mouseout', function(d, i) {
            // mouseout event for link
            var linkElement = document.getElementById('link' + i);
            linkElement.setAttributeNS(null, 'style', 'stroke-width:' + d.value + ' ; stroke:' + cmGraph.colorMapper(d.relation));
        });

        // context menu for link
        // linkSelection.on("contextmenu", function(d, i) {
        // var position = d3.mouse(this);
        // var linkDesc = d.source.name + ' ' + d.relation + ' ' + d.target.name;
        // console.log('right click on link: ' + linkDesc + '(' + i + ')');
        //
        // d3.event.preventDefault();
        // d3.event.stopPropagation();
        // });

        // link click
        // linkSelection.on("click", function(d, i) {
        // var position = d3.mouse(this);
        // var linkDesc = d.source.name + ' ' + d.relation + ' ' + d.target.name;
        // console.log('left click on link: ' + linkDesc + '(' + i + ')');
        //
        // d3.event.preventDefault();
        // d3.event.stopPropagation();
        // });

        // nodes
        var nodeSelection = svgNodeLayer.selectAll(".node").data(graph.nodes).enter().append("g").attr('class', function(d, i) {
            return "node " + d.name + ' ' + d.group;
        });

        if (circleDataLoaded) {
            // mouse events for circleMap nodes
            nodeSelection.each(function(d) {
                // add attribute to the node data
                var circleMapSvgElement = document.getElementById('circleMapSvg' + d['name']);
                var circleMapGElement = circleMapSvgElement.getElementsByClassName("circleMapG");
                circleMapGElement[0].setAttributeNS(null, 'transform', smallScale);
                // }).on('mouseover', function(d, i) {
                // // mouseover event for node
                // var circleMapSvgElement = document.getElementById('circleMapSvg' + d['name']);
                // var circleMapGElement = circleMapSvgElement.getElementsByClassName("circleMapG");
                // circleMapGElement[0].setAttributeNS(null, 'transform', largeScale);
                // }).on('mouseout', function(d, i) {
                // // mouseout event for node
                // var circleMapSvgElement = document.getElementById('circleMapSvg' + d['name']);
                // var circleMapGElement = circleMapSvgElement.getElementsByClassName("circleMapG");
                // circleMapGElement[0].setAttributeNS(null, 'transform', smallScale);
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

        // context menu for node
        // nodeSelection.on("contextmenu", function(d, i) {
        // var position = d3.mouse(this);
        // console.log('right click on node: ' + d.name + '(' + i + ')');
        //
        // d3.event.preventDefault();
        // d3.event.stopPropagation();
        // });

        // node click
        nodeSelection.on("click", function(d, i) {
            var position = d3.mouse(this);
            console.log('left click on node: ' + d.name + '(' + i + ')', d);

            if (circleDataLoaded) {
                var circleMapSvgElement = document.getElementById('circleMapSvg' + d['name']);
                var circleMapGElement = circleMapSvgElement.getElementsByClassName("circleMapG");
                var scale = circleMapGElement[0].getAttribute("transform");
                if (scale === smallScale) {
                    circleMapGElement[0].setAttributeNS(null, 'transform', largeScale);
                } else {
                    circleMapGElement[0].setAttributeNS(null, 'transform', smallScale);
                }
            }

            d3.event.preventDefault();
            d3.event.stopPropagation();
        });

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
                var path = bottomRoundedRectSvgPath(-20, -15, 40, 30, 10);
                newElement.setAttributeNS(null, 'd', path);
                newElement.setAttributeNS(null, 'opacity', opacityVal);
                newElement.setAttributeNS(null, 'stroke', 'black');
                return newElement;
            } else if (sbgn_config['macromoleculeTypes'].indexOf(type) != -1) {
                var newElement = document.createElementNS(svgNamespaceUri, 'path');
                newElement.setAttributeNS(null, 'class', 'sbgn');
                var path = allRoundedRectSvgPath(-20, -15, 40, 30, 10);
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
                var path = allAngledRectSvgPath(-50, -30, 100, 60);
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
        nodeSelection.append("svg:text").attr("text-anchor", "middle").attr('dy', "2.35em").text(function(d) {
            return d.name;
        });

        // edge tooltips
        linkSelection.append("title").text(function(d) {
            var label = d.source.name + " " + d.relation + " " + d.target.name;
            return label;
        });

        // node tooltips
        nodeSelection.append("title").text(function(d) {
            return d.name + ' : ' + d.group;
        });

        // tick handler repositions graph elements
        force.on("tick", function() {
            var maxAlpha = 0.05;

            linkSelection.attr("x1", function(d) {
                return d.source.x;
            }).attr("y1", function(d) {
                return d.source.y;
            }).attr("x2", function(d) {
                return d.target.x;
            }).attr("y2", function(d) {
                return d.target.y;
            });

            nodeSelection.attr("transform", function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            });

            // don't run the layout indefinitely
            if (force.alpha() < maxAlpha) {
                console.log("stop layout with alpha=" + force.alpha());
                force.stop();
            }
        });

        // set the nodes and links
        force.nodes(graph.nodes).links(graph.links);

        // start the layout
        force.start();
    };

})(circleMapGraph);
