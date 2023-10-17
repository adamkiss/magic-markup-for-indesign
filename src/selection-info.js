export default class SelectionInfo {
	$el = null
	app = null
	listener = null

	constructor(app, debug = false) {
		this.app = app
		this.$el = document.querySelector('#selection-info')

		this.listener = this.app.addEventListener('afterSelectionChanged', this.update.bind(this))
		this.update()
	}

	update() {
		this.$el.innerHTML = this.app.selection.length
			? `${this.app.selection.length}, first: ${this.app.selection[0].constructor.name}`
			: 'Nothing selected'
	}

	destroy() {
		this.app.removeEventListener('afterSelectionChanged', this.listener)
	}
}
