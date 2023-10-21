import {
	$, RegularExpressions,
	itemByNameOrAdd, ensureParagraphStyles, ensureCharacterStyles, resetGrepPreferences,
	createMenuItem, cleanUpMenuItems, isSelectionOneOf,
} from "./utils";

import Scope from "./scope";
import Presets from "./presets";

import RunButton from "./button-run";
import ConfirmDialog from "./dialog-confirm";
import PromptDialog from "./dialog-prompt";
import Markers from "./markers";

const {app, ScriptLanguage, UndoModes, Document} = require("indesign");
const {shell, entrypoints} = require('uxp');
const PLUGIN_NAME = '🌈 Magic Markup';
const PLUGIN_VERSION = require('uxp').versions.plugin;

// The plugin class
class MagicMarkupPlugin {
	PRODUCTION = false
	loaded = false

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
		$('#test-hyperlinks').addEventListener('click', this.testHyperlinks.bind(this))

		// Add a menu item (?) to be targeted by a script 🙄
		cleanUpMenuItems({app, currentPluginName: PLUGIN_NAME})
		createMenuItem({
			app,
			pluginName: PLUGIN_NAME,
			menuItemName: '✨ Apply Magic Markup',
			invokeCallback: this.applyMagic.bind(this)
		})

		// HELP/INFO
		this.setupInfo()
	}

	destroy() {}
	showPanel() {}

	setupInfo() {
		// info/help
		$('#info .version').textContent = `🌈 v${PLUGIN_VERSION}`
		$('#info .help').addEventListener('click', async _ => {
			await shell.openExternal('https://github.com/adamkiss/magic-markup-for-indesign#readme')
		})

		// cheatsheet
		const $markerTemplate = $('#cheatsheet-marker-template')
		for (const markerName in Markers.CODES) {
			const marker = Markers.CODES[markerName]
			const $marker = $markerTemplate.cloneNode(true)

			$marker.removeAttribute('id')
			if (marker.code === 'dh') {
				$marker.classList.add('double')
			}
			$marker.querySelector('.marker-name').innerHTML = `${markerName}
				<span class="font-normal"><code>[${marker.code}]</code> or <code>[${marker.char}]</code></span>
			`
			$marker.querySelector('.marker-description').textContent = marker.description
			$markerTemplate.parentNode.appendChild($marker)

		}
		$markerTemplate.remove()

		$('#info .cheatsheet').addEventListener('click', _ => {
			$('#cheatsheet-plugin-data-folder').value = this.presets.storage.pluginDataFolder
			$('dialog[id^="cheatsheet-"]').showModal()
		})
	}

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
		const config = this.presets.activeConfiguration

		ensureParagraphStyles(this.app.activeDocument, config.paragraph.map(rule => rule.style))
		ensureCharacterStyles(this.app.activeDocument, config.character.map(rule => rule.style))

		const greps = []
		for (const rule of config.paragraph) {
			greps.push([
				{findWhat: rule.find},
				{changeTo: '$1', appliedParagraphStyle: rule.style},
			]);
		}
		for (const rule of config.character) {
			greps.push([
				{findWhat: rule.find},
				{changeTo: '$1', appliedCharacterStyle: rule.style},
			]);
		}
		if (config.markers?.rules?.length) {
			greps.push(...config.markers.rules);
		}

		this.app.doScript(() => {
			// Run all the GREP rules
			for (const [findPrefs, changePrefs] of greps) {
				resetGrepPreferences(this.app);

				this.app.findGrepPreferences.properties = findPrefs;
				this.app.changeGrepPreferences.properties = changePrefs;

				for (const target of this.scope.grepTargets) {
					target.changeGrep();
				}
			}
			resetGrepPreferences(this.app);

			// Replace all the hyperlinks if turned on
			// WIP

		}, ScriptLanguage.UXPSCRIPT, [], UndoModes.ENTIRE_SCRIPT, 'Magic Markup: Apply');

		this.runButton.disabled = false
	}

	_replaceTextWithHyperlink({doc, root, index, replace, text, url, style}) {
		// get or create destination
		const destination = itemByNameOrAdd(doc.hyperlinkURLDestinations, url, {name: url})

		// remove original text
		root.characters.itemByRange(index, index + replace.length - 2).remove()

		// Find insertion point: either at the end of the root, or at the index
		const insertAt = root.contents.length === index
			? root.insertionPoints.lastItem()
			: root.characters.item(index)

		// insert new text, and create InDesign Objects out of it
		insertAt.contents = text
		const textSourceCharacters = root.characters.itemByRange(index, index + text.length - 1)
		const source = doc.hyperlinkTextSources.add(textSourceCharacters)

		// apply style
		textSourceCharacters.applyCharacterStyle(style)

		// get unique hyperlink name
		let name = text
		let counter = 2
		while(doc.hyperlinks.itemByName(name).isValid) {
			name = `${text} ${counter++}`
		}

		// finally: create hyperlink
		doc.hyperlinks.add(source, destination, {name})
	}

	testHyperlinks() {
		const doc = this.app.activeDocument
		const {scopeRoot} = this.scope
		const scopes = scopeRoot instanceof Document
			? scopeRoot.stories.everyItem().getElements()
			: (Array.isArray(scopeRoot) ? scopeRoot : [scopeRoot])

		this.app.doScript(() => {

			ensureCharacterStyles(doc, ['Hyperlink'])
			const hyperlinkStyle = doc.characterStyles.itemByName('Hyperlink')

			scopes.forEach(root => {

				const isSelection = isSelectionOneOf(root, 'Text', 'Paragraph', 'TextStyleRange')

				console.log(root.index, root.length)

				let regexpMatch = null
				while ((regexpMatch = RegularExpressions.markdownLink.exec(root.contents)) !== null) {
					const {index, 0: match, groups: {text, url}} = regexpMatch

					try {
						this._replaceTextWithHyperlink({
							doc,
							root: isSelection ? root.parent : root,
							index: isSelection ? index + root.index : index,
							replace: match, text, url,
							style: hyperlinkStyle
						})
					} catch (error) {
						// Show the error for debugging, but continue with the execution
						// The most probable error: the selection is already a link
						// We don't want to stop the execution because of this
						console.error(error)
					}

					// If we're working over selection, and first match occured at index 0
					// Indesign won't update the selection to include the new hyperlink
					// We need to adjust the selection manually
					if (isSelection && index === 0) {
						const {index: newIndex, length: newLength} = root

						// reset the selection to <replaced text> + "new selection"
						// note: the second part says "length", but it's actually the "end index",
						// so by adding the length to index before adjustment,
						// we're actually increasing the "length" of the selection
						root.parent.characters.itemByRange(
							-(text.length - 1) + newIndex , // <- shift index forward,
							                     newIndex + newLength - 1 // <- and of range stays the same
						).select()
						root = this.app.selection[0]
					}
				}

				let pureRegexpMatch = null
				while ((pureRegexpMatch = RegularExpressions.urlLink.exec(root.contents)) !== null) {
					const {index, 0: match, groups: {url}} = pureRegexpMatch

					// Capture original selection index & length size
					// Indesign updates the selection if the contents change,
					// but raw .contents actually didn't change.
					const {index: originalIndex, length: originalLength} = root

					try {
						this._replaceTextWithHyperlink({
							doc,
							root: isSelection ? root.parent : root,
							index: isSelection ? index + root.index : index,
							replace: match, text: url, url,
							style: hyperlinkStyle
						})
					} catch (error) {
						// Show the error for debugging, but continue with the execution
						// The most probable error: the selection is already a link
						// We don't want to stop the execution because of this
						// The end result is working link anyway
						console.error(error)
					}

					if (isSelection) {
						// Reset the selection to before the hyperlink creation
						root.parent.characters.itemByRange(originalIndex, originalIndex + originalLength - 1).select()
						root = this.app.selection[0]
					}
				}
			});

		}, ScriptLanguage.UXPSCRIPT, [], UndoModes.ENTIRE_SCRIPT, 'Magic Markup: Apply');
	}
}

// Create a new instance of the plugin
new MagicMarkupPlugin(app)

entrypoints.setup({
	commands: {
		applyMagic: () => {
			console.log('applyMagic')
		}
	}
});
