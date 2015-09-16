/**
 * controls for loading data to a circleMap graph.
 */

circleMapGraphControls = ( typeof circleMapGraphControls === "undefined") ? {} : circleMapGraphControls;
(function(cmgc) {"use strict";

    cmgc.options = {};

    cmgc.buildControls = function(containerElem, circleMapGraphContainerElem) {
        utils.removeChildElems(containerElem);

        cmgc.options["circleMapGraphContainerElem"] = circleMapGraphContainerElem;

        var sifTextAreaElem = document.createElement("textArea");
        containerElem.appendChild(sifTextAreaElem);
        utils.setElemAttributes(sifTextAreaElem, {
            "id" : "sifTextArea",
            "rows" : 3,
            "cols" : 25,
            "placeholder" : "sif data for network graph"
        });

        var sifButtonElem = document.createElement("button");
        containerElem.appendChild(sifButtonElem);
        utils.setElemAttributes(sifButtonElem, {
            "id" : "sifButton"
        });
        sifButtonElem.innerHTML = "set graph data";

        sifButtonElem.onclick = sifButtonClickHandler;

        containerElem.appendChild(document.createElement("hr"));

        var matrixTextAreaElem = document.createElement("textArea");
        containerElem.appendChild(matrixTextAreaElem);
        utils.setElemAttributes(matrixTextAreaElem, {
            "id" : "matrixTextArea",
            "rows" : 3,
            "cols" : 25,
            "placeholder" : "matrix data for rings"
        });

        var matrixTextElem = document.createElement("input");
        containerElem.appendChild(matrixTextElem);
        utils.setElemAttributes(matrixTextElem, {
            "id" : "matrixText",
            "type" : "text",
            "placeholder" : "ring name"
        });

        var matrixButtonElem = document.createElement("button");
        containerElem.appendChild(matrixButtonElem);
        utils.setElemAttributes(matrixButtonElem, {
            "id" : "matrixButton"
        });
        matrixButtonElem.innerHTML = "set ring data";

        matrixButtonElem.onclick = matrixButtonClickHandler;
    };

    var sifButtonClickHandler = function() {
        console.log("clicked sifButton");
        var sifTextAreaElem = document.getElementById("sifTextArea");
        var sifString = sifTextAreaElem.value;

        if (sifString === "") {
            window.alert("no sif data");
            return;
        }

        // load graph data
        cmgc.options["sifGraphData"] = sifString;

        // draw graph
        cmgc.buildCircleMapGraph();
    };

    var matrixButtonClickHandler = function() {
        console.log("clicked matrixButton");
        var matrixTextAreaElem = document.getElementById("matrixTextArea");
        var matrixString = matrixTextAreaElem.value;
        // console.log("matrixString", matrixString);

        var matrixTextElem = document.getElementById("matrixText");
        var matrixText = matrixTextElem.value;
        // console.log("matrixText", matrixText);

        if (matrixString === "") {
            window.alert("no ring data");
            return;
        }

        if (matrixText === "") {
            window.alert("no data name");
            return;
        }

        // load ring data
        cmgc.addRingData(matrixText, matrixString);

        // draw graph
        cmgc.buildCircleMapGraph();
    };

    /**
     * Add ring data to the eventAlbum.
     * @param {Object} ringName
     * @param {Object} ringData
     */
    cmgc.addRingData = function(ringName, ringData) {
        // console.log("ringName", ringName);
        // console.log("ringData", ringData);

        // initialize where needed
        if (!cmgc.options.hasOwnProperty("ringsList")) {
            cmgc.options["ringsList"] = [];
        }

        if (!cmgc.options.hasOwnProperty("eventAlbum")) {
            cmgc.options["eventAlbum"] = new eventData.OD_eventAlbum();
        }

        // load data
        var eventAlbum = cmgc.options["eventAlbum"];
        medbookDataLoader.genericMatrixData(ringData, ringName, eventAlbum);

        cmgc.options["ringsList"].push(ringName);
    };

    /**
     * Use the saved objects to build a new circleMapGraph.
     */
    cmgc.buildCircleMapGraph = function() {



    };

})(circleMapGraphControls);
