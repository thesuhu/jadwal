const fs = require('fs-extra');
const path = require('path');
const simpleGit = require('simple-git');
const { errorConsole, logConsole } = require('@thesuhu/colorconsole');
const readlineSync = require('readline-sync');
const os = require('os');
const { exec } = require('child_process');

require('dotenv').config();

const LOCAL_REPO = process.env.LOCAL_REPO;
const REMOTE_GIT = process.env.REMOTE_GIT;
if (!LOCAL_REPO) {
    errorConsole('Error: LOCAL_REPO environment variable is not set.');
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

async function revealInExplorer() {
    try {
        const platform = os.platform();
        let command;

        if (platform === 'win32') {
            command = `explorer /select,"${todoFile}"`;
        } else if (platform === 'darwin') {
            command = `open -R "${todoFile}"`;
        } else if (platform === 'linux') {
            // Perintah untuk Linux bisa bervariasi tergantung pada file manager yang digunakan
            command = `xdg-open "${path.dirname(todoFile)}"`; // Contoh dengan xdg-open
        } else {
            throw new Error('Operating system not supported.');
        }

        exec(command, (error, stdout, stderr) => {
            // if (error) {
            //     throw error;
            // }
            logConsole('todo.txt file revealed in explorer.', false);
        });
    } catch (error) {
        errorConsole('Error revealing todo.txt file in explorer: ' + error.message, false);
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
                // Mendapatkan data todo lama
                const oldTodoParts = todo.split(' ');

                const specialTagRegex = /^(.+?):(.+)$/; // Mencocokkan pola <tag>:<value>
                const specialTagPart = oldTodoParts.find(part => specialTagRegex.test(part));
                const specialTagMatch = specialTagPart?.match(specialTagRegex);

                const oldTodo = {
                    C: newTodo.C || oldTodoParts.find(part => part.startsWith('x'))?.substring(2),
                    p: newTodo.p || oldTodoParts.find(part => part.startsWith('(') && part.endsWith(')'))?.slice(1, -1),
                    c: newTodo.c || oldTodoParts.find(part => /^\d{4}-\d{2}-\d{2}$/.test(part)), // Gunakan newTodo.c jika ada
                    d: oldTodoParts
                        .filter(part =>
                            !/[x+@]/.test(part) &&
                            !part.startsWith('(') &&
                            !part.endsWith(')') &&
                            !specialTagRegex.test(part)
                        )
                        .join(' '),
                    P: newTodo.P || oldTodoParts.find(part => part.startsWith('+'))?.substring(1), // Gunakan newTodo.P jika ada
                    t: newTodo.t || oldTodoParts.find(part => part.startsWith('@'))?.substring(1), // Gunakan newTodo.t jika ada
                    s: newTodo.s || (specialTagMatch ? `${specialTagMatch[1]}:${specialTagMatch[2]}` : undefined) // Gunakan newTodo.s jika ada
                };

                // Menggabungkan data todo lama dan baru
                const mergedTodo = {
                    C: newTodo.C || oldTodo.C,
                    p: newTodo.p || oldTodo.p,
                    c: newTodo.c || oldTodo.c,
                    d: newTodo.d || oldTodo.d,
                    P: newTodo.P || oldTodo.P,
                    t: newTodo.t || oldTodo.t,
                    s: newTodo.s || oldTodo.s
                };
                const updatedTodo = [
                    mergedTodo.C ? `x ${mergedTodo.C}` : '',
                    mergedTodo.p ? `(${mergedTodo.p})` : '',
                    mergedTodo.c ? `${mergedTodo.c}` : '', 
                    mergedTodo.d,
                    mergedTodo.P ? `+${mergedTodo.P}` : '',
                    mergedTodo.t ? `@${mergedTodo.t}` : '',
                    mergedTodo.s || ''
                ].filter(Boolean).join(' ');
                return updatedTodo;
            } else {
                errorConsole(`Old description: '${oldTodoDesc}' not found`, false);
                return false;
            }
        });
        if (!updatedTodos[0]) {
            return;
        }
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
        if (!REMOTE_GIT) {
            throw new Error('Error: REMOTE_GIT environment variable is not set.');
        }
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
    deleteTodo,
    revealInExplorer
};
