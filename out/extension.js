"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.getDirectory = exports.getPath = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Función para cargar comandos desde el archivo
async function loadCommandsFromFile() {
    const options = {
        canSelectMany: false,
        openLabel: 'Open',
        filters: {
            'JSON files': ['json']
        }
    };
    const fileUri = await vscode.window.showOpenDialog(options);
    if (fileUri && fileUri[0]) {
        return fileUri[0].fsPath;
    }
}
// Función para leer el archivo de comandos
function readCommandsFile(filePath, context) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            vscode.window.showErrorMessage('Error reading commands.json');
            return;
        }
        try {
            const commandGroups = JSON.parse(data);
            // Crear los QuickPicks y comandos
            Object.keys(commandGroups).forEach(groupKey => {
                const group = commandGroups[groupKey];
                const quickPickCommand = vscode.commands.registerCommand(`extension.show${group.id}`, async () => {
                    const options = group.commands.map(command => ({
                        label: command.description,
                        description: command.command
                    }));
                    const selection = await vscode.window.showQuickPick(options, { placeHolder: `Select a command from ${group.id}` });
                    if (selection) {
                        const selectedCommand = group.commands.find(cmd => cmd.description === selection.label);
                        if (selectedCommand) {
                            executeCommand(selectedCommand);
                        }
                    }
                });
                context.subscriptions.push(quickPickCommand);
                const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
                statusBarItem.command = `extension.show${group.id}`;
                statusBarItem.text = group.id;
                statusBarItem.show();
                context.subscriptions.push(statusBarItem);
                const separatorItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
                separatorItem.text = '|';
                separatorItem.show();
                context.subscriptions.push(separatorItem);
            });
        }
        catch (e) {
            vscode.window.showErrorMessage('Error parsing commands.json');
        }
    });
}
// Función para activar la extensión
async function activate(context) {
    const configuration = vscode.workspace.getConfiguration('vscode-custom-buttons');
    let filePath = configuration.get('commandsFilePath');
    if (!filePath) {
        filePath = await loadCommandsFromFile();
        if (filePath) {
            await configuration.update('commandsFilePath', filePath, vscode.ConfigurationTarget.Global);
        }
        else {
            vscode.window.showErrorMessage('No commands.json file selected.');
            return;
        }
    }
    readCommandsFile(filePath, context);
    const commandEditor = vscode.commands.registerCommand('vscode-custom-buttons.openCommandEditor', () => {
        openCommandEditor(filePath, context);
    });
    context.subscriptions.push(commandEditor);
    // Añadir el botón en la barra de estado para abrir el editor de comandos
    const editorButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    editorButton.command = 'vscode-custom-buttons.openCommandEditor';
    editorButton.text = 'Edit Commands';
    editorButton.show();
    context.subscriptions.push(editorButton);
    const separatorItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    separatorItem.text = '|';
    separatorItem.show();
    context.subscriptions.push(separatorItem);
}
exports.activate = activate;
function updateQuickPicks(context, commandGroups) {
    // Eliminar todas las suscripciones actuales
    context.subscriptions.forEach(subscription => subscription.dispose());
    // Registrar de nuevo los comandos y QuickPicks
    Object.keys(commandGroups).forEach(groupKey => {
        const group = commandGroups[groupKey];
        const quickPickCommand = vscode.commands.registerCommand(`extension.show${group.id}`, async () => {
            const options = group.commands.map(command => ({
                label: command.description,
                description: command.command
            }));
            const selection = await vscode.window.showQuickPick(options, { placeHolder: `Select a command from ${group.id}` });
            if (selection) {
                const selectedCommand = group.commands.find(cmd => cmd.description === selection.label);
                if (selectedCommand) {
                    executeCommand(selectedCommand);
                }
            }
        });
        context.subscriptions.push(quickPickCommand);
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.command = `extension.show${group.id}`;
        statusBarItem.text = group.id;
        statusBarItem.show();
        context.subscriptions.push(statusBarItem);
        const separatorItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        separatorItem.text = '|';
        separatorItem.show();
        context.subscriptions.push(separatorItem);
    });
}
// Función para guardar los comandos en el archivo
function saveCommands(filePath, commandGroups, context) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(commandGroups, null, 2));
        vscode.window.showInformationMessage('Commands saved successfully');
        updateQuickPicks(context, commandGroups);
    }
    catch (e) {
        vscode.window.showErrorMessage('Error saving commands.json');
    }
}
// Función para añadir un nuevo comando
async function addNewCommand(group, filePath, context, commandGroups) {
    const id = await vscode.window.showInputBox({ prompt: 'Enter command ID' });
    if (!id)
        return;
    const command = await vscode.window.showInputBox({ prompt: 'Enter command' });
    if (!command)
        return;
    const description = await vscode.window.showInputBox({ prompt: 'Enter command description' });
    if (!description)
        return;
    const newCommand = { id, command, description };
    group.commands.push(newCommand);
    console.log("Group act: ", group);
    console.log("Command group act: ", commandGroups);
    saveCommands(filePath, commandGroups, context);
}
// Función para abrir el editor de comandos
async function openCommandEditor(filePath, context) {
    const commandGroups = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const groupOptions = Object.keys(commandGroups).map(groupKey => ({
        label: commandGroups[groupKey].id
    }));
    const selectedGroup = await vscode.window.showQuickPick(groupOptions, { placeHolder: 'Select a command group' });
    if (!selectedGroup)
        return;
    const selectedGroupId = selectedGroup.label;
    console.log("Selected group: ", selectedGroup);
    console.log("Selected group id: ", selectedGroupId);
    console.log("Command groups: ", commandGroups);
    // Buscar el grupo correspondiente
    const group = Object.values(commandGroups).find(group => group.id === selectedGroupId);
    if (!group) {
        vscode.window.showErrorMessage(`Group with id "${selectedGroupId}" not found.`);
        return;
    }
    console.log("Group: ", group);
    const commandOptions = group.commands.map(cmd => ({
        label: cmd.description
    }));
    commandOptions.push({ label: 'Add new command' });
    const selectedCommand = await vscode.window.showQuickPick(commandOptions, { placeHolder: 'Select a command to edit or add a new one' });
    if (!selectedCommand)
        return;
    if (selectedCommand.label === 'Add new command') {
        addNewCommand(group, filePath, context, commandGroups);
    }
    else {
        const selectedCmd = group.commands.find(cmd => cmd.description === selectedCommand.label);
        if (selectedCmd) {
            editCommand(selectedCmd, group, filePath, context, commandGroups);
        }
    }
}
// Función para editar un comando existente
async function editCommand(command, group, filePath, context, commandGroups) {
    const id = await vscode.window.showInputBox({ prompt: 'Enter command ID', value: command.id });
    if (!id)
        return;
    const cmd = await vscode.window.showInputBox({ prompt: 'Enter command', value: command.command });
    if (!cmd)
        return;
    const description = await vscode.window.showInputBox({ prompt: 'Enter command description', value: command.description });
    if (!description)
        return;
    command.id = id;
    command.command = cmd;
    command.description = description;
    saveCommands(filePath, commandGroups, context);
}
async function executeCommand(command) {
    const args = {};
    if (command.getDirectory) {
        const fileDirectory = getDirectory();
        if (fileDirectory) {
            args['directory'] = fileDirectory;
            runCommand(command, args);
            return;
        }
        else if (command.extraFields && command.extraFields.hasOwnProperty('directory')) {
            for (const [field, prompt] of Object.entries(command.extraFields)) {
                const userInput = await vscode.window.showInputBox({ prompt });
                if (!userInput) {
                    return;
                }
                args[field] = userInput;
                runCommand(command, args);
                return;
            }
        }
        else {
            vscode.window.showErrorMessage('Error: getDirectory es true pero extraFields no contiene "directory".');
            return;
        }
    }
    if (command.applyToOpenFile) {
        if (command.extraFields && command.extraFields.hasOwnProperty('file')) {
            const filePath = getPath();
            if (filePath) {
                args['file'] = filePath;
                for (const [field, prompt] of Object.entries(command.extraFields)) {
                    if (field !== 'file') {
                        const userInput = await vscode.window.showInputBox({ prompt });
                        if (!userInput) {
                            return;
                        }
                        args[field] = userInput;
                    }
                }
            }
            else {
                for (const [field, prompt] of Object.entries(command.extraFields)) {
                    const userInput = await vscode.window.showInputBox({ prompt });
                    if (!userInput) {
                        return;
                    }
                    args[field] = userInput;
                }
            }
        }
        else {
            vscode.window.showErrorMessage('Error: applyToOpenFile es true pero extraFields no contiene "file".');
            return;
        }
    }
    else {
        if (command.extraFields) {
            for (const [field, prompt] of Object.entries(command.extraFields)) {
                const userInput = await vscode.window.showInputBox({ prompt });
                if (!userInput) {
                    return;
                }
                args[field] = userInput;
            }
        }
    }
    if (command.confirmation === 'yes') {
        const confirmation = await vscode.window.showWarningMessage(`Are you sure you want to run the command: "${command.command}"?`, { modal: true }, 'Yes', 'No');
        if (confirmation !== 'Yes') {
            return;
        }
    }
    runCommand(command, args);
}
function runCommand(command, args) {
    const terminal = vscode.window.activeTerminal || vscode.window.createTerminal('Terminal');
    const fullCommand = Object.keys(args).reduce((cmd, key) => cmd.replace(`{${key}}`, args[key]), command.command);
    terminal.sendText(fullCommand);
    terminal.show();
}
function getPath() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const fileUri = editor.document.uri;
        const filePath = fileUri.fsPath;
        const directoryPath = path.dirname(filePath);
        const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
        terminal.sendText(`cd "${directoryPath}"`);
        terminal.show();
        const fileName = path.basename(filePath);
        return fileName;
    }
    return '';
}
exports.getPath = getPath;
function getDirectory() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const fileUri = editor.document.uri;
        const filePath = fileUri.fsPath;
        const directoryPath = path.dirname(filePath);
        return `"${directoryPath}"`;
    }
    return '';
}
exports.getDirectory = getDirectory;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map