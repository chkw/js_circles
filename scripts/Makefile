
CLOSURE_COMPILER_JAR = ~/git/closure-compiler/build/compiler.jar
#COMPILATION_LEVEL = WHITESPACE_ONLY
COMPILATION_LEVEL = SIMPLE_OPTIMIZATIONS
#COMPILATION_LEVEL = ADVANCED_OPTIMIZATIONS

BOWER_DIR=../bower_components

# cola.js contains an object function that is passed a "window" obect that Meteor claims is undefined. Change this to null to make it work.
SCRIPTS=$(BOWER_DIR)/webcola/WebCola/cola.js $(BOWER_DIR)/jstat/dist/jstat.js utils.js eventData.js graphData.js medbook_data_load.js circleMapGenerator.js circleMapGraph.js

STANDALONE_SCRIPTS=$(BOWER_DIR)/pablo/pablo.js $(BOWER_DIR)/underscore/underscore.js $(BOWER_DIR)/d3/d3.min.js $(BOWER_DIR)/jquery/dist/jquery.min.js $(BOWER_DIR)/jQuery-contextMenu/src/jquery.contextMenu.js $(BOWER_DIR)/webcola/WebCola/cola.js $(BOWER_DIR)/jstat/dist/jstat.js utils.js eventData.js graphData.js medbook_data_load.js circleMapGenerator.js circleMapGraph.js circleMapGraphControls.js

test:

circleMapGraph_webtool.js:
	java -jar $(CLOSURE_COMPILER_JAR) --compilation_level $(COMPILATION_LEVEL) --js_output_file=$@ $(STANDALONE_SCRIPTS) ;

sync_meteor: circleMapGraph_package_dev.js
	cp $< ~/workspace/MedBook-Packages/circlemap-graph/circleMapGraph_package.js ;
	\

circleMapGraph_package.js:
	java -jar $(CLOSURE_COMPILER_JAR) --compilation_level $(COMPILATION_LEVEL) --js_output_file=$@ $(SCRIPTS) ;

circleMapGraph_package_dev.js:
	rm -f 1.tmp ;
	\
	for script in $(SCRIPTS) ; do \
		cat $${script} \
		>> 1.tmp ; \
		\
		echo " // end of $${script}" \
		>> 1.tmp ; \
		\
		echo " // end of $${script}" \
		>> 1.tmp ; \
		\
	done ; \
	\
	mv 1.tmp $@ ;
	\
	rm -f 1.tmp ;
	\
