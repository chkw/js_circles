var htmlUri = 'http://www.w3.org/1999/xhtml';
var svgNamespaceUri = 'http://www.w3.org/2000/svg';
var xlinkUri = 'http://www.w3.org/1999/xlink';

var entityTypes = ['unspecified entity', 'simple chemical', 'macromolecule', 'nucleic acid feature', 'perturbing agent'];

var throbberUrl = 'images/loading_16.gif';

var svgWidth = 960, svgHeight = 500;

// circleMap data
var metaData = null;
var metaDataUrl = "data/metaDataJsonqq";

var circleData = null;
var circleDataUrl = "data/dataJson";

var query = null;
var queryUrl = "data/queryJson";

// svg element that contains the graph

var svg = d3.select("body").append("svg").attr({
    'width' : svgWidth,
    'height' : svgHeight,
    'id' : 'circleMaps'
});

// for zoom/pan
// var svg = d3.select("body").append("svg").attr({
// 'width' : svgWidth,
// 'height' : svgHeight,
// 'id' : 'circleMaps'
// }).append('g').call(d3.behavior.zoom().scaleExtent([0.2, 8]).on("zoom", zoom)).append('g');
//
// svg.append("rect").attr("class", "overlay").attr("width", svgWidth).attr("height", svgHeight);
//
// function zoom() {
// var tr = d3.event.translate;
// var scale = d3.event.scale;
// console.log('zooming\ttranslate: ' + tr + '\tscale: ' + scale);
// svg.attr("transform", "translate(" + tr + ")scale(" + scale + ")");
// }

var svgLinkLayer = svg.append('g').attr({
    id : 'linkLayer'
});
var svgNodeLayer = svg.append('g').attr({
    id : 'nodeLayer'
});

// vars for d3.layout.force
var linkDistance = 300;
var linkStrength = 0.8;
var friction = 0.6;
var charge = -500;
var nodeRadius = 20;
var graphDataURL = "data/test_pid";

// for d3 color mapping.
var color = d3.scale.category20();

// for d3 layout and rendering
var force = d3.layout.force().size([svgWidth, svgHeight]).linkDistance(linkDistance).linkStrength(linkStrength).friction(friction);

// where controls go
var form = d3.select("body").append("form");

function throbberOn() {
    svg.append('image').attr({
        id : 'throbber',
        'xlink:href' : throbberUrl,
        x : (0.5 * svgWidth),
        y : (0.5 * svgHeight),
        'width' : 16,
        'height' : 16
    });
}

function throbberOff() {
    d3.select('#throbber').remove();
}

/**
 * Check if str ends with suffix.
 * @param {Object} str
 * @param {Object} suffix
 */
function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

/**
 * get the selected values of a list box control.
 */
function getListBoxSelectedValues(listboxElement) {
    var selectedValues = new Array();
    for (var i = 0; i < listboxElement.length; i++) {
        var option = listboxElement[i];
        if (option.selected) {
            selectedValues.push(option.value);
        }
    }
    return selectedValues;
}

