import {APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import {createLogger} from "../../utils/logger";
import {getUserId} from "../utils";
import {DocumentClient} from "aws-sdk/clients/dynamodb";

const XAWS = AWSXRay.captureAWS(AWS);

const logger = createLogger('uploadTodoImage');

const docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient();
const todosTable = process.env.TODOS_TABLE;
const todosIdIndex = process.env.INDEX_USER_ID;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Caller event', event);
    const userId = getUserId(event);
    logger.info(`User id ${userId}`);

    const result = await docClient.query({
        TableName: todosTable,
        IndexName: todosIdIndex,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        },
        ScanIndexForward: false
    }).promise();

    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            items: result.Items
        })
    };
};
