// http://bl.ocks.org/mbostock/929623 shows a nice way to build a graph with intuitive controls.
// bl.ocks.org/rkirsling/5001347
// blueprints and rexster https://github.com/tinkerpop/blueprints/wiki
// context menu: http://joewalnes.com/2011/07/22/a-simple-good-looking-context-menu-for-jquery/
// context menu: https://github.com/arnklint/jquery-contextMenu
var htmlUri = 'http://www.w3.org/1999/xhtml';
var svgNamespaceUri = 'http://www.w3.org/2000/svg';
var xlinkUri = 'http://www.w3.org/1999/xlink';

var macromoleculeTypes = ['macromolecule', 'protein', 'gene', 'mrna', 'mirna', 'shrna', 'dna', 'transcription factor'];
var nucleicAcidFeatureTypes = ['nucleic acid feature', 'promoter'];
var unspecifiedEntityTypes = ['unspecified entity', 'family', 'abstract'];
var simpleChemicalTypes = ['simple chemical', 'small molecule'];
var perturbingAgentTypes = ['perturbing agent'];
var complexTypes = ['complex'];

var selectableEntityTypes = ['unspecified entity', 'protein', 'gene', 'mRNA', 'miRNA', 'nucleic acid feature', 'small molecule', 'perturbing agent', 'complex'];

var throbberUrl = 'images/loading_16.gif';

var svgWidth = 960, svgHeight = 500;

// circleMap data
var metaData = null;
var metaDataUrl = "data/metaDataJson";

var circleData = null;
var circleDataUrl = "data/dataJson";

var query = null;
var queryUrl = "data/queryJson";

// vars for d3.layout.force
var linkDistance = 120;
var linkStrength = 0.2;
var friction = 0.8;
var charge = -500;
var gravity = 0.01;

var nodeRadius = 20;
var graphDataURL = "data/test_pid";
graphDataURL = 'data/biopaxpid_75288_rdf_pid';

// $("input[type=button]").button();

// TODO dialogBox is a div
var dialogBox = d3.select('body').append('div').attr({
    id : 'dialog',
    title : ''
}).style({
    display : 'none'
});

// TODO test context menu
d3.select('body').append('div').attr({
    id : 'mythingy'
});

// TODO svg element that contains the graph

var svg = d3.select("body").append("svg").attr({
    'width' : '100%',
    'height' : '85%',
    'id' : 'circleMaps'
});

// TODO context menu on svg area

$(function() {

    $('#circleMaps').contextPopup({
        title : 'blank area popup',
        items : [{
            label : 'new node',
            // icon : 'icons/shopping-basket.png',
            action : function() {
                console.log('clicked new node');
            }
        }, null, // divider
        {
            label : 'some other thing',
            // icon : 'icons/application-monitor.png',
            action : function() {
                console.log('clicked some other thing');
            }
        }]
    });

});

// svg.on("contextmenu", function(d, i) {
// d3.event.preventDefault();
// d3.event.stopPropagation();
// var position = d3.mouse(this);
//
// console.log('right click on blank svg');
// });

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

svg.append('g').attr({
    id : 'linkLayer'
});
svg.append('g').attr({
    id : 'nodeLayer'
});

// for d3 color mapping.
var color = d3.scale.category20();

// for d3 layout and rendering
var force = d3.layout.force().size([svgWidth, svgHeight]).linkDistance(linkDistance).linkStrength(linkStrength).friction(friction).gravity(gravity);

//TODO setup controls

var form = d3.select("body").append("form");

var currentNodesListBox = form.append('select').attr({
    id : 'currentNodesListBox',
    name : 'currentNodesListBox',
    class : 'deleteControl'
}).on('change', function() {
    console.log('change');
});

var deleteSelectedNodeButton = form.append("input").attr({
    id : "deleteSelectedNodeButton",
    type : "button",
    value : "delete selected NODE",
    name : "deleteSelectedNodeButton",
    class : "deleteControl"
});

var currentEdgesListBox = form.append('select').attr({
    id : 'currentEdgesListBox',
    name : 'currentEdgesListBox',
    class : 'deleteControl'
}).on('change', function() {
    console.log('change');
});

