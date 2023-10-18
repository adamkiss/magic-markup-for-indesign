import Textarea from "./textarea";
import {$, ensureParagraphStyles, ensureCharacterStyles} from "./utils";
import createMenuItem from "./menu-item";
import Scope from "./scope";
import ConfirmDialog from "./dialog-confirm";
import RunButton from "./button-run";
import Presets from "./presets";
import PromptDialog from "./dialog-prompt";

const {app, ScriptLanguage, UndoModes} = require("indesign");
const PLUGIN_NAME = '🪄 Magic Markup';

// The plugin class
class MagicMarkupPlugin {
	PRODUCTION = false

	textareas = {}
	app = null
	listeners = []

	scope = null
	runner = null
	presets = null

	rules = {
		paragraph: [],
		character: [],
		invisibles: []
	}

	constructor(app) {
		this.app = app
		this.scope = new Scope(this)
		this.runButton = new RunButton(this)
		this.presets = new Presets(this)

		this.confirmDialog = new ConfirmDialog()
		this.promptDialog = new PromptDialog()

		this.textareas.pstyles = new Textarea($('#pstyles'))
		this.textareas.cstyles = new Textarea($('#cstyles'), false)

		// Add event listeners
		this.runButton.addEventListener('click', this.actionRun.bind(this))

		// Add a menu item (?) to be targeted by a script 🙄
		createMenuItem({
			app,
			pluginName: PLUGIN_NAME,
			menuItemName: '✨ Apply Magic Markup',
			invokeCallback: this.actionRun.bind(this)
		})

		// Fire of initial scope change
		// this.onScopeChange()
	}

	destroy() {
		console.log('destroying plugin')
	}

	showPanel() {}

	actionRun(agreedToDocumentMagic = false) {
		// Shouldn't happen, but…
		if (! this.app.activeDocument) return
		if (! this.scope) return

		if (this.scope.isDocument && agreedToDocumentMagic !== true) {
			return this.confirmDialog.show({
				title: 'Whole document selected!',
				body: 'Are you sure you want to apply Magic Markup to the whole document?',
				onSuccess: () => this.actionRun(true)
			})
		}

		this.buttonRun.disabled = true

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
				this.app.findGrepPreferences = null;
				this.app.findGrepPreferences.properties = findPrefs;
				this.app.changeGrepPreferences = null;
				this.app.changeGrepPreferences.properties = changePrefs;
				this.scope.changeGrep();
			}
			this.app.findGrepPreferences = null;
			this.app.changeGrepPreferences = null;

		}, ScriptLanguage.UXPSCRIPT, [], UndoModes.ENTIRE_SCRIPT, 'Micro Markup to styles');

		this.buttonRun.disabled = false
	}
}

// Create a new instance of the plugin
new MagicMarkupPlugin(app)
