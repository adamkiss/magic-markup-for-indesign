import {$, ensureParagraphStyles, ensureCharacterStyles, resetGrepPreferences} from "./utils";
import createMenuItem from "./menu-item";

import Scope from "./scope";
import Presets from "./presets";

import RunButton from "./button-run";
import ConfirmDialog from "./dialog-confirm";
import PromptDialog from "./dialog-prompt";

const {app, ScriptLanguage, UndoModes} = require("indesign");
const {shell} = require('uxp');
const PLUGIN_NAME = '🪄 Magic Markup';
const PLUGIN_VERSION = require('uxp').versions.plugin;

// The plugin class
class MagicMarkupPlugin {
	PRODUCTION = false
	loading = true

	textareas = {}
	app = null
	listeners = []

	scope = null
	runner = null
	presets = null

	constructor(app) {
		this.app = app
		this.scope = new Scope(this)
		this.runButton = new RunButton(this)
		this.presets = new Presets(this)

		this.confirmDialog = new ConfirmDialog()
		this.promptDialog = new PromptDialog()

		this.applyMagic = this.applyMagic.bind(this)

		// Add event listeners
		this.runButton.addEventListener('click', this.applyMagic)

		// Add a menu item (?) to be targeted by a script 🙄
		createMenuItem({
			app,
			pluginName: PLUGIN_NAME,
			menuItemName: '✨ Apply Magic Markup',
			invokeCallback: this.applyMagic.bind(this)
		})

		// Readme/version info
		$('#info .name').textContent = `${PLUGIN_NAME} v${PLUGIN_VERSION}`
		$('#info .help').addEventListener('click', async _ => {
			await shell.openExternal('https://github.com/adamkiss/magic-markup-for-indesign#readme')
		})
	}

	destroy() {}
	showPanel() {}

	applyMagic({wholeDocument = false}) {
		// Shouldn't happen, but…
		if (! this.app.activeDocument) return
		if (! this.scope) return

		if (this.scope.isDocument && wholeDocument !== true) {
			return this.confirmDialog.show({
				title: 'Whole document selected!',
				body: 'Are you sure you want to apply Magic Markup to the whole document?',
				onSuccess: () => this.applyMagic({wholeDocument: true})
			})
		}

		this.runButton.disabled = true

		ensureParagraphStyles(this.app.activeDocument, this.textareas.pstyles.rules.map(rule => rule.style))
		ensureCharacterStyles(this.app.activeDocument, this.textareas.cstyles.rules.map(rule => rule.style))

		const greps = []
		for (const rule of this.textareas.pstyles.rules) {
			greps.push([
				{findWhat: rule.find},
				{changeTo: '$1', appliedParagraphStyle: rule.style},
			]);
		}
		for (const rule of this.textareas.cstyles.rules) {
			greps.push([
				{findWhat: rule.find},
				{changeTo: '$1', appliedCharacterStyle: rule.style},
			]);
		}

		this.app.doScript(() => {
			for (const [findPrefs, changePrefs] of greps) {
				resetGrepPreferences(this.app);

				this.app.findGrepPreferences.properties = findPrefs;
				this.app.changeGrepPreferences.properties = changePrefs;

				for (const target of this.scope.grepTargets) {
					target.changeGrep();
				}
			}

			resetGrepPreferences(this.app);

		}, ScriptLanguage.UXPSCRIPT, [], UndoModes.ENTIRE_SCRIPT, 'Magic Markup: Apply');

		this.runButton.disabled = false
	}
}

// Create a new instance of the plugin
new MagicMarkupPlugin(app)
