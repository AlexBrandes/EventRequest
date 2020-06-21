'use strict';

// Dependencies
const { EventEmitter }		= require( 'events' );

/**
 * @brief	Constants
 */
const CONTENT_LENGTH_HEADER	= 'content-length';

/**
 * @brief	RawBodyParser responsible for parsing any body sent
 */
class RawBodyParser extends EventEmitter
{
	/**
	 * @param	options Object
	 * 			Accepts options:
	 * 			- maxPayloadLength - Number - The max size of the body to be parsed
	 */
	constructor( options = {} )
	{
		super();
		this.setMaxListeners( 0 );

		// Defaults to 10 MB
		this.maxPayloadLength	= typeof options.maxPayloadLength === 'number'
								? options.maxPayloadLength
								: 104857600;
	}

	/**
	 * @brief	Returns a boolean if the current body parser supports the request
	 *
	 * @return	boolean
	 */
	supports( event )
	{
		return true;
	}

	/**
	 * @brief	Parses the request
	 *
	 * @return	Promise
	 */
	parse( event )
	{
		return new Promise(( resolve, reject )=>{
			let rawBody		= [];
			let payloadLength	= 0;

			if ( ! this.supports( event ) )
				return reject( 'Body type not supported' );

			event.request.on( 'data', ( data ) =>
			{
				if ( ! event.isFinished() )
				{
					if ( payloadLength <= this.maxPayloadLength )
					{
						rawBody.push( data );
						payloadLength	+= data.length;
					}
				}
			});

			event.request.on( 'end', () => {
				if ( ! event.isFinished() )
				{
					rawBody	= Buffer.concat( rawBody, payloadLength );

					if ( payloadLength > this.maxPayloadLength || payloadLength === 0 )
						return resolve( { body: {}, rawBody: {} } );

					rawBody	= rawBody.toString();

					try
					{
						resolve( { body: rawBody, rawBody } );
					}
					catch ( e )
					{
						reject( 'Could not parse the body' );
					}
				}
			});
		});
	}
}

module.exports	= RawBodyParser;