'use strict';

const { assert, test, helpers }	= require( '../../../test_helper' );
const ErrorHandler				= require( '../../../../server/components/error/error_handler' );

test({
	message			: 'ErrorHandler._formatError.formats.the.error.correctly',
	dataProvider	: [
		['An Error Has Occurred!', 'An Error Has Occurred!'],
		[123, 123],
		[['test'], ['test']],
		[{ key: 'value' }, { key: 'value' }],
		[new Error( 'ErrorMessage' ), 'ErrorMessage'],
	],
	test			: ( done, errorToFormat, expected ) => {
		const errorHandler	= new ErrorHandler();

		assert.deepStrictEqual( errorHandler._formatError( errorToFormat ), expected );
		assert.deepStrictEqual( errorHandler._formatError( errorToFormat ), expected );

		done();
	}
});

test({
	message			: 'ErrorHandler.handleError.handles.an.Error.successfully.by.emitting.the.stack.on_error.and.sending.the.message.to.event.send',
	test			: ( done ) => {
		const eventRequest	= helpers.getEventRequest();
		const errorHandler	= new ErrorHandler();
		const error			= new Error( 'An Error Has Occurred' );
		let called			= false;
		let emitCalled		= 0;

		eventRequest._mock({
			method			: 'send',
			shouldReturn	: ( errorMessage, code ) => {
				assert.deepStrictEqual( errorMessage, { error : { code: 'app.general', message: 'An Error Has Occurred' } } );
				assert.equal( 501, code );
				called	= true;
			}
		});

		eventRequest._mock({
			method			: 'emit',
			shouldReturn	: ( event, emittedError ) => {
				emitCalled	++;
				assert.equal( event, 'on_error' );
			},
			with			: [
				['on_error', { code: 'app.general', error: error, status: 501, message: error.message, headers: {} }],
			],
			called			: 1
		});

		errorHandler.handleError( eventRequest, error, 501 );

		setTimeout(() => {
			assert.equal( called, true );
			assert.equal( emitCalled, 1 );

			done();
		}, 5 );
	}
});

test({
	message			: 'ErrorHandler.handleError.when.event.is.finished',
	test			: ( done ) => {
		const eventRequest		= helpers.getEventRequest();
		eventRequest.finished	= true;

		const errorHandler	= new ErrorHandler();
		const error			= new Error( 'An Error Has Occurred' );
		let called			= false;
		let emitCalled		= 0;

		eventRequest._mock({
			method			: 'send',
			shouldReturn	: () => {
				called	= true;
			}
		});

		eventRequest._mock({
			method			: 'emit',
			shouldReturn	: () => {
				emitCalled	++;
			},
			with			: [
				['on_error', undefined],
			],
			called			: 0
		});

		errorHandler.handleError( eventRequest, error, 501 );

		setTimeout(() => {
			assert.equal( called, false );
			assert.equal( emitCalled, 0 );

			done();
		}, 5 );
	}
});

test({
	message			: 'ErrorHandler.addNamespace.with.different.namespaces',
	test			: ( done ) => {
		const errorHandler	= new ErrorHandler();

		errorHandler.addNamespace( 'WRONG NAMESAPCE' );

		assert.deepStrictEqual( errorHandler.namespaces.size, 0 );

		errorHandler.addNamespace( 'correct.namespace' );

		const expectedCase	= errorHandler.defaultNamespace;
		expectedCase.code	= 'correct.namespace';
		assert.deepStrictEqual( errorHandler.namespaces.get( 'correct.namespace' ), errorHandler.defaultNamespace );

		assert.deepStrictEqual( errorHandler.namespaces.size, 1 );

		done();
	}
});

