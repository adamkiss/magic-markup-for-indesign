import Checkbox from './checkbox.js'

export default class CheckboxNewlines extends Checkbox {
	constructor({onChange}) {
		super({name: 'collapse-newlines', onChange})
	}

	onToggle() {
		// set the toggled state
		this.toggled = this.$toggle.checked
		this.$label.classList.toggle('disabled', !this.toggled)
		this.onChangeFn(this.value)
	}

	get value() {
		return {
			toggled: this.toggled,
			rules: this.toggled
				? [ [{findWhat: '\\r+'}, {changeTo: '\\r'}] ]
				: []
		}
	}

	set value({toggled}) {
		this.toggled = toggled
		this.$toggle.checked = toggled
		this.onToggle()
	}
}
