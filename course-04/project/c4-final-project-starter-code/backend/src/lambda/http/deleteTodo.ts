import 'source-map-support/register'

import {APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda'
import {createLogger} from "../../utils/logger";
import {getUserId} from "../utils";
import {deleteTodo} from "../../logicLayer/todos";

const logger = createLogger('deleteTodo');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info(`Processing event: ${event}`);

    const userId: string = getUserId(event);
    const todoId = event.pathParameters.todoId;

    const deletedTodoId = await deleteTodo(userId, todoId);
    logger.info(`Processing event: ${deletedTodoId}`);

    return {
        statusCode: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
        },
        body: null
    };
};
