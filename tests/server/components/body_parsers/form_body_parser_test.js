'use strict';

const { Mock, Mocker, assert, test, helpers }	= require( './../../../testing_suite' );
const { FormBodyParser }						= require( './../../../../server/components/body_parser_handler' );

test({
	message	: 'FormBodyParser.constructor on defaults does not die',
	test	: ( done )=>{
		let formBodyParser	= new FormBodyParser();
		assert.equal( formBodyParser.maxPayloadLength, 10 * 1048576 );
		assert.equal( formBodyParser.strict, true );

		done();
	}
});

test({
	message	: 'FormBodyParser.constructor on correct arguments',
	test	: ( done )=>{
		let maxPayloadLength	= 1;
		let strict				= false;

		let formBodyParser	= new FormBodyParser( { maxPayloadLength, strict } );
		assert.equal( formBodyParser.maxPayloadLength, maxPayloadLength );
		assert.equal( formBodyParser.strict, strict );

		done();
	}
});
