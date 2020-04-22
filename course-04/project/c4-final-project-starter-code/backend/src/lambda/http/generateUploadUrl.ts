import 'source-map-support/register'

import {APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda'
import {createLogger} from "../../utils/logger";
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import {DocumentClient} from "aws-sdk/clients/dynamodb";
import {getUserId} from "../utils";

const logger = createLogger('uploadTodoImage');

const XAWS = AWSXRay.captureAWS(AWS);
const docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient();

const s3 = new XAWS.S3({
    signatureVersion: 'v4'
});
const todosTable = process.env.TODOS_TABLE;
const imagesBucketName = process.env.TODOS_IMAGES_S3_BUCKET;
const signedUrlExpiration = process.env.SIGNED_URL_EXPIRATION;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const userId = getUserId(event);
    const todoId = event.pathParameters.todoId;
    logger.info(todoId);
    logger.info(docClient);

    const imageId = todoId; // Lets bind s3 image names with todoId's for easy management
    const attachmentUrl = `https://${imagesBucketName}.s3.amazonaws.com/${imageId}`;
    const uploadUrl = getUploadUrl(imagesBucketName, imageId, signedUrlExpiration);

    await docClient.update({// TODO: maybe use put????
        TableName: todosTable,
        Key: {
            "userId": userId,
            "todoId": todoId
        },
        UpdateExpression: "set attachmentUrl = :attachmentUrl",
        ExpressionAttributeValues: {
            ":attachmentUrl": attachmentUrl
        }
    }).promise();

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

function getUploadUrl(imagesBucketName: string, imageId: string, signedUrlExpiration: string) {
    return s3.getSignedUrl('putObject', {
        Bucket: imagesBucketName,
        Key: imageId,
        Expires: signedUrlExpiration
    })
}
