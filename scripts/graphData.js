/**
 * graphData.js
 * ChrisW
 *
 * objects to use for drawing network graphs in D3.js.
 */

var graphData = {};
(function(gd) {"use strict";

    /**
     * Data to specify a node.
     */
    gd.nodeData = function(data) {
        this.name = data['name'];
        if ('group' in data) {
            this.group = data['group'];
        } else {
            this.group = 'unspecified entity';
        }

        /**
         * Check if this nodeData is equal to the specified nodeData.
         */
        this.checkEquality = function(otherNodeData) {
            if (this.name == otherNodeData.name && this.group == otherNodeData.group) {
                return true;
            } else {
                return false;
            }
        };
    };

    /**
     * Data to specify a link.
     */
    gd.linkData = function(data) {
        this.source = parseInt(data['sourceIdx']);
        this.target = parseInt(data['targetIdx']);
        if ('value' in data) {
            this.value = parseFloat(data['value']);
        } else {
            this.value = 3;
        }
        if ('relation' in data) {
            this.relation = data['relation'];
        }
    };

    /**
     * A graph is a set of vertices and edges.
     */
    gd.graphData = function() {
        this.nodes = new Array();
        this.links = new Array();

        /**
         * Get a list of link relations in this graph.
         */
        this.getRelations = function() {
            var linkTypes = _.pluck(this.links, "relation");
            return _.uniq(linkTypes);
        };

        /**
         * Get all the node names in the graph.
         */
        this.getAllNodeNames = function() {
            var nodeNames = new Array();
            for (var i = 0, length = this.nodes.length; i < length; i++) {
                var nodeData = this.nodes[i];
                var nodeName = nodeData['name'];
                nodeNames.push(nodeName);
            }
            return nodeNames;
        };

        /**
         * Add a node to the graph.
         */
        this.addNode = function(nodeData) {
            // check if it is nodeData object
            if (nodeData.constructor.toString !== gd.nodeData.constructor.toString) {
                console.log('not nodeData: ' + JSON.stringify(nodeData));
                return null;
            }

            // check if node already exists
            var exists = false;
            for (var i = 0, length = this.nodes.length; i < length; i++) {
                var node = this.nodes[i];
                if (node.checkEquality(nodeData)) {
                    console.log('nodeData exists');
                    exists = true;
                    break;
                }
            }

            if (!exists) {
                // add node
                this.nodes.push(nodeData);
                return nodeData;
            } else {
                return null;
            }
        };
        /**
         * Does not check if both source and target nodes exist.
         */
        this.addLink = function(linkData) {
            // TODO first, check if link exists
            if (linkData.constructor.toString !== gd.linkData.constructor.toString) {
                console.log('not adding link: ' + JSON.stringify(linkData));
                return null;
            }
            this.links.push(linkData);
        };

        /**
         * Get IDs for nodes that have the specified name.
         */
        this.getNodeIdsByName = function(name) {
            var idList = new Array();
            var nameUc = name.toUpperCase(name);
            for (var i = 0, length = this.nodes.length; i < length; i++) {
                var node = this.nodes[i];
                if (node['name'].toUpperCase() === nameUc) {
                    idList.push(i);
                }
            }
            return idList;
        };
        /**
         * Delete a node by the name.
         */
        this.deleteNodeByName = function(name) {
            // TODO deleting node should force re-indexing of link source/targets
            // nothing to delete
            if (this.nodes.length < 1) {
                console.log('no nodes to delete');
                return;
            }

            // find index of node
            var idx = -1;
            for (var i = 0, length = this.nodes.length; i < length; i++) {
                if (this.nodes[i]['name'] == name) {
                    idx = i;
                    break;
                }
            }
            if (idx == -1) {
                console.log('No node was found for ' + name);
                return;
            }

            // find links
            var linksToDelete = new Array();
            for (var i = 0, length = this.links.length; i < length; i++) {
                var link = this.links[i];
                var source = link['source'];
                var target = link['target'];

                if (source == idx || target == idx) {
                    linksToDelete.push(link);
                    continue;
                } else if ((source['index'] == idx) || (target['index'] == idx)) {
                    linksToDelete.push(link);
                    continue;
                }
            }

            // delete stuff
            for (var i = 0, length = linksToDelete.length; i < length; i++) {
                var link = linksToDelete[i];
                utils.removeA(this.links, link);
            }
            var node = this.nodes[idx];
            utils.removeA(this.nodes, node);
        };
        /**
         * Delete a link by its array index.
         */
        this.deleteLinkByIndex = function(linkIdx) {
            this.links.splice(linkIdx, 1);
        };
        /**
         * read graph links from TAB text
         */
        this.readTab = function(text) {
            // clear old graph
            this.nodes = new Array();
            this.links = new Array();

            var lines = text.split('\n');

            // nodes
            var nodeNameArray = new Array();
            for (var i = 0, length = lines.length; i < length; i++) {
                var fields = lines[i].split('\t');
                if (fields.length >= 2) {
                    var sourceName = fields[0];
                    var targetName = fields[1];
                    nodeNameArray.push(sourceName);
                    nodeNameArray.push(targetName);
                }
            }
            nodeNameArray = d3.set(nodeNameArray).values();
            for (var i = 0, length = nodeNameArray.length; i < length; i++) {
                var nodeName = nodeNameArray[i];
                this.addNode(new nodeData({
                    name : nodeName
                }));
            }

            // links
            for (var i = 0, length = lines.length; i < length; i++) {
                var fields = lines[i].split('\t');
                if (fields.length >= 2) {
                    var sourceName = fields[0];
                    var targetName = fields[1];
                    var relation = '';
                    if (fields.length >= 3) {
                        relation = fields[2];
                    } else {
                        relation = 'unspecified';
                    }

                    var sourceIdxList = this.getNodeIdsByName(sourceName);
                    var targetIdxList = this.getNodeIdsByName(targetName);

                    this.addLink(new linkData({
                        sourceIdx : sourceIdxList[0],
                        targetIdx : targetIdxList[0],
                        'relation' : relation
                    }));
                }
            }
        };
        /**
         * read graph SIF text
         */
        this.readSif = function(text) {
            // clear old graph
            this.nodes = new Array();
            this.links = new Array();

            var lines = text.split('\n');

            // nodes
            var nodeNameArray = new Array();
            for (var i = 0, length = lines.length; i < length; i++) {
                var fields = lines[i].split('\t');
                if (fields.length >= 3) {
                    var sourceName = fields[0];
                    var targetName = fields[2];
                    nodeNameArray.push(sourceName);
                    nodeNameArray.push(targetName);
                }
            }
            nodeNameArray = d3.set(nodeNameArray).values();
            for (var i = 0, length = nodeNameArray.length; i < length; i++) {
                var nodeName = nodeNameArray[i];
                this.addNode(new gd.nodeData({
                    name : nodeName
                }));
            }

            // links
            for (var i = 0, length = lines.length; i < length; i++) {
                var fields = lines[i].split('\t');
                if (fields.length >= 3) {
                    var sourceName = fields[0];
                    var relation = fields[1];
                    var targetName = fields[2];

                    var sourceIdxList = this.getNodeIdsByName(sourceName);
                    var targetIdxList = this.getNodeIdsByName(targetName);

                    this.addLink(new gd.linkData({
                        sourceIdx : sourceIdxList[0],
                        targetIdx : targetIdxList[0],
                        'relation' : relation
                    }));
                }
            }
        };

        /**
         * Read targettingDrugsData into the graphData object.
         * targettingDrugsData is an array of documents from a mongo collection with keys "gene","drugs","pubmed_id"
         */
        this.readClinicalEventsSummaryDocs = function(targettingDrugsData) {
            _.each(targettingDrugsData, function(doc) {
                var geneNodeData = new gd.nodeData({
                    name : doc["gene"]
                });
                this.addNode(geneNodeData);
                var targetIdx = _.indexOf(this.nodes, geneNodeData);

                var pubmed_id = doc["pubmed_id"];

                var drugStrings = doc["drugs"].split(/[;,]/);
                _.each(drugStrings, function(drugString) {
                    var drugNodeData = new gd.nodeData({
                        name : drugString.trim(),
                        group : "drug"
                    });
                    this.addNode(drugNodeData);
                    var sourceIdx = _.indexOf(this.nodes, drugNodeData);

                    this.addLink(new gd.linkData({
                        'sourceIdx' : sourceIdx,
                        'targetIdx' : targetIdx,
                        'relation' : "-drug target|",
                        'pubmed_id' : pubmed_id
                    }));
                }, this);
            }, this);

            return null;
        };

        this.readMedbookGraphData = function(medbookGraphDataObj) {
            // clear old graph
            this.nodes = new Array();
            this.links = new Array();

            // nodes
            var medbookElements = medbookGraphDataObj["network"]["elements"];
            for (var i = 0, length = medbookElements.length; i < length; i++) {
                var medbookElement = medbookElements[i];
                var type = medbookElement["type"];
                var name = medbookElement["name"];
                this.addNode(new gd.nodeData({
                    "name" : name,
                    "group" : type
                }));
            }

            // edges
            var medbookInteractions = medbookGraphDataObj["network"]["interactions"];
            console.log("medbookInteractions.length", medbookInteractions.length);
            for (var i = 0, lengthi = medbookInteractions.length; i < lengthi; i++) {
                var medbookInteraction = medbookInteractions[i];
                var sourceName = medbookInteraction["source"];
                var targetName = medbookInteraction["target"];
                var relation = medbookInteraction["type"];

                var sourceIdx = -1;
                var targetIdx = -1;
                for (var j = 0, lengthj = this.nodes.length; j < lengthj; j++) {
                    var nodeName = this.nodes[j]['name'];
                    if (nodeName == sourceName) {
                        sourceIdx = j;
                    }
                    if (nodeName == targetName) {
                        targetIdx = j;
                    }
                    if (targetIdx != -1 && sourceIdx != -1) {
                        // got Idx for both... go save the edge
                        break;
                    }
                }

                // save edge
                if (targetIdx != -1 && sourceIdx != -1) {
                    this.addLink(new gd.linkData({
                        'sourceIdx' : parseInt(sourceIdx),
                        'targetIdx' : parseInt(targetIdx),
                        'relation' : relation
                    }));
                }
            };
            return null;
        };

        /**
         * read graph from PID text
         */
        this.readPid = function(text) {
            // clear old graph
            this.nodes = new Array();
            this.links = new Array();

            var lines = text.split('\n');
            // nodes
            for (var i = 0, length = lines.length; i < length; i++) {
                var fields = lines[i].split('\t');
                if (fields.length == 2) {
                    this.addNode(new nodeData({
                        name : fields[1],
                        group : fields[0]
                    }));
                }
            }
            // edges
            for (var i = 0, length = lines.length; i < length; i++) {
                var fields = lines[i].split('\t');
                if (fields.length >= 3) {
                    // relation
                    var sourceName = fields[0];
                    var targetName = fields[1];
                    var relation = fields[2];

                    var sourceIdx = -1;
                    var targetIdx = -1;
                    for (var j = 0, length = this.nodes.length; j < length; j++) {
                        var nodeName = this.nodes[j]['name'];
                        if (nodeName == sourceName) {
                            sourceIdx = j;
                        }
                        if (nodeName == targetName) {
                            targetIdx = j;
                        }
                        if (targetIdx != -1 && sourceIdx != -1) {
                            break;
                        }
                    }

                    if (targetIdx != -1 && sourceIdx != -1) {
                        this.addLink(new linkData({
                            'sourceIdx' : parseInt(sourceIdx),
                            'targetIdx' : parseInt(targetIdx),
                            'relation' : relation
                        }));
                    }
                }
            }
        };

        /**
         * Get the graph as a PID string.  Bug: Nodes that have same name, different group/type will give possibly unexpected results in the relations section.
         */
        this.toPid = function() {
            var pidString = '';

            // nodes
            for (var i = 0, length = this.nodes.length; i < length; i++) {
                var node = this.nodes[i];
                var nodeString = node['group'] + '\t' + node['name'] + '\n';
                pidString = pidString + nodeString;
            }

            // relations
            for (var i = 0, length = this.links.length; i < length; i++) {
                var link = this.links[i];
                var relation = link['value'];
                if ('relation' in link) {
                    relation = link['relation'];
                }
                var linkString = link['source']['name'] + '\t' + link['target']['name'] + '\t' + relation + '\n';
                pidString = pidString + linkString;
            }

            return pidString;
        };

        /**
         * Get the graph as a Javascript object for loading into cytoscapeJS as an elements object.
         *
         */
        this.toCytoscapeElements = function() {
            var elements = {
                'nodes' : [],
                'edges' : []
            };

            // nodes
            for (var i = 0, length = this.nodes.length; i < length; i++) {
                var node = this.nodes[i];

                elements['nodes'].push({
                    'data' : {
                        'id' : node['name'],
                        'type' : node['group']
                    }
                });
            }

            // relations
            for (var i = 0, length = this.links.length; i < length; i++) {
                var link = this.links[i];

                // relation may be stored as value or relation
                var relation = link['value'];
                if ('relation' in link) {
                    relation = link['relation'];
                }

                elements['edges'].push({
                    'data' : {
                        'source' : this.nodes[link['source']]['name'],
                        'target' : this.nodes[link['target']]['name'],
                        'relation' : relation
                    }
                });
            }

            return elements;
        };

        /**
         * Get this node's neighbors.
         */
        this.getNeighbors = function(nodeName, degree) {
            var degree = degree || 1;
            var neighborObjs = [];
            var nodeIdxs = this.getNodeIdsByName(nodeName);

            for (; degree > 0; degree--) {
                var newNodeIdxs = [];
                for (var i = 0, length = this.links.length; i < length; i++) {
                    var linkData = this.links[i];
                    var sourceNodeIdx = linkData.source.index;
                    var targetNodeIdx = linkData.target.index;
                    if ((!utils.isObjInArray(nodeIdxs, targetNodeIdx)) && utils.isObjInArray(nodeIdxs, sourceNodeIdx)) {
                        newNodeIdxs.push(targetNodeIdx);
                        neighborObjs.push(this.nodes[targetNodeIdx]);
                    } else if ((!utils.isObjInArray(nodeIdxs, sourceNodeIdx)) && utils.isObjInArray(nodeIdxs, targetNodeIdx)) {
                        newNodeIdxs.push(sourceNodeIdx);
                        neighborObjs.push(this.nodes[sourceNodeIdx]);
                    }
                }
                nodeIdxs = nodeIdxs.concat(newNodeIdxs);
            }
            return utils.eliminateDuplicates(neighborObjs);
        };
    };

})(graphData);
