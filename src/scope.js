const {Application, Document} = require('indesign')
import {$} from "./utils";

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
			// setTimeout(this.onChange, 500)
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

	/**
	 * Scope changed, validate and emit event
	 */
	onChange() {
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
		if (! [
			'TextFrame', 'Text', 'InsertionPoint', 'TextStyleRange', 'TextColumn'
		].includes(app.selection[0].constructor.name)) {
			this.scopeRoot = null
			this.scopeText = `${app.selection[0].constructor.name}: unsupported`
			return this.change()
		}

		// Set correct scope
		if (['Text', 'TextStyleRange'].includes(app.selection[0].constructor.name)) {
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
