// Draw CircleMaps just using D3, no jQuery.

var width = 960, height = 500;
var linkDistance = 300;
var linkStrength = 0.1;
var friction = 0.3
var charge = -500;
var nodeRadius = 20;
var dataURL = "data/net";

// for d3 color mapping.
var color = d3.scale.category20();

// for d3 layout and rendering
var force = d3.layout.force().size([width, height]).linkDistance(linkDistance).linkStrength(linkStrength).friction(friction);

// where controls go
var form = d3.select("body").append("form");

// svg element that contains the graph
var svg = d3.select("body").append("svg").attr({
    'width' : width,
    'height' : height
});

d3.json(dataURL, function(error, data) {

    if (error !== null) {
        console.log("error --> " + error);
    } else {
        console.log("data --> " + JSON.stringify(data));
    }
    var graph = data;
    var nodes = graph.nodes;
    var links = graph.links;

    // remove value from array without knowing index
    function removeA(arr) {
        var what, a = arguments, L = a.length, ax;
        while (L > 1 && arr.length) {
            what = a[--L];
            while (( ax = arr.indexOf(what)) !== -1) {
                arr.splice(ax, 1);
            }
        }
        return arr;
    }

    function createNode(name, group) {
        newNode = new Object();
        newNode['name'] = name;
        newNode['group'] = group;
        return newNode;
    }

    function createLink(sourceIdx, targetIdx) {
        newLink = new Object({
            source : sourceIdx,
            target : targetIdx,
            value : (Math.floor(Math.random() * 10))
        });
        return newLink;
    }

    function deleteNode(name) {
        // nothing to delete
        if (nodes.length < 1) {
            console.log('no nodes to delete');
            return;
        }

        // find index of node
        idx = -1;
        for (i in nodes) {
            if (nodes[i]['name'] == name) {
                idx = i;
                break;
            }
        }
        if (idx == -1) {
            console.log('No node was found for ' + name);
            return;
        }

        // find links
        linksToDelete = new Array();
        for (i in links) {
            link = links[i];
            source = link['source'];
            target = link['target'];

            if (source == idx || target == idx) {
                linksToDelete.push(link);
                continue;
            } else if ((source['index'] == idx) || (target['index'] == idx)) {
                linksToDelete.push(link);
                continue;
            }
        }

        // delete stuff
        for (i in linksToDelete) {
            link = linksToDelete[i];
            removeA(links, link);
        }
        node = nodes[idx];
        removeA(nodes, node);
    }

    function setupLayout() {
        // clear the current graph
        svg.selectAll(".link").remove();
        svg.selectAll(".node").remove();

        if (nodes.length < 1) {
            return;
        }

        // start the layout
        force.nodes(nodes).links(links).start();

        // links
        var linkSelection = svg.selectAll(".link").data(links).enter().append("line").attr({
            class : "link"
        })

        linkSelection.style("stroke-width", function(d) {
            return d.value;
        });

        // nodes
        var nodeSelecton = svg.selectAll(".node").data(nodes).enter().append("g").attr({
            class : "node"
        }).call(force.drag);

        nodeSelecton.append("circle").attr({
            r : nodeRadius
        }).style("fill", function(d) {
            return color(d.group);
        });

        nodeSelecton.append("svg:text").attr("text-anchor", "middle").attr('dy', ".35em").text(function(d) {
            return d.name;
        });

        // tooltips
        linkSelection.append("title").text(function(d) {
            var label = d.source.name + "-->" + d.target.name + ":" + d.value;
            return label;
        });

        nodeSelecton.append("title").text(function(d) {
            return d.name;
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

            // nodeSelecton.attr("cx", function(d) {
            // return d.x;
            // }).attr("cy", function(d) {
            // return d.y;
            // });

            nodeSelecton.attr("transform", function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            });
        });
    }

    setupLayout();

    form.append("input").attr({
        id : "addButton",
        type : "button",
        value : "add random node",
        name : "addButton"
    }).on("click", function() {
        id = this.getAttribute("id");
        value = this.getAttribute("value");

        group = Math.floor(Math.random() * 20)
        newNode = createNode(Math.random().toString(), group);
        nodes.push(newNode);

        setupLayout();
        return true;
    });

    form.append("input").attr({
        id : "addConnectedButton",
        type : "button",
        value : "add random connected node",
        name : "addConnectedButton"
    }).on("click", function() {
        id = this.getAttribute("id");
        value = this.getAttribute("value");

        group = Math.floor(Math.random() * 20)
        newNode = createNode(Math.random().toString(), group);
        nodes.push(newNode);

        sourceIdx = nodes.length - 1;
        targetIdx = Math.floor(Math.random() * nodes.length);

        if (sourceIdx != targetIdx) {
            newLink = createLink(sourceIdx, targetIdx);
            links.push(newLink);
        }

        setupLayout();
        return true;
    });

    form.append("input").attr({
        id : "deleteButton",
        type : "button",
        value : "delete random node",
        name : "deleteButton"
    }).on("click", function() {
        id = this.getAttribute("id");
        value = this.getAttribute("value");

        // no nodes to delete
        if (nodes.length < 1) {
            return;
        }

        // find/delete node and links
        index = Math.floor(Math.random() * nodes.length);
        name = nodes[index]['name'];
        deleteNode(name);

        setupLayout();
        return true;
    });
});
