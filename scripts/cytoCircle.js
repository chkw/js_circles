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
(function(cc) {
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
        var cyto = cytoscape({
            'container' : containerElem,
            'elements' : cytoscapeElementsObj,

            // http://js.cytoscape.org/#layouts
            'layout' : {

                // 'name' : 'breadthfirst',
                // 'fit' : true, // whether to fit the viewport to the graph
                // 'directed' : true, // whether the tree is directed downwards (or edges can point in any direction if false)
                // 'padding' : 10, // padding on fit
                // 'circle' : false, // put depths in concentric circles if true, put depths top down if false
                // 'boundingBox' : undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
                // 'avoidOverlap' : true, // prevents node overlap, may overflow boundingBox if not enough space
                // 'roots' : undefined, // the roots of the trees
                // 'maximalAdjustments' : 3, // how many times to try to position the nodes in a maximal way (i.e. no backtracking)
                // 'animate' : false, // whether to transition the node positions
                // 'animationDuration' : 500, // duration of animation in ms if enabled
                // 'ready' : function() {
                // console.log('layout ready');
                // }, // callback on layoutready
                // 'stop' : function() {
                // console.log('layout stop');
                // } // callback on layoutstop

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
            },

            'style' : cytoscape.stylesheet().selector('node').css({
                'height' : 80,
                'width' : 80,
                'background-repeat' : 'no-repeat', // for performance, non-repeating
                'background-clip' : 'none', // for performance, non-clipping
                'background-fit' : 'none', // none for original size, contain to fit inside node, or cover to cover the node
                // 'border-color' : '#000',
                // 'border-width' : 0,
                // 'border-opacity' : 0.5,
                'color' : 'black',
                'text-valign' : 'top',
                'text-outline-color' : 'white',
                'text-outline-width' : 0,
                'min-zoomed-font-size' : 8,
                'content' : 'data(id)'
            }).selector('edge').css({
                'width' : 6,
                'target-arrow-shape' : 'triangle',
                'line-color' : '#ffaaaa',
                'target-arrow-color' : '#ffaaaa',
                'color' : 'black',
                'text-outline-color' : 'white',
                'text-outline-width' : 0,
                'min-zoomed-font-size' : 8,
                'content' : 'data(relation)'
            })
        });
        return cyto;
    };

})(cytoCircle);
