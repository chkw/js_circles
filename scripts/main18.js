// http://bl.ocks.org/mbostock/929623 shows a nice way to build a graph with intuitive controls.
// bl.ocks.org/rkirsling/5001347
// blueprints and rexster https://github.com/tinkerpop/blueprints/wiki
// context menu: http://joewalnes.com/2011/07/22/a-simple-good-looking-context-menu-for-jquery/
// context menu: https://github.com/arnklint/jquery-contextMenu

// uses https://github.com/joewalnes/jquery-simple-context-menu
var htmlUri = 'http://www.w3.org/1999/xhtml';
var svgNamespaceUri = 'http://www.w3.org/2000/svg';
var xlinkUri = 'http://www.w3.org/1999/xlink';

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

var throbberUrl = 'images/loading_16.gif';

var d3_config = {
    // vars for d3.layout.force
    'linkDistance' : 120,
    'linkStrength' : 0.2,
    'friction' : 0.8,
    'charge' : -500,
    'gravity' : 0.01,
    'nodeRadius' : 20
};

var clickedNodesArray = new Array();

createDialogBoxDivs = function() {
    // TODO dialogBox is a div
    var bodyElem = document.getElementsByTagName('body')[0];
    var divElem = null;

    divElem = utils.createDivElement('pathwayDialog');
    divElem.setAttributeNS(null, 'title', '');
    divElem.style['display'] = 'none';
    bodyElem.appendChild(divElem);

    var textAreaElem = document.createElement('textarea');
    utils.setElemAttributes(textAreaElem, {
        'id' : 'pathwayTextArea',
        'readonly' : 'readonly'
    });

    divElem.appendChild(textAreaElem);

    divElem = utils.createDivElement('elementDialog');
    divElem.setAttributeNS(null, 'title', '');
    divElem.style['display'] = 'none';
    bodyElem.appendChild(divElem);

    divElem = utils.createDivElement('elementDialog');
    divElem.setAttributeNS(null, 'id', 'addNodeDialog');
    divElem.style['display'] = 'none';
    bodyElem.appendChild(divElem);

    divElem = utils.createDivElement('elementDialog');
    divElem.setAttributeNS(null, 'id', 'addEdgeDialog');
    divElem.style['display'] = 'none';
    bodyElem.appendChild(divElem);
};

createDialogBoxDivs();

// TODO svg element that contains the graph

var windowWidth = window.innerWidth;
var windowHeight = window.innerHeight;

var svg = d3.select("body").append("svg").attr({
    'width' : windowWidth,
    'height' : windowHeight,
    'id' : 'circleMaps'
});

var svgWidth = svg.attr('width'), svgHeight = svg.attr('height');

// TODO context menu on svg area

function showPathwayDialog() {
    var dialogElem = document.getElementById('pathwayDialog');
    dialogElem.style['font-size'] = '10px';

    var textAreaElem = document.getElementById('pathwayTextArea');
    textAreaElem.style['width'] = '100%';
    textAreaElem.style['height'] = '20em';
    setElemAttributes(textAreaElem, {
        'text' : graph.toPid()
    });

    $(dialogElem).dialog({
        'title' : 'pathway file',
        buttons : {
            "close" : function() {
                $(this).dialog("close");
                // }, //this just closes it - doesn't clean it up!!
                // "destroy" : function() {
                // $(this).dialog("destroy");
                // //this completely empties the dialog
                // //and returns it to its initial state
            }
        }
    });
}

// uses https://github.com/joewalnes/jquery-simple-context-menu
$(document.getElementById('circleMaps')).contextPopup({
    title : '',
    items : [{
        // addNodeDialog
        label : 'new node',
        // icon : 'icons/shopping-basket.png',
        action : function() {
            console.log('clicked new node');
            showAddNodeDialogBox(graph);
        }
    }, {
        // addEdge
        label : 'new edge',
        // icon : 'icons/shopping-basket.png',
        action : function() {
            console.log('clicked new edge');
            showAddEdgeDialogBox(graph);
        }
    }, null, // divider
    {
        label : 'export to UCSC pathway format',
        // icon : 'icons/application-monitor.png',
        action : function() {
            console.log('clicked export to UCSC pathway format');
            showPathwayDialog();
            // var pidString = graph.toPid();
            // alert(pidString);
        }
    }]
});

