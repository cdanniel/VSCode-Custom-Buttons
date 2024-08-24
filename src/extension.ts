import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Interfaz para los comandos y grupos
interface Command {
  id: string;
  command: string;
  description: string;
  extraFields?: { [key: string]: string };
  confirmation?: string;
  applyToOpenFile?: boolean;
  getDirectory?: boolean;
}

interface QuickPickGroup {
  id: string;
  commands: Command[];
}

// Función para cargar comandos desde el archivo
async function loadCommandsFromFile(): Promise<string | undefined> {
  const options: vscode.OpenDialogOptions = {
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
function readCommandsFile(filePath: string, context: vscode.ExtensionContext) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      vscode.window.showErrorMessage('Error reading commands.json');
      return;
    }

    try {
      const commandGroups: { [key: string]: QuickPickGroup } = JSON.parse(data);

      // Crear los QuickPicks y comandos
      Object.keys(commandGroups).forEach(groupKey => {
        const group = commandGroups[groupKey];

        const quickPickCommand = vscode.commands.registerCommand(`extension.show${group.id}`, async () => {
          const options: vscode.QuickPickItem[] = group.commands.map(command => ({
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
    } catch (e) {
      vscode.window.showErrorMessage('Error parsing commands.json');
    }
  });
}

// Función para activar la extensión
export async function activate(context: vscode.ExtensionContext) {
  const configuration = vscode.workspace.getConfiguration('vscode-custom-buttons');
  let filePath = configuration.get<string>('commandsFilePath');

  if (!filePath) {
    filePath = await loadCommandsFromFile();
    if (filePath) {
      await configuration.update('commandsFilePath', filePath, vscode.ConfigurationTarget.Global);
    } else {
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

function updateQuickPicks(context: vscode.ExtensionContext, commandGroups: { [key: string]: QuickPickGroup }, filePath: string) {
  // Filtrar y mantener solo las tres primeras suscripciones
  const retainedSubscriptions = context.subscriptions.slice(0, 3);

  // Eliminar todas las suscripciones actuales excepto las retenidas
  context.subscriptions.forEach((subscription, index) => {
    if (!retainedSubscriptions.includes(subscription)) {
      subscription.dispose();
    }
  });

  // Actualizar el array de suscripciones en el contexto
  context.subscriptions.length = 0; // Vaciar el array actual
  context.subscriptions.push(...retainedSubscriptions); // Añadir las suscripciones mantenidas

  //console.log("Subscriptions antes: ", context.subscriptions);

  // Registrar de nuevo los comandos y QuickPicks
  Object.keys(commandGroups).forEach(groupKey => {
    const group = commandGroups[groupKey];

    const quickPickCommand = vscode.commands.registerCommand(`extension.show${group.id}`, async () => {
      const options: vscode.QuickPickItem[] = group.commands.map(command => ({
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

  //console.log("Subscriptions despues: ", context.subscriptions);
}

// Función para guardar los comandos en el archivo
function saveCommands(filePath: string, commandGroups: { [key: string]: QuickPickGroup }, context: vscode.ExtensionContext) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(commandGroups, null, 2));
    vscode.window.showInformationMessage('Commands saved successfully');
    updateQuickPicks(context, commandGroups, filePath);
  } catch (e) {
    vscode.window.showErrorMessage('Error saving commands.json: ' + e);
  }
}

// Función para añadir un nuevo comando
async function addNewCommand(group: QuickPickGroup, filePath: string, context: vscode.ExtensionContext, commandGroups: { [key: string]: QuickPickGroup }) {
  const id = await vscode.window.showInputBox({ prompt: 'Enter command ID' });
  if (!id) return;

  const command = await vscode.window.showInputBox({ prompt: 'Enter command' });
  if (!command) return;

  const description = await vscode.window.showInputBox({ prompt: 'Enter command description' });
  if (!description) return;

  const newCommand: Command = { id, command, description };

  group.commands.push(newCommand);
  console.log("Group act: ", group);
  console.log("Command group act: ", commandGroups);
  saveCommands(filePath, commandGroups, context);
}

// Función para eliminar un comando existente
async function deleteCommand(group: QuickPickGroup, filePath: string, context: vscode.ExtensionContext, commandGroups: { [key: string]: QuickPickGroup }) {
  const commandOptions: vscode.QuickPickItem[] = group.commands.map(cmd => ({
    label: cmd.description
  }));

  const selectedCommand = await vscode.window.showQuickPick(commandOptions, { placeHolder: 'Select a command to delete' });
  if (!selectedCommand) return;

  const selectedCmdIndex = group.commands.findIndex(cmd => cmd.description === selectedCommand.label);
  if (selectedCmdIndex !== -1) {
    group.commands.splice(selectedCmdIndex, 1);
    saveCommands(filePath, commandGroups, context);
  }
}

// Función para abrir el editor de comandos
async function openCommandEditor(filePath: string, context: vscode.ExtensionContext) {
  const commandGroups: { [key: string]: QuickPickGroup } = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const groupOptions: vscode.QuickPickItem[] = Object.keys(commandGroups).map(groupKey => ({
    label: commandGroups[groupKey].id
  }));

  groupOptions.push({ label: 'Add new QuickPick' });
  groupOptions.push({ label: 'Delete QuickPick' });

  const selectedGroup = await vscode.window.showQuickPick(groupOptions, { placeHolder: 'Select a command group' });
  if (!selectedGroup) return;

  if (selectedGroup.label === 'Add new QuickPick') {
    addNewQuickPick(commandGroups, filePath, context);
  } else if (selectedGroup.label === 'Delete QuickPick') {
    deleteQuickPick(commandGroups, filePath, context);
  } else {
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

    const commandOptions: vscode.QuickPickItem[] = group.commands.map(cmd => ({
      label: cmd.description
    }));

    commandOptions.push({ label: 'Add new command' });
    commandOptions.push({ label: 'Delete command' });

    const selectedCommand = await vscode.window.showQuickPick(commandOptions, { placeHolder: 'Select a command to edit or add a new one' });
    if (!selectedCommand) return;

    if (selectedCommand.label === 'Add new command') {
      addNewCommand(group, filePath, context, commandGroups);
    } else if (selectedCommand.label === 'Delete command') {
      deleteCommand(group, filePath, context, commandGroups);
    } else {
      const selectedCmd = group.commands.find(cmd => cmd.description === selectedCommand.label);
      if (selectedCmd) {
        editCommand(selectedCmd, group, filePath, context, commandGroups);
      }
    }
  }
}

// Función para añadir un nuevo QuickPick
async function addNewQuickPick(commandGroups: { [key: string]: QuickPickGroup }, filePath: string, context: vscode.ExtensionContext) {
  const id = await vscode.window.showInputBox({ prompt: 'Enter QuickPick ID' });
  if (!id) return;

  commandGroups[id] = { id, commands: [] };
  saveCommands(filePath, commandGroups, context);
}

// Función para eliminar un QuickPick existente
async function deleteQuickPick(commandGroups: { [key: string]: QuickPickGroup }, filePath: string, context: vscode.ExtensionContext) {
  const groupOptions: vscode.QuickPickItem[] = Object.keys(commandGroups).map(groupKey => ({
    label: commandGroups[groupKey].id
  }));

  const selectedGroup = await vscode.window.showQuickPick(groupOptions, { placeHolder: 'Select a QuickPick to delete' });
  if (!selectedGroup) return;

  const selectedGroupId = selectedGroup.label;
  delete commandGroups[selectedGroupId];
  saveCommands(filePath, commandGroups, context);
}

// Función para editar un comando existente
async function editCommand(command: Command, group: QuickPickGroup, filePath: string, context: vscode.ExtensionContext, commandGroups: { [key: string]: QuickPickGroup }) {
  const id = await vscode.window.showInputBox({ prompt: 'Enter command ID', value: command.id });
  if (!id) return;

  const cmd = await vscode.window.showInputBox({ prompt: 'Enter command', value: command.command });
  if (!cmd) return;

  const description = await vscode.window.showInputBox({ prompt: 'Enter command description', value: command.description });
  if (!description) return;

  command.id = id;
  command.command = cmd;
  command.description = description;

  saveCommands(filePath, commandGroups, context);
}

async function executeCommand(command: Command) {
  const args: { [key: string]: string } = {};

  if(command.getDirectory) {
    const fileDirectory = getDirectory();
    if(fileDirectory) {
      args['directory'] = fileDirectory;
      runCommand(command, args);
      return;
    } else if (command.extraFields && command.extraFields.hasOwnProperty('directory')) {
      for (const [field, prompt] of Object.entries(command.extraFields)) {
        const userInput = await vscode.window.showInputBox({ prompt });
        if (!userInput) {
          return;
        }
        args[field] = userInput;
        runCommand(command, args);
        return;
      }
    } else {
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
      } else {
        for (const [field, prompt] of Object.entries(command.extraFields)) {
          const userInput = await vscode.window.showInputBox({ prompt });
          if (!userInput) {
            return;
          }
          args[field] = userInput;
        }
      }
    } else {
      vscode.window.showErrorMessage('Error: applyToOpenFile es true pero extraFields no contiene "file".');
      return;
    }
  } else {
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
    const confirmation = await vscode.window.showWarningMessage(
      `Are you sure you want to run the command: "${command.command}"?`,
      { modal: true },
      'Yes', 'No'
    );
    if (confirmation !== 'Yes') {
      return;
    }
  }

  runCommand(command, args);
}

function runCommand(command: Command, args: { [key: string]: string }) {
  const terminal = vscode.window.activeTerminal || vscode.window.createTerminal('Terminal');
  const fullCommand = Object.keys(args).reduce((cmd, key) => cmd.replace(`{${key}}`, args[key]), command.command);
  terminal.sendText(fullCommand);
  terminal.show();
}

export function getPath() {
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

export function getDirectory() {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const fileUri = editor.document.uri;
    const filePath = fileUri.fsPath;
    const directoryPath = path.dirname(filePath);

    return `"${directoryPath}"`;
  }
  return '';
}

export function deactivate() {}