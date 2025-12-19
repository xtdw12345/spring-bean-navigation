// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { BeanIndexer } from './spring-bean-navigation/indexer/beanIndexer';
import { SpringBeanDefinitionProvider } from './spring-bean-navigation/providers/definitionProvider';
import { ProjectDetector } from './spring-bean-navigation/utils/projectDetector';

let beanIndexer: BeanIndexer | undefined;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	console.log('[Happy Java] Extension activating...');

	// Check if we have workspace folders
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		console.log('[Happy Java] No workspace folders found, skipping Spring Bean navigation setup');
		return;
	}

	// Detect Spring Boot projects
	const projectDetector = new ProjectDetector();
	let hasSpringProject = false;

	for (const folder of workspaceFolders) {
		if (await projectDetector.isSpringProject(folder)) {
			hasSpringProject = true;
			console.log(`[Happy Java] Spring Boot project detected in ${folder.name}`);
			break;
		}
	}

	if (!hasSpringProject) {
		console.log('[Happy Java] No Spring Boot projects detected, skipping Bean indexing');
		return;
	}

	// Initialize Bean Indexer
	console.log('[Happy Java] Initializing Bean Indexer...');
	beanIndexer = new BeanIndexer();
	await beanIndexer.initialize(context, Array.from(workspaceFolders));

	// Try to load cached index
	const cacheLoaded = await beanIndexer.loadFromPersistentStorage();
	if (!cacheLoaded) {
		// Build full index in background
		console.log('[Happy Java] Building Bean index...');
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: 'Happy Java',
			cancellable: false
		}, async (progress) => {
			progress.report({ message: 'Indexing Spring Beans...' });
			const count = await beanIndexer!.buildFullIndex(true);
			console.log(`[Happy Java] Indexed ${count} Spring Beans`);
			return;
		});
	} else {
		const stats = beanIndexer.getStats();
		console.log(`[Happy Java] Loaded ${stats.totalBeans} beans from cache`);
	}

	// Register Definition Provider for Java files
	const definitionProvider = new SpringBeanDefinitionProvider(beanIndexer);
	const providerDisposable = vscode.languages.registerDefinitionProvider(
		{ language: 'java', scheme: 'file' },
		definitionProvider
	);
	context.subscriptions.push(providerDisposable);
	console.log('[Happy Java] Definition Provider registered for Java files');

	// Register command for manual index rebuild
	const rebuildCommand = vscode.commands.registerCommand('happy-java.rebuildIndex', async () => {
		if (beanIndexer) {
			vscode.window.showInformationMessage('Rebuilding Spring Bean index...');
			const count = await beanIndexer.buildFullIndex(true);
			vscode.window.showInformationMessage(`Indexed ${count} Spring Beans`);
		}
	});
	context.subscriptions.push(rebuildCommand);

	// Save index on deactivation
	context.subscriptions.push({
		dispose: async () => {
			if (beanIndexer) {
				await beanIndexer.saveToPersistentStorage();
				beanIndexer.dispose();
			}
		}
	});

	// Keep original hello command
	const disposable = vscode.commands.registerCommand('happy-java.happyJava', () => {
		vscode.window.showInformationMessage('Hello World from happy-java!');
	});
	context.subscriptions.push(disposable);

	console.log('[Happy Java] Extension activated successfully');
}

// This method is called when your extension is deactivated
export function deactivate() {}