svg.append('g').attr({
    id : 'linkLayer'
});
svg.append('g').attr({
    id : 'nodeLayer'
});

// for d3 color mapping.
var colorMapper = d3.scale.category20();

// for d3 layout and rendering
var force = d3.layout.force().size([svgWidth, svgHeight]).linkDistance(d3_config['linkDistance']).linkStrength(d3_config['linkStrength']).friction(d3_config['friction']).gravity(d3_config['gravity']);

//TODO setup controls

var formElem = document.createElement('form');
utils.setElemAttributes(formElem, {
    'id' : 'mainForm'
});
formElem.style['display'] = 'none';
document.getElementsByTagName('body')[0].appendChild(formElem);
var form = d3.select(formElem);

var childElem = document.createElement('select');
formElem.appendChild(childElem);
utils.setElemAttributes(childElem, {
    'id' : 'currentNodesListBox',
    'name' : 'currentNodesListBox',
    'class' : 'deleteControl'
});
childElem.onchange = function() {
    console.log('change');
};
childElem.style['display'] = 'none';

childElem = document.createElement('select');
formElem.appendChild(childElem);
utils.setElemAttributes(childElem, {
    'id' : 'currentEdgesListBox',
    'name' : 'currentEdgesListBox',
    'class' : 'deleteControl'
});
childElem.onchange = function() {
    console.log('change');
};
childElem.style['display'] = 'none';

childElem = document.createElement('input');
formElem.appendChild(childElem);
utils.setElemAttributes(childElem, {
    'id' : "newNodeNameTextBox",
    'type' : "text",
    'value' : "name of new node",
    'name' : "newNodeNameTextBox",
    'title' : 'name of new node',
    'class' : 'addControl'
});
childElem.onkeypress = function() {
    // http://stackoverflow.com/questions/15261447/how-do-i-capture-keystroke-events-in-d3-js
    console.log('keypress');
    var keyCode = event.keyCode;
    console.log('keyCode:' + keyCode);
    if (keyCode == 13) {
        // prevent page from reloading on return key (13)
        event.preventDefault();
    }
};

childElem = document.createElement('select');
formElem.appendChild(childElem);
utils.setElemAttributes(childElem, {
    'id' : 'newNodeTypeListBox',
    'name' : 'newNodeTypeListBox',
    'class' : 'addControl'
});
childElem.onchange = function() {
    console.log('change');
};

childElem = document.createElement('input');
formElem.appendChild(childElem);
utils.setElemAttributes(childElem, {
    'id' : "addNodeButton",
    'type' : "button",
    'value' : "add a new node",
    'name' : "addNodeButton",
    'class' : 'addControl'
});

childElem = document.createElement('input');
formElem.appendChild(childElem);
utils.setElemAttributes(childElem, {
    'id' : "exportToUcscFormatButton",
    'type' : "button",
    'value' : "export to UCSC pathway format",
    'name' : "exportToUcscFormatButton",
    'class' : 'displayControl'
});

childElem = document.createElement('input');
formElem.appendChild(childElem);
utils.setElemAttributes(childElem, {
    'id' : "addRandomNodeButton",
    'type' : "button",
    'value' : "add random node",
    'name' : "addRandomNodeButton",
    'class' : 'addControl'
});

childElem = document.createElement('input');
formElem.appendChild(childElem);
utils.setElemAttributes(childElem, {
    'id' : "addConnectedButton",
    'type' : "button",
    'value' : "add random connected node",
    'name' : "addConnectedButton",
    'class' : 'addControl'
});

childElem = document.createElement('form');
document.getElementsByTagName('body')[0].appendChild(childElem);
childElem.style['display'] = 'none';
utils.setElemAttributes(childElem, {
    'id' : 'addEdgeForm'
});