var deleteSelectedEdgeButton = form.append("input").attr({
    id : "deleteSelectedEdgeButton",
    type : "button",
    value : "delete selected EDGE",
    name : "deleteSelectedEdgeButton",
    class : "deleteControl"
});

var newNodeNameTextBox = form.append("input").attr({
    id : "newNodeNameTextBox",
    type : "text",
    value : "name of new node",
    name : "newNodeNameTextBox",
    title : 'name of new node',
    class : 'addControl'
}).on('keypress', function() {
    // http://stackoverflow.com/questions/15261447/how-do-i-capture-keystroke-events-in-d3-js
    console.log('keypress');
    var keyCode = d3.event.keyCode;
    if (keyCode == 13) {
        // prevent page from reloading on return key (13)
        d3.event.preventDefault();
    }
});

var newNodeTypeListBox = form.append('select').attr({
    id : 'newNodeTypeListBox',
    name : 'newNodeTypeListBox',
    class : 'addControl'
}).on('change', function() {
    console.log('change');
});

var newNodeButton = form.append("input").attr({
    id : "addNodeButton",
    type : "button",
    value : "add a new node",
    name : "addNodeButton",
    class : 'addControl'
});

var exportToUcscFormatButton = form.append("input").attr({
    id : "exportToUcscFormatButton",
    type : "button",
    value : "export to UCSC pathway format",
    name : "exportToUcscFormatButton",
    class : 'displayControl'
});

var addRandomNodeButton = form.append("input").attr({
    id : "addRandomNodeButton",
    type : "button",
    value : "add random node",
    name : "addRandomNodeButton",
    class : 'addControl'
}).style({
    display : 'none'
});

var addRandomConnectedNodeButton = form.append("input").attr({
    id : "addConnectedButton",
    type : "button",
    value : "add random connected node",
    name : "addConnectedButton",
    class : 'addControl'
}).style({
    display : 'none'
});

var showDialogBox = function(title, text) {
    $("#dialog").removeAttr('title');
    $("#dialog").empty();
    $("#dialog").append('p').text(text);
    $("#dialog").dialog({
        'title' : title
    });
};

var closeDialogBox = function() {
    $("#dialog").dialog('close');
};

var testButton = form.append('input').attr({
    id : 'testButton',
    type : 'button',
    value : 'testButton',
    name : 'testButton',
    class : 'displayControl'
}).on('click', function() {
    // $(showDialogBox('my title', 'my text'));
    closeDialogBox();
}).style({
    display : 'none'
});

// TODO draw graph

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

