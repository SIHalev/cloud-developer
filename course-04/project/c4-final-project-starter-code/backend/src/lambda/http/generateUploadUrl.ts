import 'source-map-support/register'

import {APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda'
import {createLogger} from "../../utils/logger";
import {getUserId} from "../utils";
import {makeUploadUrl} from "../../logicLayer/todos";

const logger = createLogger('uploadTodoImage');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info(`Processing event: ${event}`);

    const userId = getUserId(event);
    const todoId = event.pathParameters.todoId;

    const uploadUrl = await makeUploadUrl(userId, todoId);

    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            uploadUrl
        })
    };
};

