'use strict';

// Dependencies
const { assert, test, helpers, Mock }	= require( '../test_helper' );
const App								= require( './../../server/server' );
const path								= require( 'path' );
const http								= require( 'http' );
const fs								= require( 'fs' );
const Router							= require( './../../server/components/routing/router' );
const DataServer						= require( './../../server/components/caching/data_server' );
const Session							= require( './../../server/components/session/session' );
const PreloadedPluginManager			= require( './../../server/plugins/preloaded_plugins' );
const Server							= App.class;

const app								= App();

test({
	message	: 'Server.constructor starts without crashing with defaults',
	test	: ( done )=>{
		assert.doesNotThrow( ()=>{
			const server	= new Server();

			assert.equal( 1, server.router.middleware.length );
		});
		done();
	}
});


test({
	message	: 'Server.constructor defaults',
	test	: ( done )=>{
		let server	= new Server();
		assert.equal( true, server.router instanceof Router );
		assert.equal( 1, server.router.middleware.length );
		assert.equal( 2, Object.keys( server.plugins ).length );
		assert.equal( typeof server.pluginBag === 'object', true );
		assert.deepStrictEqual( server.pluginManager, PreloadedPluginManager );

		assert.equal( typeof server.er_timeout === 'string', true );
		assert.equal( typeof server.er_env === 'string', true );
		assert.equal( typeof server.er_rate_limits === 'string', true );
		assert.equal( typeof server.er_static_resources === 'string', true );
		assert.equal( typeof server.er_cache_server === 'string', true );
		assert.equal( typeof server.er_templating_engine === 'string', true );
		assert.equal( typeof server.er_file_stream === 'string', true );
		assert.equal( typeof server.er_logger === 'string', true );
		assert.equal( typeof server.er_session === 'string', true );
		assert.equal( typeof server.er_response_cache === 'string', true );
		assert.equal( typeof server.er_body_parser_json === 'string', true );
		assert.equal( typeof server.er_body_parser_form === 'string', true );
		assert.equal( typeof server.er_body_parser_multipart === 'string', true );

		done();
	}
});