// circleMap data
d3.json(metaDataUrl, function(error, data) {
    var circleDataLoaded = true;
    if (getQueryStringParameterByName('circles').toLowerCase() == 'false') {
        circleDataLoaded = false;
    }
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

                // prepare generator for creating SVG:g elements.
                var cmg = null;
                if (circleDataLoaded) {
                    cmg = new circleMapGenerator(metaData, circleData, query);
                }

                // TODO render graph
                renderGraph(svg, force, graph, cmg, circleDataLoaded);

                /**
                 * Update to current graphData:
                 * <ul>
                 * <li>graph rendering</li>
                 * <li>currentNodesListBox</li>
                 * <li>currentEdgesListBox</li>
                 * </ul>
                 */
                function updateToCurrentGraphData(currentGraphData) {
                    renderGraph(svg, force, currentGraphData, cmg, circleDataLoaded);
                    updateCurrentNodesListBox(currentGraphData);
                    updateCurrentEdgesListBox(currentGraphData);
                }

                updateToCurrentGraphData(graph);

                deleteSelectedNodeButton.on("click", function() {
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
                        updateToCurrentGraphData(graph);
                    } else {
                        console.log('no node selected for deletion');
                    }
                });

                deleteSelectedEdgeButton.on("click", function() {
                    id = this.getAttribute("id");
                    value = this.getAttribute("value");

                    var listbox = document.getElementById('currentEdgesListBox');
                    var selectedValues = getListBoxSelectedValues(listbox);

                    if (selectedValues.length >= 1) {
                        for (var i in selectedValues) {
                            var val = selectedValues[i];
                            console.log('edge to be deleted: ' + val);
                            graph.deleteLinkByIndex(val);
                        }
                        updateToCurrentGraphData(graph);
                    } else {
                        console.log('no edge selected for deletion');
                    }
                });

                // entity types listbox
                newNodeTypeListBox.each(function(d, i) {
                    for (var i in selectableEntityTypes) {
                        var entityType = selectableEntityTypes[i];
                        var optionElement = document.createElementNS(htmlUri, 'option');
                        optionElement.setAttributeNS(null, 'value', entityType);
                        optionElement.innerHTML = entityType;

                        this.appendChild(optionElement);
                    }
                });

                // new node button
                newNodeButton.on("click", function() {
                    id = this.getAttribute("id");
                    value = this.getAttribute("value");

                    var name = document.getElementById('newNodeNameTextBox').value;

                    // get the group
                    groups = getListBoxSelectedValues(document.getElementById('newNodeTypeListBox'));
                    graph.addNode(new nodeData({
                        'name' : name,
                        'group' : groups[0]
                    }));

                    updateToCurrentGraphData(graph);
                });

                // graph as PID button
                exportToUcscFormatButton.on("click", function() {
                    id = this.getAttribute("id");
                    value = this.getAttribute("value");

                    var pidString = graph.toPid();

                    alert(pidString);
                });

                if (getQueryStringParameterByName('test').toLowerCase() == 'true') {
                    addRandomNodeButton.style({
                        display : 'inline'
                    }).on("click", function() {
                        id = this.getAttribute("id");
                        value = this.getAttribute("value");

                        group = Math.floor(Math.random() * 20);
                        graph.addNode(new nodeData({
                            name : Math.random().toString(),
                            'group' : group
                        }));

                        updateToCurrentGraphData(graph);
                    });

                    addRandomConnectedNodeButton.style({
                        display : 'inline'
                    }).on("click", function() {
                        id = this.getAttribute("id");
                        value = this.getAttribute("value");

                        group = Math.floor(Math.random() * 20);
                        graph.addNode(new nodeData({
                            name : Math.random().toString(),
                            'group' : group
                        }));

                        sourceIdx = graph.nodes.length - 1;
                        targetIdx = Math.floor(Math.random() * graph.nodes.length);

                        if (sourceIdx != targetIdx) {
                            graph.addLink(new linkData({
                                'sourceIdx' : sourceIdx,
                                'targetIdx' : targetIdx
                            }));
                        }

                        updateToCurrentGraphData(graph);
                    });

                    testButton.style({
                        display : 'inline'
                    });

                    testButton2.style({
                        display : 'inline'
                    });
                }
            });
        });
    });
});

// TODO instance methods

