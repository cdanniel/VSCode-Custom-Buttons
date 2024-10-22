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
exports.activate = activate;
exports.getPath = getPath;
exports.getDirectory = getDirectory;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Function to load commands from file
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
function readCommandsFile(filePath, context) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            vscode.window.showErrorMessage('Error leyendo commands.json');
            return;
        }
        try {
            const commandDataG = JSON.parse(data);
            const commandDataI = JSON.parse(data);
            const commandGroups = {};
            const instantButtons = {};
            // Iterar sobre todas las propiedades que comienzan con "quickPick"
            Object.keys(commandDataG).forEach(key => {
                if (key.startsWith('quickPick')) {
                    commandGroups[key] = commandDataG[key];
                }
            });
            // Iterar sobre todas las propiedades que comienzan con "instantButton"
            Object.keys(commandDataI).forEach(key => {
                if (key.startsWith('instantButton')) {
                    instantButtons[key] = commandDataI[key];
                }
            });
            console.log('QuickPicks encontrados:', Object.keys(commandGroups));
            console.log('InstantButton encontrados:', Object.keys(instantButtons));
            // Crear QuickPicks
            Object.keys(commandGroups).forEach(groupKey => {
                const group = commandGroups[groupKey];
                const quickPickCommand = vscode.commands.registerCommand(`extension.show${group.id}`, async () => {
                    const options = group.commands.map(command => ({
                        label: command.description,
                        description: command.command
                    }));
                    const selection = await vscode.window.showQuickPick(options, { placeHolder: `Selecciona un comando de ${group.id}` });
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
                console.log(`QuickPick creado: ${group.id}`);
                const separatorItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
                separatorItem.text = '|';
                separatorItem.show();
                context.subscriptions.push(separatorItem);
            });
            // Crear instantButtons
            Object.keys(instantButtons).forEach(buttonKey => {
                const button = instantButtons[buttonKey];
                console.log("Button ", button);
                const instantCommand = vscode.commands.registerCommand(`extension.show${button.id}`, () => {
                    executeCommand(button);
                });
                console.log("instantButton pre: ", instantCommand);
                context.subscriptions.push(instantCommand);
                const statusBarButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
                statusBarButton.command = `extension.show${button.id}`;
                statusBarButton.text = button.id;
                statusBarButton.show();
                context.subscriptions.push(statusBarButton);
                console.log(`InstantButton creado: ${button.id}`);
                const separatorItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
                separatorItem.text = '|';
                separatorItem.show();
                context.subscriptions.push(separatorItem);
            });
        }
        catch (e) {
            vscode.window.showErrorMessage('Error analizando commands.json');
            console.error('Error analizando commands.json:', e);
        }
    });
}
// Function to activate the extension
async function activate(context) {
    const configuration = vscode.workspace.getConfiguration('vscode-custom-buttons');
    let filePath = configuration.get('commandsFilePath');
    if (!filePath) {
        const hasCommandFile = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Do you have a commands.json file ready?',
        });
        if (hasCommandFile === 'Yes') {
            const openUri = await vscode.window.showOpenDialog({
                canSelectMany: false,
                openLabel: 'Select commands.json',
                filters: {
                    'JSON files': ['json'],
                },
            });
            if (openUri && openUri[0]) {
                filePath = openUri[0].fsPath;
                await configuration.update('commandsFilePath', filePath, vscode.ConfigurationTarget.Global);
            }
            else {
                vscode.window.showErrorMessage('No file selected. Extension will not activate.');
                return;
            }
        }
        else if (hasCommandFile === 'No') {
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(path.join(context.extensionPath, 'commands.json')),
                saveLabel: 'Save commands.json',
                filters: {
                    'JSON files': ['json'],
                },
            });
            if (saveUri) {
                filePath = saveUri.fsPath;
                const templateFilePath = path.join(context.extensionPath, 'templates', 'commands.json');
                fs.copyFileSync(templateFilePath, filePath);
                await configuration.update('commandsFilePath', filePath, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage('commands.json file created at ' + filePath);
            }
            else {
                vscode.window.showErrorMessage('No location selected. Extension will not activate.');
                return;
            }
        }
        else {
            return;
        }
    }
    readCommandsFile(filePath, context);
    const commandEditor = vscode.commands.registerCommand('vscode-custom-buttons.openCommandEditor', () => {
        openCommandEditor(filePath, context);
    });
    context.subscriptions.push(commandEditor);
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
function updateAll(context, commandGroups, instantButtons, filePath) {
    // Filter and keep only the first three subscriptions
    const retainedSubscriptions = context.subscriptions.slice(0, 3);
    // Dispose of all current subscriptions except the retained ones
    context.subscriptions.forEach((subscription, index) => {
        if (!retainedSubscriptions.includes(subscription)) {
            subscription.dispose();
        }
    });
    // Clear the subscriptions array in the context
    context.subscriptions.length = 0; // Clear the current array
    context.subscriptions.push(...retainedSubscriptions); // Add the retained subscriptions
    // Re-register commands and QuickPicks
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
    // Re-register instantButtons
    Object.keys(instantButtons).forEach(buttonKey => {
        const button = instantButtons[buttonKey];
        console.log("Button ", button);
        const instantCommand = vscode.commands.registerCommand(`extension.show${button.id}`, () => {
            executeCommand(button);
        });
        context.subscriptions.push(instantCommand);
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.command = `extension.show${button.id}`;
        statusBarItem.text = button.id;
        statusBarItem.show();
        context.subscriptions.push(statusBarItem);
        const separatorItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        separatorItem.text = '|';
        separatorItem.show();
        context.subscriptions.push(separatorItem);
    });
}
function updateInstantButtons(context, instantButtons, filePath) {
    // Filter and keep only the first three subscriptions
    const retainedSubscriptions = context.subscriptions.slice(0, 3);
    // Filtrar las suscripciones que empiezan por 'instantButton'
    const filteredSubscriptions = context.subscriptions.filter(subscription => {
        const command = subscription?.command || '';
        //return command.startsWith('extension.showinstantButton');
    });
    // Dispose of all current subscriptions except the retained ones
    context.subscriptions.forEach((subscription, index) => {
        if (!retainedSubscriptions.includes(subscription)) {
            subscription.dispose();
        }
    });
    // Clear the subscriptions array in the context
    context.subscriptions.length = 0; // Clear the current array
    context.subscriptions.push(...retainedSubscriptions); // Add the retained subscriptions
    // Re-register commands and QuickPicks
    Object.keys(instantButtons).forEach(buttonKey => {
        const button = instantButtons[buttonKey];
        console.log("Button ", button);
        const instantCommand = vscode.commands.registerCommand(`extension.show${button.id}`, () => {
            executeCommand(button);
        });
        context.subscriptions.push(instantCommand);
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.command = `extension.show${button.id}`;
        statusBarItem.text = button.id;
        statusBarItem.show();
        context.subscriptions.push(statusBarItem);
        const separatorItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        separatorItem.text = '|';
        separatorItem.show();
        context.subscriptions.push(separatorItem);
    });
}
// Función para guardar todos los quickPicks e instantButtons en el archivo
function saveAll(filePath, commandGroups, context, instantButtons) {
    try {
        // Combina los commandGroups e instantButtons en un solo objeto
        const combinedData = {
            ...commandGroups, // Mantiene todos los grupos de comandos
            ...instantButtons // Añade los botones instantáneos
        };
        // Escribir el objeto combinado en el archivo
        fs.writeFileSync(filePath, JSON.stringify(combinedData, null, 2));
        vscode.window.showInformationMessage('Commands saved successfully');
        // Actualizar todos los elementos (barra de estado, comandos, etc.)
        updateAll(context, commandGroups, instantButtons, filePath);
    }
    catch (e) {
        vscode.window.showErrorMessage('Error saving commands.json: ' + e);
    }
}
// Function to add a new command
async function addNewCommand(group, filePath, context, commandGroups, instantButtons) {
    const id = await vscode.window.showInputBox({ prompt: 'Enter command ID' });
    if (!id)
        return;
    const command = await vscode.window.showInputBox({ prompt: 'Enter command with arguments in { }', placeHolder: 'command {arg1} {arg2}' });
    if (!command)
        return;
    const description = await vscode.window.showInputBox({ prompt: 'Enter command description' });
    if (!description)
        return;
    // Process arguments
    const argumentMatches = command.match(/{(.*?)}/g);
    const extraFields = {};
    if (argumentMatches) {
        for (const match of argumentMatches) {
            const argName = match.replace(/[{}]/g, '');
            const prompt = await vscode.window.showInputBox({ prompt: `Enter prompt for ${argName}` });
            if (prompt) {
                extraFields[argName] = prompt;
            }
        }
    }
    // Check if the command contains {file}
    let applyToOpenFile = false;
    if (extraFields.hasOwnProperty('file')) {
        const useOpenFile = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Do you want to apply this command to the currently open file?' });
        if (useOpenFile === 'Yes') {
            applyToOpenFile = true;
        }
    }
    // Ask if confirmation is needed
    const confirmation = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Does this command require confirmation?' });
    const newCommand = {
        id,
        command,
        description,
        extraFields: Object.keys(extraFields).length > 0 ? extraFields : undefined,
        applyToOpenFile: applyToOpenFile ? true : undefined,
        confirmation: confirmation === 'Yes' ? 'yes' : undefined
    };
    if (group.commands.length > 0) {
        group.commands.push(newCommand);
        saveAll(filePath, commandGroups, context, instantButtons);
    }
    else {
        return newCommand;
    }
}
// Function to delete an existing command
async function deleteCommand(group, filePath, context, commandGroups, instantButtons) {
    const commandOptions = group.commands.map(cmd => ({
        label: cmd.description
    }));
    const selectedCommand = await vscode.window.showQuickPick(commandOptions, { placeHolder: 'Select a command to delete' });
    if (!selectedCommand)
        return;
    const selectedCmdIndex = group.commands.findIndex(cmd => cmd.description === selectedCommand.label);
    if (selectedCmdIndex !== -1) {
        group.commands.splice(selectedCmdIndex, 1);
        saveAll(filePath, commandGroups, context, instantButtons);
    }
}
// Function to open the command editor
async function openCommandEditor(filePath, context) {
    // Leer el archivo y obtener los datos JSON
    const allData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // Filtrar solo los que empiezan con 'quickPick' para commandGroups
    const commandGroups = {};
    Object.keys(allData).forEach(key => {
        if (key.startsWith('quickPick')) {
            commandGroups[key] = allData[key];
        }
    });
    // Filtrar solo los que empiezan con 'instantButton' para instantButtons
    const instantButtons = {};
    Object.keys(allData).forEach(key => {
        if (key.startsWith('instantButton')) {
            instantButtons[key] = allData[key];
        }
    });
    const options = [
        { label: 'Add new QuickPick' },
        { label: 'Delete QuickPick' },
        { label: 'Edit QuickPick' },
        { label: 'Add Instant Button' }
    ];
    // Mostrar el QuickPick para seleccionar una opción o grupo
    const selectedOption = await vscode.window.showQuickPick(options, { placeHolder: 'Select an option' });
    if (!selectedOption)
        return;
    if (selectedOption.label === 'Add new QuickPick') {
        addNewQuickPick(commandGroups, filePath, context, instantButtons);
    }
    else if (selectedOption.label === 'Delete QuickPick') {
        deleteQuickPick(commandGroups, filePath, context, instantButtons);
    }
    else if (selectedOption.label === 'Edit QuickPick') {
        // Primero se lista todos los QuickPicks disponibles
        const quickPickOptions = Object.keys(commandGroups).map(key => ({
            label: commandGroups[key].id
        }));
        const selectedQuickPick = await vscode.window.showQuickPick(quickPickOptions, { placeHolder: 'Select a QuickPick group to edit' });
        if (!selectedQuickPick)
            return;
        // Seleccionado el grupo, se sigue con el flujo de edición
        const selectedGroupId = selectedQuickPick.label;
        const group = Object.values(commandGroups).find(group => group.id === selectedGroupId);
        if (!group) {
            vscode.window.showErrorMessage(`Group with id "${selectedGroupId}" not found.`);
            return;
        }
        // Listar los comandos dentro del QuickPick seleccionado
        const commandOptions = group.commands.map(cmd => ({
            label: cmd.description
        }));
        // Añadir opciones adicionales para añadir o eliminar comandos
        commandOptions.push({ label: 'Add new command' });
        commandOptions.push({ label: 'Delete command' });
        const selectedCommand = await vscode.window.showQuickPick(commandOptions, { placeHolder: 'Select a command to edit or add a new one' });
        if (!selectedCommand)
            return;
        if (selectedCommand.label === 'Add new command') {
            addNewCommand(group, filePath, context, commandGroups, instantButtons);
        }
        else if (selectedCommand.label === 'Delete command') {
            deleteCommand(group, filePath, context, commandGroups, instantButtons);
        }
        else {
            const selectedCmd = group.commands.find(cmd => cmd.description === selectedCommand.label);
            if (selectedCmd) {
                editCommand(selectedCmd, group, filePath, context, commandGroups, instantButtons);
            }
        }
    }
    else {
        addInstantButton(instantButtons, filePath, context, commandGroups);
    }
}
// Function to add a new QuickPick
async function addNewQuickPick(commandGroups, filePath, context, instantButtons) {
    const id = await vscode.window.showInputBox({ prompt: 'Enter QuickPick ID' });
    if (!id)
        return;
    const realId = "quickPick" + id;
    commandGroups[realId] = { id, commands: [] };
    saveAll(filePath, commandGroups, context, instantButtons);
}
// Function to delete an existing QuickPick
async function deleteQuickPick(commandGroups, filePath, context, instantButtons) {
    const groupOptions = Object.keys(commandGroups).map(groupKey => ({
        label: commandGroups[groupKey].id
    }));
    const selectedGroup = await vscode.window.showQuickPick(groupOptions, { placeHolder: 'Select a QuickPick to delete' });
    if (!selectedGroup)
        return;
    const selectedGroupId = selectedGroup.label;
    const realId = "quickPick" + selectedGroupId;
    delete commandGroups[realId];
    saveAll(filePath, commandGroups, context, instantButtons);
}
async function addInstantButton(instantButtons, filePath, context, commandGroups) {
    // Crea un group y un commandGroups vacio para pasarselo a la funcion addNewCommand
    const group = { id: "instantButton", commands: [] };
    const commandGroupsFake = { "instantButton": group };
    const command = await addNewCommand(group, filePath, context, commandGroupsFake, instantButtons);
    if (!command)
        return;
    console.log("Command: ", command);
    const realId = "instantButton" + command.id;
    instantButtons[realId] = command;
    console.log("InstantButtons lista: ", instantButtons);
    saveAll(filePath, commandGroups, context, instantButtons);
}
// Function to edit an existing command
async function editCommand(command, group, filePath, context, commandGroups, instantButtons) {
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
    // Process arguments
    const argumentMatches = cmd.match(/{(.*?)}/g);
    const extraFields = {};
    if (argumentMatches) {
        for (const match of argumentMatches) {
            const argName = match.replace(/[{}]/g, '');
            const prompt = await vscode.window.showInputBox({ prompt: `Enter prompt for ${argName}`, value: command.extraFields?.[argName] || '' });
            if (prompt) {
                extraFields[argName] = prompt;
            }
        }
    }
    command.extraFields = Object.keys(extraFields).length > 0 ? extraFields : undefined;
    // Check if the command contains {file}
    let applyToOpenFile = false;
    if (extraFields.hasOwnProperty('file')) {
        const useOpenFile = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Do you want to apply this command to the currently open file?' });
        if (useOpenFile === 'Yes') {
            applyToOpenFile = true;
        }
    }
    command.applyToOpenFile = applyToOpenFile ? true : undefined;
    // Ask if confirmation is needed
    const confirmation = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Does this command require confirmation?' });
    command.confirmation = confirmation === 'Yes' ? 'yes' : undefined;
    saveAll(filePath, commandGroups, context, instantButtons);
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
                if (userInput === undefined) {
                    return;
                }
                args[field] = userInput;
            }
            runCommand(command, args);
            return;
        }
        else {
            vscode.window.showErrorMessage('Error: getDirectory is true but extraFields does not contain "directory".');
            return;
        }
    }
    if (command.applyToOpenFile) {
        if (command.extraFields) {
            for (const [field, prompt] of Object.entries(command.extraFields)) {
                if (field !== 'file') {
                    const userInput = await vscode.window.showInputBox({ prompt });
                    if (userInput === undefined) {
                        return;
                    }
                    args[field] = userInput;
                }
            }
        }
        const filePath = getPath();
        if (filePath) {
            args['file'] = filePath;
        }
        else {
            const userInput = await vscode.window.showInputBox({ prompt: 'Enter file path' });
            if (userInput === undefined) {
                return;
            }
            args['file'] = userInput;
        }
    }
    else {
        if (command.extraFields) {
            for (const [field, prompt] of Object.entries(command.extraFields)) {
                const userInput = await vscode.window.showInputBox({ prompt });
                if (userInput === undefined) {
                    return;
                }
                args[field] = userInput;
            }
        }
    }
    if (command.confirmation === 'yes') {
        let confirmationMessage = `Are you sure you want to run the command: "${command.command}"`;
        // Replace placeholders in the confirmation message
        Object.keys(args).forEach(key => {
            const regex = new RegExp(`{${key}}`, 'g');
            confirmationMessage = confirmationMessage.replace(regex, args[key]);
        });
        const confirmation = await vscode.window.showWarningMessage(confirmationMessage, { modal: true }, 'Yes', 'No');
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
function deactivate() { }
//# sourceMappingURL=extension.js.map