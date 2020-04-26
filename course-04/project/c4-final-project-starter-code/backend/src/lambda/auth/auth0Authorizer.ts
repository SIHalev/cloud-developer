import {CustomAuthorizerEvent, CustomAuthorizerResult} from 'aws-lambda'
import 'source-map-support/register'
import {verify} from 'jsonwebtoken'
import {createLogger} from '../../utils/logger'
import Axios from 'axios'
import {Jwt} from '../../auth/Jwt'
import {JwtPayload} from '../../auth/JwtPayload'

const logger = createLogger('auth');

const jwksUrl = 'https://sihalev.eu.auth0.com/.well-known/jwks.json';

export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
    logger.info(`Authorizing a user ${event.authorizationToken}`);
    try {
        const jwtToken = await verifyToken(event.authorizationToken);
        logger.info('User was authorized', jwtToken);

        return {
            principalId: jwtToken.sub,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Allow',
                        Resource: '*'
                    }
                ]
            }
        }
    } catch (e) {
        logger.error('User not authorized', {error: e.message});

        return {
            principalId: 'user',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Allow',
                        // Effect: 'Deny',
                        Resource: '*'
                    }
                ]
            }
        }
    }
};

// TODO cache the certificate
async function getCertificates() {
    logger.info(`Fetched certificates from ${jwksUrl}`);
    return Axios.get(jwksUrl);
}

// https://auth0.com/blog/navigating-rs256-and-jwks
async function verifyToken(authHeader: string): Promise<JwtPayload> {
    const certificates = await getCertificates();
    // logger.info(`Fetched certificates ${JSON.stringify(certificates)}`);
    const certAlg = certificates[0].alg;
    const cert = certificates[0].x5c;

    const token = getToken(authHeader);
    const jwt: Jwt = verify(token, cert, {algorithms: [certAlg]}) as Jwt;

    return jwt.payload;
}

function getToken(authHeader: string): string {
    if (!authHeader) throw new Error('No authentication header');
    if (!authHeader.toLowerCase().startsWith('bearer ')) throw new Error('Invalid authentication header');

    const split = authHeader.split(' ');
    const token = split[1];
    return token;
}
