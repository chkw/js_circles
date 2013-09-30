/**
 * Data to specify a node.
 */
function nodeData(data) {
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
}

/**
 * Data to specify a link.
 */
function linkData(data) {
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
}

/**
 * A graph is a set of vertices and edges.
 */
function graphData() {
    this.nodes = new Array();
    this.links = new Array();

    /**
     * Get all the node names in the graph.
     */
    this.getAllNodeNames = function() {
        var nodeNames = new Array();
        for (var i in this.nodes) {
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
        if (nodeData.constructor.name != 'nodeData') {
            console.log('not nodeData: ' + JSON.stringify(nodeData));
            return null;
        }

        // check if node already exists
        var exists = false;
        for (var i in this.nodes) {
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
        if (linkData.constructor.name == 'linkData') {
            this.links.push(linkData);
        } else {
            console.log('not adding link: ' + JSON.stringify(linkData));
        }
    };

    /**
     * Get IDs for nodes that have the specified name.
     */
    this.getNodeIdsByName = function(name) {
        var idList = new Array();
        var nameUc = name.toUpperCase(name);
        for (var i in this.nodes) {
            var node = this.nodes[i];
            if (node['name'].toUpperCase() == nameUc) {
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
        for (var i in this.nodes) {
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
        for (var i in this.links) {
            link = this.links[i];
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
        for (var i in linksToDelete) {
            link = linksToDelete[i];
            removeA(this.links, link);
        }
        node = this.nodes[idx];
        removeA(this.nodes, node);
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
        for (var i in lines) {
            var fields = lines[i].split('\t');
            if (fields.length >= 2) {
                var sourceName = fields[0];
                var targetName = fields[1];
                nodeNameArray.push(sourceName);
                nodeNameArray.push(targetName);
            }
        }
        nodeNameArray = d3.set(nodeNameArray).values();
        for (var i in nodeNameArray) {
            var nodeName = nodeNameArray[i];
            this.addNode(new nodeData({
                name : nodeName
            }));
        }

        // links
        for (var i in lines) {
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
        for (var i in lines) {
            var fields = lines[i].split('\t');
            if (fields.length >= 3) {
                var sourceName = fields[0];
                var targetName = fields[2];
                nodeNameArray.push(sourceName);
                nodeNameArray.push(targetName);
            }
        }
        nodeNameArray = d3.set(nodeNameArray).values();
        for (var i in nodeNameArray) {
            var nodeName = nodeNameArray[i];
            this.addNode(new nodeData({
                name : nodeName
            }));
        }

        // links
        for (var i in lines) {
            var fields = lines[i].split('\t');
            if (fields.length >= 3) {
                var sourceName = fields[0];
                var relation = fields[1];
                var targetName = fields[2];

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
     * read graph from PID text
     */
    this.readPid = function(text) {
        // clear old graph
        this.nodes = new Array();
        this.links = new Array();

        var lines = text.split('\n');
        // nodes
        for (var i in lines) {
            var fields = lines[i].split('\t');
            if (fields.length == 2) {
                this.addNode(new nodeData({
                    name : fields[1],
                    group : fields[0]
                }));
            }
        }
        // edges
        for (var i in lines) {
            var fields = lines[i].split('\t');
            if (fields.length >= 3) {
                // relation
                var sourceName = fields[0];
                var targetName = fields[1];
                var relation = fields[2];

                var sourceIdx = -1;
                var targetIdx = -1;
                for (var j in this.nodes) {
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
        for (var i in this.nodes) {
            var node = this.nodes[i];
            var nodeString = node['group'] + '\t' + node['name'] + '\n';
            pidString = pidString + nodeString;
        }

        // relations
        for (var i in this.links) {
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
}

/**
 * remove from array by value (instead of index)
 */
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