test({
	message			: 'ErrorHandler.handleError.with.different.errors',
	dataProvider	: [
		[
			undefined,
			undefined,
			undefined,
			{ code: 'app.general', status: 500, headers: {} },
			{ error: { code: 'app.general' } },
			500,
			{}
		],
		[
			null,
			undefined,
			false,
			null,
			{ error: { code: 'app.general' } },
			500,
			{}
		],
		[
			null,
			152,
			undefined,
			{ code: 'app.general', status: 152, headers: {} },
			{ error: { code: 'app.general' } },
			152,
			{}
		],
		[
			'namespace.does.not.exist',
			undefined,
			undefined,
			{ code: 'namespace.does.not.exist', status: 500, error: 'namespace.does.not.exist', headers: {} },
			{ error: { code: 'namespace.does.not.exist' } },
			500,
			{}
		],
		[
			new Error( 'namespace.does.not.exist' ),
			undefined,
			undefined,
			{ code: 'namespace.does.not.exist', status: 500, error: new Error( 'namespace.does.not.exist' ), headers: {} },
			{ error: { code: 'namespace.does.not.exist' } },
			500,
			{}
		],
		[
			new Error( 'Just your everyday Error!' ),
			undefined,
			undefined,
			{ code: 'app.general', status: 500, message: 'Just your everyday Error!', error: new Error( 'Just your everyday Error!' ), headers: {} },
			{ error: { code: 'app.general', message: 'Just your everyday Error!' } },
			500,
			{}
		],
		[
			'Just your everyday Error!',
			undefined,
			undefined,
			{ code: 'app.general', status: 500, message: 'Just your everyday Error!', error: 'Just your everyday Error!', headers: {} },
			{ error: { code: 'app.general', message: 'Just your everyday Error!' } },
			500,
			{}
		],
		[
			{ code: 'namespace.does.not.exist' },
			undefined,
			undefined,
			{ code: 'namespace.does.not.exist', status: 500, headers: {} },
			{ error: { code: 'namespace.does.not.exist' } },
			500,
			{}
		],
		[
			{ code: 'namespace.does.not.exist', formatter: ( { code } ) => { return 'modified' + code; } },
			undefined,
			undefined,
			{ code: 'namespace.does.not.exist', status: 500, headers: {} },
			'modifiednamespace.does.not.exist',
			500,
			{}
		],
		[
			{ code: 'test.formatter.that.is.a.func' },
			undefined,
			undefined,
			{ code: 'test.formatter.that.is.a.func', status: 500, headers: {} },
			'FORMATTED',
			500,
			{}
		],
		[
			{ code: 'test.formatter.that.is.not.a.func' },
			undefined,
			undefined,
			{ code: 'test.formatter.that.is.not.a.func', status: 500, headers: {} },
			{ error: { code: 'test.formatter.that.is.not.a.func' } },
			500,
			{}
		],
		[
			{ code: 'namespace.does.not.exist', formatter: 'THIS WILL DO NOTHING' },
			undefined,
			undefined,
			{ code: 'namespace.does.not.exist', status: 500, headers: {} },
			{ error: { code: 'namespace.does.not.exist' } },
			500,
			{}
		],
		[
			{ code: 'namespace.does.not.exist', formatter: async ( { code } ) => { return 'modified' + code; } },
			undefined,
			undefined,
			{ code: 'namespace.does.not.exist', status: 500, headers: {} },
			'modifiednamespace.does.not.exist',
			500,
			{}
		],
		[
			{ code: 'namespace.does.not.exist', formatter: ( { code, status } ) => { return 'modified' + code + status; } },
			undefined,
			undefined,
			{ code: 'namespace.does.not.exist', status: 500, headers: {} },
			'modifiednamespace.does.not.exist500',
			500,
			{}
		],
		[
			{ code: 'Incorrect Namespace BABY' },
			undefined,
			undefined,
			{ code: 'Incorrect Namespace BABY', status: 500, headers: {} },
			{ error: { code: 'Incorrect Namespace BABY' } },
			500,
			{}
		],
		[
			{ code: 'namespace.does.not.exist', headers: { keyOne: 1, keyTwo: 2 } },
			undefined,
			undefined,
			{ code: 'namespace.does.not.exist', status: 500, headers: { keyOne: 1, keyTwo: 2 } },
			{ error: { code: 'namespace.does.not.exist' } },
			500,
			{ keyOne: 1, keyTwo: 2 }
		],
		[
			'namespace.does.not.exist',
			undefined,
			false,
			null,
			{ error: { code: 'namespace.does.not.exist' } },
			500,
			{}
		],
		[
			{ code: 'namespace.does.not.exist', emit: false },
			undefined,
			undefined,
			null,
			{ error: { code: 'namespace.does.not.exist' } },
			500,
			{}
		],
		[
			'namespace.does.not.exist',
			200,
			undefined,
			{ code: 'namespace.does.not.exist', status: 200, error: 'namespace.does.not.exist', headers: {} },
			{ error: { code: 'namespace.does.not.exist' } },
			200,
			{}
		],
		[
			{ code: 'namespace.does.not.exist', status: 200 },
			undefined,
			undefined,
			{ code: 'namespace.does.not.exist', status: 200, headers: {} },
			{ error: { code: 'namespace.does.not.exist' } },
			200,
			{}
		],
		[
			{ code: 'namespace.does.not.exist', status: 200, error: 'Some Error' },
			undefined,
			undefined,
			{ code: 'namespace.does.not.exist', status: 200, error: 'Some Error', message: 'Some Error', headers: {} },
			{ error: { code: 'namespace.does.not.exist', message: 'Some Error' } },
			200,
			{}
		],
		[
			{ code: 'namespace.does.not.exist', status: 200, error: 'Some Error', message: 'Some Message' },
			undefined,
			undefined,
			{ code: 'namespace.does.not.exist', status: 200, error: 'Some Error', message: 'Some Message', headers: {} },
			{ error: { code: 'namespace.does.not.exist', message: 'Some Message' } },
			200,
			{}
		],
		[
			'namespace.does.not.exist',
			200,
			false,
			null,
			{ error: { code: 'namespace.does.not.exist' } },
			200,
			{}
		],
		[
			{ code: 'namespace.does.not.exist', status: 200, emit: false },
			undefined,
			undefined,
			null,
			{ error: { code: 'namespace.does.not.exist' } },
			200,
			{}
		],
		[
			{ code: 'namespace.does.not.exist', status: 200, emit: false },
			undefined,
			true,
			null,
			{ error: { code: 'namespace.does.not.exist' } },
			200,
			{}
		],
		[
			{ code: 'namespace.does.not.exist', status: 200, emit: false, message: 'Unexisting namespace' },
			undefined,
			true,
			null,
			{ error: { code: 'namespace.does.not.exist', message: 'Unexisting namespace' } },
			200,
			{}
		],
		[
			{ code: 'namespace.does.not.exist', status: 200, emit: false, error: 'Unexisting namespace' },
			undefined,
			true,
			null,
			{ error: { code: 'namespace.does.not.exist', message: 'Unexisting namespace' } },
			200,
			{}
		],
		[
			{ code: 'namespace.does.not.exist', status: 200, emit: false },
			555,
			undefined,
			null,
			{ error: { code: 'namespace.does.not.exist' } },
			200,
			{}
		],
		[
			{ code: 'test.exists.with.just.message', message: 'Overwritten Default Message', headers: { keyOne: 1, keyTwo: 2 } },
			undefined,
			undefined,
			{ code: 'test.exists.with.just.message', status: 500, message: 'Overwritten Default Message', headers: { keyOne: 1, keyTwo: 2 } },
			{ error: { code: 'test.exists.with.just.message', message: 'Overwritten Default Message' } },
			500,
			{ keyOne: 1, keyTwo: 2 }
		],
		[
			{ code: 'test.exists.with.just.message' },
			undefined,
			undefined,
			{ code: 'test.exists.with.just.message', status: 500, message: 'Default Message', headers: {} },
			{ error: { code: 'test.exists.with.just.message', message: 'Default Message' } },
			500,
			{}
		],
		[
			{ code: 'test.exists.with.just.message', status: 501 },
			undefined,
			undefined,
			{ code: 'test.exists.with.just.message', status: 501, message: 'Default Message', headers: {} },
			{ error: { code: 'test.exists.with.just.message', message: 'Default Message' } },
			501,
			{}
		],
		[
			{ code: 'test.exists.with.just.message', error: 'Some Error!!' },
			undefined,
			undefined,
			{ code: 'test.exists.with.just.message', status: 500, message: 'Some Error!!', error: 'Some Error!!', headers: {} },
			{ error: { code: 'test.exists.with.just.message', message: 'Some Error!!' } },
			500,
			{}
		],
		[
			{ code: 'test.exists.with.just.message', status: 501 },
			undefined,
			undefined,
			{ code: 'test.exists.with.just.message', status: 501, message: 'Default Message', headers: {} },
			{ error: { code: 'test.exists.with.just.message', message: 'Default Message' } },
			501,
			{}
		],
		[
			{ code: 'test.exists.with.just.message', error: 'Some Error!!', message: 'Overwritten Message' },
			undefined,
			undefined,
			{ code: 'test.exists.with.just.message', status: 500, message: 'Overwritten Message', error: 'Some Error!!', headers: {} },
			{ error: { code: 'test.exists.with.just.message', message: 'Overwritten Message' } },
			500,
			{}
		],
		[
			{ code: 'test.exists.with.just.message', error: 'Some Error!!', message: 'Overwritten Message', emit: false },
			undefined,
			undefined,
			null,
			{ error: { code: 'test.exists.with.just.message', message: 'Overwritten Message' } },
			500,
			{}
		],
		[
			'test.exists.with.just.message',
			undefined,
			undefined,
			{ code: 'test.exists.with.just.message', status: 500, message: 'Default Message', error: 'test.exists.with.just.message', headers: {} },
			{ error: { code: 'test.exists.with.just.message', message: 'Default Message' } },
			500,
			{}
		],
		[
			new Error( 'test.exists.with.just.message' ),
			undefined,
			undefined,
			{ code: 'test.exists.with.just.message', status: 500, message: 'Default Message', error: new Error( 'test.exists.with.just.message' ), headers: {} },
			{ error: { code: 'test.exists.with.just.message', message: 'Default Message' } },
			500,
			{}
		],
		[
			'test.exists.with.just.message',
			123,
			undefined,
			{ code: 'test.exists.with.just.message', status: 123, message: 'Default Message', error: 'test.exists.with.just.message', headers: {} },
			{ error: { code: 'test.exists.with.just.message', message: 'Default Message' } },
			123,
			{}
		],
		[
			'test.exists.with.just.message',
			123,
			false,
			null,
			{ error: { code: 'test.exists.with.just.message', message: 'Default Message' } },
			123,
			{}
		],
		[
			'test.exists.with.just.message',
			undefined,
			false,
			null,
			{ error: { code: 'test.exists.with.just.message', message: 'Default Message' } },
			500,
			{}
		],
		[
			{ code: 'test.exists.with.message.and.status', status: 200 },
			undefined,
			undefined,
			{ code: 'test.exists.with.message.and.status', status: 200, message: 'Message with Status', headers: {} },
			{ error: { code: 'test.exists.with.message.and.status', message: 'Message with Status' } },
			200,
			{}
		],
		[
			{ code: 'test.exists.with.message.and.status' },
			undefined,
			undefined,
			{ code: 'test.exists.with.message.and.status', status: 532, message: 'Message with Status', headers: {} },
			{ error: { code: 'test.exists.with.message.and.status', message: 'Message with Status' } },
			532,
			{}
		],
		[
			{ code: 'test.exists.with.message.and.status', message: 'SOMETHING!' },
			undefined,
			undefined,
			{ code: 'test.exists.with.message.and.status', status: 532, message: 'SOMETHING!', headers: {} },
			{ error: { code: 'test.exists.with.message.and.status', message: 'SOMETHING!' } },
			532,
			{}
		],
		[
			{ code: 'test.exists.with.message.and.status', message: 'SOMETHING!', status: 521 },
			undefined,
			undefined,
			{ code: 'test.exists.with.message.and.status', status: 521, message: 'SOMETHING!', headers: {} },
			{ error: { code: 'test.exists.with.message.and.status', message: 'SOMETHING!' } },
			521,
			{}
		],
		[
			{ code: 'test.exists.with.message.and.status', message: 'SOMETHING!', status: 521, headers: { keyOne: 2 } },
			undefined,
			undefined,
			{ code: 'test.exists.with.message.and.status', status: 521, message: 'SOMETHING!', headers: { keyOne: 2 } },
			{ error: { code: 'test.exists.with.message.and.status', message: 'SOMETHING!' } },
			521,
			{ keyOne: 2 }
		],
		[
			'test.exists.with.message.and.status',
			undefined,
			undefined,
			{ code: 'test.exists.with.message.and.status', status: 532, message: 'Message with Status', error: 'test.exists.with.message.and.status', headers: {} },
			{ error: { code: 'test.exists.with.message.and.status', message: 'Message with Status' } },
			532,
			{}
		],
		[
			new Error( 'test.exists.with.message.and.status' ),
			undefined,
			undefined,
			{ code: 'test.exists.with.message.and.status', status: 532, message: 'Message with Status', error: new Error( 'test.exists.with.message.and.status' ), headers: {} },
			{ error: { code: 'test.exists.with.message.and.status', message: 'Message with Status' } },
			532,
			{}
		],
		[
			'test.exists.with.message.and.status',
			123,
			undefined,
			{ code: 'test.exists.with.message.and.status', status: 123, message: 'Message with Status', error: 'test.exists.with.message.and.status', headers: {} },
			{ error: { code: 'test.exists.with.message.and.status', message: 'Message with Status' } },
			123,
			{}
		],
		[
			'test.exists.with.message.and.status',
			123,
			false,
			null,
			{ error: { code: 'test.exists.with.message.and.status', message: 'Message with Status' } },
			123,
			{}
		],
		[
			'test.exists.with.message.and.status',
			undefined,
			false,
			null,
			{ error: { code: 'test.exists.with.message.and.status', message: 'Message with Status' } },
			532,
			{}
		],
		[
			'test.exists.with.status',
			undefined,
			false,
			null,
			{ error: { code: 'test.exists.with.status' } },
			462,
			{}
		],
		[
			'test.exists.with.status',
			undefined,
			undefined,
			{ code: 'test.exists.with.status', error: 'test.exists.with.status', status: 462, headers: {} },
			{ error: { code: 'test.exists.with.status' } },
			462,
			{}
		],
		[
			'test.exists.with.status',
			472,
			undefined,
			{ code: 'test.exists.with.status', error: 'test.exists.with.status', status: 472, headers: {} },
			{ error: { code: 'test.exists.with.status' } },
			472,
			{}
		],
		[
			'test.exists.with.status',
			472,
			true,
			{ code: 'test.exists.with.status', error: 'test.exists.with.status', status: 472, headers: {} },
			{ error: { code: 'test.exists.with.status' } },
			472,
			{}
		],
		[
			'test.exists.with.status',
			472,
			false,
			null,
			{ error: { code: 'test.exists.with.status' } },
			472,
			{}
		],
		[
			'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep',
			undefined,
			undefined,
			null,
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'DEEP message' } },
			532,
			{ headerOne: 1, headerTwo: 2 }
		],
		[
			'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep',
			123,
			undefined,
			null,
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'DEEP message' } },
			123,
			{ headerOne: 1, headerTwo: 2 }
		],
		[
			'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep',
			123,
			true,
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', status: 123, message: 'DEEP message', error: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', headers: { headerOne: 1, headerTwo: 2 } },
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'DEEP message' } },
			123,
			{ headerOne: 1, headerTwo: 2 }
		],
		[
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep' },
			123,
			true,
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', status: 123, message: 'DEEP message', headers: { headerOne: 1, headerTwo: 2 } },
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'DEEP message' } },
			123,
			{ headerOne: 1, headerTwo: 2 }
		],
		[
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', emit: true },
			undefined,
			undefined,
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', status: 532, message: 'DEEP message', headers: { headerOne: 1, headerTwo: 2 } },
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'DEEP message' } },
			532,
			{ headerOne: 1, headerTwo: 2 }
		],
		[
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', emit: true, status: 1235 },
			undefined,
			undefined,
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', status: 1235, message: 'DEEP message', headers: { headerOne: 1, headerTwo: 2 } },
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'DEEP message' } },
			1235,
			{ headerOne: 1, headerTwo: 2 }
		],
		[
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', emit: true, status: 1235, error: 'test' },
			undefined,
			undefined,
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', status: 1235, message: 'test', error: 'test', headers: { headerOne: 1, headerTwo: 2 } },
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'test' } },
			1235,
			{ headerOne: 1, headerTwo: 2 }
		],
		[
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', emit: true, status: 1235, message: 'test' },
			undefined,
			undefined,
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', status: 1235, message: 'test', headers: { headerOne: 1, headerTwo: 2 } },
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'test' } },
			1235,
			{ headerOne: 1, headerTwo: 2 }
		],
		[
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', emit: true, status: 1235, error: 'error', message: 'test' },
			undefined,
			undefined,
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', status: 1235, message: 'test', error: 'error', headers: { headerOne: 1, headerTwo: 2 } },
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'test' } },
			1235,
			{ headerOne: 1, headerTwo: 2 }
		],
		[
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', emit: true, status: 1235, error: 'error', message: 'test', headers: { test: 1 } },
			undefined,
			undefined,
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', status: 1235, message: 'test', error: 'error', headers: { test: 1 } },
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'test' } },
			1235,
			{ test: 1 }
		],
		[
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', emit: true, status: 1235, error: 'error', message: 'test' },
			undefined,
			false,
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', status: 1235, message: 'test', error: 'error', headers: { headerOne: 1, headerTwo: 2 } },
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'test' } },
			1235,
			{ headerOne: 1, headerTwo: 2 }
		],
		[
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', emit: true, status: 1235, error: 'error', message: 'test' },
			111,
			undefined,
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', status: 1235, message: 'test', error: 'error', headers: { headerOne: 1, headerTwo: 2 } },
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'test' } },
			1235,
			{ headerOne: 1, headerTwo: 2 }
		],
		[
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', emit: false },
			undefined,
			undefined,
			null,
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'DEEP message' } },
			532,
			{ headerOne: 1, headerTwo: 2 }
		],
		[
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', emit: true },
			undefined,
			false,
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', status: 532, message: 'DEEP message', headers: { headerOne: 1, headerTwo: 2 } },
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'DEEP message' } },
			532,
			{ headerOne: 1, headerTwo: 2 }
		],
		[
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', emit: true },
			undefined,
			false,
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', status: 532, message: 'DEEP message', headers: { headerOne: 1, headerTwo: 2 } },
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'DEEP message' } },
			532,
			{ headerOne: 1, headerTwo: 2 }
		],
		[
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep' },
			undefined,
			false,
			null,
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'DEEP message' } },
			532,
			{ headerOne: 1, headerTwo: 2 }
		],
		[
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep' },
			123,
			undefined,
			null,
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'DEEP message' } },
			123,
			{ headerOne: 1, headerTwo: 2 }
		],
		[
			{ code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep' },
			undefined,
			undefined,
			null,
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'DEEP message' } },
			532,
			{ headerOne: 1, headerTwo: 2 }
		],
		[
			new Error( 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep' ),
			undefined,
			undefined,
			null,
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'DEEP message' } },
			532,
			{ headerOne: 1, headerTwo: 2 }
		],
		[
			'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep',
			undefined,
			undefined,
			null,
			{ error: { code: 'test.deep.this.is.further.down.but.will.take.the.properties.of.test.deep', message: 'DEEP message' } },
			532,
			{ headerOne: 1, headerTwo: 2 }
		],
		[
			'test.callback',
			undefined,
			undefined,
			{ code: 'test.callback', headers: { headerOne: 1, headerTwo: 2 } },
			{ error: { code: 'test.callback' } },
			532,
			{ headerOne: 1, headerTwo: 2 }
		],
	],
	test			: ( done, errorToHandle, errorToHandleStatus, errorToHandleEmit, expectedEmittedError, expectedSentError, expectedSentStatus, expectedHeaders ) => {
		const eventRequest	= helpers.getEventRequest();
		const errorHandler	= new ErrorHandler();
		let actualHeaders	= {};
		let called			= false;
		let emitCalled		= 0;

		errorHandler.addNamespace( 'test.formatter.that.is.not.a.func', { formatter: 'Not a function!' } );
		errorHandler.addNamespace( 'test.formatter.that.is.a.func', { formatter: () => { return 'FORMATTED'; } } );
		errorHandler.addNamespace( 'test.exists.with.just.message', { message: 'Default Message' } );
		errorHandler.addNamespace( 'test.exists.with.message.and.status', { status: 532, message: 'Message with Status' } );
		errorHandler.addNamespace( 'test.exists.with.status', { status: 462 } );
		errorHandler.addNamespace( 'test.deep', { status: 532, message: 'DEEP message', emit: false, headers: { headerOne: 1, headerTwo: 2 } } );

		errorHandler.addNamespace(
			'test.callback',
			{
				callback: ( { event, code, status, message, error, headers, emit } ) => {
					emitCalled++;
					called			= true;
					actualHeaders	= headers;
					assert.deepStrictEqual( event, eventRequest );
					assert.deepStrictEqual( code, 'test.callback' );
					assert.deepStrictEqual( status, 532 );
					assert.deepStrictEqual( message, 'CALLBACK MESSAGE' );
					assert.deepStrictEqual( error, 'test.callback' );
					assert.deepStrictEqual( headers, { headerOne: 1, headerTwo: 2 } );
					assert.deepStrictEqual( emit, false );
				},
				status: 532,
				message: 'CALLBACK MESSAGE',
				emit: false,
				headers: { headerOne: 1, headerTwo: 2 }
			}
		);

		eventRequest._mock({
			method			: 'send',
			shouldReturn	: ( errorMessage, statusCode ) => {
				assert.deepStrictEqual( errorMessage, expectedSentError );
				assert.deepStrictEqual( expectedSentStatus, statusCode );
				called	= true;
			}
		});

		eventRequest._mock({
			method			: 'setResponseHeader',
			shouldReturn	: ( headerKey, headerValue ) => {
				actualHeaders[headerKey]	= headerValue;
			}
		});

		eventRequest._mock({
			method			: 'emit',
			shouldReturn	: ( event, emittedError ) => {
				emitCalled	++;
				assert.deepStrictEqual( event, 'on_error' );
				assert.deepStrictEqual( emittedError, expectedEmittedError );
			},
			with			: [
				['on_error', undefined],
			],
			called			: 1
		});

		errorHandler.handleError( eventRequest, errorToHandle, errorToHandleStatus, errorToHandleEmit );

		setTimeout(() => {
			assert.deepStrictEqual( called, true );
			assert.deepStrictEqual( emitCalled, expectedEmittedError === null ? 0 : 1 );
			assert.deepStrictEqual( actualHeaders, expectedHeaders );

			done();
		}, 5 );
	}
});
