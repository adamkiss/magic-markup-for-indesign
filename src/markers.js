import { $, $$, esc } from './utils.js'

/**
 * Responsible for UI and logic of the markers feature
 *
 * Unlike textareas, which return semi-parsed rules, this class returns final GREP rules
 */
export default class Markers {
	static CODES =
	{
		'Discretionary Hyphen': {
			char: '~-', code: 'dh',
			description: 'Invisible hyphen that only appears at the end of a line when the word breaks. Placed at the start of a word, it prevents the word from breaking.'
		},
		'Nonbreaking Hyphen': {
			char: '~~', code: 'nbh',
			description: 'Visible hyphen that prevents the word from breaking.'
		},
		'Flush Space': {
			char: '~f', code: 'fs',
			description: 'Grows to equal space for each flush space in paragraphs that are Fully Justified.'
		},
		'Hair Space': {
			char: '~|', code: 'hs',
			description: 'Hair space'
		},
		'Forced Line Break': {
			char: '\\n', code: 'flb',
			description: 'Forces a line break without breaking paragraph.'
		},
		'Column Break': {
			char: '~M', code: 'cb',
			description: 'Forces following text to begin in the next column.'
		},
		'Frame Break': {
			char: '~R', code: 'fb',
			description: 'Forces following text to begin in the next text frame.'
		},
		'Page Break': {
			char: '~P', code: 'pb',
			description: 'Forces following text to begin on the next page.'
		},
		'Tab': {
			char: '\\t', code: 'tab',
			description: 'Tab character'
		},
		'Right Indent Tab': {
			char: '~y', code: 'rit',
			description: 'Forces text beyond this marker to align to the right margin.'
		},
		'Indent to Here': {
			char: '~i', code: 'ith',
			description: 'Forces every following line in a paragraph to indent to the position of this marker.'
		},
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
