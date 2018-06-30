'use strict';

// Dependencies
const { Mock, assert, test }	= require( './../../../../testing_suite' );
const { Log }					= require( './../../../../../server/components/logger/loggur' );

/**
 * @brief	Constants
 */
const LOG_LEVELS	= {
	error	: 100,
	warning	: 200,
	notice	: 300,
	info	: 400,
	verbose	: 500,
	debug	: 600
};

const DEFAULT_LOG_LEVEL			= LOG_LEVELS.error;
const WRONG_LOG_DEFAULT_LEVEL	= LOG_LEVELS.debug;
const WRONG_LOG_DEFAULT_MESSAGE	= 'Invalid log message provided, could not be parsed';

test({
	message	: 'Log.constructor on default',
	test	: ( done )=>{
		let log	= new Log();

		assert.equal( log.message, WRONG_LOG_DEFAULT_MESSAGE );
		assert.equal( log.level, WRONG_LOG_DEFAULT_LEVEL );
		assert.equal( typeof log.timestamp === 'number' && log.timestamp > 0, true );
		assert.equal( log.uniqueId, '' );

		done();
	}
});

test({
	message	: 'Log.constructor on string',
	test	: ( done )=>{
		let logMessage	= 'test';
		let log			= new Log( logMessage );

		assert.equal( log.message, logMessage );
		assert.equal( log.level, DEFAULT_LOG_LEVEL );
		assert.equal( typeof log.timestamp === 'number' && log.timestamp > 0, true );
		assert.equal( log.uniqueId, '' );

		done();
	}
});

test({
	message	: 'Log.constructor on object',
	test	: ( done )=>{
		let logMessage	= 'test';
		let logLevel	= LOG_LEVELS.error;
		let log			= new Log({
			message	: logMessage,
			level	: logLevel
		});

		assert.equal( log.message, logMessage );
		assert.equal( log.level, logLevel );
		assert.equal( typeof log.timestamp === 'number' && log.timestamp > 0, true );
		assert.equal( log.uniqueId, '' );

		done();
	}
});

test({
	message	: 'Log.constructor on invalid',
	test	: ( done )=>{
		let log			= new Log({
			key	: 'value'
		});

		assert.equal( log.message, WRONG_LOG_DEFAULT_MESSAGE );
		assert.equal( log.level, WRONG_LOG_DEFAULT_LEVEL );
		assert.equal( typeof log.timestamp === 'number' && log.timestamp > 0, true );
		assert.equal( log.uniqueId, '' );

		done();
	}
});

test({
	message	: 'Log.constructor on object message',
	test	: ( done )=>{
		let logMessage	= { key	: 'value' };
		let log			= new Log({
			message	: logMessage
		});

		assert.equal( log.message, JSON.stringify( logMessage ) );
		assert.equal( log.level, WRONG_LOG_DEFAULT_LEVEL );
		assert.equal( typeof log.timestamp === 'number' && log.timestamp > 0, true );
		assert.equal( log.uniqueId, '' );

		done();
	}
});

test({
	message	: 'Log.getLevel returns the level',
	test	: ( done )=>{
		let log	= new Log();

		assert.equal( log.getLevel(), WRONG_LOG_DEFAULT_LEVEL );

		done();
	}
});

test({
	message	: 'Log.getMessage returns the message',
	test	: ( done )=>{
		let log	= new Log();

		assert.equal( log.getMessage(), WRONG_LOG_DEFAULT_MESSAGE );

		done();
	}
});

test({
	message	: 'Log.getTimestamp returns a number',
	test	: ( done )=>{
		let log	= new Log();

		assert.equal( typeof log.getTimestamp(), 'number' );

		done();
	}
});

test({
	message	: 'Log.setUniqueId and geUniqueId',
	test	: ( done )=>{
		let log	= new Log();
		log.setUniqueId( 'testID' );
		assert.equal( log.getUniqueId(), 'testID' );

		done();
	}
});

test({
	message	: 'Log.toString returns a string',
	test	: ( done )=>{
		let log	= new Log();

		assert.equal( typeof log.toString(), 'string' );

		done();
	}
});

test({
	message	: 'Log.getInstance returns the same as constructor',
	test	: ( done )=>{
		let logOne	= new Log();
		let logTwo	= Log.getInstance();

		assert.deepStrictEqual( logOne, logTwo );

		done();
	}
});

test({
	message	: 'Log.getInstance if an instance of Log is given returns it',
	test	: ( done )=>{
		let logOne	= new Log( 'test' );
		let logTwo	= Log.getInstance( logOne );

		assert.deepStrictEqual( logOne, logTwo );

		done();
	}
});

test({
	message	: 'Log.getUNIXTime returns a number',
	test	: ( done )=>{
		assert.deepStrictEqual( typeof Log.getUNIXTime(), 'number' );

		done();
	}
});