// circleMap data
d3.json(metaDataUrl, function(error, data) {
    var circleDataLoaded = true;
    metaData = data;
    if (metaData != null && typeof metaData === 'object') {
        console.log("number of metaData --> " + Object.keys(metaData).length);
    } else {
        circleDataLoaded = false;
        console.log("could not load data from " + metaDataUrl);
    }

    // circleMap data
    d3.json(circleDataUrl, function(error, data) {
        circleData = data;
        if (circleData != null && typeof circleData === 'object') {
            console.log("number of circleData --> " + Object.keys(circleData).length);
        } else {
            circleDataLoaded = false;
            console.log("could not load data from " + circleDataUrl);
        }

        // circleMap data
        d3.json(queryUrl, function(error, data) {
            query = data;
            if (query != null && typeof query === 'object') {
                console.log("number of query --> " + Object.keys(query).length);
            } else {
                circleDataLoaded = false;
                console.log("could not load data from " + queryUrl);
            }

            // network
            d3.text(graphDataURL, function(error, data) {
                if (error !== null) {
                    console.log("error getting graph data --> " + error);
                }

                var graph = new graphData();
                if (endsWith(graphDataURL.toUpperCase(), 'PID')) {
                    graph.readPid(data);
                } else if (endsWith(graphDataURL.toUpperCase(), 'SIF')) {
                    graph.readSif(data);
                } else {
                    graph.readTab(data);
                }
                var nodes = graph.nodes;
                var links = graph.links;

                // prepare generator for creating SVG:g elements.
                var cmg = null;
                if (circleDataLoaded) {
                    cmg = new circleMapGenerator(metaData, circleData, query);
                }

                // TODO setupLayout
                function setupLayout() {"use strict";

                    var largeScale = 'scale(2)';
                    var smallScale = 'scale(0.2)';

                    // clear the current graph
                    var removedLinks = svg.selectAll(".link").remove();
                    var removedNodes = svg.selectAll(".node").remove();

                    if (nodes.length < 1) {
                        return;
                    }

                    // reset circleMapSvg class elements by creating circleMap elements for each query feature.
                    var nodeNames = graph.getAllNodeNames();
                    if (circleDataLoaded) {
                        for (var i in nodeNames) {
                            var feature = nodeNames[i];
                            var circleMapElement = cmg.drawCircleMap(feature, svgNodeLayer);
                        }
                    }

                    // start the layout
                    force.nodes(nodes).links(links).start();

                    // links
                    var linkSelection = svgLinkLayer.selectAll(".link").data(links).enter().append("line").attr({
                        class : "link"
                    });

                    linkSelection.style("stroke-width", function(d) {
                        return d.value;
                    });

                    // nodes
                    var nodeSelection = svgNodeLayer.selectAll(".node").data(nodes).enter().append("g").attr({
                        class : "node"
                    });
                    if (circleDataLoaded) {
                        nodeSelection.each(function(d) {
                            // add attribute to the node data
                            var circleMapSvgElement = document.getElementById('circleMapSvg' + d['name']);
                            var circleMapGElement = circleMapSvgElement.getElementsByClassName("circleMapG");
                            circleMapGElement[0].setAttributeNS(null, 'transform', smallScale);
                        }).on('mouseover', function(d, i) {
                            // mouseover event for node
                            var circleMapSvgElement = document.getElementById('circleMapSvg' + d['name']);
                            var circleMapGElement = circleMapSvgElement.getElementsByClassName("circleMapG");
                            circleMapGElement[0].setAttributeNS(null, 'transform', largeScale);
                        }).on('mouseout', function(d, i) {
                            // mouseout event for node
                            var circleMapSvgElement = document.getElementById('circleMapSvg' + d['name']);
                            var circleMapGElement = circleMapSvgElement.getElementsByClassName("circleMapG");
                            circleMapGElement[0].setAttributeNS(null, 'transform', smallScale);
                        });
                    }
                    nodeSelection.call(force.drag);

                    // node visualization
                    nodeSelection.append(function(d) {
                        var nodeName = d['name'];
                        if ((circleDataLoaded ) && (nodeNames.indexOf(nodeName) >= 0)) {
                            var stagedElement = document.getElementById('circleMapSvg' + nodeName);
                            return stagedElement;
                        } else if (d.group.toUpperCase() == 'SMALLMOLECULE') {
                            var newElement = document.createElementNS(svgNamespaceUri, 'rect');
                            newElement.setAttributeNS(null, 'width', nodeRadius * 2);
                            newElement.setAttributeNS(null, 'height', nodeRadius * 2);
                            newElement.setAttributeNS(null, 'x', -1 * nodeRadius);
                            newElement.setAttributeNS(null, 'y', -1 * nodeRadius);
                            newElement.setAttributeNS(null, 'rx', 9);
                            newElement.setAttributeNS(null, 'ry', 9);
                            return newElement;
                        } else if (d.group.toUpperCase() == 'NUCLEIC ACID FEATURE') {
                            var newElement = document.createElementNS(svgNamespaceUri, 'path');
                            var path = bottomRoundedRectPath(-20, -15, 40, 30, 10);
                            newElement.setAttributeNS(null, 'd', path);
                            return newElement;
                        } else if (d.group.toUpperCase() == 'MACROMOLECULE') {
                            var newElement = document.createElementNS(svgNamespaceUri, 'path');
                            var path = allRoundedRectPath(-20, -15, 40, 30, 10);
                            newElement.setAttributeNS(null, 'd', path);
                            return newElement;
                        } else if (d.group.toUpperCase() == 'SIMPLE CHEMICAL') {
                            var newElement = document.createElementNS(svgNamespaceUri, 'circle');
                            newElement.setAttributeNS(null, 'r', nodeRadius);
                            return newElement;
                        } else if (d.group.toUpperCase() == 'COMPLEX') {
                            var newElement = document.createElementNS(svgNamespaceUri, 'path');
                            var path = allAngledRectPath(-50, -30, 100, 60);
                            newElement.setAttributeNS(null, 'd', path);
                            return newElement;
                        } else {
                            var newElement = document.createElementNS(svgNamespaceUri, 'ellipse');
                            newElement.setAttributeNS(null, 'cx', 0);
                            newElement.setAttributeNS(null, 'cy', 0);
                            newElement.setAttributeNS(null, 'rx', 1.5 * nodeRadius);
                            newElement.setAttributeNS(null, 'ry', 0.75 * nodeRadius);
                            return newElement;
                        }
                    }).style("fill", function(d) {
                        return color(d.group);
                    });

                    nodeSelection.append("svg:text").attr("text-anchor", "middle").attr('dy', ".35em").text(function(d) {
                        return d.name;
                    });

                    // tooltips
                    linkSelection.append("title").text(function(d) {
                        var label = d.source.name + "-->" + d.target.name + ":" + d.value;
                        return label;
                    });

                    nodeSelection.append("title").text(function(d) {
                        return d.name + ' : ' + d.group;
                    });

                    // tick handler repositions graph elements
                    force.on("tick", function() {
                        linkSelection.attr("x1", function(d) {
                            return d.source.x;
                        }).attr("y1", function(d) {
                            return d.source.y;
                        }).attr("x2", function(d) {
                            return d.target.x;
                        }).attr("y2", function(d) {
                            return d.target.y;
                        });

                        // nodeSelection.attr("cx", function(d) {
                        // return d.x;
                        // }).attr("cy", function(d) {
                        // return d.y;
                        // });

                        nodeSelection.attr("transform", function(d) {
                            return 'translate(' + d.x + ',' + d.y + ')';
                        });
                    });
                }

                setupLayout();

                var currentNodesListBox = form.append('select').attr({
                    id : 'currentNodesListBox',
                    name : 'currentNodesListBox'
                }).on('change', function() {
                    console.log('change');
                });

                function getSelectedNodes() {
                    return getListBoxSelectedValues(currentNodesListBox);
                }

                /**
                 *
                 * @param {Object} currentGraphData
                 */
                function updateCurrentNodesListBox(currentGraphData) {
                    var currentNodesListBox = document.getElementById('currentNodesListBox');

                    // clear options starting from the bottom of the listbox
                    var optionElements = currentNodesListBox.getElementsByTagName('option');
                    for (var i = optionElements.length - 1; optionElements.length > 0; i--) {
                        var optionElement = optionElements[i];
                        optionElement.parentNode.removeChild(optionElement);
                    }

                    // add options
                    for (var i in currentGraphData['nodes']) {
                        var nodeData = currentGraphData['nodes'][i];
                        var nodeName = nodeData['name'];
                        var optionElement = document.createElementNS(htmlUri, 'option');
                        optionElement.setAttributeNS(null, 'value', nodeName);
                        optionElement.innerHTML = nodeName;

                        currentNodesListBox.appendChild(optionElement);
                    }
                }

                updateCurrentNodesListBox(graph);

                form.append("input").attr({
                    id : "deleteSelectedNodeButton",
                    type : "button",
                    value : "delete selected node",
                    name : "deleteSelectedNodeButton"
                }).on("click", function() {
                    id = this.getAttribute("id");
                    value = this.getAttribute("value");

                    var currentNodesListBox = document.getElementById('currentNodesListBox');
                    var selectedValues = getListBoxSelectedValues(currentNodesListBox);

                    if (selectedValues.length >= 1) {
                        for (var i in selectedValues) {
                            var name = selectedValues[i];
                            console.log('node to be deleted: ' + name);
                            graph.deleteNodeByName(name);
                        }
                        setupLayout();
                        updateCurrentNodesListBox(graph);
                    } else {
                        console.log('no node selected for deletion');
                    }
                });

                form.append("input").attr({
                    id : "addButton",
                    type : "button",
                    value : "add random node",
                    name : "addButton"
                }).on("click", function() {
                    id = this.getAttribute("id");
                    value = this.getAttribute("value");

                    group = Math.floor(Math.random() * 20);
                    graph.addNode(new nodeData({
                        name : Math.random().toString(),
                        'group' : group
                    }));

                    setupLayout();
                    updateCurrentNodesListBox(graph);
                });

                form.append("input").attr({
                    id : "addConnectedButton",
                    type : "button",
                    value : "add random connected node",
                    name : "addConnectedButton"
                }).on("click", function() {
                    id = this.getAttribute("id");
                    value = this.getAttribute("value");

                    group = Math.floor(Math.random() * 20);
                    graph.addNode(new nodeData({
                        name : Math.random().toString(),
                        'group' : group
                    }));

                    sourceIdx = nodes.length - 1;
                    targetIdx = Math.floor(Math.random() * nodes.length);

                    if (sourceIdx != targetIdx) {
                        graph.addLink(new linkData({
                            'sourceIdx' : sourceIdx,
                            'targetIdx' : targetIdx
                        }));
                    }

                    setupLayout();
                    updateCurrentNodesListBox(graph);
                });

                form.append("input").attr({
                    id : "newNodeNameTextBox",
                    type : "text",
                    value : "name of new node",
                    name : "newNodeNameTextBox",
                    title : 'name of new node'
                }).on('keypress', function() {
                    // http://stackoverflow.com/questions/15261447/how-do-i-capture-keystroke-events-in-d3-js
                    console.log('keypress');
                    var keyCode = d3.event.keyCode;
                    if (keyCode == 13) {
                        // prevent page from reloading on return key (13)
                        d3.event.preventDefault();
                    }
                });

                // entity types listbox
                var newNodeTypeListBox = form.append('select').attr({
                    id : 'newNodeTypeListBox',
                    name : 'newNodeTypeListBox'
                }).on('change', function() {
                    console.log('change');
                }).each(function(d, i) {
                    for (var i in entityTypes) {
                        var entityType = entityTypes[i];
                        var optionElement = document.createElementNS(htmlUri, 'option');
                        optionElement.setAttributeNS(null, 'value', entityType);
                        optionElement.innerHTML = entityType;

                        this.appendChild(optionElement);
                    }
                });

                // new node button
                form.append("input").attr({
                    id : "addNodeButton",
                    type : "button",
                    value : "add a new node",
                    name : "addNodeButton"
                }).on("click", function() {
                    id = this.getAttribute("id");
                    value = this.getAttribute("value");

                    var name = document.getElementById('newNodeNameTextBox').value;

                    // get the group
                    groups = getListBoxSelectedValues(document.getElementById('newNodeTypeListBox'));
                    graph.addNode(new nodeData({
                        'name' : name,
                        'group' : groups[0]
                    }));

                    setupLayout();
                    updateCurrentNodesListBox(graph);
                });

                // graph as PID button
                form.append("input").attr({
                    id : "displayPidButton",
                    type : "button",
                    value : "graph as PID",
                    name : "displayPidButton"
                }).on("click", function() {
                    id = this.getAttribute("id");
                    value = this.getAttribute("value");

                    var pidString = graph.toPid();

                    alert(pidString);
                });

            });
        });
    });
});

