import {TodoItem} from "../models/TodoItem";
import {CreateTodoRequest} from "../requests/CreateTodoRequest";

import * as uuid from 'uuid'
import {TodoUpdate} from "../models/TodoUpdate";
import {UpdateTodoRequest} from "../requests/UpdateTodoRequest";
import {TodosImageAccess} from "../dataLayer/s3/todosImageAccess";
import {TodosAccess} from "../dataLayer/dynamodb/todosAccess";

const todosAccess = new TodosAccess();
const todosImageAccess = new TodosImageAccess();


export async function getAllTodos(userId: string): Promise<TodoItem[]> {
    return todosAccess.getAllTodos(userId);
}

export async function makeUploadUrl(userId: string, todoId: string): Promise<string> {
    const imageId = todoId; // Lets bind s3 image names with todoId's for easy management
    const uploadUrl = todosImageAccess.getImageUploadUrl(imageId);
    const attachmentUrl = todosImageAccess.getImageAttachmentUrl(imageId);

    await todosAccess.updateTodoAttachUrl(userId, todoId, attachmentUrl);
    return uploadUrl;
}

export async function createTodo(userId: string, createTodoRequest: CreateTodoRequest): Promise<TodoItem> {
    const todoId = uuid.v4();
    const createdAt: string = new Date().toISOString();

    const newTodo: TodoItem = {
        userId,
        todoId,
        createdAt,
        done: false,
        attachmentUrl: null,
        ...createTodoRequest
    };

    return todosAccess.createTodo(newTodo);
}

export async function updateTodo(userId: string, todoId: string, updateTodoRequest: UpdateTodoRequest): Promise<TodoUpdate> {

    const todoUpdate: TodoUpdate = {
        ...updateTodoRequest
    };

    return todosAccess.updateTodo(userId, todoId, todoUpdate);
}


export async function deleteTodo(userId: string, todoId: string): Promise<string> {
    // TODO: remove stored attachments
    return todosAccess.deleteTodo(userId, todoId);
}
