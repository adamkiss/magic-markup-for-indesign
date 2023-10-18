const {Application} = require('indesign')
import { $ } from "./utils"

/**
 * The core functionality of the plugin - apply the grep rules to a valid scope
 */
export default class RunButton extends EventTarget {
	$button = null

	constructor(plugin) {
		// setup
		super()
		this.plugin = plugin
		this.$button = $('#button-run')

		// attach event listeners
		this.plugin.scope.addEventListener('change', this.onScopeChange.bind(this))
		this.$button.addEventListener('click', this.dispatchClick.bind(this))

		// query initial state
		this.onScopeChange()
	}

	get disabled() {
		return this.$button.disabled
	}

	set disabled(value) {
		this.$button.disabled = value
	}

	onScopeChange() {
		this.$button.disabled = ! this.plugin.scope.isValid
	}

	dispatchClick() {
		this.dispatchEvent(new Event('click'))
	}
}
