/**
 * Data to specify a node.
 */
function nodeData(data) {
    this.name = data['name'];
    if ('group' in data) {
        this.group = data['group'];
    } else {
        this.group = 'protein';
    }
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
        this.value = 1;
    }
}

/**
 * A graph is a set of vertices and edges.
 */
function graphData() {
    this.nodes = new Array();
    this.links = new Array();

    this.addNode = function(nodeData) {
        if (nodeData.constructor.name == 'nodeData') {
            this.nodes.push(nodeData);
        } else {
            console.log('not adding node: ' + JSON.stringify(nodeData));
        }
    }
    /**
     * Does not check if both source and target nodes exist.
     */
    this.addLink = function(linkData) {
        if (linkData.constructor.name == 'linkData') {
            this.links.push(linkData);
        } else {
            console.log('not adding link: ' + JSON.stringify(linkData));
        }
    }
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
    }
    /**
     * Delete a node by the name.
     */
    this.deleteNodeByName = function(name) {
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
    }
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
    }
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
                        value : 3,
                    }));
                }
            }
        }
    }
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