var addEdgeFormElem = childElem;
{
    // setup node selection mode controls
    childElem = document.createElement('p');
    addEdgeFormElem.appendChild(childElem);
    childElem.innerHTML = 'edge type';

    // TODO build select box for edge type
    childElem = document.createElement('select');
    addEdgeFormElem.appendChild(childElem);
    utils.setElemAttributes(childElem, {
        'id' : 'edgeTypeSelect'
    });
    childElem.onchange = function() {
        var newEdgeType = document.getElementById('edgeTypeSelect').value;
        if (newEdgeType == sbgn_config['edgeTypeOptions'][0]) {
            clickedNodesArray.length = 0;
            resetNewEdgeDialog();
        }
        console.log('selected edge type: ' + newEdgeType);
    };

    // populate select box with allowed edge types
    for (var i in sbgn_config['edgeTypeOptions']) {
        var edgeTypeOption = sbgn_config['edgeTypeOptions'][i];
        var edgeTypeSymbol = sbgn_config['edgeTypeOptions'][i];

        var optionElem = document.createElement('option');
        childElem.appendChild(optionElem);
        utils.setElemAttributes(childElem, {
            'value' : edgeTypeSymbol
        });
        optionElem.innerHTML = edgeTypeOption;
    }

    addEdgeFormElem.appendChild(document.createElement('br'));

    childElem = document.createElement('div');
    addEdgeFormElem.appendChild(childElem);
    utils.setElemAttributes(childElem, {
        'id' : 'clickedNodesDiv'
    });

    var clickedNodesDivElem = document.getElementById('clickedNodesDiv');

    // source
    childElem = document.createElement('label');
    clickedNodesDivElem.appendChild(childElem);
    childElem.innerHTML = 'source';

    childElem = document.createElement('textarea');
    clickedNodesDivElem.appendChild(childElem);
    utils.setElemAttributes(childElem, {
        'id' : 'sourceTextArea',
        'readonly' : 'readonly'
    });

    clickedNodesDivElem.appendChild(document.createElement('br'));

    // target
    childElem = document.createElement('label');
    clickedNodesDivElem.appendChild(childElem);
    childElem.innerHTML = 'target';

    childElem = document.createElement('textarea');
    clickedNodesDivElem.appendChild(childElem);
    utils.setElemAttributes(childElem, {
        'id' : 'targetTextArea',
        'readonly' : 'readonly'
    });

    clickedNodesDivElem.appendChild(document.createElement('br'));

    // add edge button
    childElem = document.createElement('input');
    clickedNodesDivElem.appendChild(childElem);
    utils.setElemAttributes(childElem, {
        'id' : "addEdgeButton",
        'type' : "button",
        'value' : "add new edge",
        'name' : "addEdgeButton",
        'class' : 'addControl',
        'disabled' : 'disabled'
    });
    childElem.onclick = function() {
        var sourceIdx = clickedNodesArray[0];
        var targetIdx = clickedNodesArray[1];
        var relation = document.getElementById('edgeTypeSelect').value;
        console.log(sourceIdx + ' ' + relation + ' ' + targetIdx);

        if ((sourceIdx != targetIdx) && (relation != sbgn_config['edgeTypeOptions'][0]) && (clickedNodesArray.slice(-2).length == 2)) {
            graph.addLink(new linkData({
                'sourceIdx' : sourceIdx,
                'targetIdx' : targetIdx,
                'relation' : relation
            }));
            clearClickedNodes();
            resetNewEdgeDialog();
            updateToCurrentGraphData(svg, force, graph, cmg, circleDataLoaded);
        }

    };
}

// TODO continue here
var showAddEdgeDialogBox = function(graph) {
    var dialog = document.getElementById('addEdgeDialog');
    dialog.removeAttribute('title');
    dialog.style['font-size'] = 'smaller';
    $(dialog).dialog({
        'title' : 'new edge'
    });

    var addEdgeFormElem = document.getElementById('addEdgeForm');
    addEdgeFormElem.style['display'] = 'inline';
    dialog.appendChild(addEdgeFormElem);
};

var showAddNodeDialogBox = function(graph) {
    var dialog = document.getElementById('addNodeDialog');
    dialog.removeAttribute('title');
    dialog.style['font-size'] = 'smaller';

    var elem = document.getElementById('newNodeNameTextBox');
    dialog.appendChild(elem);
    elem.style['display'] = 'inline';

    elem = document.getElementById('newNodeTypeListBox');
    dialog.appendChild(elem);
    elem.style['display'] = 'inline';

    elem = document.getElementById('addNodeButton');
    dialog.appendChild(elem);
    elem.style['display'] = 'inline';

    $(dialog).dialog({
        'title' : 'new node'
    });
};

