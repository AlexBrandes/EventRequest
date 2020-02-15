'use strict';

let uniqueId	= {};

/**
 * @brief	Helper method that generates a random string
 *
 * @param	Number length
 *
 * @return	String
 */
uniqueId.makeId	= ( length ) => {
	let text		= "";
	const possible	= "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	length			= typeof length === 'number' ? length : 10;

	for ( let i = 0; i < length; ++ i )
	{
		text	+= possible.charAt( Math.floor( Math.random() * possible.length ) );
	}

	return text;
};

// Export the module
module.exports	= uniqueId;
