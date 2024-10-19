const fs = require('fs-extra');
const path = require('path');
const simpleGit = require('simple-git');
const { errorConsole, logConsole } = require('@thesuhu/colorconsole');
const readlineSync = require('readline-sync');
const os = require('os');
const { spawn } = require('child_process');

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
        let command, args;

        if (platform === 'win32') {
            command = 'explorer';
            args = ['/select,', todoFile];
        } else if (platform === 'darwin') {
            command = 'open';
            args = ['-R', todoFile];
        } else if (platform === 'linux') {
            command = 'xdg-open';
            args = [path.dirname(todoFile)];
        } else {
            throw new Error('Operating system not supported.');
        }

        const child = spawn(command, args, {
            detached: true,
            stdio: 'ignore'
        });

        child.on('error', (error) => {
            errorConsole('Error revealing todo.txt file in explorer: ' + error.message, false);
        });

        // Detach the child process
        child.unref();
    } catch (error) {
        errorConsole('Error revealing todo.txt file in explorer: ' + error.message, false);
    }
}

async function addTodo(todo) {
    try {
        const todos = await readTodos();
        let todayDate = new Date().toISOString().slice(0, 10); // Mendapatkan tanggal hari ini dalam format YYYY-MM-DD
        const newTodo = [
            // todo.C ? `x` : '',
            todo.p ? `(${todo.p})` : '',
            todo.C ? `${todo.C}` : '',
            todo.c ? todo.c : todayDate,
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

// async function updateTodo(oldTodoDesc, newTodo) {
//     try {
//         const todos = await readTodos();
//         let found = false;
//         const updatedTodos = todos.map(todo => {
//             if (todo.includes(oldTodoDesc)) {
//                 found = true;
//                 // Mendapatkan data todo lama
//                 const oldTodoParts = todo.split(' ');

//                 const specialTagRegex = /^(.+?):(.+)$/; // Mencocokkan pola <tag>:<value>
//                 const specialTagPart = oldTodoParts.find(part => specialTagRegex.test(part));
//                 const specialTagMatch = specialTagPart?.match(specialTagRegex);

//                 const oldTodo = {
//                     p: oldTodoParts.find(part => part.startsWith('(') && part.endsWith(')'))?.slice(1, -1),
//                     c: oldTodoParts.find(part => /^\d{4}-\d{2}-\d{2}$/.test(part)), // Gunakan newTodo.c jika ada
//                     d: oldTodoParts.filter(part =>
//                         !/^\d{4}-\d{2}-\d{2}$/.test(part) && // Abaikan bagian yang merupakan tanggal
//                         !/[x+@]/.test(part) &&
//                         !part.startsWith('(') &&
//                         !part.endsWith(')') &&
//                         !specialTagRegex.test(part)
//                     ).join(' '),
//                     P: oldTodoParts.find(part => part.startsWith('+'))?.substring(1), // Gunakan newTodo.P jika ada
//                     t: oldTodoParts.find(part => part.startsWith('@'))?.substring(1), // Gunakan newTodo.t jika ada
//                     s: (specialTagMatch ? `${specialTagMatch[1]}:${specialTagMatch[2]}` : undefined) // Gunakan newTodo.s jika ada
//                 };

//                 // Menggabungkan data todo lama dan baru
//                 const mergedTodo = {
//                     p: newTodo.p || oldTodo.p,
//                     c: newTodo.c || oldTodo.c,
//                     d: newTodo.d || oldTodo.d,
//                     P: newTodo.P || oldTodo.P,
//                     t: newTodo.t || oldTodo.t,
//                     s: newTodo.s || oldTodo.s
//                 };

//                 const updatedTodo = [
//                     mergedTodo.p ? `(${mergedTodo.p})` : '',
//                     mergedTodo.c ? `${mergedTodo.c}` : '',
//                     mergedTodo.d,
//                     mergedTodo.P ? `+${mergedTodo.P}` : '',
//                     mergedTodo.t ? `@${mergedTodo.t}` : '',
//                     mergedTodo.s || ''
//                 ].filter(Boolean).join(' ');
//                 return updatedTodo;
//             } else {
//                 return todo;
//             }
//         });

//         if (!found) {
//             errorConsole(`Old description: '${oldTodoDesc}' not found`, false);
//             return;
//         }

//         await writeTodos(updatedTodos);
//         logConsole('Todo updated successfully.', false);
//     } catch (error) {
//         errorConsole('Error updating todo: ' + error.message, false);
//     }
// }

async function updateTodo(oldTodoDesc, newTodo) {
    try {
        const todos = await readTodos();
        const matchingTodos = todos.filter(todo => todo.includes(oldTodoDesc));

        if (matchingTodos.length === 0) {
            errorConsole(`Old description: '\x1b[33m${oldTodoDesc}\x1b[0m' not found`, false);
            return;
        }

        if (matchingTodos.length > 1) {
            errorConsole(`Multiple todos found with description: '\x1b[33m${oldTodoDesc}\x1b[0m'. Update aborted.`, false);
            matchingTodos.forEach(todo => {
                const parts = todo.split(' ');
                const coloredParts = [];

                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    if (part.startsWith('x')) { // Status
                        coloredParts.push(`\x1b[90m${part}\x1b[0m`); // Abu-abu
                    } else if (part.startsWith('(')) { // Prioritas
                        coloredParts.push(`\x1b[33m${part}\x1b[0m`); // Kuning
                    } else if (/^\d{4}-\d{2}-\d{2}$/.test(part)) { // Tanggal Selesai atau Tanggal Dibuat
                        if (i === 0 || parts[i - 1].startsWith('x')) { // Jika di awal atau setelah 'x' (Status), maka Tanggal Selesai
                            coloredParts.push(`\x1b[36m${part}\x1b[0m`); // Cyan
                        } else { // Jika tidak, maka Tanggal Dibuat
                            coloredParts.push(`\x1b[96m${part}\x1b[0m`); // Biru muda
                        }
                    } else if (part.startsWith('+')) { // Project Tag
                        coloredParts.push(`\x1b[32m${part}\x1b[0m`); // Hijau
                    } else if (part.startsWith('@')) { // Context Tag
                        coloredParts.push(`\x1b[34m${part}\x1b[0m`); // Biru
                    } else if (/:/.test(part)) { // Special Tag
                        coloredParts.push(`\x1b[35m${part}\x1b[0m`); // Magenta
                    } else { // Deskripsi
                        coloredParts.push(part); // Tidak diberi warna
                    }
                }
                console.log(coloredParts.join(' '));
            });
            return;
        }

        const updatedTodos = todos.map(todo => {
            if (todo.includes(oldTodoDesc)) {
                // Mendapatkan data todo lama
                const oldTodoParts = todo.split(' ');

                const specialTagRegex = /^(.+?):(.+)$/; // Mencocokkan pola <tag>:<value>
                const specialTagPart = oldTodoParts.find(part => specialTagRegex.test(part));
                const specialTagMatch = specialTagPart?.match(specialTagRegex);

                const oldTodo = {
                    p: oldTodoParts.find(part => part.startsWith('(') && part.endsWith(')'))?.slice(1, -1),
                    c: oldTodoParts.find(part => /^\d{4}-\d{2}-\d{2}$/.test(part)), // Gunakan newTodo.c jika ada
                    d: oldTodoParts.filter(part =>
                        !/^\d{4}-\d{2}-\d{2}$/.test(part) && // Abaikan bagian yang merupakan tanggal
                        !/[x+@]/.test(part) &&
                        !part.startsWith('(') &&
                        !part.endsWith(')') &&
                        !specialTagRegex.test(part)
                    ).join(' '),
                    P: oldTodoParts.find(part => part.startsWith('+'))?.substring(1), // Gunakan newTodo.P jika ada
                    t: oldTodoParts.find(part => part.startsWith('@'))?.substring(1), // Gunakan newTodo.t jika ada
                    s: (specialTagMatch ? `${specialTagMatch[1]}:${specialTagMatch[2]}` : undefined) // Gunakan newTodo.s jika ada
                };

                // Menggabungkan data todo lama dan baru
                const mergedTodo = {
                    p: newTodo.p || oldTodo.p,
                    c: newTodo.c || oldTodo.c,
                    d: newTodo.d || oldTodo.d,
                    P: newTodo.P || oldTodo.P,
                    t: newTodo.t || oldTodo.t,
                    s: newTodo.s || oldTodo.s
                };

                const updatedTodo = [
                    mergedTodo.p ? `(${mergedTodo.p})` : '',
                    mergedTodo.c ? `${mergedTodo.c}` : '',
                    mergedTodo.d,
                    mergedTodo.P ? `+${mergedTodo.P}` : '',
                    mergedTodo.t ? `@${mergedTodo.t}` : '',
                    mergedTodo.s || ''
                ].filter(Boolean).join(' ');
                return updatedTodo;
            } else {
                return todo;
            }
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
            errorConsole(`Old description: '\x1b[33m${todoDesc}\x1b[0m' not found`, false);
            return;
        }

        if (matchingTodos.length > 1) {
            errorConsole(`Multiple todos found with description: '\x1b[33m${todoDesc}\x1b[0m'. Delete aborted.`, false);
            matchingTodos.forEach(todo => {
                const parts = todo.split(' ');
                const coloredParts = [];

                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    if (part.startsWith('x')) { // Status
                        coloredParts.push(`\x1b[90m${part}\x1b[0m`); // Abu-abu
                    } else if (part.startsWith('(')) { // Prioritas
                        coloredParts.push(`\x1b[33m${part}\x1b[0m`); // Kuning
                    } else if (/^\d{4}-\d{2}-\d{2}$/.test(part)) { // Tanggal Selesai atau Tanggal Dibuat
                        if (i === 0 || parts[i - 1].startsWith('x')) { // Jika di awal atau setelah 'x' (Status), maka Tanggal Selesai
                            coloredParts.push(`\x1b[36m${part}\x1b[0m`); // Cyan
                        } else { // Jika tidak, maka Tanggal Dibuat
                            coloredParts.push(`\x1b[96m${part}\x1b[0m`); // Biru muda
                        }
                    } else if (part.startsWith('+')) { // Project Tag
                        coloredParts.push(`\x1b[32m${part}\x1b[0m`); // Hijau
                    } else if (part.startsWith('@')) { // Context Tag
                        coloredParts.push(`\x1b[34m${part}\x1b[0m`); // Biru
                    } else if (/:/.test(part)) { // Special Tag
                        coloredParts.push(`\x1b[35m${part}\x1b[0m`); // Magenta
                    } else { // Deskripsi
                        coloredParts.push(part); // Tidak diberi warna
                    }
                }
                console.log(coloredParts.join(' '));
            });
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

async function doneTodo(todoDesc) {
    try {
        const todos = await readTodos();
        const matchingTodos = todos.filter(todo => todo.includes(todoDesc));

        if (matchingTodos.length === 0) {
            errorConsole(`Old description: '\x1b[33m${todoDesc}\x1b[0m' not found`, false);
            return;
        }

        if (matchingTodos.length > 1) {
            errorConsole(`Multiple todos found with description: '\x1b[33m${todoDesc}\x1b[0m'. Mark as done aborted.`, false);
            matchingTodos.forEach(todo => {
                const parts = todo.split(' ');
                const coloredParts = [];

                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    if (part.startsWith('x')) { // Status
                        coloredParts.push(`\x1b[90m${part}\x1b[0m`); // Abu-abu
                    } else if (part.startsWith('(')) { // Prioritas
                        coloredParts.push(`\x1b[33m${part}\x1b[0m`); // Kuning
                    } else if (/^\d{4}-\d{2}-\d{2}$/.test(part)) { // Tanggal Selesai atau Tanggal Dibuat
                        if (i === 0 || parts[i - 1].startsWith('x')) { // Jika di awal atau setelah 'x' (Status), maka Tanggal Selesai
                            coloredParts.push(`\x1b[36m${part}\x1b[0m`); // Cyan
                        } else { // Jika tidak, maka Tanggal Dibuat
                            coloredParts.push(`\x1b[96m${part}\x1b[0m`); // Biru muda
                        }
                    } else if (part.startsWith('+')) { // Project Tag
                        coloredParts.push(`\x1b[32m${part}\x1b[0m`); // Hijau
                    } else if (part.startsWith('@')) { // Context Tag
                        coloredParts.push(`\x1b[34m${part}\x1b[0m`); // Biru
                    } else if (/:/.test(part)) { // Special Tag
                        coloredParts.push(`\x1b[35m${part}\x1b[0m`); // Magenta
                    } else { // Deskripsi
                        coloredParts.push(part); // Tidak diberi warna
                    }
                }
                console.log(coloredParts.join(' '));
            });
            return;
        }

        if (!readlineSync.keyInYN('Are you sure you want to mark as done this todo?')) {
            return;
        }

        const updatedTodos = todos.filter(todo => {
            if (todo.includes(todoDesc) && !todo.startsWith('x ')) {
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
            todos.forEach(todo => {
                const parts = todo.split(' ');
                const coloredParts = [];

                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    if (part.startsWith('x')) { // Status
                        coloredParts.push(`\x1b[90m${part}\x1b[0m`); // Abu-abu
                    } else if (part.startsWith('(')) { // Prioritas
                        coloredParts.push(`\x1b[33m${part}\x1b[0m`); // Kuning
                    } else if (/^\d{4}-\d{2}-\d{2}$/.test(part)) { // Tanggal Selesai atau Tanggal Dibuat
                        if (i === 0 || parts[i - 1].startsWith('x')) { // Jika di awal atau setelah 'x' (Status), maka Tanggal Selesai
                            coloredParts.push(`\x1b[36m${part}\x1b[0m`); // Cyan
                        } else { // Jika tidak, maka Tanggal Dibuat
                            coloredParts.push(`\x1b[96m${part}\x1b[0m`); // Biru muda
                        }
                    } else if (part.startsWith('+')) { // Project Tag
                        coloredParts.push(`\x1b[32m${part}\x1b[0m`); // Hijau
                    } else if (part.startsWith('@')) { // Context Tag
                        coloredParts.push(`\x1b[34m${part}\x1b[0m`); // Biru
                    } else if (/:/.test(part)) { // Special Tag
                        coloredParts.push(`\x1b[35m${part}\x1b[0m`); // Magenta
                    } else { // Deskripsi
                        coloredParts.push(part); // Tidak diberi warna
                    }
                }

                console.log(coloredParts.join(' '));
            });
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
        if (!LOCAL_REPO) {
            throw new Error('Error: LOCAL_REPO environment variable is not set.');
        }
        if (!fs.existsSync(LOCAL_REPO)) {
            throw new Error(`Error: Local repository directory does not exist: ${LOCAL_REPO}`);
        }

        const git = simpleGit(LOCAL_REPO);
        
        console.log('Pulling latest changes from remote repository...');
        await git.pull('origin', 'main');
        
        const status = await git.status();
        if (status.files.length > 0) {
            console.log('Adding changes to staging area...');
            await git.add('.');
            
            let utcDateTime = new Date().toJSON();
            console.log('Committing changes...');
            await git.commit('Update todo.txt - ' + utcDateTime);
            
            console.log('Pushing changes to remote repository...');
            await git.push('origin', 'main');
            
            logConsole('Synced with git repository.', false);
        } else {
            console.log('No changes to commit.');
        }
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
