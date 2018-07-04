'use strict';

const { runAllTests }			= require( './testing_suite' );
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
const fileTest					= require( './server/components/logger/components/transport_types/file_test' );
const dataServerTest			= require( './server/components/caching/data_server_test' );
const memoryDataServerTest		= require( './server/components/caching/memory/memory_data_server_test' );
const bodyParserHandlerTest		= require( './server/components/body_parser_handler_test' );
const bodyParserTest			= require( './server/components/body_parsers/body_parser_test' );
const formBodyParserTest		= require( './server/components/body_parsers/form_body_parser_test' );
const jsonBodyParserTest		= require( './server/components/body_parsers/json_body_parser_test' );
const multipartDataParserTest	= require( './server/components/body_parsers/multipart_data_parser_test' );
const child_process				= require( 'child_process' );

let spawnedServer				= child_process.spawn(
	'node',
	['tests/external_server_for_testing.js'],
	{},
	( error, stdout, stderr )=> {
		console.log( error );
		console.log( stdout );
		console.error( stderr );
	}
);

runAllTests({
	dieOnFirstError	: true,
	debug			: true,
	silent			: false,
	filter			: '',
	callback		: ( err )=>{
		spawnedServer.kill();

		if ( err )
		{
			throw new Error( err );
		}
		else
		{
			process.exit( 0 );
		}
	}
});

module.exports	= {};
