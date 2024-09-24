#!/usr/bin/env node

const { addTodo, listTodos, doneTodo, syncWithGit, deleteTodo } = require('.');
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
                console.error("Please provide the old description using --old-description or -o.");
                break;
            }

            try {
                validateOptions(options, true);
                await updateTodo(oldDescription, {
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
        case 'help':
            if (args[0] === 'add') {
                console.log('Usage: jadwal add --description <text> [options]');
                console.log('Options:');
                console.log('  --description, -d <text>  Description of the task (required)');
                console.log('  --priority, -p <A-Z>      Priority of the task (optional)');
                console.log('  --creation-date, -c <date> Creation date of the task (optional)');
                console.log('  --completion-date, -C <date> Completion date of the task (optional)');
                console.log('  --project, -P <tag>        Project tag for the task (optional)');
                console.log('  --context, -t <tag>        Context tag for the task (optional)');
                console.log('  --special-tag, -s <tag>:<value>   Special tag for the task (optional)');
            } else if (args[0] === 'update') {
                console.log('Usage: jadwal update (--old-description|-o) <text> --description <text> [options]'); // Menambahkan -o
                console.log('Options:');
                console.log('  --old-description, -o <text>  Old description of the task (required)'); // Menambahkan -o
                console.log('  --description, -d <text>  New description of the task (required)');
                console.log('  --priority, -p <A-Z>        Priority of the task (optional)');
                console.log('  --creation-date, -c <date> Creation date of the task (optional)');
                console.log('  --completion-date, -C <date> Completion date of the task (optional)');
                console.log('  --project, -P <tag>          Project tag for the task (optional)');
                console.log('  --context, -t <tag>          Context tag for the task (optional)');
                console.log('  --special-tag, -s <tag>:<value>   Special tag for the task (optional)');
            } else if (args[0] === 'delete') {
                console.log('Usage: jadwal delete <description>');
                console.log('  <description>  Description of the todo to delete (required)');
            } else {
                console.log('Available commands:');
                console.log('  add     - Add a new todo');
                console.log('  update  - Update an existing todo');
                console.log('  delete  - Delete a todo');
                console.log('  list    - List all todos');
                console.log('  done    - Mark a todo as done');
                console.log('  sync    - Sync todos with Git');
                console.log('  help    - Show this help message');
                console.log(''); // Empty line
                console.log('For more detailed information on a specific command, use:');
                console.log('  jadwal help <command>');
                console.log('');
                console.log('  For example:');
                console.log('    jadwal help add');
                console.log('    jadwal help update');
                console.log('    jadwal help delete');
            }
            break;
        default:
            console.error("Hmm, not sure what you mean. Type 'jadwal help' for a list of available commands.");
    }
}

function validateOptions(options, isUpdate = false) {
    const validOptions = ['d', 'description', 'p', 'priority', 'c', 'creation-date', 'C', 'completion-date', 'P', 'project', 't', 'context', 's', 'special-tag'];

    // Jika ini adalah operasi update, maka 'old-description' juga valid
    if (isUpdate) {
        validOptions.push('old-description');
    }

    // Jika ini bukan operasi update (yaitu operasi add), deskripsi wajib ada
    if (!isUpdate && !options.d && !options['description']) {
        throw new Error('Description is mandatory.');
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
