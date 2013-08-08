// A graph is a set of vertices and edges.
function graphObject() {
    this.nodes = new Array();
    this.links = new Array();

    this.addNode = function(nodeObject) {
        this.nodes.push(nodeObject);
    }

    this.addLink = function(linkObject){
        this.links.push(linkObject);
    }
    // read graph from PID text
    this.readPid = function(text) {
        // clear old graph
        this.nodes = new Array();
        this.links = new Array();

        var lines = text.split('\n');
        // nodes
        for (var i in lines) {
            var fields = lines[i].split('\t');
            if (fields.length == 2) {
                // concept
                // nodes.push({
                    // name : fields[1],
                    // group : fields[0]
                // });
                this.addNode({
                    name : fields[1],
                    group : fields[1]
                });
            }
        }
        // edges
        for (var i in lines) {
            var fields = lines[i].split('\t');
            if (fields.length >= 3) {
                // relation
                //console.log('relation\t' + lines[i]);
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
                    this.addLink({
                        source : parseInt(sourceIdx),
                        target : parseInt(targetIdx),
                        value : 3,
                    });
                }
            }
        }
    }
    // read graph from SIF text
    this.readSif = function(text) {
        // clear old graph
        this.nodes = new Array();
        this.links = new Array();
    }
}
