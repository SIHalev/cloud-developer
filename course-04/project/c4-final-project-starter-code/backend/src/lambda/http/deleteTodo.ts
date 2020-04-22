import 'source-map-support/register'

import {APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda'
import {createLogger} from "../../utils/logger";
import {DocumentClient} from "aws-sdk/clients/dynamodb";
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import {getUserId} from "../utils";

const logger = createLogger('deleteTodo');

const XAWS = AWSXRay.captureAWS(AWS);
const docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient();

const todosTable = process.env.TODOS_TABLE;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const userId: string = getUserId(event);
    const todoId = event.pathParameters.todoId;
    logger.info(todoId);
    logger.info(docClient);

    const result = await docClient.delete({
        TableName: todosTable,
        Key: {
            "userId": userId,
            "todoId": todoId
        }
    }).promise();

    logger.error(result);

    return {
        statusCode: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
        },
        body: null //TODO: Check if it should be ''
    };
};
