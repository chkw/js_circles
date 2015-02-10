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

            setNodeCircleMapBackground(cytoscapeObj, nodeID, circleMapGenerator);
        }
    };

    /**
     * Generate an SVG data URI for a node and set it as the background of a cytoscape node.
     *
     * @param {Object} cytoscapeObj
     * @param {Object} nodeID
     * @param {Object} circleMapGenerator
     */
    var setNodeCircleMapBackground = function(cytoscapeObj, nodeID, circleMapGenerator) {
        var svgGElem = circleMapGenerator.generateCircleMapSvgGElem(nodeID);

        var svgTagOpen = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200">';
        var stringifiedSvg = svgTagOpen + svgGElem.outerHTML + '</svg>';

        setNodeCssBackgroundSvgUri(cytoscapeObj, nodeID, stringifiedSvg);
    };

    /**
     * Set the background image of a cytoscape node via data URI of an SVG.
     *
     * @param {Object} cytoscapeObj
     * @param {Object} nodeID
     * @param {Object} stringifiedSVG
     */
    var setNodeCssBackgroundSvgUri = function(cytoscapeObj, nodeID, stringifiedSVG) {
        var cyNodes = cytoscapeObj.elements('node#' + nodeID);
        var dataURI = 'data:image/svg+xml;utf8,' + encodeURIComponent(stringifiedSVG);
        // console.log('dataURI', dataURI);
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
                name : 'breadthfirst',
                directed : true,
                padding : 10
            },

            // layout : {
            // name : 'cose'
            // },

            'style' : cytoscape.stylesheet().selector('node').css({
                'height' : 80,
                'width' : 80,
                'background-fit' : 'cover',
                'border-color' : '#000',
                'border-width' : 3,
                'border-opacity' : 0.5,
                'color' : 'black',
                'text-valign' : 'center',
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
