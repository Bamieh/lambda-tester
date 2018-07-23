'use strict';

const LambdaRunner = require( '../runner' );

const utils = require( '../utils' );

const DEFAULT_TIMEOUT = 0;

class BaseTester {

    constructor( eventBase = {} ) {

        this._handler = null;

        this._context = {};

        this._event = Object.assign( {}, eventBase );

        this.options = {

            timeout: DEFAULT_TIMEOUT,
            enforceTimeout: false,
            checkForHandleLeak: false
        };
    }

    handler( handlerFunc ) {

        this._handler = handlerFunc;

        return this;
    }

    context( ctx )  {

        // copy entire context
        this._context = Object.assign( {}, ctx );

        return this;
    }

    checkForLeaks( enabled = true ) {

        this.options.checkForHandleLeak = enabled;
        return this;
    }

    updateContext( ctx ) {

        this._context = Object.assign( this._context, ctx );

        return this;
    }

    clientContext( clientContext ) {

        utils.putValue( this._context, 'clientContext', clientContext );
        return this;
    }

    identity( cognitoIdentityId, cognitoIdentityPoolId ) {

        utils.putValue( this._context, 'identity', {

                cognitoIdentityId,
                cognitoIdentityPoolId
            });

        return this;
    }

    timeout( seconds ) {

        this.options.timeout = seconds * 1000;
        this.options.enforceTimeout = true;

        return this;
    }

    xray() {

        this.options.xray = true;

        return this;
    }

    contextValue( nameOrPath, value ) {

        utils.putValue( this._context, nameOrPath, value );

        return this;
    }

    expectSucceed( resultVerifier ) {

        return this.createRunner( 'context.succeed', resultVerifier );
    }

    expectFail( resultVerifier ) {

        return this.createRunner( 'context.fail', resultVerifier );
    }

    expectError( resultVerifier ) {

        return this.createRunner( 'callback:error', resultVerifier );
    }

    expectResult( resultVerifier ) {

        return this.createRunner( 'callback:result', resultVerifier );
    }

    expectResolve( resultVerifier ) {

        return this.createRunner( 'Promise.resolve', resultVerifier );
    }

    expectReject( resultVerifier ) {

        return this.createRunner( 'Promise.reject', resultVerifier );
    }

    createRunner( execMethod, resultVerifier ) {

        return this._promisifyHandler()
            .then( ( handler ) => {

                return new LambdaRunner( execMethod, resultVerifier, this.options )
                        .withEvent( this._event )
                        .withContext( this._context )
                        .run( handler );

            });
    }

    _resolveHandler() {

        return this._handler;
    }

    _promisifyHandler() {

        return new Promise( ( resolve, reject ) => {

            try {

                let handler = this._resolveHandler();

                if( !handler ) {

                    throw new Error( 'no handler specified or returned from loadHandler()' );
                }

                resolve( handler );
            }
            catch( err ) {

                reject( err );
            }
        });
    }
}


module.exports = BaseTester;
