import 'source-map-support/register'

import {APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda'

import {UpdateTodoRequest} from '../../requests/UpdateTodoRequest'
import {createLogger} from "../../utils/logger";

import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import {getUserId} from "../utils";
import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";

const XAWS = AWSXRay.captureAWS(AWS);
const docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient();

const todosTable = process.env.TODOS_TABLE;

const logger = createLogger('uploadTodoImage');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info(`Processing event: ${event}`);
    const userId = getUserId(event);
    logger.info(`User id ${userId}`);
    const todoId = event.pathParameters.todoId;
    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body);

    logger.info(todoId + " " + updatedTodo);
    logger.info(docClient);

    await docClient.update({
        TableName: todosTable,
        Key: {
            "userId": userId,
            "todoId": todoId
        },
        // name is a reserved keyword this is why we handle it differently
        // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ExpressionAttributeNames.html#Expressions.ExpressionAttributeNames.ReservedWords
        UpdateExpression: "set #name=:name, dueDate=:dueDate, done=:done",
        ExpressionAttributeValues: {
            ":name": updatedTodo.name,
            ":dueDate": updatedTodo.dueDate,
            ":done": updatedTodo.done
        },
        ExpressionAttributeNames: {
            "#name": "name"
        }
    }).promise();

    return {
        statusCode: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
        },
        body: null
    };
};
