'use strict';

const { runAllTests }	= require( './tests/test_helper' );
const testSuites		= require( './tests/test_suites' );
require( './tests/test_bootstrap' );

let startTests	= ()=>{
	testSuites.securitySuite();
	testSuites.templatingEngine();
	testSuites.helpersSuite();
	testSuites.errorSuite();
	testSuites.eventSuite();
	testSuites.routingSuite();
	testSuites.loggingSuite();
	testSuites.bodyParserSuite();
	testSuites.validationSuite();
	testSuites.pluginsSuite();
	testSuites.cachingSuite();
	testSuites.rateLimiterSuite();

	runAllTests({
		dieOnFirstError	: true,
		debug			: true,
		silent			: false,
		filter			: ''
	});
};

startTests();