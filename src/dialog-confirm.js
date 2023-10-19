import { $ } from "./utils";

/**
 * Responsible for wiring up the confirm dialog for magic application over the whole active document
 */
export default class ConfirmDialog extends EventTarget {
	onSuccessFn = null
	successListener = null
	cancelListener = null

	constructor() {
		super()

		this.$dialog = $('dialog#confirm')
		this.$title = this.$dialog.querySelector('sp-heading')
		this.$body = this.$dialog.querySelector('#confirm-body')
		this.$buttonConfirm = this.$dialog.querySelector('sp-button[action="confirm"]')
		this.$buttonCancel = this.$dialog.querySelector('sp-button[action="cancel"]')

		this.confirm = this.confirm.bind(this)
		this.close = this.close.bind(this)
	}

	show({
		title = '',
		body = '',
		destructive = false,
		onSuccess = null
	}) {
		this.onSuccessFn = onSuccess

		this.$title.innerHTML = title
		this.$body.innerHTML = `<sp-body>${body}</sp-body>`
		// "negative" is current Spectrum name for "warning". Not yet supported
		// this.$buttonConfirm.setAttribute('variant', destructive ? 'negative' : 'cta')
		this.$buttonConfirm.setAttribute('variant', destructive ? 'warning' : 'cta')

		this.$buttonConfirm.addEventListener('click', this.confirm)
		this.$buttonCancel.addEventListener('click', this.close)

		this.$dialog.showModal()
		this.$dialog.focus() // Does nothing currently
	}

	confirm() {
		this.onSuccessFn()
		this.close()
	}

	close() {
		// reset dialog
		this.onSuccessFn = null
		this.$buttonConfirm.removeEventListener('click', this.confirm)
		this.$buttonCancel.removeEventListener('click', this.close)

		// close the dialog
		this.$dialog.close()
	}
}
