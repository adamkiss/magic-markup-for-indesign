import { $, $$ } from './utils.js'

export default class Invisibles extends EventTarget {
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
		super()

		this.$labels = $$('sp-field-label[for^="invisibles-"] > sp-detail');
		this.$toggle = $('#invisibles-switch')
		this.$inputOpen = $('#invisibles-open')
		this.$inputClose = $('#invisibles-close')

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

		this.onChangeFn({invisibles: this.value})
	}

	onCharacterChanged() {
		this.onChangeFn({invisibles: this.value})
	}

	get value() {
		return {
			toggled: this.toggled,
			open: this.$inputOpen.value,
			close: this.$inputClose.value
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
