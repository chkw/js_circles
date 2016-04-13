js_circles
===

This repository contains javascript for drawing a **circle map network graph**. A circle map network graph is a network graph in which the nodes are visualized as **circle maps**. This is a pure-javascript rewrite of the circle map network graph code that originally appeared in the UCSC Interaction Browser, which was a GWT project (citation below).

Included are two versions of this code.
  1. `circleMapGraph_package.js` version requires data provided from javascript. It works by passing in some data to `circleMapGraph.build()`.
  2. `circleMapGraph_webtool.js` version has UI controls for user-provided data. Use this line of javascript: `circleMapGraphControls.buildControls(controlsDivElement, circleMapGraphDivElem);`.

Python Command Line Scripts
===

Circle Maps can also be generated with the python command line scripts at <https://github.com/chkw/stuartlab-circleplotter-py>.


Meteor Package
===

There is a Meteor Package that uses this code. It is at <https://atmospherejs.com/limax/circlemap-graph>.

3rd Party Dependencies
===

  * d3
  * jQuery-contextMenu
  * jquery
  * jstat
  * pablo
  * underscore
  * webcola

Citation for The UCSC Interaction Browser
===

Wong CK, Vaske CJ, Ng S, Sanborn J, Benz S. Haussler D, Stuart J. The UCSC Interaction Browser: Multi-dimensional data views in pathway context. Nucleic Acids Research. 2013 Jul 1;41(Web Server issue):W218-24. doi: 10.1093/nar/gkt473. PMID:23748957.
