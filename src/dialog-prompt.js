import { $ } from "./utils";

/**
 * Responsible for wiring up the confirm dialog for magic application over the whole active document
 */
export default class PromptDialog extends EventTarget {
	onSuccessFn = null
	successListener = null
	cancelListener = null

	constructor() {
		super()

		this.$dialog = $('dialog#prompt')
		this.$title = this.$dialog.querySelector('sp-heading')
		this.$input = this.$dialog.querySelector('#prompt-input')
		this.$buttonConfirm = this.$dialog.querySelector('sp-button[action="confirm"]')
		this.$buttonCancel = this.$dialog.querySelector('sp-button[action="cancel"]')

		this.confirm = this.confirm.bind(this)
		this.close = this.close.bind(this)
		this.confirmByEnter = this.confirmByEnter.bind(this)
	}

	show({
		title = '',
		input = '',
		destructive = false,
		onSuccess = null
	}) {
		this.onSuccessFn = onSuccess
		this.$title.innerHTML = title
		this.$input.setAttribute('value', input)

		this.$buttonConfirm.setAttribute('variant', destructive ? 'negative' : 'cta')

		this.$buttonConfirm.addEventListener('click', this.confirm)
		this.$buttonCancel.addEventListener('click', this.close)
		this.$input.addEventListener('keydown', this.confirmByEnter)

		this.$dialog.showModal()
		setTimeout(() => {
			this.$input.focus()
		}, 100);
	}

	confirmByEnter(e) {
		if (e.key === 'Enter') {
			this.confirm()
		}
	}

	confirm() {
		this.onSuccessFn(this.$input.value || '')
		this.close()
	}

	close() {
		// reset dialog
		this.onSuccessFn = null
		this.$buttonConfirm.removeEventListener('click', this.confirm)
		this.$buttonCancel.removeEventListener('click', this.close)
		this.$input.removeEventListener('keydown', this.confirmByEnter)

		// close the dialog
		this.$dialog.close()
	}
}