/**
 * Determine which dialog box should be displayed... EDGE or NODE
 */
var showElementDialogBox = function(type, graph, index) {
    var dialogElem = document.getElementById('elementDialog');
    dialogElem.removeAttribute('title');
    utils.removeChildElems(dialogElem);

    if (type.toUpperCase() === 'EDGE') {
        var data = graph.links[index];

        var pElem = document.createElement('p');
        dialogElem.appendChild(pElem);
        pElem.style['font-size'] = 'smaller';
        pElem.innerHTML = data.source.name + ' ' + data.relation + ' ' + data.target.name;

        $(dialogElem).dialog({
            'title' : type,
            buttons : {
                "delete" : function() {
                    // delete edge
                    graph.deleteLinkByIndex(index);
                    updateToCurrentGraphData(svg, force, graph, cmg, circleDataLoaded);
                    $(this).dialog("close");
                },
                "close" : function() {
                    $(this).dialog("close");
                    // }, //this just closes it - doesn't clean it up!!
                    // "destroy" : function() {
                    // $(this).dialog("destroy");
                    // //this completely empties the dialog
                    // //and returns it to its initial state
                }
            }
        });
    } else if (type.toUpperCase() === 'NODE') {
        var data = graph.nodes[index];

        var pElem = document.createElement('p');
        dialogElem.appendChild(pElem);
        pElem.style['font-size'] = 'smaller';
        pElem.innerHTML = data.name + ': ' + data.group;

        $(dialogElem).dialog({
            'title' : type,
            buttons : {
                "delete" : function() {
                    // delete node
                    graph.deleteNodeByName(data.name);
                    updateToCurrentGraphData(svg, force, graph, cmg, circleDataLoaded);
                    $(this).dialog("close");
                },
                "close" : function() {
                    $(this).dialog("close");
                    // }, //this just closes it - doesn't clean it up!!
                    // "destroy" : function() {
                    // $(this).dialog("destroy");
                    // //this completely empties the dialog
                    // //and returns it to its initial state
                }
            }
        });
    }
};

childElem = document.createElement('input');
formElem.appendChild(childElem);
utils.setElemAttributes(childElem, {
    'id' : 'testButton',
    'type' : 'button',
    'value' : 'testButton',
    'name' : 'testButton',
    'class' : 'displayControl',
    'title' : 'test'
});
childElem.onclick = function() {
    // $(showDialogBox('my title', 'my text'));
    // closeDialogBox();
    //d3.select('#pathwayTextArea').text('text from testButton');
    //$('#pathwayTextArea').val('text from the testButton');
    console.log('mode:' + getNodeClickMode());
};

// var testButton = form.append('input').attr({
// id : 'testButton',
// type : 'button',
// value : 'testButton',
// name : 'testButton',
// 'class' : 'displayControl',
// title : 'test'
// }).on('click', function() {
// // $(showDialogBox('my title', 'my text'));
// // closeDialogBox();
// //d3.select('#pathwayTextArea').text('text from testButton');
// //$('#pathwayTextArea').val('text from the testButton');
// console.log('mode:' + getNodeClickMode());
// });

/**
 * get the node click mode, which is selected from the possible types of edges to create
 */
function getNodeClickMode() {
    var mode = 'none';
    var edgeTypeValue = document.getElementById('edgeTypeSelect').value;
    if (edgeTypeValue != null) {
        mode = edgeTypeValue;
    }
    return mode;
}

// TODO draw graph

function throbberOn() {
    var imageElem = document.createElement('image');
    utils.setElemAttributes(imageElem, {
        'id' : 'throbber',
        'xlink:href' : throbberUrl,
        'x' : (0.5 * svgWidth),
        'y' : (0.5 * svgHeight),
        'width' : 16,
        'height' : 16
    });

    svg[0][0].appendChild(imageElem);

    // svg.append('image').attr({
    // id : 'throbber',
    // 'xlink:href' : throbberUrl,
    // x : (0.5 * svgWidth),
    // y : (0.5 * svgHeight),
    // 'width' : 16,
    // 'height' : 16
    // });
}

function throbberOff() {
    // d3.select('#throbber').remove();
    removeElemById('throbber');
}

