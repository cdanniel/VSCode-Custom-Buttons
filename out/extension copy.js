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
exports.deactivate = exports.activate = exports.getPath = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
class StatusBar {
    statusBarItems;
    constructor(statusBarItems) {
        this.statusBarItems = statusBarItems;
    }
    addItem(text, cmd, tip, col) {
        const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        item.text = text;
        if (cmd) {
            item.command = cmd;
        }
        if (tip) {
            item.tooltip = tip;
        }
        if (col) {
            item.color = col;
        }
        item.show();
        this.statusBarItems.push(item);
    }
}
exports.default = StatusBar;
function getPath() {
    //* La primera opción devuelve el path completo del archivo
    // const editor = vscode.window.activeTextEditor;
    // if (editor) {
    //     const fileUri = editor.document.uri;
    //     const filePath = fileUri.fsPath;
    //     console.log("filePath", filePath);
    //     return filePath;
    // }
    // return '';
    //* La segunda opción devuelve solo el nombre del archivo haciendo antes un cd al directorio del archivo
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const fileUri = editor.document.uri;
        const filePath = fileUri.fsPath;
        console.log("filePath", filePath);
        const directoryPath = path.dirname(filePath);
        console.log("directoryPath", directoryPath);
        // Cambiar al directorio del archivo
        const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
        terminal.sendText(`cd "${directoryPath}"`);
        terminal.show();
        // Devolver solo el nombre del archivo
        const fileName = path.basename(filePath);
        return fileName;
    }
    return '';
}
exports.getPath = getPath;
async function confirmAndRunCommand(command) {
    const confirmation = await vscode.window.showWarningMessage(`Are you sure you want to run the command: "${command}"?`, { modal: true }, 'Yes', 'No');
    if (confirmation === 'Yes') {
        const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
        terminal.sendText(command);
        terminal.show();
    }
}
function activate(context) {
    console.log('Congratulations, your extension "clearcase-buttons" is now active!');
    const statusBarItems = [];
    const statusBar = new StatusBar(statusBarItems);
    // Comandos
    const disposable = vscode.commands.registerCommand('clearcase-buttons.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from ClearCase Buttons!');
    });
    const listFilesCommand = vscode.commands.registerCommand('clearcase-buttons.listFiles', async () => {
        const userInput = await vscode.window.showInputBox({
            prompt: 'Ingrese más información para el comando "ls"',
            placeHolder: 'Más información opcional...'
        });
        const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
        if (userInput) {
            terminal.sendText(`ls ${userInput}`);
        }
        else {
            terminal.sendText('ls');
        }
        terminal.show();
    });
    const clearTerminalCommand = vscode.commands.registerCommand('clearcase-buttons.clearTerminal', () => {
        const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
        terminal.sendText('clear');
        terminal.show();
    });
    const ctlsco = vscode.commands.registerCommand('clearcase-buttons.ctlsco', () => {
        const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
        terminal.sendText('ct lsco -cview -avob');
        terminal.show();
    });
    const ctlscoVOB = vscode.commands.registerCommand('clearcase-buttons.ctlscoNoLabel', () => {
        const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
        terminal.sendText('ct lsco -r -cview');
        terminal.show();
    });
    const quickPickWatchCheckout = vscode.commands.registerCommand('clearcase-buttons.quickPickWatchCheckout', async () => {
        const options = [
            { label: 'Watch Checkout', description: 'Watch all checkout files in all vobs (ct lsco -cview -avob)' },
            { label: 'Watch Checkout (VOB)', description: 'Watch all checkout files in current vob' }
        ];
        const selection = await vscode.window.showQuickPick(options, { placeHolder: 'Select a ClearCase command' });
        if (selection) {
            if (selection.label === 'Watch Checkout') {
                vscode.commands.executeCommand('clearcase-buttons.ctlsco');
            }
            else if (selection.label === 'Watch Checkout (VOB)') {
                vscode.commands.executeCommand('clearcase-buttons.ctlscoNoLabel');
            }
        }
    });
    // Comandos para Differencies
    const iccDiff = vscode.commands.registerCommand('clearcase-buttons.iccDiff', async () => {
        const label = await vscode.window.showInputBox({ prompt: 'Ingrese el nombre de la etiqueta' });
        if (label) {
            const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
            terminal.sendText(`icc diff ${label}`);
            terminal.show();
        }
    });
    const iccLog = vscode.commands.registerCommand('clearcase-buttons.iccLog', async () => {
        const filePath = getPath();
        if (filePath) {
            const command = `icc log "${filePath}"`;
            const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
            terminal.sendText(command);
            terminal.show();
        }
        else {
            const file = await vscode.window.showInputBox({ prompt: 'Ingrese el nombre del fichero' });
            if (file) {
                const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
                terminal.sendText(`icc log ${file}`);
                terminal.show();
            }
            else {
                vscode.window.showInformationMessage('No hay ningún archivo seleccionado y no se ingresó un nombre de fichero.');
            }
        }
    });
    const iccLogBranch = vscode.commands.registerCommand('clearcase-buttons.iccLogBranch', async () => {
        const branch = await vscode.window.showInputBox({ prompt: 'Ingrese el nombre de la rama' });
        const filePath = getPath();
        if (filePath) {
            if (branch) {
                const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
                terminal.sendText(`icc log -branch ${branch} ${filePath}`);
                terminal.show();
            }
            else {
                vscode.window.showInformationMessage('No se ingresó una rama.');
            }
        }
        else {
            const file = await vscode.window.showInputBox({ prompt: 'Ingrese el nombre del fichero' });
            if (branch && file) {
                const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
                terminal.sendText(`icc log -branch ${branch} ${file}`);
                terminal.show();
            }
        }
    });
    const quickPickDifferencies = vscode.commands.registerCommand('clearcase-buttons.quickPickDifferencies', async () => {
        const options = [
            { label: 'icc diff [nombre de etiqueta]', description: 'Diferenciar los ficheros de esa etiqueta' },
            { label: 'icc log [nombre fichero]', description: 'Ver el histórico de cambios de un fichero' },
            { label: 'icc log -branch [rama] [archivo]', description: 'Ver el histórico de cambios de un fichero en esa rama' }
        ];
        const selection = await vscode.window.showQuickPick(options, { placeHolder: 'Seleccione una opción' });
        if (selection) {
            if (selection.label === 'icc diff [nombre de etiqueta]') {
                vscode.commands.executeCommand('clearcase-buttons.iccDiff');
            }
            else if (selection.label === 'icc log [nombre fichero]') {
                vscode.commands.executeCommand('clearcase-buttons.iccLog');
            }
            else if (selection.label === 'icc log -branch [rama] [archivo]') {
                vscode.commands.executeCommand('clearcase-buttons.iccLogBranch');
            }
        }
    });
    // Comandos para Checkout
    const iccCo = vscode.commands.registerCommand('clearcase-buttons.iccCo', async () => {
        const label = await vscode.window.showInputBox({ prompt: 'Ingrese el nombre de la etiqueta' });
        const filePath = getPath();
        if (filePath) {
            if (label) {
                const command = `icc co "${label}" "${filePath}"`;
                confirmAndRunCommand(command);
            }
            else {
                vscode.window.showInformationMessage('No se ingresó una etiqueta.');
            }
        }
        else {
            const file = await vscode.window.showInputBox({ prompt: 'Ingrese el nombre del fichero' });
            if (label && file) {
                const command = `icc co "${label}" "${filePath}"`;
                confirmAndRunCommand(command);
            }
        }
    });
    const ctCo = vscode.commands.registerCommand('clearcase-buttons.ctCo', async () => {
        const comment = await vscode.window.showInputBox({ prompt: 'Ingrese el comentario' });
        const filePath = getPath();
        if (filePath) {
            if (comment) {
                const command = `ct co -c "${comment}" "${filePath}"`;
                confirmAndRunCommand(command);
            }
            else {
                vscode.window.showInformationMessage('No se ingresó un comentario.');
            }
        }
        else {
            const file = await vscode.window.showInputBox({ prompt: 'Ingrese el nombre del fichero' });
            if (file && comment) {
                const command = `ct co -c "${comment}" "${file}"`;
                confirmAndRunCommand(command);
            }
            else {
                vscode.window.showInformationMessage('No se ingreso el comentario o no se ingresó un nombre de fichero.');
            }
        }
    });
    const quickPickCheckout = vscode.commands.registerCommand('clearcase-buttons.quickPickCheckout', async () => {
        const options = [
            { label: 'icc co "nombre_de_etiqueta" "nombre_fichero"', description: 'Hacer checkout asociando una etiqueta al fichero' },
            { label: 'ct co -c "nombre.PTR: [comentario]" "nombre_fichero"', description: 'Hacer checkout sin asociarlo a ninguna etiqueta' }
        ];
        const selection = await vscode.window.showQuickPick(options, { placeHolder: 'Seleccione una opción' });
        if (selection) {
            if (selection.label === 'icc co "nombre_de_etiqueta" "nombre_fichero"') {
                vscode.commands.executeCommand('clearcase-buttons.iccCo');
            }
            else if (selection.label === 'ct co -c "nombre.PTR: [comentario]" "nombre_fichero"') {
                vscode.commands.executeCommand('clearcase-buttons.ctCo');
            }
        }
    });
    // Comandos para Undo Checkout
    const ctUncoKeep = vscode.commands.registerCommand('clearcase-buttons.ctUncoKeep', async () => {
        const filePath = getPath();
        if (filePath) {
            const command = `ct unco -keep ${filePath}`;
            confirmAndRunCommand(command);
        }
        else {
            const file = await vscode.window.showInputBox({ prompt: 'Ingrese el nombre del fichero' });
            if (file) {
                const command = `ct unco -keep ${file}`;
                confirmAndRunCommand(command);
            }
        }
    });
    const ctUncoRm = vscode.commands.registerCommand('clearcase-buttons.ctUncoRm', async () => {
        const filePath = getPath();
        if (filePath) {
            const command = `ct unco -rm ${filePath}`;
            confirmAndRunCommand(command);
        }
        else {
            const file = await vscode.window.showInputBox({ prompt: 'Ingrese el nombre del fichero' });
            if (file) {
                const command = `ct unco -rm ${file}`;
                confirmAndRunCommand(command);
            }
        }
    });
    const quickPickUndoCheckout = vscode.commands.registerCommand('clearcase-buttons.quickPickUndoCheckout', async () => {
        const options = [
            { label: 'ct unco -keep nombre_fichero', description: 'Deshace el checkout y crea una copia con los cambios en un fichero .keep' },
            { label: 'ct unco -rm nombre_fichero', description: 'Deshace el checkout borrando los cambios' }
        ];
        const selection = await vscode.window.showQuickPick(options, { placeHolder: 'Seleccione una opción' });
        if (selection) {
            if (selection.label === 'ct unco -keep nombre_fichero') {
                vscode.commands.executeCommand('clearcase-buttons.ctUncoKeep');
            }
            else if (selection.label === 'ct unco -rm nombre_fichero') {
                vscode.commands.executeCommand('clearcase-buttons.ctUncoRm');
            }
        }
    });
    // Comandos para Checkin
    const ctCi = vscode.commands.registerCommand('clearcase-buttons.ctCi', async () => {
        const filePath = getPath();
        if (filePath) {
            const command = `ct ci -nc ${filePath}`;
            confirmAndRunCommand(command);
        }
        else {
            const file = await vscode.window.showInputBox({ prompt: 'Ingrese el nombre del fichero' });
            if (file) {
                const command = `ct ci -nc ${file}`;
                confirmAndRunCommand(command);
            }
        }
    });
    const iccCi = vscode.commands.registerCommand('clearcase-buttons.iccCi', async () => {
        const command = 'icc ci';
        const confirmation = await vscode.window.showWarningMessage(`Are you sure you want to run the command: "${command}"?`, { modal: true }, 'Yes', 'No');
        if (confirmation === 'Yes') {
            const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
            terminal.sendText(command);
            terminal.show();
        }
    });
    const quickPickCheckin = vscode.commands.registerCommand('clearcase-buttons.quickPickCheckin', async () => {
        const options = [
            { label: 'ct ci -nc "nombre_fichero"', description: 'Hacer checkin' },
            { label: 'icc ci', description: 'Hacer checkin con icc ci' }
        ];
        const selection = await vscode.window.showQuickPick(options, { placeHolder: 'Seleccione una opción' });
        if (selection) {
            if (selection.label === 'ct ci -nc "nombre_fichero"') {
                vscode.commands.executeCommand('clearcase-buttons.ctCi');
            }
            else if (selection.label === 'icc ci') {
                vscode.commands.executeCommand('clearcase-buttons.iccCi');
            }
        }
    });
    // Comandos para Labels
    const ctMklbtype = vscode.commands.registerCommand('clearcase-buttons.ctMklbtype', async () => {
        const comment = await vscode.window.showInputBox({ prompt: 'Ingrese el comentario' });
        const label = await vscode.window.showInputBox({ prompt: 'Ingrese el nombre de la etiqueta' });
        if (comment && label) {
            const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
            terminal.sendText(`ct mklbtype -pbr -c "${comment}" ${label}`);
            terminal.show();
        }
    });
    const ctMklabel = vscode.commands.registerCommand('clearcase-buttons.ctMklabel', async () => {
        const label = await vscode.window.showInputBox({ prompt: 'Ingrese el nombre de la etiqueta' });
        const filePath = getPath();
        if (filePath) {
            if (label) {
                const command = `ct mklabel ${label} ${filePath}`;
                confirmAndRunCommand(command);
            }
            else {
                vscode.window.showInformationMessage('No se ingresó una etiqueta.');
            }
        }
        else {
            const file = await vscode.window.showInputBox({ prompt: 'Ingrese el nombre del fichero' });
            if (file && label) {
                const command = `ct mklabel ${label} ${file}`;
                confirmAndRunCommand(command);
            }
            else {
                vscode.window.showInformationMessage('No hay ningún archivo seleccionado o no se ingresó un nombre de fichero.');
            }
        }
    });
    const ctRenameLabel = vscode.commands.registerCommand('clearcase-buttons.ctRenameLabel', async () => {
        const oldLabel = await vscode.window.showInputBox({ prompt: 'Ingrese el nombre de la etiqueta antigua' });
        const newLabel = await vscode.window.showInputBox({ prompt: 'Ingrese el nombre de la nueva etiqueta' });
        if (oldLabel && newLabel) {
            const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
            terminal.sendText(`ct rename lbtype:${oldLabel} ${newLabel}`);
            terminal.show();
        }
    });
    const quickPickLabels = vscode.commands.registerCommand('clearcase-buttons.quickPickLabels', async () => {
        const options = [
            { label: 'ct mklbtype -pbr -c "comentario" "nombre_de_etiqueta(ITC_...)"', description: 'Crear una etiqueta' },
            { label: 'ct mklabel "nombre_de_etiqueta" "nombre_fichero"', description: 'Asignar etiqueta a fichero' },
            { label: 'ct rename lbtype:antigua nueva', description: 'Renombrar etiqueta, hacer en cada vob afectado' }
        ];
        const selection = await vscode.window.showQuickPick(options, { placeHolder: 'Seleccione una opción' });
        if (selection) {
            if (selection.label === 'ct mklbtype -pbr -c "comentario" "nombre_de_etiqueta(ITC_...)"') {
                vscode.commands.executeCommand('clearcase-buttons.ctMklbtype');
            }
            else if (selection.label === 'ct mklabel "nombre_de_etiqueta" "nombre_fichero"') {
                vscode.commands.executeCommand('clearcase-buttons.ctMklabel');
            }
            else if (selection.label === 'ct rename lbtype:antigua nueva') {
                vscode.commands.executeCommand('clearcase-buttons.ctRenameLabel');
            }
        }
    });
    // Comandos para Merge
    const ctFindmergePrint = vscode.commands.registerCommand('clearcase-buttons.ctFindmergePrint', async () => {
        const version = await vscode.window.showInputBox({ prompt: 'Ingrese la versión' });
        const filePath = getPath();
        if (filePath) {
            if (version) {
                const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
                terminal.sendText(`ct findmerge ${filePath} -fver ${version} -print`);
                terminal.show();
            }
            else {
                vscode.window.showInformationMessage('No se ingresó una versión.');
            }
        }
        else {
            const file = await vscode.window.showInputBox({ prompt: 'Ingrese el nombre del fichero' });
            if (file && version) {
                const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
                terminal.sendText(`ct findmerge ${file} -fver ${version} -print`);
                terminal.show();
            }
            else {
                vscode.window.showInformationMessage('No hay ningún archivo seleccionado o no se ingresó un nombre de fichero.');
            }
        }
    });
    const ctFindmergeMerge = vscode.commands.registerCommand('clearcase-buttons.ctFindmergeMerge', async () => {
        const directory = await vscode.window.showInputBox({ prompt: 'Ingrese el directorio (use . para recursivo)' });
        const version = await vscode.window.showInputBox({ prompt: 'Ingrese la versión' });
        const comment = await vscode.window.showInputBox({ prompt: 'Ingrese el comentario' });
        const label = await vscode.window.showInputBox({ prompt: 'Ingrese el nombre de la etiqueta' });
        if (directory && version && comment && label) {
            const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
            terminal.sendText(`ct findmerge ${directory} -fver '${version}' -merge -gmerge -c '${comment}' -exec 'cleartool mklabel ${label} $CLEARCASE_PN'`);
            terminal.show();
        }
    });
    const ctFindmergeInsert = vscode.commands.registerCommand('clearcase-buttons.ctFindmergeInsert', async () => {
        const file = await vscode.window.showInputBox({ prompt: 'Ingrese el nombre del fichero' });
        const version = await vscode.window.showInputBox({ prompt: 'Ingrese la versión' });
        const comment = await vscode.window.showInputBox({ prompt: 'Ingrese el comentario' });
        const label = await vscode.window.showInputBox({ prompt: 'Ingrese el nombre de la etiqueta' });
        if (file && version && comment && label) {
            const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
            terminal.sendText(`ct findmerge ${file} -fver "${version}" -exec ' cleartool co -c "${comment}" $CLEARCASE_PN ;cleartool merge -ins -nar -graphical -to $CLEARCASE_PN $CLEARCASE_FXPN; cleartool mklabel ${label} $CLEARCASE_PN '`);
            terminal.show();
        }
    });
    const quickPickMerge = vscode.commands.registerCommand('clearcase-buttons.quickPickMerge', async () => {
        const options = [
            { label: 'ct findmerge "nombre_fichero" -fver .../dev_b9.3/LATEST -print', description: 'Pintar merges en caso de que haya' },
            { label: 'ct findmerge . -fver \'.../cp_itc_159320/LATEST\' -merge -gmerge -c \'rrvillanueva.CP: ITC#175992 Remove user management commands\' -exec \'cleartool mklabel ITC_175992 $CLEARCASE_PN\'', description: 'Hacer merge recursivo' },
            { label: 'ct findmerge "nombre_fichero" -fver "version" -exec \' cleartool co -c "comentario" $CLEARCASE_PN ;cleartool merge -ins -nar -graphical -to $CLEARCASE_PN $CLEARCASE_FXPN; cleartool mklabel "nombre_de_etiqueta" $CLEARCASE_PN \'', description: 'Merge insertivo' }
        ];
        const selection = await vscode.window.showQuickPick(options, { placeHolder: 'Seleccione una opción' });
        if (selection) {
            if (selection.label === 'ct findmerge "nombre_fichero" -fver .../dev_b9.3/LATEST -print') {
                vscode.commands.executeCommand('clearcase-buttons.ctFindmergePrint');
            }
            else if (selection.label === 'ct findmerge . -fver \'.../cp_itc_159320/LATEST\' -merge -gmerge -c \'rrvillanueva.CP: ITC#175992 Remove user management commands\' -exec \'cleartool mklabel ITC_175992 $CLEARCASE_PN\'') {
                vscode.commands.executeCommand('clearcase-buttons.ctFindmergeMerge');
            }
            else if (selection.label === 'ct findmerge "nombre_fichero" -fver "version" -exec \' cleartool co -c "comentario" $CLEARCASE_PN ;cleartool merge -ins -nar -graphical -to $CLEARCASE_PN $CLEARCASE_FXPN; cleartool mklabel "nombre_de_etiqueta" $CLEARCASE_PN \'') {
                vscode.commands.executeCommand('clearcase-buttons.ctFindmergeInsert');
            }
        }
    });
    const changeDirectory = vscode.commands.registerCommand('clearcase-buttons.changeDirectory', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const fileUri = editor.document.uri;
            const filePath = fileUri.fsPath;
            console.log("filePath", filePath);
            const directoryPath = path.dirname(filePath);
            console.log("directoryPath", directoryPath);
            const command = `cd "${directoryPath}"`;
            const terminal = vscode.window.activeTerminal || vscode.window.createTerminal(`Terminal`);
            terminal.sendText(command);
            terminal.show();
        }
        else {
            vscode.window.showInformationMessage('No hay ningún archivo seleccionado.');
        }
    });
    context.subscriptions.push(disposable, listFilesCommand, clearTerminalCommand, ctlsco, ctlscoVOB, quickPickWatchCheckout, iccDiff, iccLog, iccLogBranch, quickPickDifferencies, iccCo, ctCo, quickPickCheckout, ctUncoKeep, ctUncoRm, quickPickUndoCheckout, ctCi, iccCi, quickPickCheckin, ctMklbtype, ctMklabel, ctRenameLabel, quickPickLabels, ctFindmergePrint, ctFindmergeMerge, ctFindmergeInsert, quickPickMerge, changeDirectory);
    statusBar.addItem('|');
    statusBar.addItem('List File', 'clearcase-buttons.listFiles', 'List files (ls [extra params])');
    statusBar.addItem('|');
    statusBar.addItem('Watch Checkout', 'clearcase-buttons.quickPickWatchCheckout', 'List all commands for watching checkout files');
    statusBar.addItem('|');
    statusBar.addItem('Clear Terminal', 'clearcase-buttons.clearTerminal', 'Clear terminal');
    statusBar.addItem('|');
    statusBar.addItem('Differencies', 'clearcase-buttons.quickPickDifferencies', 'Diferenciar ficheros y ver historico');
    statusBar.addItem('|');
    statusBar.addItem('Checkout', 'clearcase-buttons.quickPickCheckout', 'Realizar checkout');
    statusBar.addItem('|');
    statusBar.addItem('Undo Checkout', 'clearcase-buttons.quickPickUndoCheckout', 'Deshacer checkout');
    statusBar.addItem('|');
    statusBar.addItem('Checkin', 'clearcase-buttons.quickPickCheckin', 'Realizar checkin');
    statusBar.addItem('|');
    statusBar.addItem('Labels', 'clearcase-buttons.quickPickLabels', 'Administrar etiquetas');
    statusBar.addItem('|');
    statusBar.addItem('Merge', 'clearcase-buttons.quickPickMerge', 'Realizar merge');
    statusBar.addItem('|');
    statusBar.addItem('CD', 'clearcase-buttons.changeDirectory', 'Cambiar de directorio');
    statusBar.addItem('|');
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension%20copy.js.map