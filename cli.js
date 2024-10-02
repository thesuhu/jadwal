#!/usr/bin/env node

const { addTodo, listTodos, doneTodo, syncWithGit, 
    revealInExplorer, deleteTodo, updateTodo } = require('.');
const { errorConsole, logConsole } = require('@thesuhu/colorconsole');

const command = process.argv[2];
const args = process.argv.slice(3);

function parseOptions(args) {
    const options = {};
    for (let i = 0; i < args.length; i += 2) {
        if (args[i].startsWith('-')) {
            const key = args[i].replace(/^-+/, '');
            const value = args[i + 1];
            options[key] = value;
        }
    }
    return options;
}

async function main() {
    switch (command) {
        case 'add': {
            const options = parseOptions(args);
            try {
                validateOptions(options); // Panggil fungsi validasi dengan isUpdate = false (default)
                await addTodo({
                    d: options.d || options['description'],
                    p: options.p || options['priority'],
                    c: options.c || options['creation-date'],
                    C: options.C || options['completion-date'],
                    P: options.P || options['project'],
                    t: options.t || options['context'],
                    s: options.s || options['special-tag']
                });
            } catch (error) {
                console.error(error.message);
            }
            break;
        }
        case 'update': {
            const options = parseOptions(args);
            const oldDescription = options['old-description'] || options.o; // Terima juga -o

            if (!oldDescription) {
                console.error("Please provide the old description using \x1b[33m--old-description\x1b[0m or \x1b[33m-o\x1b[0m.");
                break;
            }

            try {
                validateOptions(options, true);
                await updateTodo(oldDescription, {
                    d: options.d || options['description'],
                    p: options.p || options['priority'],
                    c: options.c || options['creation-date'],
                    P: options.P || options['project'],
                    t: options.t || options['context'],
                    s: options.s || options['special-tag']
                });
            } catch (error) {
                console.error(error.message);
            }
            break;
        }
        case 'delete': {
            const description = args[0];
            if (!description) {
                console.error("Please provide the description of the todo to delete.");
                break;
            }
            await deleteTodo(description);
            break;
        }
        case 'list':
            await listTodos();
            break;
        case 'done':
            await doneTodo(args[0]);
            break;
        case 'sync':
            await syncWithGit();
            break;
        case 'reveal':
            await revealInExplorer();
            break;
        case 'help':
            if (args[0] === 'add') {
                console.log('Usage: \x1b[36mjadwal\x1b[0m \x1b[32madd\x1b[0m \x1b[33m--description <text>\x1b[0m [options]');
                console.log('Options:');
                console.log('  \x1b[33m--description\x1b[0m, \x1b[33m-d\x1b[0m <text>          Description of the task (required)');
                console.log('  \x1b[33m--priority\x1b[0m, \x1b[33m-p\x1b[0m <A-Z>              Priority of the task (optional)');
                console.log('  \x1b[33m--creation-date\x1b[0m, \x1b[33m-c\x1b[0m <date>        Creation date of the task (optional)');
                console.log('  \x1b[33m--project\x1b[0m, \x1b[33m-P\x1b[0m <tag>               Project tag for the task (optional)');
                console.log('  \x1b[33m--context\x1b[0m, \x1b[33m-t\x1b[0m <tag>               Context tag for the task (optional)');
                console.log('  \x1b[33m--special-tag\x1b[0m, \x1b[33m-s\x1b[0m <tag>:<value>   Special tag for the task (optional)');
            } else if (args[0] === 'update') {
                console.log('Usage: \x1b[36mjadwal\x1b[0m \x1b[32mupdate\x1b[0m (\x1b[33m--old-description\x1b[0m|\x1b[33m-o\x1b[0m) <text> \x1b[33m--description\x1b[0m <text> [options]');
                console.log('Options:');
                console.log('  \x1b[33m--old-description\x1b[0m, \x1b[33m-o\x1b[0m <text>      Old description of the task (required)');
                console.log('  \x1b[33m--description\x1b[0m, \x1b[33m-d\x1b[0m <text>          New description of the task (optional)');
                console.log('  \x1b[33m--priority\x1b[0m, \x1b[33m-p\x1b[0m <A-Z>              Priority of the task (optional)');
                console.log('  \x1b[33m--creation-date\x1b[0m, \x1b[33m-c\x1b[0m <date>        Creation date of the task (optional)');
                console.log('  \x1b[33m--project\x1b[0m, \x1b[33m-P\x1b[0m <tag>               Project tag for the task (optional)');
                console.log('  \x1b[33m--context\x1b[0m, \x1b[33m-t\x1b[0m <tag>               Context tag for the task (optional)');
                console.log('  \x1b[33m--special-tag\x1b[0m, \x1b[33m-s\x1b[0m <tag>:<value>   Special tag for the task (optional)');
            } else if (args[0] === 'delete') {
                console.log('Usage: \x1b[36mjadwal\x1b[0m \x1b[32mdelete\x1b[0m <description>');
                console.log('  <description>  Description of the todo to delete (required)');
            }
            else {
                console.log('Available commands:');
                console.log('  \x1b[32madd\x1b[0m     - Add a new todo');
                console.log('  \x1b[32mupdate\x1b[0m  - Update an existing todo');
                console.log('  \x1b[32mdelete\x1b[0m  - Delete a todo');
                console.log('  \x1b[32mlist\x1b[0m    - List all todos');
                console.log('  \x1b[32mdone\x1b[0m    - Mark a todo as done');
                console.log('  \x1b[32msync\x1b[0m    - Sync todos with Git');
                console.log('  \x1b[32mreveal\x1b[0m  - Reveal todo.txt in explorer');
                console.log('  \x1b[32mhelp\x1b[0m    - Show this help message');
                console.log(''); // Empty line
                console.log('For more detailed information on a specific command, use:');
                console.log('  \x1b[36mjadwal\x1b[0m \x1b[32mhelp\x1b[0m <command>');
                console.log('');
                console.log('  For example:');
                console.log('    \x1b[36mjadwal\x1b[0m \x1b[32mhelp add\x1b[0m');
                console.log('    \x1b[36mjadwal\x1b[0m \x1b[32mhelp update\x1b[0m');
                console.log('    \x1b[36mjadwal\x1b[0m \x1b[32mhelp delete\x1b[0m');
            }
            break;
        default:
            console.error("Hmm, not sure what you mean. Type '\x1b[36mjadwal\x1b[0m \x1b[32mhelp\x1b[0m' for a list of available commands.");
    }
}

