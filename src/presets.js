const {Application} = require('indesign')
import { $ } from "./utils";


/**
 * Manages presets, as well as preset configuration
 */
export default class Presets extends EventTarget {
	plugin = null

	presets = [
		{
			name: 'Default',
			paragraph: [],
			character: [],
			invisibles: []
		},
		{
			name: 'Another',
			paragraph: [],
			character: [],
			invisibles: []
		}
	]
	activePreset = 'Default'

	constructor(plugin) {
		super()

		this.plugin = plugin
		this.$picker = $('#presets')

		// update preset list and enable
		this.updatePresetList()
		this.$picker.disabled = false
	}

	_presetToMenuItem(preset) {
		return `
			<sp-menu-item value="${
				preset.name
			}"${
				this.activePreset === preset.name ? ' selected="selected"' : ''
			}>${preset.name}</sp-menu-item>
		`;
	}

	updatePresetList() {
		this.$picker.querySelector('sp-menu').innerHTML = `
		${
			this.presets.map(p => this._presetToMenuItem(p)).join('')
		}
		<sp-menu-divider></sp-menu-divider>
		<sp-menu-item id="preset-rename" ${this.activePreset === 'Default' ? 'disabled':''}>Rename preset</sp-menu-item>
		<sp-menu-item id="preset-duplicate">Duplicate preset</sp-menu-item>
		<sp-menu-item id="preset-delete" ${this.activePreset === 'Default' ? 'disabled':''}>Delete preset</sp-menu-item>
		`;
		this.$picker.setAttribute('value', this.activePreset)
		console.log(this.$picker.value)
	}
}
