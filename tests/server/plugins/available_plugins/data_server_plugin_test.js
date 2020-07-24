'use strict';

const DataServerPlugin			= require( '../../../../server/plugins/available_plugins/data_server_plugin' );
const DataServer				= require( '../../../../server/components/caching/data_server' );
const Router					= require( '../../../../server/components/routing/router' );
const { assert, test, helpers }	= require( '../../../test_helper' );
const path						= require( 'path' );
const fs						= require( 'fs' );

const PROJECT_ROOT				= path.parse( require.main.filename ).dir;
const DEFAULT_PERSIST_FILE		= path.join( PROJECT_ROOT, 'cache' );

/**
 * @brief	Removes the cache file
 */
function removeCache( dataServer )
{
	if ( dataServer )
	{
		dataServer.stop();
	}
	else
	{
		if ( fs.existsSync( DEFAULT_PERSIST_FILE ) )
			fs.unlinkSync( DEFAULT_PERSIST_FILE );
	}
}

test({
	message	: 'DataServerPlugin.constructor does not throw',
	test	: ( done )=>{
		assert.doesNotThrow(() => {
			new DataServerPlugin( 'plugin_id', { key: 'value' } );
		});

		done();
	}
});

test({
	message	: 'DataServerPlugin.getServer returns a DataServer',
	test	: ( done )=>{
		const options					= { dataServerOptions: { ttl: 100, persist: false } };
		const memoryDataServerPlugin	= new DataServerPlugin( 'plugin_id', options );

		const dataServer				= memoryDataServerPlugin.getServer();

		assert.deepStrictEqual( memoryDataServerPlugin.dataServerOptions, options.dataServerOptions );
		assert.equal( memoryDataServerPlugin.server instanceof DataServer, true );

		removeCache( dataServer );

		done();
	}
});

test({
	message	: 'DataServerPlugin.getPluginMiddleware returns a middleware that adds a dataServer',
	test	: ( done )=>{
		const options					= { dataServerOptions: { persist: false } };
		const memoryDataServerPlugin	= new DataServerPlugin( 'id', options );
		const eventRequest				= helpers.getEventRequest();
		const router					= new Router();
		const middleware				= memoryDataServerPlugin.getPluginMiddleware();
		let called						= 0;

		eventRequest._mock({
			method			: 'on',
			shouldReturn	: () => {
				called	++;
			},
			with			: [
				['cleanUp', undefined],
			],
			called			: 1
		});

		assert.equal( 1, middleware.length );

		router.add( middleware[0] );
		router.add( {
			handler	: ( event )=>{
				assert.equal( typeof event.dataServer !== 'undefined', true );
				assert.equal( event.dataServer instanceof DataServer, true );
				assert.equal( called, 1 );

				removeCache( event.dataServer );
				done();
			}
		} );

		eventRequest._setBlock( router.getExecutionBlockForCurrentEvent( eventRequest ) );
		setTimeout(() => {
			eventRequest.next();
		}, 250 );
	}
});