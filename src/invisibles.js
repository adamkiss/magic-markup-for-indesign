import { $, $$ } from './utils.js'


export default class Invisibles extends EventTarget {
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
			$label.classList.toggle('low-opacity', !this.toggled)
		}

		this.onChangeFn({invisibles: this.value})
	}

	onCharacterChanged() {
		this.onChangeFn({invisibles: this.value})
	}

	get value() {
		console.log(this.$inputOpen.value, this.$inputClose.value)
		return {
			toggled: this.toggled,
			open: this.$inputOpen.value,
			close: this.$inputClose.value
		}
	}

	set value({toggled, open, close}) {
		console.log(this.$inputOpen.value, this.$inputClose.value)

		this.toggled = toggled
		this.$toggle.checked = toggled
		this.$inputOpen.value = open
		this.$inputClose.value = close
		this.onToggle()
	}
}