doit2 = function() {
    // TODO render graph
    updateToCurrentGraphData(svg, force, graph, cmg, circleDataLoaded);

    // entity types listbox
    var elem = document.getElementById('newNodeTypeListBox');
    for (var i = 0; i < sbgn_config['selectableEntityTypes'].length; i++) {
        var entityType = sbgn_config['selectableEntityTypes'][i];
        var optionElement = document.createElementNS(htmlUri, 'option');
        optionElement.setAttributeNS(null, 'value', entityType);
        optionElement.innerHTML = entityType;
        elem.appendChild(optionElement);
    };

    // new node button

    elem = document.getElementById('addNodeButton');
    elem.onclick = function() {
        id = this.getAttribute("id");
        value = this.getAttribute("value");

        var name = document.getElementById('newNodeNameTextBox').value;

        // get the group
        groups = utils.getListBoxSelectedValues(document.getElementById('newNodeTypeListBox'));
        graph.addNode(new nodeData({
            'name' : name,
            'group' : groups[0]
        }));

        updateToCurrentGraphData(svg, force, graph, cmg, circleDataLoaded);
    };

    if (utils.getQueryStringParameterByName('test').toLowerCase() == 'true') {
        form.style({
            display : 'inline'
        });

        var elem = document.getElementById('currentNodesListBox');
        elem.style['display'] = 'inline';

        elem = document.getElementById('currentEdgesListBox');
        elem.style['display'] = 'inline';

        elem = document.getElementById('addRandomNodeButton');
        elem.style['display'] = 'inline';
        elem.onclick = function() {
            id = this.getAttribute("id");
            value = this.getAttribute("value");

            group = Math.floor(Math.random() * 20);
            graph.addNode(new nodeData({
                name : Math.random().toString(),
                'group' : group
            }));

            updateToCurrentGraphData(svg, force, graph, cmg, circleDataLoaded);
        };

        elem = document.getElementById('addConnectedButton');
        elem.style['display'] = 'inline';
        elem.onclick = function() {
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

            updateToCurrentGraphData(svg, force, graph, cmg, circleDataLoaded);
        };

        // graph as PID button
        elem = document.getElementById('exportToUcscFormatButton');
        elem.style['display'] = 'inline';
        elem.onclick = function() {
            id = this.getAttribute("id");
            value = this.getAttribute("value");

            var pidString = graph.toPid();

            alert(pidString);
        };

        elem = document.getElementById('testButton');
        elem.style['display'] = 'inline';
    }
};

