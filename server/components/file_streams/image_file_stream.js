'use strict';

// Dependencies
const FileStream	= require( './file_stream' );
const path			= require( 'path' );
const fs			= require( 'fs' );

/**
 * @brief	Used to stream text files
 */
class ImageFileStream extends FileStream
{
	/**
	 * @see	FileStream::constructor()
	 */
	constructor( event, options )
	{
		super( event, options );
		this.SUPPORTED_FORMATS	= [
			'.apng', '.bmp', '.gif', '.ico', '.cur', '.jpeg', '.jpg', '.jfif', '.pjpeg', '.pjp', '.png', '.svg', '.tif', '.tiff', '.webp'
		];
		this._streamType		= 'image';

		this.sanitize();
	}

	/**
	 * @see	FileStream::sanitize()
	 */
	sanitize()
	{
	}

	/**
	 * @see	FileStream::supports()
	 */
	supports( file )
	{
		file	= path.parse( file );
		return this.SUPPORTED_FORMATS.indexOf( file.ext ) !== -1;
	}

	/**
	 * @see	FileStream::stream()
	 */
	stream( file, options = {} )
	{
		if ( ! fs.existsSync( file ) )
		{
			this.event.sendError( `File not found: ${file}` );
			return;
		}

		this.event.emit( 'stream_start' );

		file	= fs.createReadStream( file );

		file.pipe( this.event.response );
	}

	/**
	 * @see	FileStream::stream()
	 */
	getType()
	{
		return this._streamType;
	}
}

module.exports	= ImageFileStream;