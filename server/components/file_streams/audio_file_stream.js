'use strict';

// Dependencies
const path					= require( 'path' );
const fs					= require( 'fs' );
const AbstractFileStream	= require( './abstract_file_stream' );

/**
 * @brief	The type of file this stream supports
 *
 * @var		String
 */
const STREAM_TYPE		= 'audio';

/**
 * @brief	The supported file extensions
 *
 * @var		Array
 */
const SUPPORTED_TYPES	= ['.mp3', '.flac', '.wav', '.aiff', '.aac'];

/**
 * @brief	Used to stream audio files
 */
class AudioFileStream extends AbstractFileStream
{
	constructor()
	{
		super( SUPPORTED_TYPES, STREAM_TYPE );
	}

	/**
	 * @brief	Gets the file stream for the file
	 *
	 * @param	{EventRequest} event
	 * @param	{String} file
	 * @param	{Object} [options={}]
	 *
	 * @return	ReadStream
	 */
	getFileStream( event, file, options = {} )
	{
		let stream		= null;
		const stat		= fs.statSync( file );
		const fileSize	= stat.size;
		const range		= event.getRequestHeader( 'range' );

		event.setResponseHeader( 'Content-Type', `audio/${path.parse( file ).ext.substring( 1 )}` );
		if ( range )
		{
			const parts	= range.replace( /bytes=/, "" ).split( "-" );
			const start	= parseInt( parts[0], 10 );
			const end	= parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

			event.setResponseHeader( 'Content-Range', `bytes ${start}-${end}/${fileSize}` );
			event.setResponseHeader( 'Accept-Ranges', 'bytes' );
			event.setResponseHeader( 'Content-Length', ( end - start ) + 1 );
			event.setStatusCode( 206 );

			stream	= fs.createReadStream( file, { start, end } );
		}
		else
		{
			event.setResponseHeader( 'Content-Length', fileSize );
			event.setStatusCode( 200 );

			stream	= fs.createReadStream( file );
		}

		event.emit( 'stream_start', { stream } );

		return stream;
	}
}

module.exports	= AudioFileStream;
