'use strict';

const { test, runAllTests }		= require( './testing_suite' );
const eventTest					= require( './server/event_test' );
const routeTest					= require( './server/route_test' );
const routerTest				= require( './server/router_test' );
const serverTest				= require( './server/server_test' );
const middlewareContainerTest	= require( './server/middleware_container_test' );
const loggurTest				= require( './server/components/logger/loggur_test' );
const logTest					= require( './server/components/logger/components/log_test' );
const loggerTest				= require( './server/components/logger/components/logger_test' );
const transportTest				= require( './server/components/logger/components/transport_types/transport_test' );
const consoleTest				= require( './server/components/logger/components/transport_types/console_test' );
const child_process				= require( 'child_process' );

let spawnedServer				= child_process.spawn(
	'node',
	['tests/external_server_for_testing.js'],
	{},
	( error, stdout, stderr )=> {
		console.log( stdout );
		console.error( stderr );
	}
);

runAllTests({
	dieOnFirstError	: true,
	debug			: false,
	silent			: false,
	callback		: ( err )=>{
		spawnedServer.kill();

		if ( err )
		{
			throw new Error( err );
		}
	}
});

module.exports	= {};
