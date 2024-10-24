# VSCode Custom Buttons Extension

This Visual Studio Code extension enhances functionality with custom commands and status bar buttons. You can execute any type of command by clicking on a button in the status bar or group a set of commands in quickPicks.

## Installation from .vsix

1. Navigate to the Extensions section.
2. Click on the three dots at the top right of the section.
3. Select `Install from VSIX`.
4. Choose the `.vsix` file.

## Use example

![Tutorial](./resources/tutorial.gif)
You can also find this `commands.json` example in https://github.com/cdanniel/VSCode-Custom-Buttons/tree/main/templates

## Custom Commands

Custom commands can be managed through the graphical interface by adding, modifying, or deleting entries in the `commands.json` file. Each command must include the following properties:

- `id`: Unique identifier for the command.
- `command`: The command to execute.
- `description`: Brief description of the command.
- `extraFields` (optional): Additional user-defined fields.
- `confirmation` (optional): Prompt for confirmation before executing.
- `applyToOpenFile` (optional): Apply command to currently open file.

### Managing Instant Buttons

To manage commands:

1. Open the extension's graphical interface (`Edit Commands` button).
2. Add, modify, or delete instant buttons as needed.
3. Save changes.
4. This proccess automatically save changes to `commands.json` and reload the status-bar.

## Custom QuickPicks

QuickPicks can also be managed via the graphical interface by adding, modifying, or deleting entries in `commands.json`.

### Managing QuickPicks

To manage QuickPicks:

1. Open the extension's graphical interface (`Edit Commands` button).
2. Add, modify, or delete QuickPicks as needed.
3. This proccess automatically save changes to `commands.json` and reload the status-bar

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
