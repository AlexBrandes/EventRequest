'use strict';

// Dependencies
const MultipartFormParser	= require( './multipart_data_parser' );
const FormBodyParser		= require( './form_body_parser' );
const JsonBodyParser		= require( './json_body_parser' );
const BodyParser			= require( './body_parser' );
const EventRequest			= require( '../../event' );

/**
 * @brief	BodyParserHandler responsible for parsing the body of the request
 */
class BodyParserHandler
{
	/**
	 * @brief	Initializes the parsers
	 *
	 * @details	Possible options:
	 * 			MultipartFormParser	: {} -> instructions to initialize the MultipartFormParser with the specified options
	 * 			FormBodyParser		: {} -> instructions to initialize the FormBodyParser with the specified options
	 * 			JsonBodyParser		: {} -> instructions to initialize the JsonBodyParser with the specified options
	 *
	 * @param	EventRequest event
	 * @param	Object options
	 */
	constructor( event, options = {} )
	{
		this.options	= options;
		this.event		= event;
		this.parsers	= [];

		if ( ! ( this.event instanceof EventRequest ) || typeof this.options !== 'object' )
		{
			throw new Error( 'Invalid constructor arguments passed' );
		}

		this.sanitizeConfig();
		this.initParsers();
	}

	/**
	 * @brief	Sanitizes the config of the session handler
	 *
	 * @return	void
	 */
	sanitizeConfig()
	{
		this.baseOptions		= {};
		this.options.parsers	= typeof this.options.parsers === 'object' ? this.options.parsers : [];

		let parsers				= this.options.parsers;
		if (
			parsers.constructor === Array
			&& ( parsers.indexOf( 'default' ) !== -1 || parsers.length === 0 )
		) {
			let index	= parsers.indexOf( 'default' );
			if ( index !== -1 )
				parsers.splice( index, 1 );

			let defaultParsers	= [
				{ instance : FormBodyParser },
				{ instance : MultipartFormParser },
				{ instance : JsonBodyParser }
			];

			this.options.parsers	= parsers.concat(  defaultParsers );
		}
	}

	/**
	 * @brief	Initializes the parsers
	 *
	 * @return	void
	 */
	initParsers()
	{
		try
		{
			if ( this.options.parsers.constructor === Array )
			{
				for ( let index in this.options.parsers )
				{
					let parserConfig	= this.options.parsers[index];

					let parser			= typeof parserConfig.instance === 'function' ? parserConfig.instance : null;
					let parserOptions	= typeof parserConfig.options === 'object' ? parserConfig.options : {};

					if ( parser === null )
					{
						throw new Error( 'Invalid configuration' );
					}

					parser	= parser.getInstance( Object.assign( this.baseOptions, parserOptions ) );

					if ( parser instanceof BodyParser )
					{
						this.parsers.push( parser );
					}
				}
			}
		}
		catch ( e )
		{
			this.event.next( 'Invalid configuration provided' );
		}
	}

	/**
	 * @brief	Goes through all the parsers and tries to parse the payload. If it cannot be parsed then an error is set
	 *
	 * @param	Function callback
	 *
	 * @return	void
	 */
	parseBody( callback )
	{
		for ( let index in this.parsers )
		{
			let parser	= this.parsers[index];

			if ( parser.supports( this.event ) )
			{
				parser.parse( this.event, ( err, data ) =>{
					if ( ! err && data ) {
						this.event.body	= data;
						callback( false );
					}
					else {
						callback( err );
					}
				});
				return;
			}
		}

		callback( false );
	}
}

module.exports	= {
	BodyParserHandler,
	BodyParser,
	MultipartFormParser,
	JsonBodyParser,
	FormBodyParser
};