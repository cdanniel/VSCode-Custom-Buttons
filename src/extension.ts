import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Interface for commands and groups
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


function readCommandsFile(filePath: string, context: vscode.ExtensionContext) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      vscode.window.showErrorMessage('Error reading commands.json');
      return;
    }

    try {
      const commandDataG = JSON.parse(data);
      const commandDataI = JSON.parse(data);
      const commandGroups: { [key: string]: QuickPickGroup } = {};
      const instantButtons: { [key: string]: Command } = {};

      // Iterate over all properties that start with "quickPick"
      Object.keys(commandDataG).forEach(key => {
        if (key.startsWith('quickPick')) {
          commandGroups[key] = commandDataG[key];
        }
      });

      // Iterate over all properties that start with "instantButton"
      Object.keys(commandDataI).forEach(key => {
        if (key.startsWith('instantButton')) {
          instantButtons[key] = commandDataI[key];
        }
      });

      console.log('QuickPicks found:', Object.keys(commandGroups));
      console.log('InstantButton found:', Object.keys(instantButtons));

      // Create QuickPicks
      Object.keys(commandGroups).forEach(groupKey => {
        const group = commandGroups[groupKey];

        const quickPickCommand = vscode.commands.registerCommand(`extension.show${group.id}`, async () => {
          const options: vscode.QuickPickItem[] = group.commands.map(command => ({
            label: command.description,
            description: command.command
          }));

          if (!options.length) {
            vscode.window.showInformationMessage('No commands found in this QuickPick, you can add one from the Edit Commands button');
            console.log('No commands found in this QuickPick');
            return;
          }

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

        console.log(`QuickPick created: ${group.id}`);

        const separatorItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        separatorItem.text = '|';
        separatorItem.show();
        context.subscriptions.push(separatorItem);
      });

      // Create instantButtons
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

        console.log(`InstantButton created: ${button.id}`);

        const separatorItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        separatorItem.text = '|';
        separatorItem.show();
        context.subscriptions.push(separatorItem);
      });

    } catch (e) {
      vscode.window.showErrorMessage('Error parsing commands.json');
      console.error('Error parsing commands.json:', e);
    }
  });
}

