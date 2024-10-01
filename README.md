# Jadwal (To Do)


[![npm](https://img.shields.io/npm/v/jadwal.svg?style=flat-square)](https://www.npmjs.com/package/jadwal)
[![license](https://img.shields.io/github/license/thesuhu/jadwal?style=flat-square)](https://github.com/thesuhu/jadwal/blob/master/LICENSE)

Personal to-do list, organized as a simple, yet effective tool for task management. Using `todo.txt` file to store data with [todo.txt](https://github.com/todotxt/todo.txt) format rule.

<img src="https://raw.githubusercontent.com/todotxt/todo.txt/master/description.svg" width="100%" height="100%">

## Environtment

To store your to-do list, create personal `Git` project and create `todo.txt` file in your project with `main` branch name. Clone it to your local directory.

Add environment to your system:

### Unix/Linux/macOS

Temporary (for the current session):

```sh
export LOCAL_REPO=/path/to/local/repo
export REMOTE_GIT=https://github.com/username/todo-repo.git
```

Permanent (persists across sessions):

Add the following lines to your shell's configuration file (e.g., `~/.bashrc` or `~/.zshrc`):

```sh
export LOCAL_REPO=/path/to/local/repo
export REMOTE_GIT=https://github.com/username/todo-repo.git
```

Then, either restart your terminal or run source `~/.bashrc` (or `source ~/.zshrc`) to apply the changes.

### Windows

Temporary (for the current session), using the Command Prompt (CMD):

```cmd
set LOCAL_REPO=C:\path\to\local\repo
set REMOTE_GIT=https://github.com/username/todo-repo.git
```

Temporary (for the current session), using the PowerShell:

```powershell
$env:LOCAL_REPO = "C:\path\to\local\repo"
$env:REMOTE_GIT = "https://github.com/username/todo-repo.git"
```

Permanent (persists across sessions), using the Command Prompt (CMD):

```cmd
setx LOCAL_REPO "C:\path\to\local\repo" /m
setx REMOTE_GIT "https://github.com/username/todo-repo.git" /m
```
Permanent (persists across sessions), using the PowerShell:

```powershell
[Environment]::SetEnvironmentVariable("LOCAL_REPO", "C:\path\to\local\repo", "User")
[Environment]::SetEnvironmentVariable("REMOTE_GIT", "https://github.com/username/todo-repo.git", "User")
```

## Install

`NPM` must be installed on your system, then install it with global parameters:

```sh
npm i -g jadwal
```

## Usage

Once the `jadwal` package is installed, the following commands are available:

`jadwal add` - Add a new todo. Use jadwal help add for detailed usage.

Examples:

### Unix/Linux/macOS

Using long options:

```sh
jadwal add --description "Finish report" \
    --priority A \
    --creation-date 2024-09-20 \
    --completion-date 2024-09-30 \
    --project Work \
    --context Office \
    --special-tag reminder:2024-09-25
```

Using short options:

```sh
jadwal add \
    -d "Finish report" \
    -p A \
    -c 2024-09-20 \
    -P Work \
    -t Office \
    -s reminder:2024-09-25
```

### Windows

```powershell
jadwal add --description "Finish report" ^
    --priority A ^
    --creation-date 2024-09-20 ^
    --project Work ^
    --context Office ^
    --special-tag reminder:2024-09-25
```

Using short options:

```powershell
jadwal add ^
    -d "Finish report" ^
    -p A ^
    -c 2024-09-20 ^
    -P Work ^
    -t Office ^
    -s reminder:2024-09-25
```

Both examples will add a new todo with the following attributes:

- Description: "Finish report"
- Priority: A
- Creation Date: January 15, 2023
- Completion Date: September 30, 2024
- Project Tag: Work
- Context Tag: Office
- Special Tag: reminder:2024-09-25

`jadwal update` - Update an existing todo. Use jadwal help update for detailed usage. Below is example to update data with adding completion data, new description and priority attributes. And don't forget to provide `old description` as key for updating existing data.

```sh
jadwal update \
    -d "Update finish report" \
    -p B \
    -c 2024-09-20 \
    -o "Finish report"
```

For long option and Windows commands, see the example in `add` section above.

`jadwal delete` - Delete a todo. Use jadwal help delete for detailed usage.

`jadwal list` - List all todos.

`jadwal done` - Mark a todo as done.

`jadwal sync` - Sync todos with Git.

`jadwal help` - Show the general help message.

`jadwal help <command>` - Show detailed help for a specific command (e.g., `jadwal help add`).

## License

[MIT](https://github.com/thesuhu/jadwal/blob/master/LICENSE)