test({
	message	: 'Server is started',
	test	: ( done ) =>{
		helpers.sendServerRequest( '/ping' ).then(()=>{
			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.getPluginManager returns a pluginManager',
	test	: ( done ) =>{
		const server		= new Server();
		const pluginManager	= server.getPluginManager();

		assert.equal( true, pluginManager instanceof PreloadedPluginManager.constructor );
		done();
	}
});

test({
	message	: 'Server.add adds a handler with different permutations',
	test	: ( done ) =>{
		const server	= new Server();

		server.add({
			handler	:()=>{}
		});

		server.add({
			route	: '/',
			handler	:()=>{}
		});

		server.add({
			route	: '/',
			method	: 'GET',
			handler	:()=>{}
		});

		server.add({
			method	: 'GET',
			handler	:()=>{}
		});

		server.add({
			route	: '/',
			method	: 'GET'
		});

		server.add(()=>{});

		// 5 added 1 pre loaded
		assert.equal( 7, server.router.middleware.length );

		done();
	}
});

test({
	message	: 'Server.apply applies only a PluginInterface and a valid string',
	test	: ( done ) =>{
		const server			= new Server();

		const PluginManager		= server.getPluginManager();
		const staticResources	= PluginManager.getPlugin( 'er_static_resources' );

		server.apply( staticResources );
		server.apply( 'er_static_resources' );

		assert.throws(()=>{
			server.apply( 'wrong' );
		});

		assert.throws(()=>{
			server.apply( {} );
		});

		// 2 added 1 pre loaded
		assert.equal( 3, server.router.middleware.length );

		done();
	}
});

test({
	message	: 'Server.get works as intended',
	test	: ( done ) =>{
		const server		= new Server();
		const eventRequest	= helpers.getEventRequest( 'GET', '/' );

		server.get( '/', ( event )=>{
			event.next();
		});

		server.get( '/test', ( event )=>{
			event.next();
		});

		server.get( ( event )=>{
			event.next();
		});

		const router	= server.router;
		const block		= router.getExecutionBlockForCurrentEvent( eventRequest );

		assert.equal( 2, block.length );

		done();
	}
});

test({
	message	: 'Server.post works as intended',
	test	: ( done ) =>{
		const server		= new Server();
		const eventRequest	= helpers.getEventRequest( 'POST', '/' );

		server.post( '/', ( event )=>{
			event.next();
		});

		server.post( '/test', ( event )=>{
			event.next();
		});

		server.post( ( event )=>{
			event.next();
		});

		const router	= server.router;
		const block		= router.getExecutionBlockForCurrentEvent( eventRequest );

		assert.equal( 2, block.length );

		done();
	}
});

test({
	message	: 'Server.delete works as intended',
	test	: ( done ) =>{
		const server		= new Server();
		const eventRequest	= helpers.getEventRequest( 'DELETE', '/' );

		server.delete( '/', ( event )=>{
			event.next();
		});

		server.delete( '/test', ( event )=>{
			event.next();
		});

		server.delete( ( event )=>{
			event.next();
		});

		const router	= server.router;
		const block	= router.getExecutionBlockForCurrentEvent( eventRequest );

		assert.equal( 2, block.length );

		done();
	}
});

test({
	message	: 'Server.put works as intended',
	test	: ( done ) =>{
		const server		= new Server();
		const eventRequest	= helpers.getEventRequest( 'PUT', '/' );

		server.put( '/', ( event )=>{
			event.next();
		});

		server.put( '/test', ( event )=>{
			event.next();
		});

		server.put( ( event )=>{
			event.next();
		});

		const router	= server.router;
		const block		= router.getExecutionBlockForCurrentEvent( eventRequest );

		assert.equal( 2, block.length );

		done();
	}
});

test({
	message	: 'Server.define calls router.define',
	test	: ( done ) =>{
		const RouterMock		= Mock( Router );
		const middlewareName	= 'test';
		const server			= new Server();
		const router			= new RouterMock();
		let called				= false;

		router._mock({
			method			: 'define',
			shouldReturn	: ()=>{
				called	= true;
			}
		});

		server.router			= router;

		server.define( middlewareName, ()=>{} );

		called === true ? done() : done( 'Router.define was not called but should have been' );
	}
});

test({
	message	: 'Server() returns the same instance',
	test	: ( done )=>{
		const server	= App();
		const serverTwo	= App();

		server.define( 'testMiddleware', ()=>{} );

		assert.throws( ()=>{
			serverTwo.define( 'testMiddleware', ()=>{} );
		});

		App.cleanUp();

		done();
	}
});

test({
	message	: 'Server.cleanUp() cleans up',
	test	: ( done )=>{
		const server	= App();

		server.define( 'testMiddleware', ()=>{} );

		assert.throws( ()=>{
			server.define( 'testMiddleware', ()=>{} );
		});

		App.cleanUp();

		App().define( 'testMiddleware', ()=>{} );

		done();
	}
});

test({
	message	: 'App().attach() returns a function',
	test	: ( done )=>{
		assert.equal( typeof App().attach() === 'function', true );

		done();
	}
});

test({
	message	: 'App().attach() using a httpServer works as expected',
	test	: ( done )=>{
		const httpServer	= require( 'http' );
		const body			= '<h1>Hello World!</h1>';
		const port			= 1234;
		const app			= App();

		app.get( '/attachUsingHttpServer', ( event ) => {
			event.send( body, 201 );
		});

		const server	= httpServer.createServer( App().attach() );

		server.listen( port );

		server.on( 'listening', ()=>{
			helpers.sendServerRequest( '/attachUsingHttpServer', 'GET',  201, '', {}, port ).then(()=>{
				server.close();
				done();
			}).catch( done );
		} );
	}
});

test({
	message	: 'Server testGETWithoutRoute ( skipped cause it will fail all the others )',
	skipped	: true,
	test	: ( done )=>{
		const body	= 'testGET';
		app.get( ( event )=>{
			event.send( body );
		});

		helpers.sendServerRequest( '/testGET', 'POST', 404 ).then(()=>{
			return helpers.sendServerRequest( '/testGET', 'DELETE', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testGET', 'PUT', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testGET', 'HEAD', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testGET', 'COPY', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testGET', 'PATCH', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testGET' );
		}).then(( response )=>{
			assert.equal( response.body.toString(), body );

			done();
		}).catch( done );
	}
});

test({
	message	: 'Server testGET',
	test	: ( done )=>{
		const body	= 'testGET';
		app.get( '/testGET', ( event )=>{
			event.send( body );
		});

		helpers.sendServerRequest( '/testGET', 'POST', 404 ).then(()=>{
			return helpers.sendServerRequest( '/testGET', 'DELETE', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testGET', 'PUT', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testGET', 'HEAD', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testGET', 'COPY', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testGET', 'PATCH', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testGET' );
		}).then(( response )=>{
			assert.equal( response.body.toString(), body );

			done();
		}).catch( done );
	}
});

test({
	message	: 'Server testPOST',
	test	: ( done )=>{
		const body	= 'testPOST';
		app.post( '/testPOST', ( event )=>{
			event.send( body );
		});

		helpers.sendServerRequest( '/testPOST', 'GET', 404 ).then(()=>{
			return helpers.sendServerRequest( '/testPOST', 'DELETE', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPOST', 'PUT', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPOST', 'HEAD', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPOST', 'COPY', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPOST', 'PATCH', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPOST', 'POST' );
		}).then(( response )=>{
			assert.equal( response.body.toString(), body );

			done();
		}).catch( done );
	}
});

test({
	message	: 'Server testDELETE',
	test	: ( done )=>{
		const body	= 'testDELETE';
		app.delete( '/testDELETE', ( event )=>{
			event.send( body );
		});

		helpers.sendServerRequest( '/testDELETE', 'GET', 404 ).then(()=>{
			return helpers.sendServerRequest( '/testDELETE', 'POST', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testDELETE', 'PUT', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testDELETE', 'HEAD', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testDELETE', 'COPY', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testDELETE', 'PATCH', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testDELETE', 'DELETE' );
		}).then(( response )=>{
			assert.equal( response.body.toString(), body );

			done();
		}).catch( done );
	}
});

test({
	message	: 'Server testPUT',
	test	: ( done )=>{
		const body	= 'testPUT';
		app.put( '/testPUT', ( event )=>{
			event.send( body );
		});

		helpers.sendServerRequest( '/testPUT', 'GET', 404 ).then(()=>{
			return helpers.sendServerRequest( '/testPUT', 'POST', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPUT', 'DELETE', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPUT', 'HEAD', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPUT', 'COPY', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPUT', 'PATCH', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPUT', 'PUT' );
		}).then(( response )=>{
			assert.equal( response.body.toString(), body );

			done();
		}).catch( done );
	}
});

test({
	message	: 'Server testHEAD also head does not return body even if sent',
	test	: ( done )=>{
		const body	= 'testHEAD';
		app.head( '/testHEAD', ( event )=>{
			event.send( body );
		});

		helpers.sendServerRequest( '/testHEAD', 'GET', 404 ).then(()=>{
			return helpers.sendServerRequest( '/testHEAD', 'POST', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testHEAD', 'DELETE', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testHEAD', 'PUT', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testHEAD', 'COPY', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testHEAD', 'PATCH', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testHEAD', 'HEAD' );
		}).then(( response )=>{
			assert.equal( response.body.toString(), '' );

			done();
		}).catch( done );
	}
});

test({
	message	: 'Server testPATCH',
	test	: ( done )=>{
		const body	= 'testPATCH';
		app.patch( '/testPATCH', ( event )=>{
			event.send( body );
		});

		helpers.sendServerRequest( '/testPATCH', 'GET', 404 ).then(()=>{
			return helpers.sendServerRequest( '/testPATCH', 'POST', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPATCH', 'DELETE', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPATCH', 'PUT', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPATCH', 'COPY', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPATCH', 'HEAD', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPATCH', 'PATCH' );
		}).then(( response )=>{
			assert.equal( response.body.toString(), body );

			done();
		}).catch( done );
	}
});

test({
	message	: 'Server testGET with add',
	test	: ( done )=>{
		const body	= 'testGETWithAdd';
		app.add({
			method	: 'GET',
			route	: '/testGETWithAdd',
			handler	: ( event )=>{
				event.send( body );
			}
		});

		helpers.sendServerRequest( '/testGETWithAdd', 'POST', 404 ).then(()=>{
			return helpers.sendServerRequest( '/testGETWithAdd', 'DELETE', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testGETWithAdd', 'PUT', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testGETWithAdd', 'HEAD', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testGETWithAdd', 'COPY', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testGETWithAdd', 'PATCH', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testGETWithAdd' );
		}).then(( response )=>{
			assert.equal( response.body.toString(), body );

			done();
		}).catch( done );
	}
});

test({
	message	: 'Server testPOST with add',
	test	: ( done )=>{
		const body	= 'testPOSTWithAddWithAdd';
		app.add({
			method	: 'POST',
			route	: '/testPOSTWithAdd',
			handler	: ( event )=>{
				event.send( body );
			}
		});

		helpers.sendServerRequest( '/testPOSTWithAdd', 'GET', 404 ).then(()=>{
			return helpers.sendServerRequest( '/testPOSTWithAdd', 'DELETE', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPOSTWithAdd', 'PUT', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPOSTWithAdd', 'HEAD', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPOSTWithAdd', 'COPY', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPOSTWithAdd', 'PATCH', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPOSTWithAdd', 'POST' );
		}).then(( response )=>{
			assert.equal( response.body.toString(), body );

			done();
		}).catch( done );
	}
});

test({
	message	: 'Server testDELETE with add',
	test	: ( done )=>{
		const body	= 'testDELETEWithAdd';
		app.add({
			method	: 'DELETE',
			route	: '/testDELETEWithAdd',
			handler	: ( event )=>{
				event.send( body );
			}
		});

		helpers.sendServerRequest( '/testDELETEWithAdd', 'GET', 404 ).then(()=>{
			return helpers.sendServerRequest( '/testDELETEWithAdd', 'POST', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testDELETEWithAdd', 'PUT', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testDELETEWithAdd', 'HEAD', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testDELETEWithAdd', 'COPY', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testDELETEWithAdd', 'PATCH', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testDELETEWithAdd', 'DELETE' );
		}).then(( response )=>{
			assert.equal( response.body.toString(), body );

			done();
		}).catch( done );
	}
});

test({
	message	: 'Server testPUT with add',
	test	: ( done )=>{
		const body	= 'testPUTWithAdd';
		app.add({
			method	: 'PUT',
			route	: '/testPUTWithAdd',
			handler	: ( event )=>{
				event.send( body );
			}
		});

		helpers.sendServerRequest( '/testPUTWithAdd', 'GET', 404 ).then(()=>{
			return helpers.sendServerRequest( '/testPUTWithAdd', 'POST', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPUTWithAdd', 'DELETE', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPUTWithAdd', 'HEAD', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPUTWithAdd', 'COPY', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPUTWithAdd', 'PATCH', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPUTWithAdd', 'PUT' );
		}).then(( response )=>{
			assert.equal( response.body.toString(), body );

			done();
		}).catch( done );
	}
});

test({
	message	: 'Server testHEAD with add also head does not return body even if sent',
	test	: ( done )=>{
		const body	= 'testHEADWithAdd';
		app.add({
			method	: 'HEAD',
			route	: '/testHEADWithAdd',
			handler	: ( event )=>{
				event.send( body );
			}
		});

		helpers.sendServerRequest( '/testHEADWithAdd', 'GET', 404 ).then(()=>{
			return helpers.sendServerRequest( '/testHEADWithAdd', 'POST', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testHEADWithAdd', 'DELETE', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testHEADWithAdd', 'PUT', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testHEADWithAdd', 'COPY', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testHEADWithAdd', 'PATCH', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testHEADWithAdd', 'HEAD' );
		}).then(( response )=>{
			assert.equal( response.body.toString(), '' );

			done();
		}).catch( done );
	}
});

test({
	message	: 'Server testPATCH with add',
	test	: ( done )=>{
		const body	= 'testPATCHWithAdd';
		app.add({
			method	: 'PATCH',
			route	: '/testPATCHWithAdd',
			handler	: ( event )=>{
				event.send( body );
			}
		});

		helpers.sendServerRequest( '/testPATCHWithAdd', 'GET', 404 ).then(()=>{
			return helpers.sendServerRequest( '/testPATCHWithAdd', 'POST', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPATCHWithAdd', 'DELETE', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPATCHWithAdd', 'PUT', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPATCHWithAdd', 'COPY', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPATCHWithAdd', 'HEAD', 404 );
		}).then(()=>{
			return helpers.sendServerRequest( '/testPATCHWithAdd', 'PATCH' );
		}).then(( response )=>{
			assert.equal( response.body.toString(), body );

			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test add is case insensitive',
	test	: ( done )=>{
		const body			= 'testGETCaseInsensitive';
		const headerName	= 'testGETCaseInsensitive';
		const headerValue	= 'value';
		app.add({
			method	: 'GET',
			route	: '/testGETCaseInsensitive',
			handler	: ( event )=>{
				event.setHeader( headerName, headerValue );
				event.next();
			}
		});
		
		app.add({
			method	: 'get',
			route	: '/testGETCaseInsensitive',
			handler	: ( event )=>{
				event.send( body );
			}
		});

		helpers.sendServerRequest( '/testGETCaseInsensitive' ).then(( response )=>{
			assert.equal( response.headers[headerName.toLowerCase()], headerValue );
			assert.equal( response.body.toString(), body );
			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test middlewares',
	test	: ( done )=>{
		const body			= 'testGETWithMiddlewares';
		const headerName	= 'testGETWithMiddlewares';
		const headerValue	= 'value';

		app.define( 'testGETWithMiddlewaresMiddleware', ( event )=>{
			event.setHeader( headerName, headerValue );
			event.next();
		} );

		app.get( '/testGETWithMiddlewares', ( event )=>{
			event.send( body );
		}, 'testGETWithMiddlewaresMiddleware' );

		helpers.sendServerRequest( '/testGETWithMiddlewares' ).then(( response )=>{
			assert.equal( response.headers[headerName.toLowerCase()], headerValue );
			assert.equal( response.body.toString(), body );
			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test multiple middlewares',
	test	: ( done )=>{
		const body				= 'testGETWithMultipleMiddlewares';

		const headerName		= 'testGETWithMultipleMiddlewaresOne';
		const headerValue		= 'valueOne';

		const headerNameTwo		= 'testGETWithMultipleMiddlewaresTwo';
		const headerValueTwo	= 'valueTwo';

		app.define( 'testGETWithMultipleMiddlewaresMiddlewareOne', ( event )=>{
			event.setHeader( headerName, headerValue );
			event.next();
		} );

		app.define( 'testGETWithMultipleMiddlewaresMiddlewareTwo', ( event )=>{
			event.setHeader( headerNameTwo, headerValueTwo );
			event.next();
		} );

		app.get( '/testGETWithMultipleMiddlewares', ( event )=>{
			event.send( body );
		}, ['testGETWithMultipleMiddlewaresMiddlewareOne', 'testGETWithMultipleMiddlewaresMiddlewareTwo'] );

		helpers.sendServerRequest( '/testGETWithMultipleMiddlewares' ).then(( response )=>{
			assert.equal( response.headers[headerName.toLowerCase()], headerValue );
			assert.equal( response.headers[headerNameTwo.toLowerCase()], headerValueTwo );
			assert.equal( response.body.toString(), body );
			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test empty middleware',
	test	: ( done )=>{
		const body				= 'testEmptyMiddleware';
		const headerName		= 'testEmptyMiddleware';
		const headerValue		= 'valueOne';

		app.add({
			handler	: ( event )=>{
				event.setHeader( headerName, headerValue );
				event.next();
			}
		});

		app.get( '/testEmptyMiddleware', ( event )=>{
			event.send( body );
		} );

		helpers.sendServerRequest( '/testEmptyMiddleware' ).then(( response )=>{
			assert.equal( response.headers[headerName.toLowerCase()], headerValue );
			assert.equal( response.body.toString(), body );
			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_timeout without reaching timeout',
	test	: ( done )=>{
		const body			= 'testTimeoutWithoutReachingTimeout';
		const timeout		= 100;
		let timeoutCalled	= 0;

		if ( ! app.hasPlugin( app.er_timeout ) )
			app.apply( app.er_timeout, { timeout } );

		app.add( ( event )=>{
				event.on( 'clearTimeout', ()=>{
					timeoutCalled++;
				});

				event.next();
			}
		);

		app.get( '/testTimeoutWithoutReachingTimeout', ( event )=>{
			event.send( body );
		} );

		helpers.sendServerRequest( '/testTimeoutWithoutReachingTimeout' ).then(( response )=>{
			assert.equal( response.body.toString(), body );
			assert.equal( timeoutCalled, 1 );
			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_timeout with reaching timeout',
	test	: ( done )=>{
		const timeout	= 100;
		let timeoutCalled	= 0;

		if ( ! app.hasPlugin( app.er_timeout ) )
			app.apply( app.er_timeout, { timeout } );

		app.add({
			handler	: ( event )=>{
				event.on( 'clearTimeout', ()=>{
					timeoutCalled++;
				});

				event.next();
			}
		});

		app.get( '/testTimeoutWithReachingTimeout', ( event )=>{} );

		helpers.sendServerRequest( '/testTimeoutWithReachingTimeout', 'GET', 500 ).then(( response )=>{
			assert.equal( response.body.toString(), JSON.stringify( { error: `Request timed out in: ${timeout}`} ) );
			assert.equal( timeoutCalled, 1 );

			app.add({
				handler	: ( event )=>{
					event.clearTimeout();
					event.next();
				}
			});

			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_env attaches environment variables to process',
	test	: ( done )=>{
		const name			= 'testErEnvAttachesVariablesToProcess';
		const fileLocation	= path.join( __dirname, './fixture/.env' );
		app.apply( app.er_env, { fileLocation } );

		assert.equal( process.env.TESTKEY, 'TESTVALUE' );

		app.get( `/${name}`, ( event )=>{
			assert.equal( process.env.TESTKEY, 'TESTVALUE' );
			event.send( name );
		} );

		helpers.sendServerRequest( `/${name}` ).then(( response )=>{
			assert.equal( response.body.toString(), name );
			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_rate_limits does not die without any parameters',
	test	: ( done )=>{
		const name			= 'testErRateLimitsDoesNotDie';
		const fileLocation	= path.join( __dirname, './../../rate_limits.json' );

		const Server		= App.class;
		const app			= new Server();
		const server		= http.createServer( app.attach() );

		app.apply( app.er_rate_limits );

		app.get( `/${name}`, ( event )=>{
			event.send( name );
		} );

		server.listen( 3334 );

		helpers.sendServerRequest( `/${name}`, 'GET', 200, '', {}, 3334 ).then(( response )=>{
			assert.equal( response.body.toString(), name );
			fs.unlinkSync( fileLocation );
			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_rate_limits with permissive limiting',
	test	: ( done )=>{
		const name			= 'testErRateLimitsWithPermissiveLimiting';
		const fileLocation	= path.join( __dirname, './fixture/rate_limits.json' );
		let called			= 0;

		if ( ! app.hasPlugin( app.er_rate_limits ) )
			app.apply( app.er_rate_limits, { fileLocation } );

		app.get( `/${name}`, ( event )=>{
			called ++;

			if ( called > 1 )
			{
				assert.equal( event.rateLimited, true );
			}
			else
			{
				assert.equal( event.rateLimited, false );
			}

			event.send( name );
		} );

		helpers.sendServerRequest( `/${name}` ).then(( response )=>{
			return helpers.sendServerRequest( `/${name}` );
		}).then(( response )=>{
			assert.equal( response.body.toString(), name );
			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_rate_limits with permissive limiting refills',
	test	: ( done )=>{
		const name			= 'testErRateLimitsWithPermissiveLimitingRefills';
		const fileLocation	= path.join( __dirname, './fixture/rate_limits.json' );

		if ( ! app.hasPlugin( app.er_rate_limits ) )
			app.apply( app.er_rate_limits, { fileLocation } );

		app.get( `/${name}`, ( event )=>{
			assert.equal( event.rateLimited, false );
			event.send( name );
		} );

		helpers.sendServerRequest( `/${name}` ).then(( response )=>{
			setTimeout(()=>{
				helpers.sendServerRequest( `/${name}` ).then(( response )=>{
					assert.equal( response.body.toString(), name );
					done();
				}).catch( done )
			}, 1000 );
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_rate_limits with connection delay policy limiting',
	test	: ( done )=>{
		const name			= 'testErRateLimitsWithConnectionDelayPolicy';
		const fileLocation	= path.join( __dirname, './fixture/rate_limits.json' );
		const now			= Math.floor( new Date().getTime() / 1000 );

		if ( ! app.hasPlugin( app.er_rate_limits ) )
			app.apply( app.er_rate_limits, { fileLocation } );

		app.get( `/${name}`, ( event )=>{
			event.send( name );
		} );

		helpers.sendServerRequest( `/${name}` ).then(( response )=>{
			return helpers.sendServerRequest( `/${name}` );
		}).then(( response )=>{
			assert.equal( response.body.toString(), name );
			assert.equal( ( Math.floor( new Date().getTime() / 1000 ) - now ) >= 2, true );

			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_rate_limits with strict policy',
	test	: ( done )=>{
		const name			= 'testErRateLimitsWithStrictPolicy';
		const fileLocation	= path.join( __dirname, './fixture/rate_limits.json' );

		if ( ! app.hasPlugin( app.er_rate_limits ) )
			app.apply( app.er_rate_limits, { fileLocation } );

		app.get( `/${name}`, ( event )=>{
			event.send( name );
		} );

		helpers.sendServerRequest( `/${name}` ).then(( response )=>{
			return helpers.sendServerRequest( `/${name}`, 'GET', 429 );
		}).then(( response )=>{
			assert.equal( response.body.toString(), JSON.stringify( { error: 'Too many requests' } ) );
			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_rate_limits with specified methods matches',
	test	: ( done )=>{
		const name			= 'testErRateLimitsWithStrictPolicyWithSpecifiedMethods';
		const fileLocation	= path.join( __dirname, './fixture/rate_limits.json' );

		if ( ! app.hasPlugin( app.er_rate_limits ) )
			app.apply( app.er_rate_limits, { fileLocation } );

		app.get( `/${name}`, ( event )=>{
			event.send( name );
		} );

		helpers.sendServerRequest( `/${name}` ).then(( response )=>{
			return helpers.sendServerRequest( `/${name}`, 'GET', 429 );
		}).then(( response )=>{
			assert.equal( response.body.toString(), JSON.stringify( { error: 'Too many requests' } ) );
			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_rate_limits with multiple specified methods matches',
	test	: ( done )=>{
		const name			= 'testErRateLimitsWithStrictPolicyWithMultipleSpecifiedMethods';
		const fileLocation	= path.join( __dirname, './fixture/rate_limits.json' );

		if ( ! app.hasPlugin( app.er_rate_limits ) )
			app.apply( app.er_rate_limits, { fileLocation } );

		app.get( `/${name}`, ( event )=>{
			event.send( name );
		} );

		helpers.sendServerRequest( `/${name}` ).then(( response )=>{
			return helpers.sendServerRequest( `/${name}`, 'GET', 429 );
		}).then(( response )=>{
			assert.equal( response.body.toString(), JSON.stringify( { error: 'Too many requests' } ) );
			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_rate_limits with specified methods does not match if method is not the same',
	test	: ( done )=>{
		const name			= 'testErRateLimitsWithStrictPolicyWithSpecifiedMethodsThatDoNotMatch';
		const fileLocation	= path.join( __dirname, './fixture/rate_limits.json' );

		if ( ! app.hasPlugin( app.er_rate_limits ) )
			app.apply( app.er_rate_limits, { fileLocation } );

		app.get( `/${name}`, ( event )=>{
			event.send( name );
		} );

		helpers.sendServerRequest( `/${name}` ).then(( response )=>{
			return helpers.sendServerRequest( `/${name}` );
		}).then(( response )=>{
			assert.equal( response.body.toString(), name );
			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_rate_limits with stopPropagation',
	test	: ( done )=>{
		const name			= 'testErRateLimitsWithPropagation';
		const fileLocation	= path.join( __dirname, './fixture/rate_limits.json' );
		let called			= 0;

		if ( ! app.hasPlugin( app.er_rate_limits ) )
			app.apply( app.er_rate_limits, { fileLocation } );

		app.get( `/${name}`, ( event )=>{
			called ++;

			if ( called > 1 )
			{
				assert.equal( event.rateLimited, true );
			}
			else
			{
				assert.equal( event.rateLimited, false );
			}

			event.send( name );
		} );

		helpers.sendServerRequest( `/${name}` ).then(( response )=>{
			return helpers.sendServerRequest( `/${name}`, 'GET', 200 );
		}).then(( response )=>{
			assert.equal( response.body.toString(), name );
			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_rate_limits with multiple rules',
	test	: ( done )=>{
		const name			= 'testErRateLimitsWithMultipleRules';
		const fileLocation	= path.join( __dirname, './fixture/rate_limits.json' );

		if ( ! app.hasPlugin( app.er_rate_limits ) )
			app.apply( app.er_rate_limits, { fileLocation } );

		app.get( `/${name}`, ( event )=>{
			event.send( name );
		} );

		helpers.sendServerRequest( `/${name}` ).then(( response )=>{
			return helpers.sendServerRequest( `/${name}`, 'GET', 429 );
		}).then(( response )=>{
			assert.equal( response.body.toString(), JSON.stringify( { error: 'Too many requests' } ) );
			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_rate_limits strict overrides connection delay',
	test	: ( done )=>{
		const name			= 'testErRateLimitsStrictOverridesConnectionDelayPolicy';
		const fileLocation	= path.join( __dirname, './fixture/rate_limits.json' );

		if ( ! app.hasPlugin( app.er_rate_limits ) )
			app.apply( app.er_rate_limits, { fileLocation } );

		app.get( `/${name}`, ( event )=>{
			event.send( name );
		} );

		helpers.sendServerRequest( `/${name}` ).then(( response )=>{
			return helpers.sendServerRequest( `/${name}`, 'GET', 429 );
		}).then(( response )=>{
			assert.equal( response.body.toString(), JSON.stringify( { error: 'Too many requests' } ) );
			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_rate_limits connection delay overrides permissive',
	test	: ( done )=>{
		const name			= 'testErRateLimitsConnectionDelayOverridesPermissivePolicy';
		const fileLocation	= path.join( __dirname, './fixture/rate_limits.json' );
		const now			= Math.floor( new Date().getTime() / 1000 );

		if ( ! app.hasPlugin( app.er_rate_limits ) )
			app.apply( app.er_rate_limits, { fileLocation } );

		app.get( `/${name}`, ( event )=>{
			event.send( name );
		} );

		helpers.sendServerRequest( `/${name}` ).then(( response )=>{
			return helpers.sendServerRequest( `/${name}` );
		}).then(( response )=>{
			assert.equal( response.body.toString(), name );
			assert.equal( ( Math.floor( new Date().getTime() / 1000 ) - now ) >= 2, true );

			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_rate_limits connection delay returns 429 if no more retries',
	test	: ( done )=>{
		const name			= 'testErRateLimitsConnectionDelayReturns429IfNoMoreRetries';
		const fileLocation	= path.join( __dirname, './fixture/rate_limits.json' );

		if ( ! app.hasPlugin( app.er_rate_limits ) )
			app.apply( app.er_rate_limits, { fileLocation } );

		app.get( `/${name}`, ( event )=>{
			event.send( name );
		} );

		helpers.sendServerRequest( `/${name}` ).then(( response )=>{
			return helpers.sendServerRequest( `/${name}`, 'GET', 429 );
		}).then(( response )=>{
			assert.equal( response.body.toString(), JSON.stringify( { error: 'Too many requests' } ) );
			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_rate_limits with strict policy with ipLimit',
	test	: ( done )=>{
		const name			= 'testErRateLimitsWithStrictPolicyWithIpLimit';
		const fileLocation	= path.join( __dirname, './fixture/rate_limits.json' );

		if ( ! app.hasPlugin( app.er_rate_limits ) )
			app.apply( app.er_rate_limits, { fileLocation } );

		app.get( `/${name}`, ( event )=>{

			try
			{
				assert.notEqual( Object.keys( event.rules[4].buckets )[0], `/${name}` );
			}
			catch ( e )
			{
				return done( 'er_rate_limits with ip limit did not return as expected' );
			}

			event.send( name );
		} );

		helpers.sendServerRequest( `/${name}` ).then(( response )=>{
			return helpers.sendServerRequest( `/${name}`, 'GET', 429 );
		}).then(( response )=>{
			assert.equal( response.body.toString(), JSON.stringify( { error: 'Too many requests' } ) );
			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_templating_engine attaches a render function that fetches files',
	test	: ( done )=>{
		const name			= 'testTemplatingEngine';
		const deepName		= 'testTemplatingEngineDeep';
		const templateDir 	= path.join( __dirname, './fixture/templates' );
		let renderCalled	= 0;

		app.apply( app.er_templating_engine, { templateDir } );

		app.add({
			handler	: ( event )=>{
				event.on( 'render', ()=>{
					renderCalled++;
				} );

				event.next();
			}
		});

		app.get( `/${name}`, ( event )=>{
			event.render( 'index' );
		} );

		app.get( `/${deepName}`, ( event )=>{
			event.render( 'deep/directory/structure/file' );
		} );

		helpers.sendServerRequest( `/${name}` ).then(( response )=>{
			assert.equal( response.body.toString().includes( 'THIS_IS_THE_INDEX_HTML_FILE' ), true );
			return helpers.sendServerRequest( `/${deepName}` );
		}).then(( response )=>{
			assert.equal( response.body.toString().includes( 'THIS_IS_THE_DEEP_HTML_FILE' ), true );
			assert.equal( renderCalled, 2 );
			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_session works as expected',
	test	: ( done )=>{
		const name	= 'testErSession';

		assert.throws(()=>{
			app.apply( app.er_session );
		});

		app.apply( app.er_cache_server );
		app.apply( app.er_session );

		app.get( `/${name}`, ( event )=>{
			event.initSession( event.next ).catch( event.next );
		} );

		app.get( `/${name}`, async ( event )=>{
			assert.equal( event.session instanceof Session, true );
			const session	= event.session;

			if ( session.has( 'authenticated' ) === false )
			{
				assert.throws(()=>{
					session.get( 'authenticated' );
				});

				session.add( 'authenticated', true );
			}
			else
			{
				assert.equal( session.get( 'authenticated' ), true );
				event.setHeader( 'authenticated', 1 );
			}

			event.send( name );
		} );

		helpers.sendServerRequest( `/${name}` ).then(( response )=>{
			assert.equal( response.body.toString(), name );
			assert.equal( typeof response.headers['set-cookie'] !== 'undefined', true );

			const cookies	= {},
				rc		= response.headers['set-cookie'][0];

			rc && rc.split( ';' ).forEach( function( cookie ) {
				const parts						= cookie.split( '=' );
				cookies[parts.shift().trim()]	= decodeURI( parts.join( '=' ) );
			});

			assert.equal( typeof cookies.sid === 'string', true );

			const headers	= { cookie: `sid=${cookies.sid}`};

			return helpers.sendServerRequest( `/${name}`, 'GET', 200, '', headers );
		}).then(( response )=>{
			assert.equal( response.body.toString(), name );
			assert.equal( typeof response.headers.authenticated !== 'undefined', true );
			assert.equal( response.headers.authenticated, 1 );

			const headers	= { cookie: `sid=wrong`};

			return helpers.sendServerRequest( `/${name}`, 'GET', 200, '', headers );
		}).then(( response )=>{
			assert.equal( response.body.toString(), name );
			assert.equal( typeof response.headers.authenticated === 'undefined', true );

			done();
		}).catch( done );
	}
});

test({
	message	: 'Server.test er_cache_server works as expected',
	test	: ( done )=>{
		const name			= 'testCacheServer';
		const secondName	= `/${name}Second`;
		const key			= `${name}_KEY`;
		const value			= `${name}_VALUE`;

		app.apply( app.er_cache_server, { dataServerOptions: { persist: false } } );

		app.get( `/${name}`, async ( event )=>{
			assert.equal( event.cachingServer instanceof DataServer, true );

			await event.cachingServer.set( key, value ).catch( done );
			await event.cachingServer.set( `${key}_delete`, value ).catch( done );

			await event.cachingServer.delete( `${key}_delete`, value ).catch( done );

			event.send( name );
		});

		app.get( secondName, async ( event )=>{
			assert.equal( event.cachingServer instanceof DataServer, true );

			const cacheValue	= await event.cachingServer.get( key ).catch( done );

			assert.equal( cacheValue.value, value );
			assert.equal( await event.cachingServer.get( `${key}_delete` ).catch( done ), null );

			event.send( secondName );
		});

		helpers.sendServerRequest( `/${name}` ).then(( response )=>{
			assert.equal( response.body.toString(), name );
			return helpers.sendServerRequest( secondName );
		}).then(( response )=>{
			assert.equal( response.body.toString(), secondName );
			done();
		}).catch( done )
	}
});

test({
	message	: 'Server.test er_static_resources works as expected',
	test	: ( done )=>{
		app.apply( app.er_static_resources, { paths: ['tests/server/fixture/static'] } );

		helpers.sendServerRequest( `/tests/server/fixture/static/test_file.js` ).then(( response )=>{
			assert.equal( response.body.toString(), 'const test=\'123\';' );

			return helpers.sendServerRequest( '/tests/server/fixture/static/test.css' );
		}).then(( response )=>{
			assert.equal( response.body.toString(), 'body{background:black;}' );

			return helpers.sendServerRequest( '/tests/server/fixture/static/unknown_file.js', 'GET', 404 );
		}).then(( response )=>{
			assert.equal( response.body.toString().includes( 'File not found' ), true );

			done();
		}).catch( done )
	}
});
