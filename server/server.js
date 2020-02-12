'use strict';

// Dependencies
const http						= require( 'http' );
const EventRequest				= require( './event' );
const { EventEmitter }			= require( 'events' );
const Router					= require( './components/routing/router' );
const PluginInterface			= require( './plugins/plugin_interface' );
const PluginManager				= require( './plugins/preloaded_plugins' );
const Logging					= require( './components/logger/loggur' );
const { Loggur, LOG_LEVELS }	= Logging;

/**
 * @brief	Server class responsible for receiving requests and sending responses
 */
class Server extends EventEmitter
{
	/**
	 * @brief	Initializes the Server
	 */
	constructor()
	{
		super();
		this.setMaxListeners( 0 );

		this.plugins		= [];
		this.pluginManager	= PluginManager;
		this.router			= this.Router();

		this.setUpDefaultPlugins();
	}

	/**
	 * @brief	Adds a new middleware to the router
	 *
	 * @param	String middlewareName
	 * @param	Function middleware
	 *
	 * @return	void
	 */
	define()
	{
		this.router.define.apply( this.router, arguments );
	}

	/**
	 * @brief	Sets up the default plugins
	 *
	 * @return	void
	 */
	setUpDefaultPlugins()
	{
		this.apply( this.router );

		let pluginsToApply	= [
			{ plugin : 'er_static_resources', options: ['favicon.ico'] },
			{ plugin : 'er_body_parser_json' },
			{ plugin : 'er_body_parser_form' },
		];

		pluginsToApply.forEach(( pluginConfig )=>{
			this.apply( pluginConfig.plugin, pluginConfig.options );
		});

		// attached like this to enable smart autocomplete in IDE's
		this.er_timeout					= 'er_timeout';
		this.er_env						= 'er_env';
		this.er_rate_limits				= 'er_rate_limits';
		this.er_static_resources		= 'er_static_resources';
		this.er_cache_server			= 'er_cache_server';
		this.er_templating_engine		= 'er_templating_engine';
		this.er_file_stream				= 'er_file_stream';
		this.er_logger					= 'er_logger';
		this.er_body_parser				= 'er_body_parser';
		this.er_session					= 'er_session';
		this.er_response_cache			= 'er_response_cache';
		this.er_body_parser_json		= 'er_body_parser_json';
		this.er_body_parser_form		= 'er_body_parser_form';
		this.er_body_parser_multipart	= 'er_body_parser_multipart';
	}

	/**
	 * @brief	Returns the plugin manager
	 *
	 * @return	PluginManager
	 */
	getPluginManager()
	{
		return this.pluginManager;
	}

	/**
	 * @brief	Creates a new router
	 *
	 * @return	Router
	 */
	Router()
	{
		return new Router();
	}

	/**
	 * @brief	This is used to apply a new PluginInterface
	 *
	 * @details	The plugin manager can be used to extract and set up plugins and then add them to the server just by
	 * 			giving their plugin ids
	 *
	 * @param	PluginInterface|String plugin
	 * @param	Object options
	 *
	 * @return	Server
	 */
	apply( plugin, options = null )
	{
		if ( plugin instanceof PluginInterface )
		{
		}
		else if ( typeof plugin === 'string' )
		{
			plugin	= this.pluginManager.getPlugin( plugin );
		}
		else
		{
			throw new Error( 'A PluginInterface or an existing PluginManager pluginId (string) must be added' );
		}

		if ( options != null )
		{
			plugin.setOptions( options );
		}

		this._attachPlugin( plugin );

		return this;
	}

	/**
	 * @brief	Attaches a PluginInterface to the server
	 *
	 * @param	PluginInterface plugin
	 *
	 * @return	void
	 */
	_attachPlugin( plugin )
	{
		let pluginDependencies	= plugin.getPluginDependencies();
		let pluginId			= plugin.getPluginId();

		pluginDependencies.forEach(( dependency )=>{
			if ( ! this.hasPlugin( dependency ) )
			{
				throw new Error( 'The plugin ' + pluginId + ' requires ' + dependency + ' which is missing.' );
			}
		});

		plugin.setServerOnRuntime( this );

		let pluginMiddleware	= plugin.getPluginMiddleware();

		pluginMiddleware.forEach( ( route )=>{
			this.add( route );
		});

		this.plugins[pluginId]	= plugin;
	}

