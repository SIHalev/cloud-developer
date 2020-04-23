import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import {DocumentClient} from "aws-sdk/clients/dynamodb";
import {TodoItem} from "../../models/TodoItem";
import {createLogger} from "../../utils/logger";
import {TodoUpdate} from "../../models/TodoUpdate";

const XAWS = AWSXRay.captureAWS(AWS);

const logger = createLogger('dataLayer');

export class TodosAccess {

    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly todosIdIndex = process.env.INDEX_USER_ID,
    ) {
        // NO-OP
    }

    async getAllTodos(userId: string): Promise<TodoItem[]> {
        logger.info(`Getting all todos for ${userId}`);
        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.todosIdIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false
        }).promise();

        const items = result.Items;
        logger.info(`Returning total todos ${items.length} for ${userId}`);
        return items as TodoItem[]
    }

    async createTodo(newTodo: TodoItem): Promise<TodoItem> {
        logger.info(`Generating new todo with id ${newTodo.todoId}`);
        await this.docClient.put({
            TableName: this.todosTable,
            Item: newTodo
        }).promise();

        return newTodo
    }

    async updateTodo(userId: string, todoId: string, updateTodo: TodoUpdate): Promise<TodoUpdate> {
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            },
            // name is a reserved keyword this is why we handle it differently
            // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ExpressionAttributeNames.html#Expressions.ExpressionAttributeNames.ReservedWords
            UpdateExpression: "set #name=:name, dueDate=:dueDate, done=:done",
            ExpressionAttributeValues: {
                ":name": updateTodo.name,
                ":dueDate": updateTodo.dueDate,
                ":done": updateTodo.done
            },
            ExpressionAttributeNames: {
                "#name": "name"
            }
        }).promise();

        return updateTodo;
    }

    async updateTodoAttachUrl(userId: string, todoId: string, attachmentUrl: string): Promise<string> {
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            },
            UpdateExpression: "set attachmentUrl = :attachmentUrl",
            ExpressionAttributeValues: {
                ":attachmentUrl": attachmentUrl
            }
        }).promise();

        return attachmentUrl;
    }

    async deleteTodo(userId: string, todoId: string): Promise<string> {
        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            }
        }).promise();

        return todoId;
    }


}
