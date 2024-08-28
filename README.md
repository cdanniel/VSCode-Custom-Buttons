# VSCode Custom Buttons Extension

This Visual Studio Code extension enhances functionality with custom commands and status bar buttons. Below is a detailed description of each command and its functionality.

## Installation from .vsix

1. Navigate to the Extensions section.
2. Click on the three dots at the top right of the section.
3. Select `Install from VSIX`.
4. Choose the `.vsix` file.

## Setting Up Commands

To customize the commands available in the extension, you need to define them in a `commands.json` file. Below is an example structure for the `commands.json` file:

```json
{
  "quickPickNavigation": {
    "id": "Navigation",
    "commands": [
      {
        "id": "ls",
        "command": "ls",
        "description": "List all files in the directory",
        "confirmation": "no",
        "applyToOpenFile": false
      },
      {
        "id": "cd",
        "command": "cd {directory}",
        "description": "Change directory",
        "extraFields": {
          "directory": "Enter the directory"
        },
        "confirmation": "no",
        "applyToOpenFile": false
      },
      {
        "id": "pwd",
        "command": "pwd",
        "description": "Print the current directory",
        "confirmation": "no",
        "applyToOpenFile": false
      }
    ]
  },
  "quickPickNetwork": {
    "id": "Network",
    "commands": [
      {
        "id": "ipconfig",
        "command": "ipconfig",
        "description": "Display network configuration",
        "confirmation": "no",
        "applyToOpenFile": false
      },
      {
        "id": "ping",
        "command": "ping {hostname}",
        "description": "Ping a hostname",
        "extraFields": {
          "hostname": "Enter the hostname or IP address"
        },
        "confirmation": "no",
        "applyToOpenFile": false
      },
      {
        "id": "tracert",
        "command": "tracert {hostname}",
        "description": "Trace route to a hostname",
        "extraFields": {
          "hostname": "Enter the hostname or IP address"
        },
        "confirmation": "no",
        "applyToOpenFile": false
      }
    ]
  },
  "quickPickFileOperations": {
    "id": "File Operations",
    "commands": [
      {
        "id": "findstr",
        "command": "findstr \"{text}\" {file}",
        "description": "Search for a text string in a file",
        "extraFields": {
          "text": "Enter the text to search",
          "file": "Enter the file path"
        },
        "applyToOpenFile": true
      },
      {
        "id": "type",
        "command": "type {file}",
        "description": "Display the contents of a file",
        "extraFields": {
          "file": "Enter the file path"
        },
        "applyToOpenFile": true
      }
    ]
  }
}
```
You can also find this `commands.json` example in https://github.com/cdanniel/VSCode-Custom-Buttons/tree/main/templates

## Custom Commands

Custom commands can be managed through the graphical interface by adding, modifying, or deleting entries in the `commands.json` file. Each command must include the following properties:

- `id`: Unique identifier for the command.
- `command`: The command to execute.
- `description`: Brief description of the command.
- `extraFields` (optional): Additional user-defined fields.
- `confirmation` (optional): Prompt for confirmation before executing.
- `applyToOpenFile` (optional): Apply command to currently open file.

### Managing Commands

To manage commands:

1. Open the extension's graphical interface (`Edit Commands` button).
2. Add, modify, or delete commands as needed.
3. Save changes to `commands.json`.
4. This proccess automatically save changes to `commands.json` and reload the status-bar

## Custom QuickPicks

QuickPicks can also be managed via the graphical interface by adding, modifying, or deleting entries in `commands.json`.

### Managing QuickPicks

To manage QuickPicks:

1. Open the extension's graphical interface (`Edit Commands` button).
2. Add, modify, or delete QuickPicks as needed.
3. This proccess automatically save changes to `commands.json` and reload the status-bar

## Use example

![Tutorial](./resources/tutorial.gif)

## Changelog

### 0.1.0

- Initial release with basic functionality.
- Commands CRUD.
- QuickPicks CRUD.

## Known Issues

- Some commands may require specific environment configurations to function correctly.
- Certain commands may necessitate additional permissions or configurations.

## Contributing

For contributions, please contact `cdanielsoa@gmail.com` or `jesus.palominoabreu@gmail.com`.
