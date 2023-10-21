import cconsole from './cconsole';

const lfs = require('uxp').storage.localFileSystem;

export default class Storage {
	static DEFAULT_PRESETS = {
		'Default': {
			paragraph: {
				rules: [],
				raw: ''
			},
			character: {
				rules: [],
				raw: ''
			},
			markers: {
				rules: [],
				toggled: false,
				open: '[', close: ']',
			},
			'collapse-newlines': {
				rules: [],
				toggled: false,
			},
			'markdown-links': false,
			'raw-links': false,
		}
	}
	static DEFAULT_ACTIVE_PRESET = 'Default'

	intialized = false
	onChange = () => {}

	pluginDataFolder = null
	presetsFile = null
	activePresetFile = null

	presets = null

	constructor({
		presets,
		onLoad = _ => {},
		onChange = _ => {}
	}) {
		this.presets = presets
		this.onChange = onChange

		this.onChange(true)
		this.init(onLoad);
	}

	async init(onLoadCallback) {
		if (this.intialized) return

		this.pluginDataFolder = (await lfs.getDataFolder()).nativePath

		this.presetsFile = await lfs.createEntryWithUrl('plugin-data:/presets.json', {overwrite: true})
		let presets
		try { presets = await this.loadPresets() }
		catch (e) {
			cconsole.info('loading', 'Error loading presets, creating default')
			await this.savePresets(Storage.DEFAULT_PRESETS)
			presets = await this.loadPresets()
		}

		this.activePresetFile = await lfs.createEntryWithUrl('plugin-data:/active-preset.json', {overwrite: true})
		let activePreset
		try { activePreset = await this.loadActivePreset() }
		catch (e) {
			cconsole.info('loading', 'Error loading active preset, creating default')
			await this.saveActivePreset(Storage.DEFAULT_ACTIVE_PRESET)
			activePreset = await this.loadActivePreset()
		}

		this.intialized = true
		this.onChange(false)
		return onLoadCallback({presets, activePreset})
	}

	_emitWorking() {
		this.onChange(true)
	}
	_emitDone() {
		this.onChange(false)
	}

	async loadPresets() {
		this._emitWorking()
		const data = await this.presetsFile.read()
		const parsed = JSON.parse(data)
		this._emitDone()

		return parsed
	}

	async savePresets(presets) {
		this._emitWorking()
		const written = await this.presetsFile.write(JSON.stringify(presets, null, 2))
		this._emitDone()

		return written > 0
	}

	async loadActivePreset() {
		this._emitWorking()
		const data = await this.activePresetFile.read()
		const parsed = JSON.parse(data)
		this._emitDone()
		return parsed
	}

	async saveActivePreset(activePreset) {
		this._emitWorking()
		const written = await this.activePresetFile.write(JSON.stringify(activePreset))
		this._emitDone()
		return written > 0
	}

	async saveAll({presets, activePreset}) {
		await this.savePresets(presets)
		await this.saveActivePreset(activePreset)
	}
}
