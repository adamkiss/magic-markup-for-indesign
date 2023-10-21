const {Document} = require('indesign')
import {$, isSelectionOneOf} from "./utils";

/**
 * Responsible for resolving and maintaining the scope of the plugin,
 * as well as running the core functionality of the plugin.
 */
export default class Scope extends EventTarget {
	plugin = null

	scopeRoot = null
	scopeText = '…';

	constructor(plugin) {
		super()
		this.plugin = plugin
		this.$ui = $('#scope')

		this.onChange = this.onChange.bind(this)

		// Reloading plugin with event listeners crashes InDesign
		// so in development we'll just poll for changes
		if (this.plugin.PRODUCTION === true) {
			this.plugin.app.addEventListener('afterSelectionChanged', this.onChange)
			this.plugin.app.addEventListener("afterContextChanged", this.onChange)
		} else {
			setInterval(this.onChange, 500)
		}

		// detect initial scope
		this.onChange()
	}

	/**
	 * Return scope text formatted for display
	 */
	get text() {
		return `SCOPE<br>${this.scopeText.toUpperCase()}`
	}

	/**
	 * Return validity of scope
	 */
	get isValid() {
		return this.scopeRoot !== null
	}

	get isDocument() {
		return this.scopeRoot instanceof Document
	}

	get grepTargets() {
		return Array.isArray(this.scopeRoot)
			? this.scopeRoot.map(item => item.parentStory || null).filter(item => item !== null)
			: [this.scopeRoot]
	}

	get hyperlinkTargets() {
		const scopes = this.scopeRoot instanceof Document
			? scopeRoot.stories.everyItem().getElements()
			: (Array.isArray(this.scopeRoot)
				? this.scopeRoot
				: [this.scopeRoot]
			)
		return scopes
	}

	/**
	 * Scope changed, validate and emit event
	 */
	onChange() {
		if (!this.plugin.loaded) return

		const app = this.plugin.app

		if (app.documents.length === 0) {
			this.scopeRoot = null
			this.scopeText = 'invalid'
			return this.change()
		}

		if (app.selection.length === 0) {
			this.scopeRoot = app.activeDocument
			this.scopeText = 'document'
			return this.change()
		}

		if (app.selection.length > 1) {
			this.scopeRoot = app.selection
			this.scopeText = 'multiple objects'
			return this.change()
		}

		// discard unsupport selection types
		if (!isSelectionOneOf(app.selection[0], 'TextFrame', 'Text', 'Paragraph', 'InsertionPoint', 'TextStyleRange', 'TextColumn')) {
			this.scopeRoot = null
			this.scopeText = `${app.selection[0].constructor.name}: unsupported`
			return this.change()
		}

		if (isSelectionOneOf(app.selection[0], 'TextColumn')) {
			// We convert TextColumn to Text because it's easier to work with
			// I can't create TextColumn with multiple texts, so until bug report is filed
			// we'll just use the first text of the column
			this.scopeRoot = app.selection[0].texts.item(0)
			this.scopeText = 'text (column)'
			return this.change()
		}

		// Set correct scope
		if (isSelectionOneOf(app.selection[0], 'Text', 'TextStyleRange', 'Paragraph')) {
			this.scopeRoot = app.selection[0]
			this.scopeText = 'selected text'
			return this.change()
		}

		this.scopeRoot = app.selection[0].parentStory
		this.scopeText = 'selected story'
		return this.change()
	}

	/**
	 * Emit scope change event
	 */
	change() {
		this.$ui.innerHTML = this.text
		this.dispatchEvent(new Event('change'));
	}
}
