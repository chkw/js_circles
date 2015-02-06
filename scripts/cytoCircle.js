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
    cc.test2 = function(cytoscapeObj) {
        var nodes = cytoscapeObj.elements('node');
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var nodeID = node.id();
            console.log('nodeID', nodeID);
        }
    };

    cc.test = function(cytoscapeObj, nodeID) {
        cc.setNodeSvgUri(cytoscapeObj, nodeID, arCircleMapSVG);
    };

    cc.setNodeSvgUri = function(cytoscapeObj, nodeID, stringifiedSVG) {
        var nodes = cytoscapeObj.elements('node#' + nodeID);
        var dataURI = 'data:image/svg+xml;utf8,' + encodeURIComponent(stringifiedSVG);
        console.log('dataURI', dataURI);
        nodes.css({
            // 'background-image' : 'https://farm8.staticflickr.com/7272/7633179468_3e19e45a0c_b.jpg',
            // 'background-image' : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><linearGradient id='gradient'><stop offset='10%' stop-color='#F00'/><stop offset='90%' stop-color='#fcc'/> </linearGradient><rect fill='url(#gradient)' x='0' y='0' width='100%' height='100%'/></svg>",
            'background-image' : dataURI,
            'background-fit' : 'cover'
        });
    };

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
            // .selector('#bird')
            // .css({
            // 'background-image': 'https://farm8.staticflickr.com/7272/7633179468_3e19e45a0c_b.jpg'
            // })
            // .selector('#cat')
            // .css({
            // 'background-image': 'https://farm2.staticflickr.com/1261/1413379559_412a540d29_b.jpg'
            // })
            // .selector('#ladybug')
            // .css({
            // 'background-image': 'https://farm4.staticflickr.com/3063/2751740612_af11fb090b_b.jpg'
            // })
            // .selector('#aphid')
            // .css({
            // 'background-image': 'https://farm9.staticflickr.com/8316/8003798443_32d01257c8_b.jpg'
            // })
            // .selector('#rose')
            // .css({
            // 'background-image': 'https://farm6.staticflickr.com/5109/5817854163_eaccd688f5_b.jpg'
            // })
            // .selector('#grasshopper')
            // .css({
            // 'background-image': 'https://farm7.staticflickr.com/6098/6224655456_f4c3c98589_b.jpg'
            // })
            // .selector('#plant')
            // .css({
            // 'background-image': 'https://farm1.staticflickr.com/231/524893064_f49a4d1d10_z.jpg'
            // })
            // .selector('#wheat')
            // .css({
            // 'background-image': 'https://farm3.staticflickr.com/2660/3715569167_7e978e8319_b.jpg'
            // })
        });
        return cyto;
    };

})(cytoCircle);