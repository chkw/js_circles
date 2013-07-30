// Draw CircleMaps just using D3, no jQuery.

var width = 960, height = 500;
var charge = -100;
var linkDistance = 100;
var nodeRadius = 20;
var dataURL = "data/net";
var friction = 0.3

var color = d3.scale.category20();

var force = d3.layout.force().charge(charge).linkDistance(linkDistance).size([width, height]);

var form = d3.select("body").append("form");

var svg = d3.select("body").append("svg").attr({
    'width' : width,
    'height' : height
});
// type="button" value="See Some Text" name="button2" onClick="window.status='You clicked the button!'; return true"

d3.json(dataURL, function(error, data) {

    if (error !== null) {
        console.log("error --> " + error);
    } else {
        console.log("data --> " + JSON.stringify(data));
    }
    var graph = data;
    var nodes = graph.nodes;
    var links = graph.links;

    function createNode(name, group) {
        newNode = new Object();
        newNode['name'] = name;
        newNode['group'] = group;
        return newNode;
    }

    function setupLayout() {
        // start the layout
        force.friction(friction).nodes(nodes).links(links).start();

        // links
        var link = svg.selectAll(".link").data(links).enter().append("line").attr("class", "link").style("stroke-width", function(d) {
            return d.value;
        });

        // nodes
        var node = svg.selectAll(".node").data(nodes).enter().append("circle").attr("class", "node").attr("r", nodeRadius).style("fill", function(d) {
            return color(d.group);
        }).call(force.drag);

        // tooltips
        link.append("title").text(function(d) {
            var label = d.source.name + "-->" + d.target.name + ":" + d.value;
            return label;
        });

        node.append("title").text(function(d) {
            return d.name;
        });

        // tick handler repositions graph elements
        force.on("tick", function() {
            link.attr("x1", function(d) {
                return d.source.x;
            }).attr("y1", function(d) {
                return d.source.y;
            }).attr("x2", function(d) {
                return d.target.x;
            }).attr("y2", function(d) {
                return d.target.y;
            });

            node.attr("cx", function(d) {
                return d.x;
            }).attr("cy", function(d) {
                return d.y;
            });
        });
    }


    form.append("input").attr({
        id : "button",
        type : "button",
        value : "test button",
        name : "testButton"
    }).on("click", function() {
        id = this.getAttribute("id");
        value = this.getAttribute("value");

        newNode = createNode(Math.random().toString(), 5);

        console.log('old size: ' + nodes.length);
        nodes.push(newNode);
        console.log('new size: ' + nodes.length);

        setupLayout();

        return true;
    });
});
