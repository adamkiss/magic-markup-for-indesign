import Textarea from "./textarea";
import {$, ensureParagraphStyles, ensureCharacterStyles} from "./utils";

const {ScriptLanguage, UndoModes} = require("indesign");

const PLUGIN_NAME = '🪄 Magic Markup';

export default class MagicMarkupPlugin {
	$els = {}
	textareas = {}
	app = null

	document = null
	scope = null
	scopeText = 'unknown'

	constructor(app) {
		this.app = app

		// Get elements
		this.$els = {
			scopeDetail: $('sp-detail#scope'),
			runButton: $('#button-run'),
		}
		this.textareas.pstyles = new Textarea($('#pstyles'))
		this.textareas.cstyles = new Textarea($('#cstyles'), false)

		// Add event listeners
		this.app.addEventListener('afterSelectionChanged', this.listenerSelectionChanged.bind(this))
		this.app.addEventListener("afterContextChanged", this.listenerAfterContextChanged.bind(this));
		this.$els.runButton.addEventListener('click', this.actionRun.bind(this))

		// Add a menu item (?) to be targeted by a script 🙄
		this.createAndAddMenuItem()

		// Fire off context change
		this.listenerAfterContextChanged()
	}

	createAndAddMenuItem() {
		try {
			const pluginMenu = this.app
				.menus.item('Main')
				.submenus.item('Plug-Ins')
				.submenus.item(PLUGIN_NAME)

			const existingMenuItem = pluginMenu.menuItems.itemByName("✨ Apply Magic Markup");
			// existingMenuItem.remove()
			// ^ Keep if debugging/developing

			if (! existingMenuItem.isValid) {
				this.menuItem = this.app.scriptMenuActions.add("✨ Apply Magic Markup")
				this.menuItem.addEventListener('onInvoke', this.actionRun.bind(this));
				pluginMenu.menuItems.add(this.menuItem)
			}
		} catch (error) {
			// Swallow the error
			console.error(error)
		}
	}

	showPanel() {
		this.updateScope()
	}

	listenerSelectionChanged() {
		this.updateScope()
	}

	listenerAfterContextChanged() {
		this.updateScope()
	}

	updateScope() {
		if (this.app.documents.length === 0) {
			this.scope = null
			this.scopeText = 'invalid'
			return this.updateScopeUI()
		}

		if (this.app.selection.length === 0) {
			this.scope = this.app.activeDocument
			this.scopeText = 'document'
			return this.updateScopeUI()
		}

		if (this.app.selection.length > 1) {
			this.scope = null
			this.scopeText = 'multiple (unsupported)'
			return this.updateScopeUI()
		}

		// discard unsupport selection types
		if (! [
			'TextFrame', 'Text', 'InsertionPoint', 'TextStyleRange', 'TextColumn'
		].includes(this.app.selection[0].constructor.name)) {
			this.scope = null
			this.scopeText = `${this.app.selection[0].constructor.name} (unsupported)`
			return this.updateScopeUI()
		}

		// Set correct scope
		if (['Text', 'TextStyleRange'].includes(this.app.selection[0].constructor.name)) {
			this.scope = this.app.selection[0]
			this.scopeText = 'selected text'
			return this.updateScopeUI()
		}

		this.scope = this.app.selection[0].parentStory
		this.scopeText = 'selected story'
		return this.updateScopeUI()
	}

	updateScopeUI() {
		this.setRunButtonDisabled(! this.scope)
		this.$els.scopeDetail.innerHTML = `scope<br>${this.scopeText}`.toUpperCase()
	}

	setRunButtonDisabled(disabled = true) {
		this.$els.runButton.disabled = disabled
	}

	actionRun() {
		// Shouldn't happen, but…
		if (! this.app.activeDocument) return
		if (! this.scope) return

		this.setRunButtonDisabled(true)

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

		this.setRunButtonDisabled(false)
	}
}
