'use strict';

// Dependencies
const cluster	= require( 'cluster' );
const Worker	= require( './worker' );

/**
 * @brief	Cluster class used to spawn workers
 */
class Cluster
{
	/**
	 * @param	Server server
	 */
	constructor( server )
	{
		this.server					= server;
		this.communicationManager	= this.server.communicationManager;
	}

	/**
	 * @brief	Starts the cluster and spawns the given amount of workers
	 *
	 * @param	Number workers
	 * @param	Function callback
	 *
	 * @return	void
	 */
	startCluster( workers, callback )
	{
		if ( cluster.isMaster )
		{
			let spawnedWorkers	= [];
			for ( let i = 0; i < workers; ++ i )
			{
				let worker	= cluster.fork();
				spawnedWorkers.push( worker );
			}

			this.communicationManager.attachListeners( spawnedWorkers );
			callback( false );
		}
		else
		{
			new Worker( this.server );
		}
	}

	/**
	 * @brief	Stops all the spawned workers
	 *
	 * @return	void
	 */
	stopClusters()
	{
		if ( cluster.isMaster )
		{
			this.communicationManager.exitAllWorkers();
		}
	}
}

module.exports	= Cluster;