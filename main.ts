import { App, Plugin, TFile } from 'obsidian';

export default class DailyNoteRollover extends Plugin {
	app: App;

	constructor(app: App, pluginId: string) {
		super(app, pluginId);
		this.app = app;
	}

	async onload(): Promise<void> {
		console.log('DailyNoteRollover plugin loaded.');
		this.app.workspace.on('layout-ready', () => this.initialize());
	}

	async initialize(): Promise<void> {
		console.log('DailyNoteRollover plugin initialized.');

		// Debug
		console.log('Initializing rollover');

		const dailyNotesPlugin = this.app.plugins.getPlugin('daily-notes');
		let dateFormat: string = 'YYYY-MM-DD';
		if (dailyNotesPlugin) {
			dateFormat = dailyNotesPlugin.options.format;
		}
		const yesterday: string = window.moment().subtract(1, 'days').format(dateFormat);
		const today: string = window.moment().format(dateFormat);

		let todayNote: TFile | null = this.app.vault.getAbstractFileByPath(`Daily/${today}.md`);
		if (todayNote) {
			console.log("Today's note already exists. Skipping rollover.");
			return;
		}

		let yesterNote: TFile | null = this.app.vault.getAbstractFileByPath(`Daily/${yesterday}.md`);
		console.log(`Yesterday's note exists: ${yesterNote ? 'Yes' : 'No'}`);

		// Debug
		console.log('yesterNote', yesterNote);

		let yesterContent: string = yesterNote ? await this.app.vault.read(yesterNote) : '';

		// Debug
		console.log('yesterContent', yesterContent);

		const lines: string[] = yesterContent.split('\n');
		let filteredContent: string = '';
		let skip = false;
		let skipLevel = 0; // New variable to keep track of indents to skip

		for (const line of lines) {
			const indentLevel = line.search(/\S/); // Gets the indent level by finding the index of the first non-whitespace character

			if (line.startsWith("- [x]")) {
				skip = true;
				skipLevel = indentLevel;
			} else if (indentLevel <= skipLevel) {
				skip = false;
			}

			if (!skip) {
				filteredContent += line + '\n';
			}
		}

		// Debug
		console.log('filteredContent', filteredContent);

		// let todayNote: TFile | null = this.app.vault.getAbstractFileByPath(`Daily/${today}.md`);
		if (!todayNote) {
			await this.app.vault.create(`Daily/${today}.md`, '');
			todayNote = this.app.vault.getAbstractFileByPath(`Daily/${today}.md`);
		}

		// Debug
		console.log('todayNote', todayNote);

		if (todayNote) {
			await this.app.vault.modify(todayNote, filteredContent);
		}
	}

}
