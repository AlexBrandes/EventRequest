'use strict';

// Dependencies
const { assert, test, helpers }	= require( '../../../test_helper' );
const TemplatingEnginePlugin	= require( '../../../../server/plugins/available_plugins/templating_engine_plugin' );
const Router					= require( '../../../../server/components/routing/router' );
const path						= require( 'path' );

class TestTemplatingEngine
{
	render( html, variables )
	{
		return 'rendered';
	}
}

test({
	message		: 'TemplatingEnginePlugin calls the render function of the engine and sends the rendered html successfully and attaches a render function',
	test		: ( done )=>{
		let eventRequest			= helpers.getEventRequest( 'GET', '/tests/fixture/test.css' );
		let templatingEnginePlugin	= new TemplatingEnginePlugin( 'id', { engine : new TestTemplatingEngine(), templateDir: path.join( __dirname, './fixture/templates' ) } );
		let router					= new Router();
		let called					= 0;

		eventRequest._mock({
			method			: 'send',
			shouldReturn	: ()=>{
				called	++;
			},
			with			: [['rendered', 200, true]],
			called			: 1
		});

		let pluginMiddlewares	= templatingEnginePlugin.getPluginMiddleware();

		assert.equal( 1, pluginMiddlewares.length );
		assert.equal( true, typeof eventRequest.render === 'undefined' );

		router.add( pluginMiddlewares[0] );
		router.add( helpers.getEmptyMiddleware() );

		eventRequest.setBlock( router.getExecutionBlockForCurrentEvent( eventRequest ) );
		eventRequest.next();
		eventRequest.render( 'test', {}, ( err )=>{
			assert.equal( 1, called );
			assert.equal( false, err );
			assert.equal( false, typeof eventRequest.render === 'undefined' );
			assert.equal( false, typeof eventRequest.templateDir === 'undefined' );
			assert.equal( false, typeof eventRequest.templatingEngine === 'undefined' );

			done();
		} );

	}
});