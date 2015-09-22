/**
 * controls for loading data to a circleMap graph.
 */

circleMapGraphControls = ( typeof circleMapGraphControls === "undefined") ? {} : circleMapGraphControls;
(function(cmgc) {"use strict";

    cmgc.options = {};

    cmgc.buildControls = function(containerElem, circleMapGraphContainerElem) {
        utils.removeChildElems(containerElem);

        cmgc.options["containerDiv"] = circleMapGraphContainerElem;
        cmgc.options["circleDataLoaded"] = (utils.getQueryStringParameterByName('circles').toLowerCase() === 'true');
        // cmgc.options["circleDataLoaded"] = false;

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

        var radioButtonsDiv = document.createElement("div");
        containerElem.appendChild(radioButtonsDiv);

        var exprRadio = document.createElement("input");
        radioButtonsDiv.appendChild(exprRadio);
        utils.setElemAttributes(exprRadio, {
            "id" : "exprRadio",
            "name" : "allowedValues",
            "type" : "radio",
            "value" : "expression data"
        });
        radioButtonsDiv.innerHTML = radioButtonsDiv.innerHTML + "expression data <BR>";

        var numericRadio = document.createElement("input");
        radioButtonsDiv.appendChild(numericRadio);
        utils.setElemAttributes(numericRadio, {
            "id" : "numericRadio",
            "name" : "allowedValues",
            "type" : "radio",
            "value" : "numeric",
            "checked" : true
        });
        radioButtonsDiv.innerHTML = radioButtonsDiv.innerHTML + "other numeric data <BR>";

        var categoricRadio = document.createElement("input");
        radioButtonsDiv.appendChild(categoricRadio);
        utils.setElemAttributes(categoricRadio, {
            "id" : "categoricRadio",
            "name" : "allowedValues",
            "type" : "radio",
            "value" : "categoric"
        });
        radioButtonsDiv.innerHTML = radioButtonsDiv.innerHTML + "categoric data <BR>";

        var clinicalRadio = document.createElement("input");
        radioButtonsDiv.appendChild(clinicalRadio);
        utils.setElemAttributes(clinicalRadio, {
            "id" : "clinicalRadio",
            "name" : "allowedValues",
            "type" : "radio",
            "value" : "clinical"
        });
        radioButtonsDiv.innerHTML = radioButtonsDiv.innerHTML + "clinical data <BR>";

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

        var datasetAllowedVals = $('input[name="allowedValues"]:checked').val();
        // console.log("datasetAllowedVals", datasetAllowedVals);
        if (datasetAllowedVals === "clinical") {
            document.getElementById("matrixText").value = "clinical data";
        }

        var matrixTextAreaElem = document.getElementById("matrixTextArea");
        var matrixString = matrixTextAreaElem.value;
        // console.log("matrixString", matrixString);
        if (matrixString === "") {
            window.alert("no ring data");
            return;
        }

        var matrixTextElem = document.getElementById("matrixText");
        var matrixText = matrixTextElem.value;
        // console.log("matrixText", matrixText);
        if (matrixText === "") {
            window.alert("no data name");
            return;
        }

        // load ring data
        cmgc.addRingData(matrixText, matrixString, datasetAllowedVals);

        // draw graph
        cmgc.buildCircleMapGraph();
    };

    /**
     * Add ring data to the eventAlbum.
     * @param {Object} ringName
     * @param {Object} ringData
     * @param {Object} datasetAllowedVals
     */
    cmgc.addRingData = function(ringName, ringData, datasetAllowedVals) {
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

        var returnFeatures = medbookDataLoader.genericMatrixData(ringData, ringName, eventAlbum, datasetAllowedVals);

        if (_.isUndefined(returnFeatures)) {
            cmgc.options["ringsList"].push(ringName);
        } else {
            _.each(returnFeatures, function(feature) {
                cmgc.options["ringsList"].push(feature);
            });
        }
    };

    /**
     * Use the saved objects to build a new circleMapGraph.
     */
    cmgc.buildCircleMapGraph = function() {
        circleMapGraph.build(cmgc.options);
    };

})(circleMapGraphControls);
