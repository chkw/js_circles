
// TODO "main" section of the script.
$(document).ready(function() {

    $("#input").hide();

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

});