function validateOptions(options, isUpdate = false) {
    const validOptions = ['d', 'description', 'p', 'priority', 'c', 'creation-date', 'C', 'completion-date', 'P', 'project', 't', 'context', 's', 'special-tag'];

    // Jika ini adalah operasi update, maka 'old-description' juga valid
    if (isUpdate) {
        validOptions.push('o');
        validOptions.push('old-description');
    }

    // Jika ini bukan operasi update (yaitu operasi add), deskripsi wajib ada
    if (!isUpdate && !options.d && !options['description']) {
        throw new Error('Description is mandatory. Please provide description using \x1b[33m--description\x1b[0m or \x1b[33m-d\x1b[0m option.');
    }

    for (const key in options) {
        if (!validOptions.includes(key)) {
            const validOptionsString = validOptions
                .filter((opt, index, self) =>
                    // Filter out duplicate long options (keep the first occurrence)
                    self.indexOf(opt) === index || opt.length === 1
                )
                .map(opt => {
                    let retval = opt.length === 1 ? `-${opt}` : `--${opt}`;
                    return retval;
                })
                .join(', ');

            throw new Error(`Invalid option '--${key}'. Valid options are: ${validOptionsString}.`);
        }

        // Validasi: Long option harus memiliki nilai
        if (key.length === 1 && !options[key]) {
            throw new Error(`Option '-${key}' requires a value.`);
        }

        // Validasi: Long option harus memiliki nilai
        if (key.length > 1 && !options[key]) {
            throw new Error(`Option '--${key}' requires a value.`);
        }

        // Validasi format special tag (jika ada)
        if ((key === 's' || key === 'special-tag') && options[key] && !/:/.test(options[key])) {
            throw new Error('Invalid special tag format. Please use <tag>:<value>.');
        }
    }

    // Validasi: Tanggal pembuatan wajib ada jika ada tanggal penyelesaian
    if ((options.C || options['completion-date']) && (!options.c && !options['creation-date'])) {
        throw new Error('Creation Date is mandatory if Completion Date is present.');
    }

    // Date format validation (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if ((options.C || options['completion-date']) && !dateRegex.test(options.C || options['completion-date'])) {
        throw new Error('Invalid completion date format. Please use YYYY-MM-DD.');
    }
    if ((options.c || options['creation-date']) && !dateRegex.test(options.c || options['creation-date'])) {
        throw new Error('Invalid creation date format. Please use YYYY-MM-DD.');
    }
}

main().catch(console.error);
