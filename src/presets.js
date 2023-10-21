import { $ } from "./utils";

import Storage from "./storage";
import Textarea from "./textarea";
import Markers from "./markers";
import Checkbox from "./checkbox";
import CheckboxNewlines from "./checkbox-newlines";

/**
 * Manages presets, as well as preset configuration
 */
export default class Presets extends EventTarget {
	plugin = null
	storage = null

	reloading = false

	presets = null
	activePresetName = null

	$picker = null
	$paraStyles = null
	$charStyles = null

	constructor(plugin) {
		super()

		this.plugin = plugin

		this.$storageActive = $('#storage-active')
		this.onStorageLoaded = this.onStorageLoaded.bind(this)
		this.onStorageChange = this.onStorageChange.bind(this)
		this.storage = new Storage({
			presets: this,
			onLoad: this.onStorageLoaded,
			onChange: this.onStorageChange
		})

		this.$picker = $('#presets')
		this.$picker.addEventListener('change', this.onPickerChange.bind(this))

		this.$paraStyles = new Textarea({
			$element: $('#pstyles'),
			parseAsParagraphStyles: true,
			onChange: ({rules, raw}) => this.onPresetChanged('paragraph', {rules, raw})
		})
		this.$charStyles = new Textarea({
			$element: $('#cstyles'),
			parseAsParagraphStyles: false,
			onChange: ({rules, raw}) => this.onPresetChanged('character', {rules, raw})
		})
		this.markers = new Markers({
			onChange: ({markers}) => this.onPresetChanged('markers', markers)
		})
		this.collapseNewlines = new CheckboxNewlines({
			onChange: ({toggled, rules}) => this.onPresetChanged('collapse-newlines', {toggled, rules})
		})
		this.markdownLinks = new Checkbox({
			name: 'markdown-links',
			onChange: (newValue) => this.onPresetChanged('markdown-links', newValue['markdown-links'])
		})
		this.rawLinks = new Checkbox({
			name: 'raw-links',
			onChange: (newValue) => this.onPresetChanged('raw-links', newValue['raw-links'])
		})
	}

	onStorageLoaded({presets, activePreset}) {
		this.presets = presets
		this.activePreset = activePreset

		this.updatePresetSelect()
		this.updatePresetConfig()

		this.$picker.disabled = false
		this.plugin.loaded = true
		this.plugin.scope.onChange()
	}

	onStorageChange(active = false){
		this.$storageActive.textContent = active ? '…' : ' '
	}

	onPickerChange(e) {
		const value = e.target.value

		if (value === this.activePreset) return

		switch (e.target.value) {
			case '__command__delete':
				this.plugin.confirmDialog.show({
					title: 'Delete preset?',
					destructive: true,
					onSuccess: () => {
						this.deletePreset(this.activePreset)
					}
				})
				this.updatePresetSelect() // reset the picker
				break;
			case '__command__rename':
				this.plugin.promptDialog.show({
					title: "Rename the preset to:",
					input: this.activePreset,
					onSuccess: (val) => {
						this.renamePreset(this.activePreset, val)
					}
				})
				this.updatePresetSelect() // reset the picker
				break;
			case '__command__duplicate':
				this.plugin.promptDialog.show({
					title: "Duplicate the preset as:",
					input: this.activePreset + ' copy',
					onSuccess: (val) => {
						this.duplicatePreset(this.activePreset, val)
					}
				})
				this.updatePresetSelect() // reset the picker
				break;
			default:
				this.activePreset = value
		}
	}

	onPresetChanged(type, value) {
		if (this.reloading) return

		this.activeConfiguration[type] = value
		this.saveToStorage()

		// Force "scope change" to reenable the "Apply" button
		// This is a bit hacky
		this.plugin.scope.onChange()
	}

	get activeConfiguration() {
		return this.presets[this.activePreset]
	}

	get lastPreset() {
		const keys = Object.keys(this.presets)
		return keys[keys.length - 1]
	}

	get activePreset() {
		return this.activePresetName
	}

	set activePreset(name) {
		if (! (name in this.presets)) {
			this.activePreset = this.lastPreset
		}

		this.activePresetName = name
		this.storage.activePreset = name
		this.updatePresetSelect()
		this.updatePresetConfig()

		this.storage.saveActivePreset(this.activePresetName)
	}

	deletePreset(name) {
		// Shouldn't happen, but…
		if (name === 'Default') return

		delete this.presets[name]
		this.activePreset = this.lastPreset
		this.saveToStorage()
	}

	renamePreset(name, newName) {
		// Shouldn't happen, but…
		if (name === 'Default') return

		const preset = this.presets[name]
		this.presets[newName] = preset
		delete this.presets[name]

		this.activePreset = newName
		this.saveToStorage()
	}

	duplicatePreset(name, newName) {
		const preset = this.presets[name]
		this.presets[newName] = Object.assign({}, preset)

		this.activePreset = newName
		this.saveToStorage()
	}

	saveToStorage() {
		this.storage.saveAll({
			presets: this.presets,
			activePreset: this.activePreset
		})
	}

	_mi_preset(name) {
		return `
			<sp-menu-item value="${name}"${
				this.activePreset === name ? ' selected="selected"' : ''
			}>${name}</sp-menu-item>
		`;
	}

	_mi_divider() {
		return `<sp-menu-divider></sp-menu-divider>`;
	}

	_mi_command({command, text, disabled}) {
		return `
			<sp-menu-item value="__command__${command}"${
				disabled ? ' disabled="disabled"' : ''
			}>${text}</sp-menu-item>
		`;
	}

	updatePresetSelect() {
		const HTML = [
			...Object.keys(this.presets).map(this._mi_preset.bind(this)),

			this._mi_divider(),

			this._mi_command({
				command: 'rename',
				text: 'Rename preset',
				disabled: this.activePreset === 'Default'
			}),
			this._mi_command({
				command: 'duplicate',
				text: 'Duplicate preset'
			}),
			this._mi_command({
				command: 'delete',
				text: 'Delete preset',
				disabled: this.activePreset === 'Default'
			})
		].join('')
		this.$picker.querySelector('sp-menu').innerHTML = HTML
	}

	updatePresetConfig() {
		this.reloading

		this.$paraStyles.value = this.activeConfiguration.paragraph?.raw || ''
		this.$charStyles.value = this.activeConfiguration.character?.raw || ''
		this.markers.value = this.activeConfiguration.markers || {toggled: false, open: '<', close: '>'}
		this.collapseNewlines.value = this.activeConfiguration['collapse-newlines'] || {toggled: false, rules: []}
		this.markdownLinks.value = this.activeConfiguration['markdown-links'] || false
		this.rawLinks.value = this.activeConfiguration['raw-links'] || false

		this.reloading = false
	}
}
