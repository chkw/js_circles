/**
 * controls for loading data to a circleMap graph.
 */

circleMapGraphControls = (typeof circleMapGraphControls === "undefined") ? {} : circleMapGraphControls;
(function(cmgc) {
    "use strict";

    cmgc.options = {};

    cmgc.buildControls = function(containerElem, circleMapGraphContainerElem) {
        utils.removeChildElems(containerElem);

        cmgc.options.containerDiv = circleMapGraphContainerElem;
        // cmgc.options["circleDataLoaded"] = (utils.getQueryStringParameterByName('circles').toLowerCase() === 'true');
        // cmgc.options["circleDataLoaded"] = false;
        cmgc.options.circleDataLoaded = true;

        var pathwayTextAreaElem = document.createElement("textArea");
        containerElem.appendChild(pathwayTextAreaElem);
        utils.setElemAttributes(pathwayTextAreaElem, {
            "id": "pathwayTextArea",
            "rows": 3,
            "cols": 25,
            "placeholder": "paste in sif data for network graph"
        });

        // TODO: pathway file type
        var pathwayFileTypeRadioDiv = document.createElement("div");
        containerElem.appendChild(pathwayFileTypeRadioDiv);

        var sifFileTypeRadioButton = document.createElement("input");
        pathwayFileTypeRadioDiv.appendChild(sifFileTypeRadioButton);
        utils.setElemAttributes(sifFileTypeRadioButton, {
            "id": "sifFileTypeRadio",
            "name": "pathwayFileType",
            "type": "radio",
            "value": "sif",
            "checked": true
        });
        pathwayFileTypeRadioDiv.innerHTML = pathwayFileTypeRadioDiv.innerHTML + "sif format <BR>";

        var superpathwayFileTypeRadioButton = document.createElement("input");
        pathwayFileTypeRadioDiv.appendChild(superpathwayFileTypeRadioButton);
        utils.setElemAttributes(superpathwayFileTypeRadioButton, {
            "id": "superpathwayFileTypeRadio",
            "name": "pathwayFileType",
            "type": "radio",
            "value": "superpathway"
        });
        pathwayFileTypeRadioDiv.innerHTML = pathwayFileTypeRadioDiv.innerHTML + "superpathway format <BR>";


        var setPathwayButton = document.createElement("button");
        containerElem.appendChild(setPathwayButton);
        utils.setElemAttributes(setPathwayButton, {
            "id": "setPathwayButton"
        });
        setPathwayButton.innerHTML = "set graph data";

        setPathwayButton.onclick = setPathwayClickHandler;

        containerElem.appendChild(document.createElement("hr"));

        var matrixTextAreaElem = document.createElement("textArea");
        containerElem.appendChild(matrixTextAreaElem);
        utils.setElemAttributes(matrixTextAreaElem, {
            "id": "matrixTextArea",
            "rows": 3,
            "cols": 25,
            "placeholder": "paste in matrix data for rings"
        });

        var matrixTextElem = document.createElement("input");
        containerElem.appendChild(matrixTextElem);
        utils.setElemAttributes(matrixTextElem, {
            "id": "matrixText",
            "type": "text",
            "placeholder": "ring name"
        });

        // radio buttons for matrix data type
        var radioButtonsDiv = document.createElement("div");
        containerElem.appendChild(radioButtonsDiv);

        var numericRadio = document.createElement("input");
        radioButtonsDiv.appendChild(numericRadio);
        utils.setElemAttributes(numericRadio, {
            "id": "numericRadio",
            "name": "allowedValues",
            "type": "radio",
            "value": "numeric",
            "checked": true
        });
        radioButtonsDiv.innerHTML = radioButtonsDiv.innerHTML + "numeric data <BR>";

        var clinicalRadio = document.createElement("input");
        radioButtonsDiv.appendChild(clinicalRadio);
        utils.setElemAttributes(clinicalRadio, {
            "id": "clinicalRadio",
            "name": "allowedValues",
            "type": "radio",
            "value": "clinical"
        });
        radioButtonsDiv.innerHTML = radioButtonsDiv.innerHTML + "clinical data <BR>";

        var centerRadio = document.createElement("input");
        radioButtonsDiv.appendChild(centerRadio);
        utils.setElemAttributes(centerRadio, {
            "id": "centerRadio",
            "name": "allowedValues",
            "type": "radio",
            "value": "center"
        });
        radioButtonsDiv.innerHTML = radioButtonsDiv.innerHTML + "node center <BR>";

        // button to submit matrix data
        var matrixButtonElem = document.createElement("button");
        containerElem.appendChild(matrixButtonElem);
        utils.setElemAttributes(matrixButtonElem, {
            "id": "matrixButton"
        });
        matrixButtonElem.innerHTML = "set ring data";

        matrixButtonElem.onclick = matrixButtonClickHandler;

        containerElem.appendChild(document.createElement("hr"));

        // TODO controls for inputing discrete color mapping
        var discreteColorMappingDiv = document.createElement("div");
        containerElem.appendChild(discreteColorMappingDiv);

        discreteColorMappingDiv.innerHTML = discreteColorMappingDiv.innerHTML + "custom color mapping for clinical data ... <BR>";

        var discreteColorMappingTextAreaElem = document.createElement("textArea");
        containerElem.appendChild(discreteColorMappingTextAreaElem);
        utils.setElemAttributes(discreteColorMappingTextAreaElem, {
            "id": "discreteColorMappingTextArea",
            "rows": 3,
            "cols": 25,
            "placeholder": "category - tab - color"
        });

        var discreteColorMappingButtonElem = document.createElement("button");
        containerElem.appendChild(discreteColorMappingButtonElem);
        utils.setElemAttributes(discreteColorMappingButtonElem, {
            "id": "discreteColorMappingButton"
        });
        discreteColorMappingButtonElem.innerHTML = "set colors";

        discreteColorMappingButtonElem.onclick = colorMappingButtonClickHandler;

        containerElem.appendChild(document.createElement("hr"));

        // radio buttons for color mapping option
        var colorMappingOptionDiv = document.createElement("div");
        containerElem.appendChild(colorMappingOptionDiv);

        colorMappingOptionDiv.innerHTML = colorMappingOptionDiv.innerHTML + "Compute sample min/max values for color mapping ... <BR>";

        var perNodeRadio = document.createElement("input");
        colorMappingOptionDiv.appendChild(perNodeRadio);
        utils.setElemAttributes(perNodeRadio, {
            "id": "perNodeRadio",
            "name": "colorMappingOption",
            "type": "radio",
            "value": "perNode",
            "checked": true
        });
        colorMappingOptionDiv.innerHTML = colorMappingOptionDiv.innerHTML + "per node <BR>";

        var perDatatypeRadio = document.createElement("input");
        colorMappingOptionDiv.appendChild(perDatatypeRadio);
        utils.setElemAttributes(perDatatypeRadio, {
            "id": "perDatatypeRadio",
            "name": "colorMappingOption",
            "type": "radio",
            "value": "perDatatype"
        });
        colorMappingOptionDiv.innerHTML = colorMappingOptionDiv.innerHTML + "per datatype <BR>";

        $('input[name="colorMappingOption"]').change(function(eventObj) {
            var name = eventObj.target.name;
            var radioVal = $('input[name="' + name + '"]:checked').val();
            console.log(name + " changed to:", radioVal);
            cmgc.options.colorMappingOption = radioVal;
            cmgc.buildCircleMapGraph();
        });

        containerElem.appendChild(document.createElement("hr"));

        // radio buttons for download image file type
        var fileTypeRadioDiv = document.createElement("div");
        containerElem.appendChild(fileTypeRadioDiv);

        var svgFileTypeRadio = document.createElement("input");
        fileTypeRadioDiv.appendChild(svgFileTypeRadio);
        utils.setElemAttributes(svgFileTypeRadio, {
            "id": "svgFileTypeRadio",
            "name": "fileTypeRadio",
            "type": "radio",
            "value": "svg",
            "checked": true
        });
        fileTypeRadioDiv.innerHTML = fileTypeRadioDiv.innerHTML + "svg <BR>";

        var pngFileTypeRadio = document.createElement("input");
        fileTypeRadioDiv.appendChild(pngFileTypeRadio);
        utils.setElemAttributes(pngFileTypeRadio, {
            "id": "pngFileTypeRadio",
            "name": "fileTypeRadio",
            "type": "radio",
            "value": "png"
        });
        fileTypeRadioDiv.innerHTML = fileTypeRadioDiv.innerHTML + "png <BR>";

        var jpgFileTypeRadio = document.createElement("input");
        fileTypeRadioDiv.appendChild(jpgFileTypeRadio);
        utils.setElemAttributes(jpgFileTypeRadio, {
            "id": "jpgFileTypeRadio",
            "name": "fileTypeRadio",
            "type": "radio",
            "value": "jpg"
        });
        fileTypeRadioDiv.innerHTML = fileTypeRadioDiv.innerHTML + "jpg <BR>";

        // button to download image file
        var saveButtonElem = document.createElement("button");
        containerElem.appendChild(saveButtonElem);
        utils.setElemAttributes(saveButtonElem, {
            "id": "saveButton"
        });
        saveButtonElem.innerHTML = "download image file";

        saveButtonElem.onclick = saveButtonClickHandler;

        // handle tab keydown events in textareas
        _.each(document.querySelectorAll("textarea"), function(textAreaElem) {
            textAreaElem.addEventListener("keydown", utils.handleTabsAsText, false);
        });
    };

    // TODO
    var colorMappingButtonClickHandler = function() {
        console.log("clicked discreteColorMappingButton");
        var discreteColorMappingTextAreaElem = document.getElementById("discreteColorMappingTextArea");
        var colorMappingString = discreteColorMappingTextAreaElem.value;

        if (colorMappingString === "") {
            window.alert("no mapping string");
            return;
        }

        var colorMapping = {};
        var lines = colorMappingString.split('\n');
        _.each(lines, function(line) {
            line = line.trim();
            var fields = line.split("\t", 2);
            colorMapping[fields[0]] = fields[1];
        });

        console.log("parsed colorMapping", colorMapping);

        // load graph data
        cmgc.options.discreteColorMapping = colorMapping;

        // draw graph
        cmgc.buildCircleMapGraph();
    };

    var setPathwayClickHandler = function() {
        console.log("clicked setPathwayButton");

        var pathwayFileType = $('input[name="pathwayFileType"]:checked').val();
        console.log("pathwayFileType", pathwayFileType);

        var pathwayTextAreaElem = document.getElementById("pathwayTextArea");
        var pathwayTextString = pathwayTextAreaElem.value;

        if (pathwayTextString === "") {
            window.alert("no pathway data");
            return;
        }

        var extractSifFromSuperpathway = function(pathwayTextString) {
            var sifLines = [];

            var lines = pathwayTextString.split("\n");
            _.each(lines, function(line) {
                var fields = line.split("\t");
                if (fields.length != 3) {
                    return null;
                }
                sifLines.push(fields[0] + "\t" + fields[2] + "\t" + fields[1]);
            });

            return sifLines.join("\n");
        };

        // load graph data
        if (pathwayFileType === "superpathway") {
            cmgc.options.sifGraphData = extractSifFromSuperpathway(pathwayTextString);
        } else {
            cmgc.options.sifGraphData = pathwayTextString;
        }

        // draw graph
        cmgc.buildCircleMapGraph();
    };

    var matrixButtonClickHandler = function() {
        console.log("clicked matrixButton");

        var datasetAllowedVals = $('input[name="allowedValues"]:checked').val();
        // console.log("datasetAllowedVals", datasetAllowedVals);
        if (datasetAllowedVals === "clinical") {
            document.getElementById("matrixText").value = "clinical data";
        } else if (datasetAllowedVals === "center") {
            document.getElementById("matrixText").value = "node center";
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

        if (datasetAllowedVals === "center") {
            // node center data, a dict of node:score where score is a 0-centered, normalized value [-1,1]
            var parsedRows = d3.tsv.parseRows(matrixString);
            var centerScores = {};
            _.each(parsedRows, function(parsedRow) {
                if (parsedRow.length >= 2) {
                    var nodeName = parsedRow[0];
                    var score = parsedRow[1];
                    centerScores[nodeName] = score;
                }
            });
            // console.log("centerScores", centerScores);
            cmgc.options.centerScores = centerScores;
        } else {
            // load ring data
            cmgc.addRingData(matrixText, matrixString, datasetAllowedVals);
        }

        // draw graph
        cmgc.buildCircleMapGraph();
    };

    // use pablo.js to save a file
    var saveButtonClickHandler = function() {
        console.log("clicked saveButton");

        var fileTypeRadioVal = $('input[name="fileTypeRadio"]:checked').val();
        console.log("fileTypeRadioVal", fileTypeRadioVal);
        cmgc.options.imageFileFormat = fileTypeRadioVal;

        var defaultFileName = "graph";
        var supportDownload = Pablo.support.download;
        var type = cmgc.options.imageFileFormat || "svg";

        if (supportDownload) {
            // get a pablo collection
            var pabloCircleMapsSvg = Pablo('#circleMaps');

            type = type.toLowerCase();
            if (_.contains(["jpeg", "jpg"], type)) {
                type = "jpeg";
            } else if (type === "png") {
                type = "png";
            } else {
                type = "svg";
            }

            // save image file
            pabloCircleMapsSvg.download(type, defaultFileName, function(result) {
                var gotError = result.error ? true : false;
                console.log(type, "download worked?", !gotError);
            });

        } else {
            window.alert("Download not supported on this browser.");
        }
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
            cmgc.options.ringsList = [];
        }

        if (!cmgc.options.hasOwnProperty("eventAlbum")) {
            cmgc.options.eventAlbum = new eventData.OD_eventAlbum();
        }

        // load data
        var eventAlbum = cmgc.options.eventAlbum;

        var returnFeatures = medbookDataLoader.genericMatrixData(ringData, ringName, eventAlbum, datasetAllowedVals);

        if (_.isUndefined(returnFeatures)) {
            cmgc.options.ringsList.push(ringName);
        } else {
            _.each(returnFeatures, function(feature) {
                cmgc.options.ringsList.push(feature);
            });
        }
    };

    /**
     * Use the saved objects to build a new circleMapGraph.
     */
    cmgc.buildCircleMapGraph = function() {
        console.log("options", cmgc.options);
        circleMapGraph.build(cmgc.options);
    };

})(circleMapGraphControls);
