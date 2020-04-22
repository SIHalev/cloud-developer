import {APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda'
import 'source-map-support/register'
import * as uuid from 'uuid'

import {CreateTodoRequest} from '../../requests/CreateTodoRequest'
import {getUserId} from "../utils";
import {createLogger} from "../../utils/logger";


import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import {DocumentClient} from "aws-sdk/clients/dynamodb";

const XAWS = AWSXRay.captureAWS(AWS);
const docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient();

const logger = createLogger('createTodo');

const todosTable = process.env.TODOS_TABLE;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing event: ', event);

    const parsedTodoBody: CreateTodoRequest = JSON.parse(event.body);
    const todoId = uuid.v4(); // TODO: maybe just incremental?
    const createdAt: string = new Date().toISOString();
    const userId: string = getUserId(event);

    logger.info(docClient);
    logger.info(todoId + " " + createdAt);

    const newTodo = {
        userId,
        todoId,
        createdAt,
        done: false,
        attachmentUrl: null,
        ...parsedTodoBody // TODO: validate name and due date
    };

    const result = await docClient.put({
        TableName: todosTable,
        Item: newTodo
    }).promise();

    logger.info(result);
    return {
        statusCode: 201,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
            item: newTodo
        })
    }
};