// Function to activate the extension
export async function activate(context: vscode.ExtensionContext) {
  const configuration = vscode.workspace.getConfiguration('vscode-custom-buttons');
  let filePath = configuration.get<string>('commandsFilePath');

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
      } else {
        vscode.window.showErrorMessage('No file selected. Extension will not activate.');
        return;
      }
    } else if (hasCommandFile === 'No') {
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
      } else {
        vscode.window.showErrorMessage('No location selected. Extension will not activate.');
        return;
      }
    } else {
      return;
    }
  }

  readCommandsFile(filePath, context);

  const commandEditor = vscode.commands.registerCommand('vscode-custom-buttons.openCommandEditor', () => {
    openCommandEditor(filePath!, context);
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



function updateAll(context: vscode.ExtensionContext, commandGroups: { [key: string]: QuickPickGroup }, instantButtons: { [key: string]: Command }, filePath: string) {
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
      const options: vscode.QuickPickItem[] = group.commands.map(command => ({
        label: command.description,
        description: command.command
      }));

      if (!options.length) {
        vscode.window.showInformationMessage('No commands found in this QuickPick, you can add one from the Edit Commands button');
        console.log('No commands found in this QuickPick');
        return;
      }

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

function updateInstantButtons(context: vscode.ExtensionContext, instantButtons: { [key: string]: Command }, filePath: string) {
  // Filter and keep only the first three subscriptions
  const retainedSubscriptions = context.subscriptions.slice(0, 3);

  // Filter subscriptions that start with 'instantButton'
  const filteredSubscriptions = context.subscriptions.filter(subscription => {
    const command = (subscription as vscode.StatusBarItem)?.command || '';
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

// Function to save all QuickPicks and instantButtons to the file
function saveAll(filePath: string, commandGroups: { [key: string]: QuickPickGroup }, context: vscode.ExtensionContext, instantButtons: { [key: string]: Command }) {
  try {
    // Combine commandGroups and instantButtons into a single object
    const combinedData = {
      ...commandGroups,  // Keep all command groups
      ...instantButtons  // Add instant buttons
    };

    // Write the combined object to the file
    fs.writeFileSync(filePath, JSON.stringify(combinedData, null, 2));

    vscode.window.showInformationMessage('Commands saved successfully');
    
    // Update all elements (status bar, commands, etc.)
    updateAll(context, commandGroups, instantButtons, filePath);
  } catch (e) {
    vscode.window.showErrorMessage('Error saving commands.json: ' + e);
  }
}

// Function to add a new command
async function addNewCommand(group: QuickPickGroup, filePath: string, context: vscode.ExtensionContext, commandGroups: { [key: string]: QuickPickGroup }, instantButtons: { [key: string]: Command }) {
  const id = await vscode.window.showInputBox({ prompt: 'Enter command ID' });
  if (!id) return;

  const command = await vscode.window.showInputBox({ prompt: 'Enter command with arguments in { }', placeHolder: 'command {arg1} {arg2}' });
  if (!command) return;

  const description = await vscode.window.showInputBox({ prompt: 'Enter command description' });
  if (!description) return;

  // Process arguments
  const argumentMatches = command.match(/{(.*?)}/g);
  const extraFields: { [key: string]: string } = {};

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

  const newCommand: Command = {
    id,
    command,
    description,
    extraFields: Object.keys(extraFields).length > 0 ? extraFields : undefined,
    applyToOpenFile: applyToOpenFile ? true : undefined,
    confirmation: confirmation === 'Yes' ? 'yes' : undefined
  };

  if (group.id === "instantButton") {  
    return newCommand;
  } else {
    group.commands.push(newCommand);
    saveAll(filePath, commandGroups, context, instantButtons);
  }
}

// Function to delete an existing command
async function deleteCommand(group: QuickPickGroup, filePath: string, context: vscode.ExtensionContext, commandGroups: { [key: string]: QuickPickGroup }, instantButtons: { [key: string]: Command }) {
  const commandOptions: vscode.QuickPickItem[] = group.commands.map(cmd => ({
    label: cmd.description
  }));

  const selectedCommand = await vscode.window.showQuickPick(commandOptions, { placeHolder: 'Select a command to delete' });
  if (!selectedCommand) return;

  const selectedCmdIndex = group.commands.findIndex(cmd => cmd.description === selectedCommand.label);
  if (selectedCmdIndex !== -1) {
    group.commands.splice(selectedCmdIndex, 1);
    saveAll(filePath, commandGroups, context, instantButtons);
  }
}

async function deleteInstantButton(instantButtons: { [key: string]: Command }, filePath: string, context: vscode.ExtensionContext, commandGroups: { [key: string]: QuickPickGroup }) {
  const buttonOptions: vscode.QuickPickItem[] = Object.keys(instantButtons).map(buttonKey => ({
    label: instantButtons[buttonKey].description
  }));

  if (!buttonOptions.length) {
    vscode.window.showInformationMessage('No instant buttons found, you can add one from the Edit Commands button');
    console.log('No instant buttons found');
    return;
  }

  const selectedButton = await vscode.window.showQuickPick(buttonOptions, { placeHolder: 'Select an instant button to delete' });
  if (!selectedButton) return;

  const selectedButtonIndex = Object.values(instantButtons).findIndex(button => button.description === selectedButton.label);
  if (selectedButtonIndex !== -1) {
    delete instantButtons[Object.keys(instantButtons)[selectedButtonIndex]];
    saveAll(filePath, commandGroups, context, instantButtons);
  }
}

// Function to open the command editor
async function openCommandEditor(filePath: string, context: vscode.ExtensionContext) {
  // Read the file and get the JSON data
  const allData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Filter only those that start with 'quickPick' for commandGroups
  const commandGroups: { [key: string]: QuickPickGroup } = {};
  Object.keys(allData).forEach(key => {
    if (key.startsWith('quickPick')) {
      commandGroups[key] = allData[key];
    }
  });

  // Filter only those that start with 'instantButton' for instantButtons
  const instantButtons: { [key: string]: Command } = {};
  Object.keys(allData).forEach(key => {
    if (key.startsWith('instantButton')) {
      instantButtons[key] = allData[key];
    }
  });

  const options: vscode.QuickPickItem[] = [
    { label: 'Add new QuickPick' },
    { label: 'Delete QuickPick' },
    { label: 'Edit QuickPick' },
    { label: 'Add Instant Button' },
    { label: 'Delete Instant Button' },
    { label: 'Edit Instant Button' }
  ];

  // Show the QuickPick to select an option or group
  const selectedOption = await vscode.window.showQuickPick(options, { placeHolder: 'Select an option' });
  if (!selectedOption) return;

  if (selectedOption.label === 'Add new QuickPick') {
    addNewQuickPick(commandGroups, filePath, context, instantButtons);
  } else if (selectedOption.label === 'Delete QuickPick') {
    deleteQuickPick(commandGroups, filePath, context, instantButtons);
  } else if (selectedOption.label === 'Edit QuickPick') {
    // First list all available QuickPicks
    const quickPickOptions: vscode.QuickPickItem[] = Object.keys(commandGroups).map(key => ({ 
      label: commandGroups[key].id 
    }));

    if (!quickPickOptions.length) {
      vscode.window.showInformationMessage('No QuickPicks found, you can add one from the Edit Commands button');
      console.log('No QuickPicks found');
      return;
    }

    const selectedQuickPick = await vscode.window.showQuickPick(quickPickOptions, { placeHolder: 'Select a QuickPick group to edit' });
    if (!selectedQuickPick) return;

    // Selected the group, continue with the editing flow
    const selectedGroupId = selectedQuickPick.label;
    const group = Object.values(commandGroups).find(group => group.id === selectedGroupId);

    if (!group) {
      vscode.window.showErrorMessage(`Group with id "${selectedGroupId}" not found.`);
      return;
    }

    // List the commands inside the selected QuickPick
    const commandOptions: vscode.QuickPickItem[] = group.commands.map(cmd => ({
      label: cmd.description
    }));

    // Add additional options to add or delete commands
    commandOptions.push({ label: 'Add new command' });
    commandOptions.push({ label: 'Delete command' });

    const selectedCommand = await vscode.window.showQuickPick(commandOptions, { placeHolder: 'Select a command to edit or add a new one' });
    if (!selectedCommand) return;

    if (selectedCommand.label === 'Add new command') {
      addNewCommand(group, filePath, context, commandGroups, instantButtons);
    } else if (selectedCommand.label === 'Delete command') {
      deleteCommand(group, filePath, context, commandGroups, instantButtons);
    } else {
      const selectedCmd = group.commands.find(cmd => cmd.description === selectedCommand.label);
      if (selectedCmd) {
        editCommand(selectedCmd, filePath, context, commandGroups, instantButtons);
      }
    }
  } else if (selectedOption.label === 'Add Instant Button') {
    addInstantButton(instantButtons, filePath, context, commandGroups);
  } else if (selectedOption.label === 'Delete Instant Button') {
    deleteInstantButton(instantButtons, filePath, context, commandGroups);
  } else if (selectedOption.label === 'Edit Instant Button') { 
    // List all available instantButtons
    const buttonOptions: vscode.QuickPickItem[] = Object.values(instantButtons).map(button => ({ 
      label: button.description,
      description: button.command
    }));

    if (!buttonOptions.length) {
      vscode.window.showInformationMessage('No instant buttons found, you can add one from the Edit Commands button');
      console.log('No instant buttons found');
      return;
    }

    const selectedButton = await vscode.window.showQuickPick(buttonOptions, { placeHolder: 'Select an instant button to edit' });
    if (!selectedButton) return;

    const selectedButtonIndex = Object.values(instantButtons).findIndex(button => button.description === selectedButton.label);
    if (selectedButtonIndex !== -1) {
      const button = Object.values(instantButtons)[selectedButtonIndex];
      editCommand(button, filePath, context, commandGroups, instantButtons);
    }
  }
}

// Function to add a new QuickPick
async function addNewQuickPick(commandGroups: { [key: string]: QuickPickGroup }, filePath: string, context: vscode.ExtensionContext, instantButtons: { [key: string]: Command }) {
  const id = await vscode.window.showInputBox({ prompt: 'Enter QuickPick ID' });
  if (!id) return;

  const realId = "quickPick" + id.replace(/\s+/g, '');

  commandGroups[realId] = { id: realId.replace("quickPick", ""), commands: [] };

  saveAll(filePath, commandGroups, context, instantButtons);
}


// Function to delete an existing QuickPick
async function deleteQuickPick(commandGroups: { [key: string]: QuickPickGroup }, filePath: string, context: vscode.ExtensionContext, instantButtons: { [key: string]: Command }) {
  const groupOptions: vscode.QuickPickItem[] = Object.keys(commandGroups).map(groupKey => ({
    label: commandGroups[groupKey].id
  }));

  if (!groupOptions.length) {
    vscode.window.showInformationMessage('No QuickPicks found, you can add one from the Edit Commands button');
    console.log('No QuickPicks found');
    return;
  }

  const selectedGroup = await vscode.window.showQuickPick(groupOptions, { placeHolder: 'Select a QuickPick to delete' });
  if (!selectedGroup) return;

  const selectedGroupId = selectedGroup.label;
  const realId = "quickPick" + selectedGroupId;
  delete commandGroups[realId];
  saveAll(filePath, commandGroups, context, instantButtons);
}

async function addInstantButton(instantButtons: { [key: string]: Command }, filePath: string, context: vscode.ExtensionContext, commandGroups: { [key: string]: QuickPickGroup }) {
  // Create an empty group and commandGroups to pass to the addNewCommand function
  const group = { id: "instantButton", commands: [] };
  const commandGroupsFake = { "instantButton": group };
  const command = await addNewCommand(group, filePath, context, commandGroupsFake, instantButtons);
  if (!command) return;
  console.log("Command: ", command);

  const realId = "instantButton" + command.id.replace(/\s+/g, '');

  instantButtons[realId] = command;
  console.log("InstantButtons list: ", instantButtons);

  saveAll(filePath, commandGroups, context, instantButtons);

}

// Function to edit an existing command
async function editCommand(command: Command, filePath: string, context: vscode.ExtensionContext, commandGroups: { [key: string]: QuickPickGroup }, instantButtons: { [key: string]: Command }) {
  const id = await vscode.window.showInputBox({ prompt: 'Enter command ID', value: command.id });
  if (!id) return;

  const cmd = await vscode.window.showInputBox({ prompt: 'Enter command', value: command.command });
  if (!cmd) return;

  const description = await vscode.window.showInputBox({ prompt: 'Enter command description', value: command.description });
  if (!description) return;

  command.id = id;
  command.command = cmd;
  command.description = description;

  // Process arguments
  const argumentMatches = cmd.match(/{(.*?)}/g);
  const extraFields: { [key: string]: string } = {};

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

async function executeCommand(command: Command) {
  const args: { [key: string]: string } = {};

  if (command.getDirectory) {
    const fileDirectory = getDirectory();
    if (fileDirectory) {
      args['directory'] = fileDirectory;
      runCommand(command, args);
      return;
    } else if (command.extraFields && command.extraFields.hasOwnProperty('directory')) {
      for (const [field, prompt] of Object.entries(command.extraFields)) {
        const userInput = await vscode.window.showInputBox({ prompt });
        if (userInput === undefined) {
          return;
        }
        args[field] = userInput;
      }
      runCommand(command, args);
      return;
    } else {
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
    } else {
      const userInput = await vscode.window.showInputBox({ prompt: 'Enter file path'});
      if (userInput === undefined) {
        return;
      }
      args['file'] = userInput;
    }
  } else {
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
  
    const confirmation = await vscode.window.showWarningMessage(
      confirmationMessage,
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