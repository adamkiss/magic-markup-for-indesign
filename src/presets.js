const {Application} = require('indesign')

import Storage from "./storage";
import { $ } from "./utils";

/**
 * Manages presets, as well as preset configuration
 */
export default class Presets extends EventTarget {
	plugin = null
	storage = null

	presets = null
	activePresetName = null

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
	}

	onStorageLoaded({presets, activePreset}) {
		this.presets = presets
		this.activePreset = activePreset

		this.updatePresetSelect()

		this.$picker.disabled = false
		this.plugin.loaded = true
	}

	onStorageChange(active = false){
		this.$storageActive.textContent = active ? ' …' : ''
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

	get lastPreset() {
		const keys = Object.keys(this.presets)
		return keys[keys.length - 1]
	}

	get activePreset() {
		return this.activePresetName
	}
	set activePreset(name) {
		this.activePresetName = name
		this.storage.activePreset = name
		this.updatePresetSelect()

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
}
