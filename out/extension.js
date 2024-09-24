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
// Función para cargar comandos desde archivo
async function loadCommandsFromFile() {
    const options = {
        canSelectMany: false,
        openLabel: 'Abrir',
        filters: {
            'Archivos JSON': ['json']
        }
    };
    const fileUri = await vscode.window.showOpenDialog(options);
    if (fileUri && fileUri[0]) {
        return fileUri[0].fsPath;
    }
}
// Función para leer archivo de comandos
function readCommandsFile(filePath, context) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            vscode.window.showErrorMessage('Error leyendo commands.json');
            return;
        }
        try {
            const commandData = JSON.parse(data);
            const commandGroups = {};
            // Iterar sobre todas las propiedades que comienzan con "quickPick"
            Object.keys(commandData).forEach(key => {
                if (key.startsWith('quickPick')) {
                    commandGroups[key] = commandData[key];
                }
            });
            console.log('QuickPicks encontrados:', Object.keys(commandGroups));
            // Crear QuickPicks y comandos
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
        }
        catch (e) {
            vscode.window.showErrorMessage('Error analizando commands.json');
            console.error('Error analizando commands.json:', e);
        }
    });
}
// Nueva función para crear instant buttons
function createInstantButtons(filePath, context) {
    console.log('Creando Instant Buttons desde:', filePath);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error leyendo commands.json:', err);
            vscode.window.showErrorMessage('Error leyendo commands.json');
            return;
        }
        try {
            const commandData = JSON.parse(data);
            const instantButtons = commandData.instantButtons || [];
            console.log('Instant Buttons encontrados:', instantButtons.length);
            context.subscriptions.forEach(subscription => {
                if (subscription.dispose) { // Verificación alternativa
                    subscription.dispose();
                }
            });
            if (instantButtons.length > 0) {
                instantButtons.forEach(async (button) => {
                    // Verificar si el comando ya existe
                    const commandId = `extension.instantButton${button.id}`;
                    if (!(await vscode.commands.getCommands()).includes(commandId)) {
                        console.log('Creando Instant Button:', button.description);
                        const instantButtonCommand = vscode.commands.registerCommand(commandId, () => {
                            executeCommand(button);
                        });
                        context.subscriptions.push(instantButtonCommand);
                        const instantButtonItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
                        instantButtonItem.command = commandId;
                        instantButtonItem.text = button.description;
                        instantButtonItem.show();
                        context.subscriptions.push(instantButtonItem);
                        console.log('Instant Button creado:', button.description);
                    }
                    else {
                        console.log('El comando ya existe:', commandId);
                    }
                });
                const separatorItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
                separatorItem.text = '|';
                separatorItem.show();
                context.subscriptions.push(separatorItem);
            }
        }
        catch (e) {
            console.error('Error analizando commands.json:', e);
            vscode.window.showErrorMessage('Error analizando commands.json');
        }
    });
}
// Función para activar la extensión
async function activate(context) {
    const configuration = vscode.workspace.getConfiguration('vscode-custom-buttons');
    let filePath = configuration.get('commandsFilePath');
    if (!filePath) {
        const hasCommandFile = await vscode.window.showQuickPick(['Sí', 'No'], {
            placeHolder: '¿Tienes un archivo commands.json listo?',
        });
        if (hasCommandFile === 'Sí') {
            const openUri = await vscode.window.showOpenDialog({
                canSelectMany: false,
                openLabel: 'Seleccionar commands.json',
                filters: {
                    'Archivos JSON': ['json'],
                },
            });
            if (openUri && openUri[0]) {
                filePath = openUri[0].fsPath;
                await configuration.update('commandsFilePath', filePath, vscode.ConfigurationTarget.Global);
            }
            else {
                vscode.window.showErrorMessage('No se seleccionó ningún archivo. La extensión no se activará.');
                return;
            }
        }
        else if (hasCommandFile === 'No') {
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(path.join(context.extensionPath, 'commands.json')),
                saveLabel: 'Guardar commands.json',
                filters: {
                    'Archivos JSON': ['json'],
                },
            });
            if (saveUri) {
                filePath = saveUri.fsPath;
                const templateFilePath = path.join(context.extensionPath, 'templates', 'commands.json');
                fs.copyFileSync(templateFilePath, filePath);
                await configuration.update('commandsFilePath', filePath, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage('Archivo commands.json creado en ' + filePath);
            }
            else {
                vscode.window.showErrorMessage('No se seleccionó ninguna ubicación. La extensión no se activará.');
                return;
            }
        }
        else {
            return;
        }
    }
    console.log('Ruta del archivo commands.json:', filePath);
    readCommandsFile(filePath, context);
    createInstantButtons(filePath, context);
    const commandEditor = vscode.commands.registerCommand('vscode-custom-buttons.openCommandEditor', () => {
        openCommandEditor(filePath, context);
    });
    context.subscriptions.push(commandEditor);
    const editorButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    editorButton.command = 'vscode-custom-buttons.openCommandEditor';
    editorButton.text = 'Editar Comandos';
    editorButton.show();
    context.subscriptions.push(editorButton);
    const separatorItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    separatorItem.text = '|';
    separatorItem.show();
    context.subscriptions.push(separatorItem);
}
// Función para abrir el editor de comandos
async function openCommandEditor(filePath, context) {
    const commandData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(commandData);
    const commandGroups = {};
    Object.keys(commandData).forEach(key => {
        if (key.startsWith('quickPick')) {
            commandGroups[key] = commandData[key];
        }
    });
    const instantButtons = commandData.instantButtons || [];
    const options = [
        { label: 'Agregar nuevo QuickPick' },
        { label: 'Eliminar QuickPick' },
        { label: 'Editar QuickPicks' }, // Nueva opción
        { label: 'Agregar nuevo Instant Button' },
        { label: 'Eliminar Instant Button' },
        { label: 'Editar Instant Buttons' }
    ];
    const selectedOption = await vscode.window.showQuickPick(options, { placeHolder: 'Selecciona una opcion o grupo de QuickPick' });
    if (!selectedOption)
        return;
    if (selectedOption.label === 'Agregar nuevo QuickPick') {
        addNewQuickPick(commandGroups, filePath, context);
    }
    else if (selectedOption.label === 'Eliminar QuickPick') {
        deleteQuickPick(commandGroups, filePath, context);
    }
    else if (selectedOption.label === 'Editar QuickPicks') {
        editQuickPicks(commandGroups, filePath, context);
    }
    else if (selectedOption.label === 'Agregar nuevo Instant Button') {
        addNewInstantButton(instantButtons, filePath, context);
    }
    else if (selectedOption.label === 'Eliminar Instant Button') {
        deleteInstantButton(instantButtons, filePath, context);
    }
    else if (selectedOption.label === 'Editar Instant Buttons') {
        editInstantButtons(instantButtons, filePath, context);
    }
    else {
        const selectedGroupId = selectedOption.label;
        const group = Object.values(commandGroups).find(group => group.id === selectedGroupId);
        if (!group) {
            vscode.window.showErrorMessage(`Grupo con id "${selectedGroupId}" no encontrado.`);
            return;
        }
        const commandOptions = group.commands.map(cmd => ({
            label: cmd.description
        }));
        commandOptions.push({ label: 'Agregar nuevo comando' });
        commandOptions.push({ label: 'Eliminar comando' });
        const selectedCommand = await vscode.window.showQuickPick(commandOptions, { placeHolder: 'Selecciona un comando para editar o agrega uno nuevo' });
        if (!selectedCommand)
            return;
        if (selectedCommand.label === 'Agregar nuevo comando') {
            addNewCommand(group, filePath, context, commandGroups);
        }
        else if (selectedCommand.label === 'Eliminar comando') {
            deleteCommand(group, filePath, context, commandGroups);
        }
        else {
            const selectedCmd = group.commands.find(cmd => cmd.description === selectedCommand.label);
            if (selectedCmd) {
                editCommand(selectedCmd, group, filePath, context, commandGroups);
            }
        }
    }
}
// Función para agregar un nuevo QuickPick
async function addNewQuickPick(commandGroups, filePath, context) {
    const id = await vscode.window.showInputBox({ prompt: 'Ingresa el ID del QuickPick' });
    if (!id)
        return;
    const realId = "quickPick" + id;
    commandGroups[realId] = { id, commands: [] };
    saveCommands(filePath, commandGroups, context);
}
// Función para eliminar un QuickPick existente
async function deleteQuickPick(commandGroups, filePath, context) {
    console.log(commandGroups);
    const groupOptions = Object.keys(commandGroups).map(groupKey => ({
        label: commandGroups[groupKey].id
    }));
    console.log(groupOptions);
    if (groupOptions.length <= 1) {
        vscode.window.showErrorMessage('Debe haber al menos un QuickPick. No se puede eliminar.');
        return;
    }
    const selectedGroup = await vscode.window.showQuickPick(groupOptions, { placeHolder: 'Selecciona un QuickPick para eliminar' });
    if (!selectedGroup)
        return;
    const selectedGroupId = selectedGroup.label;
    const realId = "quickPick" + selectedGroupId;
    delete commandGroups[realId];
    saveCommands(filePath, commandGroups, context);
}
// Función para editar QuickPicks existentes
async function editQuickPicks(commandGroups, filePath, context) {
    const quickPickOptions = Object.values(commandGroups).map(group => ({
        label: group.id,
        description: `${group.commands.length} comandos`
    }));
    const selectedQuickPick = await vscode.window.showQuickPick(quickPickOptions, {
        placeHolder: 'Selecciona un QuickPick para editar'
    });
    if (!selectedQuickPick)
        return;
    const group = Object.values(commandGroups).find(g => g.id === selectedQuickPick.label);
    if (!group) {
        vscode.window.showErrorMessage(`No se encontró el QuickPick ${selectedQuickPick.label}`);
        return;
    }
    const commandOptions = group.commands.map(cmd => ({
        label: cmd.description,
        description: cmd.command
    }));
    commandOptions.push({ label: 'Agregar nuevo comando', description: 'Añadir un nuevo comando a este QuickPick' });
    const selectedCommand = await vscode.window.showQuickPick(commandOptions, {
        placeHolder: 'Selecciona un comando para editar o agregar uno nuevo'
    });
    if (!selectedCommand)
        return;
    if (selectedCommand.label === 'Agregar nuevo comando') {
        addNewCommand(group, filePath, context, commandGroups);
    }
    else {
        const commandToEdit = group.commands.find(cmd => cmd.description === selectedCommand.label);
        if (commandToEdit) {
            editCommand(commandToEdit, group, filePath, context, commandGroups);
        }
    }
}
// Función para agregar un nuevo comando
async function addNewCommand(group, filePath, context, commandGroups) {
    const newCommand = await createNewCommand();
    if (newCommand) {
        group.commands.push(newCommand);
        saveCommands(filePath, commandGroups, context);
    }
}
// Función para eliminar un comando existente
async function deleteCommand(group, filePath, context, commandGroups) {
    const commandOptions = group.commands.map(cmd => ({
        label: cmd.description
    }));
    const selectedCommand = await vscode.window.showQuickPick(commandOptions, { placeHolder: 'Selecciona un comando para eliminar' });
    if (!selectedCommand)
        return;
    const selectedCmdIndex = group.commands.findIndex(cmd => cmd.description === selectedCommand.label);
    if (selectedCmdIndex !== -1) {
        group.commands.splice(selectedCmdIndex, 1);
        saveCommands(filePath, commandGroups, context);
    }
}
// Función para editar un comando existente
async function editCommand(command, group, filePath, context, commandGroups) {
    const editedCommand = await createNewCommand(command);
    if (editedCommand) {
        Object.assign(command, editedCommand);
        saveCommands(filePath, commandGroups, context);
    }
}
// Función para agregar un nuevo Instant Button
async function addNewInstantButton(instantButtons, filePath, context) {
    const newButton = await createNewInstantButton();
    if (!newButton)
        return;
    instantButtons.push(newButton);
    saveCommandsWithInstantButtons(filePath, instantButtons, context);
}
// Función para eliminar un Instant Button existente
async function deleteInstantButton(instantButtons, filePath, context) {
    if (instantButtons.length === 0) {
        vscode.window.showInformationMessage('No hay Instant Buttons para eliminar.');
        return;
    }
    const buttonOptions = instantButtons.map(button => ({
        label: button.description
    }));
    const selectedButton = await vscode.window.showQuickPick(buttonOptions, { placeHolder: 'Selecciona un Instant Button para eliminar' });
    if (!selectedButton)
        return;
    const index = instantButtons.findIndex(button => button.description === selectedButton.label);
    if (index !== -1) {
        instantButtons.splice(index, 1);
        console.log('Instant Button eliminado:', selectedButton.label);
        saveCommandsWithInstantButtons(filePath, instantButtons, context);
    }
}
// Función para editar Instant Buttons existentes
async function editInstantButtons(instantButtons, filePath, context) {
    if (instantButtons.length === 0) {
        vscode.window.showInformationMessage('No hay Instant Buttons para editar.');
        return;
    }
    const buttonOptions = instantButtons.map(button => ({
        label: button.description
    }));
    const selectedButton = await vscode.window.showQuickPick(buttonOptions, { placeHolder: 'Selecciona un Instant Button para editar' });
    if (!selectedButton)
        return;
    const buttonToEdit = instantButtons.find(button => button.description === selectedButton.label);
    if (buttonToEdit) {
        const editedButton = await createNewInstantButton(buttonToEdit);
        if (editedButton) {
            Object.assign(buttonToEdit, editedButton);
            saveCommandsWithInstantButtons(filePath, instantButtons, context);
        }
    }
}
// Función auxiliar para crear un nuevo comando o Instant Button
async function createNewCommand(existingCommand) {
    const id = await vscode.window.showInputBox({ prompt: 'Ingresa el ID del comando', value: existingCommand?.id });
    if (!id)
        return;
    const command = await vscode.window.showInputBox({ prompt: 'Ingresa el comando con argumentos entre { }', placeHolder: 'comando {arg1} {arg2}', value: existingCommand?.command });
    if (!command)
        return;
    const description = await vscode.window.showInputBox({ prompt: 'Ingresa la descripción del comando', value: existingCommand?.description });
    if (!description)
        return;
    // Procesar argumentos
    const argumentMatches = command.match(/{(.*?)}/g);
    const extraFields = {};
    if (argumentMatches) {
        for (const match of argumentMatches) {
            const argName = match.replace(/[{}]/g, '');
            const prompt = await vscode.window.showInputBox({ prompt: `Ingresa el prompt para ${argName}`, value: existingCommand?.extraFields?.[argName] });
            if (prompt) {
                extraFields[argName] = prompt;
            }
        }
    }
    // Verificar si el comando contiene {file}
    let applyToOpenFile = existingCommand?.applyToOpenFile || false;
    if (extraFields.hasOwnProperty('file')) {
        const useOpenFile = await vscode.window.showQuickPick(['Sí', 'No'], { placeHolder: '¿Quieres aplicar este comando al archivo actualmente abierto?' });
        if (useOpenFile === 'Sí') {
            applyToOpenFile = true;
        }
    }
    // Preguntar si se necesita confirmación
    const confirmation = await vscode.window.showQuickPick(['Sí', 'No'], { placeHolder: '¿Este comando requiere confirmación?' });
    return {
        id,
        command,
        description,
        extraFields: Object.keys(extraFields).length > 0 ? extraFields : undefined,
        applyToOpenFile: applyToOpenFile ? true : undefined,
        confirmation: confirmation === 'Sí' ? 'yes' : undefined
    };
}
// Alias para crear un nuevo Instant Button
const createNewInstantButton = createNewCommand;
// Función para guardar comandos
function saveCommands(filePath, commandGroups, context) {
    try {
        const existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        existingData.quickPicks = commandGroups;
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
        vscode.window.showInformationMessage('Comandos guardados exitosamente');
        readCommandsFile(filePath, context);
    }
    catch (e) {
        vscode.window.showErrorMessage('Error guardando commands.json: ' + e);
    }
}
// Función para guardar comandos con Instant Buttons
function saveCommandsWithInstantButtons(filePath, instantButtons, context) {
    try {
        const existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        existingData.instantButtons = instantButtons;
        console.log('Instant Buttons guardados:', existingData.instantButtons);
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
        vscode.window.showInformationMessage('Comandos guardados exitosamente');
        createInstantButtons(filePath, context);
    }
    catch (e) {
        vscode.window.showErrorMessage('Error guardando commands.json: ' + e);
    }
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
            vscode.window.showErrorMessage('Error: getDirectory es verdadero pero extraFields no contiene "directory".');
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
            const userInput = await vscode.window.showInputBox({ prompt: 'Ingresa la ruta del archivo' });
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
        let confirmationMessage = `¿Estás seguro de que quieres ejecutar el comando: "${command.command}"`;
        // Reemplazar marcadores de posición en el mensaje de confirmación
        Object.keys(args).forEach(key => {
            const regex = new RegExp(`{${key}}`, 'g');
            confirmationMessage = confirmationMessage.replace(regex, args[key]);
        });
        const confirmation = await vscode.window.showWarningMessage(confirmationMessage, { modal: true }, 'Sí', 'No');
        if (confirmation !== 'Sí') {
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