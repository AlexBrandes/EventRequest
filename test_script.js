'use strict';

const { runAllTests }	= require( './tests/test_helper' );
const testSuites		= require( './tests/test_suites' );
require( './tests/test_bootstrap' );

let startTests	= ()=>{
	testSuites.templatingEngine();
	testSuites.rateLimiterSuite();
	testSuites.helpersSuite();
	testSuites.errorSuite();
	testSuites.eventSuite();
	testSuites.routingSuite();
	testSuites.cachingSuite();
	testSuites.securitySuite();
	testSuites.loggingSuite();
	testSuites.bodyParserSuite();
	testSuites.validationSuite();
	testSuites.pluginsSuite();

	runAllTests({
		dieOnFirstError	: true,
		debug			: true,
		silent			: true,
		filter			: ''
	});
};

startTests();