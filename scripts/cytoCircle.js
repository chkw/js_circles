/**
 * cytoCircle.js
 * Combine circleMaps with cytoscapeJS to make pure-javascript, client-side circleMap network graphs.
 *
 * 02FEB15  chrisw@soe.ucsc.edu
 *
 * requirements:
 * cytoscape.js
 * ...
 */

var cytoCircle = {};
(function(cc) {"use strict";

    /**
     * cytoscape object
     */
    cc.cytoObj = null;

    cc.buildCytoCircleGraph = function(containerDivElem, graphConfig, circleDataConfig) {
        // set up divs
        var cytoGraphFormDiv = document.createElement("div");
        containerDivElem.appendChild(cytoGraphFormDiv);
        utils.setElemAttributes(cytoGraphFormDiv, {
            "id" : "cytoGraphFormDiv"
        });

        var cytoGraphForm = document.createElement("form");
        cytoGraphFormDiv.appendChild(cytoGraphForm);
        utils.setElemAttributes(cytoGraphForm, {
            "id" : "cytoGraphForm",
            "name" : "cytoGraphForm"
        });

        containerDivElem.appendChild(document.createElement("hr"));

        var cytoGraphDiv = document.createElement("div");
        containerDivElem.appendChild(cytoGraphDiv);
        utils.setElemAttributes(cytoGraphDiv, {
            "id" : "cytoGraphDiv",
            "style" : "height: 100%; width: 100%; position: absolute; left: 0; top: 80;"
        });

        // pathway
        // graphDataURL = "data/forYulia/pathway.sif";
        var graph = new graphData.graphData();
        graph.readSif(utils.getResponse(graphConfig['url']));

        // draw pathway graph
        cc.cytoObj = cc.buildCytoGraph(cytoGraphDiv, graph.toCytoscapeElements());

        // event data
        var eventAlbum = new eventData.OD_eventAlbum();
        medbookDataLoader.getGeneBySampleData("data/igf1r/igf1r_genes_wcdt_expression.tab", eventAlbum, '_wcdt_expression', 'wcdt_expression', 'numeric');
        medbookDataLoader.getGeneBySampleData("data/igf1r/igf1r_genes_tcga_expression.tab", eventAlbum, '_tcga_expression', 'tcga_expression', 'numeric');

        cc.album = eventAlbum;

        // circleMap generator
        var cmg = new circleMapGenerator.circleMapGenerator(cc.album, circleDataConfig);

        cytoGraphForm.appendChild(cc.createCircleMapToggleControl(cmg));

        cc.setQtips();
    };

    /**
     * Create a div element that contains controls for toggling circlemaps.
     */
    cc.createCircleMapToggleControl = function(circleMapGenerator) {
        var divElem1 = document.createElement('div');
        var childElem = document.createElement('input');
        divElem1.appendChild(childElem);
        utils.setElemAttributes(childElem, {
            'id' : 'circleMapCheckbox',
            'type' : 'checkbox',
            'value' : 'circleMapCheckbox',
            'name' : 'circleMapCheckbox',
            'class' : 'displayControl',
            'title' : 'check to turn on CircleMaps'
        });
        childElem.onclick = function() {
            if (this.checked) {
                cc.setNodeCircleMapBackgrounds(cc.cytoObj, circleMapGenerator);
            } else {
                cc.removeCircleMaps(cc.cytoObj);
            }
        };

        childElem = document.createElement('label');
        divElem1.appendChild(childElem);
        utils.setElemAttributes(childElem, {
            'title' : 'check to turn on CircleMaps'
        });
        childElem.innerHTML = 'turn on CircleMaps';

        return divElem1;
    };

    /**
     * Remove the circlemap background images from nodes.
     */
    cc.removeCircleMaps = function(cytoscapeObj) {
        var cyNodes = cytoscapeObj.elements('node');
        cyNodes.removeCss('background-image');
    };

    /**
     * Generate and set circlemap images for all cytoscape nodes.
     *
     * @param {Object} cytoscapeObj
     * @param {Object} circleMapGenerator
     */
    cc.setNodeCircleMapBackgrounds = function(cytoscapeObj, circleMapGenerator) {
        var cyNodes = cytoscapeObj.elements('node');
        for (var i = 0; i < cyNodes.length; i++) {
            var cyNode = cyNodes[i];
            var nodeID = cyNode.id();

            var dataURI = circleMapGenerator.getCircleMapDataUri(nodeID);
            setNodeCssBackgroundSvgUri(cytoscapeObj, nodeID, dataURI);
        }
    };

    /**
     * Set the background image of a cytoscape node via data URI of an SVG.
     *
     * @param {Object} cytoscapeObj
     * @param {Object} nodeID
     * @param {Object} stringifiedSVG
     */
    var setNodeCssBackgroundSvgUri = function(cytoscapeObj, nodeID, dataURI) {
        var cyNodes = cytoscapeObj.elements('node#' + nodeID);
        cyNodes.css({
            'background-image' : dataURI,
            'background-fit' : 'cover'
        });
    };

    /**
     * Container element must have the minimum style attributes: style='height: 80%; width: 80%; position: absolute; left: 0; top: 50;'
     * @param {Object} containerElem
     * @param {Object} cytoscapeElementsObj
     */
    cc.buildCytoGraph = function(containerElem, cytoscapeElementsObj) {
        // http://js.cytoscape.org/#layouts
        var layouts = {
            "breadthfirst" : {
                'name' : 'breadthfirst',
                'fit' : true, // whether to fit the viewport to the graph
                'directed' : true, // whether the tree is directed downwards (or edges can point in any direction if false)
                'padding' : 10, // padding on fit
                'circle' : false, // put depths in concentric circles if true, put depths top down if false
                'boundingBox' : undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
                'avoidOverlap' : true, // prevents node overlap, may overflow boundingBox if not enough space
                'roots' : undefined, // the roots of the trees
                'maximalAdjustments' : 3, // how many times to try to position the nodes in a maximal way (i.e. no backtracking)
                'animate' : false, // whether to transition the node positions
                'animationDuration' : 500, // duration of animation in ms if enabled
                'ready' : function() {
                    console.log('layout ready');
                }, // callback on layoutready
                'stop' : function() {
                    console.log('layout stop');
                } // callback on layoutstop
            },
            "cose" : {
                name : 'cose',
                // Called on `layoutready`
                ready : function() {
                },
                // Called on `layoutstop`
                stop : function() {
                },
                // Whether to animate while running the layout
                animate : false,
                // Number of iterations between consecutive screen positions update (0 -> only updated on the end)
                refresh : 4,
                // Whether to fit the network view after when done
                fit : true,
                // Padding on fit
                padding : 10,
                // Constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
                boundingBox : undefined,
                // Whether to randomize node positions on the beginning
                randomize : true,
                // Whether to use the JS console to print debug messages
                debug : false,
                // Node repulsion (non overlapping) multiplier
                nodeRepulsion : 400000,
                // Node repulsion (overlapping) multiplier
                nodeOverlap : 10,
                // Ideal edge (non nested) length
                idealEdgeLength : 10,
                // Divisor to compute edge forces
                edgeElasticity : 100,
                // Nesting factor (multiplier) to compute ideal edge length for nested edges
                nestingFactor : 5,
                // Gravity force (constant)
                gravity : 250,
                // Maximum number of iterations to perform
                numIter : 100,
                // Initial temperature (maximum node displacement)
                initialTemp : 200,
                // Cooling factor (how the temperature is reduced between consecutive iterations
                coolingFactor : 0.95,
                // Lower temperature threshold (below this point the layout will end)
                minTemp : 1.0
            }
        };

        var styling = {
            "samsNodes" : cytoscape.stylesheet().selector("node").css({
                "height" : "mapData(SCORE, 1, 6, 15, 100)",
                "width" : "mapData(SCORE, 1, 6, 15, 100)",
                "border-color" : "#000000",
                "border-width" : 2,
                "border-opacity" : 0.5,
                "content" : "data(LABEL)",
                "font-size" : 8,
                "color" : "white",
                "text-valign" : "center",
                "text-outline-width" : 1,
                "text-outline-color" : "#000000"
            }).selector("node[SIGNATURE]").selector("node[SIGNATURE <= 0]").css({
                "background-color" : "mapData(SIGNATURE, -6, 0, blue, white)"
            }).selector("node[SIGNATURE]").selector("node[SIGNATURE >= 0]").css({
                "background-color" : "mapData(SIGNATURE, 0, 6, white, red)"
            }).selector("node[TYPE = 'protein']")// if there is an image use ellipse
            .css({
                "shape" : "ellipse"
            }).selector("node[TYPE = 'abstract']").css({
                "shape" : "roundrectangle"
            }).selector("node[TYPE = 'complex']").css({
                "shape" : "hexagon"
            }).selector("node[TYPE = 'family']").css({
                "shape" : "triangle"
            }).selector("node[IMAGE]").css({
                "shape" : "ellipse",
                "background-image" : "data(IMAGE)",
                "background-fit" : "cover"
            }),
            "simpleNodes" : cytoscape.stylesheet().selector('node').css({
                'height' : 80,
                'width' : 80,
                'background-repeat' : 'no-repeat', // for performance, non-repeating
                'background-clip' : 'none', // for performance, non-clipping
                'background-fit' : 'none', // none for original size, contain to fit inside node, or cover to cover the node
                'border-color' : '#000',
                'border-width' : 2,
                'border-opacity' : 0.5,
                'color' : 'black',
                'text-valign' : 'top',
                'text-outline-color' : 'white',
                'text-outline-width' : 0,
                'min-zoomed-font-size' : 8,
                'content' : 'data(id)'
            })
        };

        var cyto = cytoscape({
            'container' : containerElem,
            'elements' : cytoscapeElementsObj,

            'boxSelectionEnabled' : false,

            // http://js.cytoscape.org/#layouts
            'layout' : layouts.breadthfirst,

            'style' : styling["simpleNodes"].selector('edge').css({
                'width' : 2,
                'line-color' : '#000000',
                'target-arrow-color' : '#000000'
            }).selector('edge[relation = "-t>"]').css({
                'line-style' : 'solid',
                'target-arrow-shape' : 'triangle'
            }).selector('edge[relation = "-t|"]').css({
                'line-style' : 'solid',
                'target-arrow-shape' : 'tee'
            }).selector('edge[relation = "-a>"]').css({
                'line-style' : 'dashed',
                'target-arrow-shape' : 'triangle'
            }).selector('edge[relation = "-a|"]').css({
                'line-style' : 'dashed',
                'target-arrow-shape' : 'tee'
            }).selector('edge[relation = "-ap>"]').css({
                'line-style' : 'dashed',
                'target-arrow-shape' : 'triangle'
            }).selector('edge[relation = "-ap|"]').css({
                'line-style' : 'dashed',
                'target-arrow-shape' : 'tee'
            }).selector('edge[relation = "component>"]').css({
                'line-style' : 'dashed',
                'target-arrow-shape' : 'circle'
            }).selector('edge[relation = "member>"]').css({
                'line-style' : 'dashed',
                'target-arrow-shape' : 'circle'
            }).selector('edge[relation = "-disconnected-"]').css({
                'line-style' : 'dotted'
            }).selector(':selected').css({
                'border-color' : '#E5E500',
                'line-color' : '#E5E500',
                'target-arrow-color' : '#E5E500'
            })
        });

        return cyto;
    };

    /**
     * Set the qtips.
     */
    cc.setQtips = function() {
        cc.cytoObj.$("*").qtip({
            content : function() {
                // 'this' is a cytoscape element obj.

                var qtip_text = '';
                if (this.isNode()) {
                    qtip_text = "<b>" + this.data("id") + "</b>";
                }

                if (this.isEdge()) {
                    qtip_text = "<b>" + this.data("source") + ' to ' + this.data('target') + "</b>";
                }

                if (this.filter("[TYPE]").length) {
                    qtip_text += "<br />Type: <em>" + this.data("TYPE") + "</em>";
                }
                if (this.filter("[INTERACTION]").length) {
                    qtip_text += "<br />Interaction: <em>" + this.data("INTERACTION") + "</em>";
                }
                if (this.filter("[relation]").length) {
                    qtip_text += "<br />relation: <em>" + this.data("relation") + "</em>";
                }
                if (this.filter("[SIGNATURE]").length) {
                    qtip_text += "<br />Signature: <em>" + this.data("SIGNATURE") + "</em>";
                }
                if (this.filter("[BOOTSTRAP]").length) {
                    qtip_text += "<br />Bootstrap: <em>" + this.data("BOOTSTRAP") + "</em>";
                }
                if (this.filter("[IMAGE]").length) {
                    qtip_text += "<br />Image: <em>" + this.data("IMAGE") + "</em>";
                }
                return qtip_text;
            },
            style : {
                classes : "qtip-bootstrap",
                tip : {
                    width : 16,
                    height : 8
                }
            }
        });
    };

})(cytoCircle);