	/**
	 * @brief	Gets a plugin attached to the server
	 *
	 * @details	Will throw if the plugin is not attached
	 *
	 * @param	String pluginId
	 *
	 * @return	PluginInterface
	 */
	getPlugin( pluginId )
	{
		if ( this.hasPlugin( pluginId ) )
		{
			return this.plugins[pluginId];
		}
		else
		{
			throw new Error( `The plugin ${pluginId} is not attached to the server` );
		}
	}

	/**
	 * @brief	Checks whether the server has a plugin with the given id
	 *
	 * @param	String pluginId
	 *
	 * @return	Boolean
	 */
	hasPlugin( pluginId )
	{
		return typeof this.plugins[pluginId] !== 'undefined';
	}

	/**
	 * @brief	Resolves the given request and response
	 *
	 * @details	Creates a EventRequest used by the Server with helpful methods
	 *
	 * @return	EventRequest
	 */
	resolve ( request, response )
	{
		return new EventRequest( request, response );
	};

	/**
	 * @brief	Called when a request is received to the server
	 *
	 * @param	IncomingMessage request
	 * @param	ServerResponse response
	 *
	 * @return	void
	 */
	_attach( request, response )
	{
		let eventRequest	= this.resolve( request, response );
		this.emit( 'eventRequestResolved', { eventRequest, request, response  } );

		request.on( 'close', ()=> {
			this.emit( 'eventRequestRequestClosed', { eventRequest, request } );

			if ( eventRequest != null )
			{
				eventRequest.cleanUp();
				eventRequest	= null;
			}
		});

		response.on( 'finish', () => {
			this.emit( 'eventRequestResponseFinish', { eventRequest, response } );

			if ( eventRequest != null )
			{
				eventRequest.cleanUp();
				eventRequest	= null;
			}
		});

		response.on( 'error', ( error ) => {
			this.emit( 'eventRequestResponseError', { eventRequest, response, error } );

			if ( eventRequest != null )
			{
				eventRequest.next( error );
				eventRequest	= null;
			}
		});

		try
		{
			let block	= this.router.getExecutionBlockForCurrentEvent( eventRequest );
			this.emit( 'eventRequestBlockSetting', { eventRequest, block } );
			eventRequest.setBlock( block );
			this.emit( 'eventRequestBlockSet', { eventRequest, block } );

			const onErrorCallback	= ( error ) =>{
				this.emit( 'eventRequestError', { eventRequest, error } );

				if ( eventRequest.logger === null )
				{
					Loggur.log( error, LOG_LEVELS.error );
				}
			};

			eventRequest.on( 'error', onErrorCallback );
			eventRequest.on( 'on_error', onErrorCallback );

			eventRequest.next();
		}
		catch ( error )
		{
			this.emit( 'eventRequestThrow', { eventRequest, error } );

			eventRequest.next( error );
		}
	}

}

// Holds the instance of the server class
let server	= null;

/**
 * @brief	Creates a new server, or return existing instance
 *
 * @returns	Server
 */
let App				= ()=>{
	return server || ( server = new Server() );
};

/**
 * @brief	Removes the server instance ( this does not stop the httpServer if it was started )
 *
 * @return	void
 */
App.cleanUp			= ()=>{
	server	= null;
};

/**
 * @brief	Returns the attach function of the serve
 *
 * @details	This can be used to implement the http/https server
 *
 * @returns	Function
 */
App.attach			= ()=>{
	let self	= App();
	return self._attach.bind( self );
};

/**
 * @brief	Starts the server with the given arguments
 *
 * @returns	Server
 */
App.start			= function(){
	const httpServer	= http.createServer( App.attach() );
	return httpServer.listen.apply( httpServer, arguments );
};

App.class			= Server;

// Export the server module
module.exports	= App;
