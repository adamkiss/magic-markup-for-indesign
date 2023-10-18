const {Application} = require('indesign')
import { $ } from "./utils";


/**
 * Manages presets, as well as preset configuration
 */
export default class Presets extends EventTarget {
	plugin = null

	presets = {
		'Default': {
			paragraph: [],
			character: [],
			invisibles: []
		}
	}
	activePreset = 'Default'

	constructor(plugin) {
		super()

		this.plugin = plugin
		this.$picker = $('#presets')

		this.$picker.addEventListener('change', this.onPickerChange.bind(this))

		// update preset list and enable
		this.updatePresetSelect()
		this.$picker.disabled = false
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
				this.activatePreset(value)
		}
	}

	get lastPreset() {
		const keys = Object.keys(this.presets)
		return keys[keys.length - 1]
	}

	deletePreset(name) {
		// Shouldn't happen, but…
		if (name === 'Default') return

		delete this.presets[name]
		this.activatePreset(this.lastPreset)
	}

	renamePreset(name, newName) {
		// Shouldn't happen, but…
		if (name === 'Default') return

		const preset = this.presets[name]
		this.presets[newName] = preset
		delete this.presets[name]

		this.activatePreset(newName)
	}

	duplicatePreset(name, newName) {
		const preset = this.presets[name]
		this.presets[newName] = Object.assign({}, preset)
		this.activatePreset(newName)
	}

	activatePreset(name) {
		this.activePreset = name
		this.updatePresetSelect()
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
}