// requires svg, force, graph, cmg, circleDataLoaded, and various constants
function renderGraph(svg, force, graph, cmg, circleDataLoaded) {"use strict";

    var largeScale = 'scale(2)';
    var smallScale = 'scale(0.2)';

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

    // start the layout
    force.nodes(graph.nodes).links(graph.links).start();

    // links
    var svgLinkLayer = svg.select('#linkLayer');
    var linkSelection = svgLinkLayer.selectAll(".link").data(graph.links).enter().append("line").attr({
        class : "link"
    }).style("stroke", function(d) {
        return color(d.relation);
    });

    linkSelection.style("stroke-width", function(d) {
        return d.value;
    });

    // TODO context menu for link
    linkSelection.on("contextmenu", function(d, i) {
        var position = d3.mouse(this);
        var linkDesc = d.source.name + ' ' + d.relation + ' ' + d.target.name;
        console.log('right click on link: ' + linkDesc + '(' + i + ')');

        $(showDialogBox('edge', linkDesc + '(' + i + ')'));

        d3.event.preventDefault();
        d3.event.stopPropagation();
    });

    // nodes
    var nodeSelection = svgNodeLayer.selectAll(".node").data(graph.nodes).enter().append("g").attr('class', function(d, i) {
        return "node " + d.name + ' ' + d.group;
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

    // TODO context menu for node
    nodeSelection.on("contextmenu", function(d, i) {
        var position = d3.mouse(this);
        console.log('right click on node: ' + d.name + '(' + i + ')');

        $(showDialogBox('node', d.name + '(' + i + ')'));

        d3.event.preventDefault();
        d3.event.stopPropagation();
    });

    // node visualization
    var opacityVal = 0.6;
    nodeSelection.append(function(d) {
        var nodeName = d['name'];
        var type = d.group.toString().toLowerCase();
        if ((circleDataLoaded ) && (nodeNames.indexOf(nodeName) >= 0)) {
            // circleMap
            var stagedElement = document.getElementById('circleMapSvg' + nodeName);
            return stagedElement;
        } else if (nucleicAcidFeatureTypes.indexOf(type) != -1) {
            var newElement = document.createElementNS(svgNamespaceUri, 'path');
            var path = bottomRoundedRectPath(-20, -15, 40, 30, 10);
            newElement.setAttributeNS(null, 'd', path);
            newElement.setAttributeNS(null, 'opacity', opacityVal);
            return newElement;
        } else if (macromoleculeTypes.indexOf(type) != -1) {
            var newElement = document.createElementNS(svgNamespaceUri, 'path');
            var path = allRoundedRectPath(-20, -15, 40, 30, 10);
            newElement.setAttributeNS(null, 'd', path);
            newElement.setAttributeNS(null, 'opacity', opacityVal);
            return newElement;
        } else if (simpleChemicalTypes.indexOf(type) != -1) {
            // circle
            var newElement = document.createElementNS(svgNamespaceUri, 'circle');
            newElement.setAttributeNS(null, 'r', nodeRadius);
            newElement.setAttributeNS(null, 'opacity', opacityVal);
            return newElement;
        } else if (complexTypes.indexOf(type) != -1) {
            var newElement = document.createElementNS(svgNamespaceUri, 'path');
            var path = allAngledRectPath(-50, -30, 100, 60);
            newElement.setAttributeNS(null, 'd', path);
            newElement.setAttributeNS(null, 'opacity', opacityVal);
            return newElement;
        } else {
            // unspecified entity
            var newElement = document.createElementNS(svgNamespaceUri, 'ellipse');
            newElement.setAttributeNS(null, 'cx', 0);
            newElement.setAttributeNS(null, 'cy', 0);
            newElement.setAttributeNS(null, 'rx', 1.5 * nodeRadius);
            newElement.setAttributeNS(null, 'ry', 0.75 * nodeRadius);
            newElement.setAttributeNS(null, 'opacity', opacityVal);
            return newElement;
        }
    }).style("fill", function(d) {
        return color(d.group);
    });

    nodeSelection.append("svg:text").attr("text-anchor", "middle").attr('dy', ".35em").text(function(d) {
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
    });
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

/**
 *
 * @param {Object} currentGraphData
 */
function updateCurrentEdgesListBox(currentGraphData) {
    var listbox = document.getElementById('currentEdgesListBox');

    // clear options starting from the bottom of the listbox
    var optionElements = listbox.getElementsByTagName('option');
    for (var i = optionElements.length - 1; optionElements.length > 0; i--) {
        var optionElement = optionElements[i];
        optionElement.parentNode.removeChild(optionElement);
    }

    // add options
    for (var i in currentGraphData['links']) {
        var linkData = currentGraphData['links'][i];
        var sourceNode = linkData['source'];
        var targetNode = linkData['target'];
        var relation = linkData['relation'];

        var value = sourceNode['name'] + ' ' + relation + ' ' + targetNode['name'];

        var optionElement = document.createElementNS(htmlUri, 'option');
        optionElement.setAttributeNS(null, 'value', i);
        optionElement.innerHTML = value;

        listbox.appendChild(optionElement);
    }
}

// TODO static methods

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
    // calculated from longer side
    var pad = (width > height) ? width / 8 : height / 8;
    var pathString = '';
    pathString += "M" + (x + pad) + "," + (y);
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

/**
 * Get the value of a parameter from the query string.  If parameter has not value or does not exist, return <code>null</code>.
 * From <a href='http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values'>here</a>.
 * @param {Object} name
 */
function getQueryStringParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    var results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
