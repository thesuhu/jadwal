const fs = require('fs-extra');
const path = require('path');
const simpleGit = require('simple-git');
const { errorConsole, logConsole } = require('@thesuhu/colorconsole');
const readlineSync = require('readline-sync');

require('dotenv').config();

const LOCAL_REPO = process.env.LOCAL_REPO;
const REMOTE_GIT = process.env.REMOTE_GIT;
if (!LOCAL_REPO) {
    console.error('Error: TODO_LOCAL_REPO environment variable is not set.');
    process.exit(1); // Menghentikan eksekusi skrip dengan kode kesalahan
}

const todoFile = path.join(LOCAL_REPO, 'todo.txt');

async function readTodos() {
    try {
        const data = await fs.readFile(todoFile, 'utf8');
        return data.split('\n').filter(line => line.trim() !== '');
    } catch (error) {
        errorConsole('Error reading todos: ' + error.message, false);
        return [];
    }
}

async function writeTodos(todos) {
    try {
        const data = todos.join('\n');
        await fs.writeFile(todoFile, data, 'utf8');
    } catch (error) {
        errorConsole('Error writing todos: ' + error.message, false);
    }
}

async function addTodo(todo) {
    try {
        const todos = await readTodos();
        const newTodo = [
            todo.C ? `x` : '',
            todo.p ? `(${todo.p})` : '',
            todo.C ? `${todo.C}` : '',
            todo.c ? todo.c : '',
            todo.d,
            todo.P ? `+${todo.P}` : '',
            todo.t ? `@${todo.t}` : '',
            todo.s || ''
        ].filter(Boolean).join(' ');

        todos.push(newTodo);
        await writeTodos(todos);
        logConsole('Todo added successfully.', false);
    } catch (error) {
        errorConsole('Error adding todo: ' + error.message, false);
    }
}

async function updateTodo(oldTodoDesc, newTodo) {
    try {
        const todos = await readTodos();
        const updatedTodos = todos.map(todo => {
            if (todo.includes(oldTodoDesc)) {
                const updatedTodo = [
                    newTodo.C ? `x ${newTodo.C}` : '',
                    newTodo.p ? `(${newTodo.p})` : '',
                    newTodo.c ? newTodo.c : '',
                    newTodo.d,
                    newTodo.P ? `+${newTodo.P}` : '',
                    newTodo.t ? `@${newTodo.t}` : '',
                    newTodo.s ? newTodo.s : ''
                ].filter(Boolean).join(' ');
                return updatedTodo;
            }
            return todo;
        });

        await writeTodos(updatedTodos);
        logConsole('Todo updated successfully.', false);
    } catch (error) {
        errorConsole('Error updating todo: ' + error.message, false);
    }
}

async function deleteTodo(todoDesc) {
    try {
        const todos = await readTodos();
        const matchingTodos = todos.filter(todo => todo.includes(todoDesc));

        if (matchingTodos.length === 0) {
            throw new Error('No todo found with the given description.');
        } else if (matchingTodos.length > 1) {
            errorConsole('Multiple todos found with the given description. Please refine your search.', false);
            return;
        }

        if (!readlineSync.keyInYN('Are you sure you want to delete this todo?')) {
            return;
        }

        const updatedTodos = todos.filter(todo => !todo.includes(todoDesc));
        await writeTodos(updatedTodos);
        logConsole('Todo deleted successfully.', false);
    } catch (error) {
        errorConsole('Error deleting todo: ' + error.message, false);
    }
}

async function doneTodo(partialDescription) {
    try {
        const todos = await readTodos();
        const updatedTodos = todos.map(todo => {
            if (todo.includes(partialDescription) && !todo.startsWith('x ')) {
                return `x ${todo}`;
            }
            return todo;
        });
        await writeTodos(updatedTodos);
        logConsole('Todo marked as done.', false);
    } catch (error) {
        errorConsole('Error marking todo as done: ' + error.message, false);
    }
}

async function listTodos() {
    try {
        const todos = await readTodos();
        if (todos.length === 0) {
            logConsole('No todos found.', false);
        } else {
            todos.forEach(todo => console.log(todo));
        }
    } catch (error) {
        errorConsole('Error listing todos: ' + error.message, false);
    }
}

async function syncWithGit() {
    try {
        const git = simpleGit(REMOTE_GIT);
        await git.pull();
        await git.add('.');
        await git.commit('Update todo.txt');
        await git.push('origin', 'main');
        logConsole('Synced with git repository.', false);
    } catch (error) {
        errorConsole('Error syncing with git: ' + error.message, false);
    }
}

module.exports = {
    addTodo,
    listTodos,
    doneTodo,
    syncWithGit,
    updateTodo,
    deleteTodo
};
