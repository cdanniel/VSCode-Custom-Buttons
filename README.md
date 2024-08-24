# VSCode Custom Buttons Extension

This Visual Studio Code extension adds a series of commands and status bar buttons for custom actions. Below is a detailed description of each command and its functionality.

## Installation

1. Go to the Extensions section.
2. Click on the three dots at the top right of the section.
3. Select `Install from VSIX`.
4. Select the `.vsix` file.

## Custom Commands

You can create custom commands by adding entries to the `commands.json` file. Each command must have the following properties:

- `id`: Unique identifier for the command.
- `command`: The actual command to be executed.
- `description`: Brief description of the command.
- `extraFields` (optional): Additional fields to be provided by the user.
- `confirmation` (optional): Whether to prompt the user for confirmation before executing the command.
- `applyToOpenFile` (optional): Whether the command should be applied to the currently opened file.

### Adding New Commands

To add new commands:

1. Open the `commands.json` file.
2. Add a new entry following the structure described above.
3. Reload the extension for the changes to take effect.

## Changelog

### 0.1.0

- Added initial set of commands and status bar buttons.

## Known Issues

- Some commands may not work as expected if the environment is not properly configured.
- Additional permissions or configuration may be required for certain commands.

## Contributing

If you would like to contribute to the project, please contact us.

## License

TODO