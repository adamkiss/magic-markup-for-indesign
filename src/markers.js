import { $, $$, esc } from './utils.js'

/**
 * Responsible for UI and logic of the markers feature
 *
 * Unlike textareas, which return semi-parsed rules, this class returns final GREP rules
 */
export default class Markers {
	static CODES =
	{
		'Discretionary Hyphen': {char: '~-', code: 'dh'},
		'Nonbreaking Hyphen': {char: '~~', code: 'nbh'},
		'Flush Space': {char: '~f', code: 'fs'},
		'Hair Space': {char: '~|', code: 'hs'},
		'Forced Line Break': {char: '\\n', code: 'flb'},
		'Column Break': {char: '~M', code: 'cb'},
		'Frame Break': {char: '~R', code: 'fb'},
		'Page Break': {char: '~P', code: 'pb'},
		'Tab': {char: '\\t', code: 'tab'},
		'Right Indent Tab': {char: '~y', code: 'rit'},
		'Indent to Here': {char: '~i', code: 'ith'},
	}

	toggled = false
	onChangeFn = null

	constructor({onChange}) {
		this.$labels = $$('sp-field-label[for^="markers-"] > sp-detail');
		this.$toggle = $('#markers-switch')
		this.$inputOpen = $('#markers-open')
		this.$inputClose = $('#markers-close')

		this.$toggle.addEventListener('change', this.onToggle.bind(this))
		this.$inputOpen.addEventListener('input', this.onCharacterChanged.bind(this))
		this.$inputClose.addEventListener('input', this.onCharacterChanged.bind(this))
		this.onChangeFn = onChange
	}

	onToggle() {
		// set the toggled state
		this.toggled = this.$toggle.checked

		// update the UI
		this.$inputOpen.disabled = !this.toggled
		this.$inputClose.disabled = !this.toggled
		for (const $label of this.$labels) {
			$label.classList.toggle('disabled', !this.toggled)
		}

		this.onChangeFn({markers: this.value})
	}

	onCharacterChanged() {
		this.onChangeFn({markers: this.value})
	}

	get	open() { return this.$inputOpen.value }
	get	close() { return this.$inputClose.value }

	get rules() {
		if (this.toggled !== true || !(this.open || this.close)) return []

		const op = esc(this.open || '')
		const cl = esc(this.close || '')

		return Object.keys(Markers.CODES).map(key => {
			const {char, code} = Markers.CODES[key]
			return [
				{findWhat: `${op}(?:${esc(char)}|${code})${cl}`},
				{changeTo: char}
			]
		})
	}


	get value() {
		return {
			toggled: this.toggled,
			open: this.open,
			close: this.close,
			rules: this.rules
		}
	}

	set value({toggled, open, close}) {
		this.toggled = toggled
		this.$toggle.checked = toggled
		this.$inputOpen.value = open
		this.$inputClose.value = close
		this.onToggle()
	}
}
