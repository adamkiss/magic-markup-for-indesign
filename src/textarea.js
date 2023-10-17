export default class Textarea {
	static MIN_HEIGHT = 5

	constructor($element) {
		this.$ = $element

		this.$.addEventListener('input', this.input.bind(this))
		this.$.addEventListener('keydown', this.keydown.bind(this))

		this.load()
		this.autosize()
	}

	input() {
		this.autosize()
		this.save()
	}

	keydown(event) {
		// refresh on paste
		if (event.key === 'v' && (event.ctrlKey || event.metaKey)) {
			setTimeout(this.input.bind(this), 0)
		}

		// capture tab and add it to textarea
		if (event.key === 'Tab' && !event.shiftKey) {
			event.preventDefault()
			const start = this.$.selectionStart
			const end = this.$.selectionEnd
			const value = this.$.value
			this.$.value = value.substring(0, start) + '\t' + value.substring(end)
		}
	}

	autosize() {
		this.$.style.height = `calc(
			(var(--textarea-font-size) * (var(--textarea-line-height)))
				* ${Math.max(Textarea.MIN_HEIGHT, this.lines.length)}
		)`;
	}

	get lines() {
		return (this.$.value || '').split('\n')
	}

	load() {
		this.$.value = localStorage.getItem(this.$.id) || ''
	}

	save() {
		localStorage.setItem(this.$.id, this.$.value)
	}
}
