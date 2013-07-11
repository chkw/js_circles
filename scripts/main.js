function getURLAnchor() {
    return decodeURI((RegExp('#(.+?)($)').exec(location.hash)||[,null])[1]);
}

function setURLAnchor(msg) {
    location.hash = msg
}

/**
 * Set the data to display as preformatted text in the "input" element.
 */
function setDataDisplay(dataText) {
    $("#input").empty().append($("<pre>").append(dataText));
}

/**
 * Render the data as a graph via graphViewer.
 */
function renderAsGraph(graphViewer, data) {
    var lines = data.split("\n")
    for (var i in lines) {
        var tmp = lines[i].split("\t");
        if (tmp.length == 2) {
            graphViewer.add_node(tmp[1], tmp[1], {
                type : tmp[0]
            })
        }
        if (tmp.length == 3) {
            graphViewer.add_edge(tmp[0], tmp[1], {
                type : tmp[2]
            });
        }
    }
    graphViewer.render();
}

// TODO "main" section of the script.
$(document).ready(function() {

    $("#input").hide();

    if (false) {
        $("#input").show();

        var pid = getURLAnchor();

        if (pid == '' || pid === null || pid == 'null') {
            pid = "PID41410"
        }
        $("#title").append(pid)
        setURLAnchor(pid)

        var gv = $("#drawingElement").graphViewer({
            height : 400,
            width : 600
        });

        $('#input').draggable();
        var fileUrl = "superpathway_db/" + pid + "/graph";
        $.ajax({
            url : fileUrl
        }).done(function(data) {
            setDataDisplay(data);
            renderAsGraph(gv, data);
        }).fail(function() {
            var msg = "failure getting graph data for " + pid;
            console.log(msg);
            alert(msg);
        });

    } else {
        // TODO circleMap tests

        var metaData = null;
        var metaDataUrl = "data/metaDataJson";

        var data = null;
        var dataUrl = "data/dataJson";

        var query = null;
        var queryUrl = "data/queryJson";

        $.getJSON(metaDataUrl, function(response) {
            metaData = response;
        }).done(function() {
            console.log("number of metaData --> " + Object.keys(metaData).length);
            $.getJSON(dataUrl, function(response) {
                data = response;
            }).done(function() {
                console.log("number of data --> " + Object.keys(data).length);
                $.getJSON(queryUrl, function(response) {
                    query = response;
                }).done(function() {
                    console.log("number of query --> " + Object.keys(query).length);
                    var cv = $("#circleDiv").circleMapViewer(800, 800, metaData, data, query);
                }).fail(function() {
                    alert("fail getting " + queryUrl);
                });
            }).fail(function() {
                alert("fail getting " + dataUrl);
            });
        }).fail(function() {
            alert("fail getting " + metaDataUrl);
        });

        // TODO circleMapViewer
        // var cv = $("#circleDiv").circleMapViewer(800, 600, JSON.stringify(testMetaData), JSON.stringify(testData), JSON.stringify(null));
        // var cv = $("#circleDiv").circleMapViewer(800, 600, JSON.stringify(testMetaData), JSON.stringify(testData), JSON.stringify(null));
    }
});
