'use strict';

const ValidationAttribute	= require( './validation_attribute' );

/**
 * @brief	Validation result that holds information of all the attributes being validated and their results
 */
class ValidationResult
{
	constructor()
	{
		this.attributes			= [];
		this.result				= null;
		this.validationFailed	= false;
	}

	/**
	 * @brief	Adds attributes to the validation result
	 *
	 * @param	ValidationAttribute attribute
	 *
	 * @return	void
	 */
	addAttribute( attribute )
	{
		if ( ! ( attribute instanceof ValidationAttribute ) )
		{
			throw new Error( 'Invalid attribute added. Attribute must be an instanceof ValidationAttribute' );
		}

		this.attributes.push( attribute );
	}

	/**
	 * @brief	Triggers the validate self on each of the added attributes and returns the validation
	 *
	 * @return	Object
	 */
	validateAllAttributes()
	{
		if ( this.result === null )
		{
			this.result	= [];

			this.attributes.forEach( ( attribute ) => {
				let validation				= attribute.validateSelf();
				this.result[attribute.key]	= validation;

				if ( validation !== false )
				{
					this.validationFailed	= true;
				}
			});
		}
	}

	/**
	 * @brief	Checks if the validation of a given ValidationInput has failed.
	 *
	 * @return	Boolean
	 */
	hasValidationFailed()
	{
		this.validateAllAttributes();

		return this.validationFailed;
	}

	/**
	 * @brief	Gets the reason if any of validation failure
	 *
	 * @return	Array|Boolean
	 */
	getValidationResult()
	{
		this.validateAllAttributes();

		return this.result;
	}
}

module.exports	= ValidationResult;