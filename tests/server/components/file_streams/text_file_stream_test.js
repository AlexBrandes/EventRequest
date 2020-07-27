'use strict';

const TextFileStream					= require( '../../../../server/components/file_streams/text_file_stream' );
const { assert, test, Mock, helpers }	= require( '../../../test_helper' );
const path								= require( 'path' );
const fs								= require( 'fs' );

const DEFAULT_TEST_FILE			= path.join( __dirname, './fixtures/testFile.txt' );

test({
	message	: 'TextFileStream.getFileStream',
	test	: ( done ) => {
		const eventRequest	= helpers.getEventRequest( undefined, undefined, undefined );
		const fileStream	= new TextFileStream();

		const stream	= fileStream.getFileStream( eventRequest, DEFAULT_TEST_FILE );

		assert.deepStrictEqual( stream instanceof fs.ReadStream, true );

		const data	= [];

		stream.on( 'data', ( chunk ) => {
			data.push( chunk );
		});

		stream.on( 'end', () => {
			assert.deepStrictEqual( Buffer.concat( data ).toString(), 'This is a test file. It has a bit of data.' );
			done();
		});
	}
});