/**
 * Returns path data for a rectangle with rounded bottom corners.
 * The top-left corner is (x,y).
 * @param {Object} x
 * @param {Object} y
 * @param {Object} width
 * @param {Object} height
 * @param {Object} radius
 */
function bottomRoundedRectPath(x, y, width, height, radius) {
    var pathString = '';
    pathString += "M" + x + "," + y;
    pathString += "h" + (width);
    pathString += "v" + (height - radius);
    pathString += "a" + radius + "," + radius + " 0 0 1 " + (-1 * radius) + "," + (radius);
    pathString += "h" + (-1 * (width - 2 * radius));
    pathString += "a" + radius + "," + radius + " 0 0 1 " + (-1 * radius) + "," + (-1 * radius);
    pathString += "v" + (-1 * (height - radius));
    pathString += 'z';
    return pathString;
}

/**
 * Returns path data for a rectangle with all rounded corners.
 * The top-left corner is (x,y).
 * @param {Object} x
 * @param {Object} y
 * @param {Object} width
 * @param {Object} height
 * @param {Object} radius
 */
function allRoundedRectPath(x, y, width, height, radius) {
    var pathString = '';
    pathString += "M" + (x) + "," + (y + radius);
    pathString += "a" + (radius) + "," + (radius) + " 0 0 1 " + (radius) + "," + (-1 * radius);
    pathString += "h" + (width - 2 * radius);
    pathString += "a" + radius + "," + radius + " 0 0 1 " + (radius) + "," + (radius);
    pathString += "v" + (height - 2 * radius);
    pathString += "a" + radius + "," + radius + " 0 0 1 " + (-1 * radius) + "," + (radius);
    pathString += "h" + (-1 * (width - 2 * radius));
    pathString += "a" + radius + "," + radius + " 0 0 1 " + (-1 * radius) + "," + (-1 * radius);
    pathString += "v" + (-1 * (height - 2 * radius));
    pathString += 'z';
    return pathString;
}

/**
 * Returns path data for a rectangle with angled corners.
 * The top-left corner is (x,y).
 * @param {Object} x
 * @param {Object} y
 * @param {Object} width
 * @param {Object} height
 */
function allAngledRectPath(x, y, width, height) {
    var pad = (width > height) ? width / 8 : height / 8;
    var pathString = '';
    pathString += "M" + (x) + "," + (y);
    pathString += "h" + (width - 2 * pad);
    pathString += 'l' + pad + ',' + pad;
    pathString += "v" + (height - 2 * pad);
    pathString += 'l' + (-1 * pad) + ',' + (pad);
    pathString += "h" + (-1 * (width - 2 * pad));
    pathString += 'l' + (-1 * pad) + ',' + (-1 * pad);
    pathString += "v" + (-1 * (height - 2 * pad));
    pathString += 'z';
    return pathString;
}

