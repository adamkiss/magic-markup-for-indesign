import { $ } from './utils.js'

/**
 * Responsible for UI and logic of the markers feature
 *
 * Unlike textareas, which return semi-parsed rules, this class returns final GREP rules
 */
export default class Checkbox {
	name = null
	toggled = false
	onChangeFn = null

	constructor({name, onChange}) {
		if (!name) throw new Error('Checkbox name is required')

		this.name = name

		this.$label = $(`sp-field-label[for="${name}-switch"] > sp-detail`);
		this.$toggle = $(`#${name}-switch`)

		this.$toggle.addEventListener('change', this.onToggle.bind(this))
		this.onChangeFn = onChange
	}

	onToggle() {
		// set the toggled state
		this.toggled = this.$toggle.checked
		this.$label.classList.toggle('disabled', !this.toggled)
		this.onChangeFn({[this.name]: this.toggled})
	}

	get value() {
		return {
			toggled: this.toggled,
		}
	}

	set value(value) {
		this.toggled = value
		this.$toggle.checked = value
		this.onToggle()
	}
}
