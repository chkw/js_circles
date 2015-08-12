
CLOSURE_COMPILER_JAR = ~/git/closure-compiler/build/compiler.jar
#COMPILATION_LEVEL = WHITESPACE_ONLY
COMPILATION_LEVEL = SIMPLE_OPTIMIZATIONS
#COMPILATION_LEVEL = ADVANCED_OPTIMIZATIONS

BOWER_DIR=../bower_components

#SCRIPTS= ../bower_components/jquery/dist/jquery.min.js ../bower_components/jQuery-contextMenu/src/jquery.contextMenu.js ../bower_components/jstat/dist/jstat.min.js ../bower_components/d3/d3.min.js utils.js eventData.js graphData.js medbook_data_load.js circleMapGenerator.js circleMapGraph.js

#SCRIPTS=$(BOWER_DIR)/jquery/dist/jquery.js $(BOWER_DIR)/jQuery-contextMenu/src/jquery.contextMenu.js $(BOWER_DIR)/d3/d3.js $(BOWER_DIR)/jstat/dist/jstat.js utils.js eventData.js graphData.js medbook_data_load.js circleMapGenerator.js circleMapGraph.js
SCRIPTS=$(BOWER_DIR)/webcola/WebCola/cola.min.js $(BOWER_DIR)/jstat/dist/jstat.js utils.js eventData.js graphData.js medbook_data_load.js circleMapGenerator.js circleMapGraph.js

test:

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
