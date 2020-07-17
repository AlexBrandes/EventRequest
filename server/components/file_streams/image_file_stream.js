'use strict';

// Dependencies
const path			= require( 'path' );
const fs			= require( 'fs' );


/**
 * @brief	The type of file this stream supports
 *
 * @var		String
 */
const STREAM_TYPE	= 'image';

/**
 * @brief	Used to stream text files
 */
class ImageFileStream
{
	constructor()
	{
		this.SUPPORTED_FORMATS	= [
			'.apng', '.bmp', '.gif', '.ico', '.cur', '.jpeg', '.jpg', '.jfif', '.pjpeg', '.pjp', '.png', '.svg', '.tif', '.tiff', '.webp'
		];
		this._streamType		= STREAM_TYPE;
	}

	/**
	 * @brief	Check whether the given file is supported by the file stream
	 *
	 * @param	{String} file
	 *
	 * @return	Boolean
	 */
	supports( file )
	{
		const parsedPath	= path.parse( file );
		return this.SUPPORTED_FORMATS.indexOf( parsedPath.ext.toLowerCase() ) !== -1;
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
		const stream	= fs.createReadStream( file, options );

		event.emit( 'stream_start', { stream } );

		return stream;
	}

	/**
	 * @brief	Gets the type of file this stream supports
	 *
	 * @return	String
	 */
	getType()
	{
		return this._streamType;
	}
}

module.exports	= ImageFileStream;