doit2();
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
    var linkSelection = svgLinkLayer.selectAll(".link").data(graph.links).enter().append("line").attr('id', function(d, i) {
        return 'link' + i;
    }).attr({
        'class' : "link"
    }).style("stroke", function(d) {
        return colorMapper(d.relation);
    });

    linkSelection.style("stroke-width", function(d) {
        return d.value;
    });

    // mouse events for links - thicken on mouseover
    linkSelection.on('mouseover', function(d, i) {
        // mouseover event for link
        var linkElement = document.getElementById('link' + i);
        linkElement.setAttributeNS(null, 'style', 'stroke-width:' + (d.value * 3) + ' ; stroke:' + colorMapper(d.relation));
    }).on('mouseout', function(d, i) {
        // mouseout event for link
        var linkElement = document.getElementById('link' + i);
        linkElement.setAttributeNS(null, 'style', 'stroke-width:' + d.value + ' ; stroke:' + colorMapper(d.relation));
    });

    // context menu for link
    linkSelection.on("contextmenu", function(d, i) {
        var position = d3.mouse(this);
        var linkDesc = d.source.name + ' ' + d.relation + ' ' + d.target.name;
        console.log('right click on link: ' + linkDesc + '(' + i + ')');

        $(showElementDialogBox('edge', graph, i));

        d3.event.preventDefault();
        d3.event.stopPropagation();
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
    } else {
        // mouse events for sbgn nodes
        nodeSelection.on('mouseover', function(d, i) {
            // mouseover event for node
            var nodeElement = document.getElementsByClassName("node " + d.name + ' ' + d.group);
            var nodeSbgnElement = nodeElement[0].getElementsByClassName('sbgn');
            nodeSbgnElement[0].setAttributeNS(null, 'style', 'stroke-width:4;fill:' + colorMapper(d.group));
        }).on('mouseout', function(d, i) {
            // mouseout event for node
            var nodeElement = document.getElementsByClassName("node " + d.name + ' ' + d.group);
            var nodeSbgnElement = nodeElement[0].getElementsByClassName('sbgn');
            nodeSbgnElement[0].setAttributeNS(null, 'style', 'stroke-width:1;fill:' + colorMapper(d.group));
        });
    }
    nodeSelection.call(force.drag);

    // context menu for node
    nodeSelection.on("contextmenu", function(d, i) {
        var position = d3.mouse(this);
        console.log('right click on node: ' + d.name + '(' + i + ')');

        $(showElementDialogBox('node', graph, i));

        d3.event.preventDefault();
        d3.event.stopPropagation();
    });

    // TODO node click
    nodeSelection.on("click", function(d, i) {
        var position = d3.mouse(this);
        console.log('left click on node: ' + d.name + '(' + i + ')');

        var nodeClickMode = getNodeClickMode();

        console.log('click mode: ' + nodeClickMode);

        if (nodeClickMode == 'none' || nodeClickMode == sbgn_config['edgeTypeOptions'][0]) {
            console.log('ignore click event');
        } else {
            addClickedNodeToList(i);
            for (var i in clickedNodesArray) {
                var idx = clickedNodesArray[i];
                console.log(idx);
            }

            updateNewEdgeDialog();
        }

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
        return colorMapper(d.group);
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

/**
 * Clear the text from the text areas in the new edge dialog box.
 */
function resetNewEdgeDialog() {
    d3.select('#clickedNodesDiv').select('#sourceTextArea').text('');
    d3.select('#clickedNodesDiv').select('#targetTextArea').text('');
    d3.select('#addEdgeButton').attr({
        'disabled' : 'disabled'
    });
}

/**
 * fill in the text area with source node and target node for new edge.
 */
function updateNewEdgeDialog() {
    var slice = clickedNodesArray.slice(-2);
    for (var i in slice) {
        var nodeData = graph['nodes'][slice[i]];
        var newText = nodeData.name + ': ' + nodeData.group;
        var textAreaId = (i == 0) ? 'sourceTextArea' : 'targetTextArea';
        d3.select('#clickedNodesDiv').select('#' + textAreaId).text(newText);
    }

    // make button (in)active
    if (slice.length == 2) {
        d3.select('#addEdgeButton').attr({
            'disabled' : null
        });
    } else {
        d3.select('#addEdgeButton').attr({
            'disabled' : 'disabled'
        });
    }
}

/**
 * clear the clickedNodesArray
 */
function clearClickedNodes() {
    clickedNodesArray = new Array();
}

/**
 * add specified index to clicked nodes array.  Keeps only last 2 items.
 */
function addClickedNodeToList(nodeIdx) {
    // check if node already exists
    var exists = false;
    for (var i in clickedNodesArray) {
        var idx = clickedNodesArray[i];
        if (idx === nodeIdx) {
            exists = true;
            break;
        }
    }
    if (!exists) {
        // add node
        clickedNodesArray.push(nodeIdx);

        // trim array to maximum 2 elements
        if (clickedNodesArray.length > 2) {
            // keep only last 2 elements
            clickedNodesArray = clickedNodesArray.slice(-2);
        }
    }
    return clickedNodesArray;
}

/**
 * remove specified index from clicked nodes array
 */
function removeClickedNode(nodeIdx) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && clickedNodesArray.length) {
        what = a[--L];
        while (( ax = clickedNodesArray.indexOf(what)) !== -1) {
            clickedNodesArray.splice(ax, 1);
        }
    }
    return clickedNodesArray;
}

/**
 * Update to current graphData:
 * <ul>
 * <li>graph rendering</li>
 * <li>currentNodesListBox</li>
 * <li>currentEdgesListBox</li>
 * </ul>
 */
function updateToCurrentGraphData(svgElement, d3Force, currentGraphData, circleMapGenerator, circleDataLoaded) {
    clearClickedNodes();
    renderGraph(svgElement, d3Force, currentGraphData, circleMapGenerator, circleDataLoaded);
    updateCurrentNodesListBox(currentGraphData);
    updateCurrentEdgesListBox(currentGraphData);
    d3.select('#pathwayTextArea').text(currentGraphData.toPid());
}
