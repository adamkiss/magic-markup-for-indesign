import Checkbox from './checkbox.js'

export default class CheckboxNewlines extends Checkbox {
	get value() {
		return {
			toggled: this.toggled,
			rules: this.toggled
				? [{findWhat: '\\r+'}, {changeTo: '\\r'}]
				: []
		}
	}

	set value({toggled}) {
		this.toggled = toggled
		this.$toggle.checked = toggled
		this.onToggle()
	}
}
