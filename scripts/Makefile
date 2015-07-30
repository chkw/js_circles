
CLOSURE_COMPILER_JAR = ~/git/closure-compiler/build/compiler.jar
#COMPILATION_LEVEL = WHITESPACE_ONLY
COMPILATION_LEVEL = SIMPLE_OPTIMIZATIONS
#COMPILATION_LEVEL = ADVANCED_OPTIMIZATIONS

#SCRIPTS= ../bower_components/jquery/dist/jquery.min.js ../bower_components/jQuery-contextMenu/src/jquery.contextMenu.js ../bower_components/jstat/dist/jstat.min.js ../bower_components/d3/d3.min.js utils.js eventData.js graphData.js medbook_data_load.js circleMapGenerator.js circleMapGraph.js
SCRIPTS= utils.js

test:

sync_meteor: circleMapGraph_package.js
	cp $< ~/workspace/MedBook-PatientCare/webapp/packages/circlemap-graph/. ;
	\

circleMapGraph_package.js:
	java -jar $(CLOSURE_COMPILER_JAR) --compilation_level $(COMPILATION_LEVEL) --js_output_file=$@ $(SCRIPTS) ;

circleMapGraph_package_dev.js:
	cat $(SCRIPTS) \
	> 1.tmp ;
	\
	mv 1.tmp $@ ;
	\
	rm -f 1.tmp ;
	\
