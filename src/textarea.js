export default class Textarea {
	static MIN_HEIGHT = 5
	static MATCHER_SINGLE = /^(.+):\s*(.+)$/
	static MATCHER_BEGIN_END = /^(.+):(.+):\s*(.+)$/

	paragraphStyles = true
	$ = null
	document = null

	rules = []

	constructor($element, paragraphStyles = true) {
		this.$ = $element
		this.paragraphStyles = paragraphStyles

		this.$.addEventListener('input', this.input.bind(this))
		this.$.addEventListener('keydown', this.keydown.bind(this))

		this.load()
		this.autosize()
	}

	parse() {
		this.rules = this.paragraphStyles
			? this.parseParagraphStyles()
			: this.parseCharacterStyles()
	}

	parseCharacterStyles() {
		const rules = []
		for (const line of this.lines) {
			if (!line.trim()) continue
			if (!line.includes(':')) continue

			if (line.match(Textarea.MATCHER_BEGIN_END)) {
				const [begin, end, value] = line.match(Textarea.MATCHER_BEGIN_END).slice(1)
				rules.push({find: `${begin}(.*?)${end}`, style: value.trim()})
			} else if (line.match(Textarea.MATCHER_SINGLE)) {
				const [key, value] = line.match(Textarea.MATCHER_SINGLE).slice(1)
				rules.push({find: `${key}(.*?)${key}`, style: value.trim()})
			}
		}
		return rules
	}

	parseParagraphStyles() {
		const rules = []
		for (const line of this.lines) {
			if (! line.match(Textarea.MATCHER_SINGLE)) continue

			const [key, value] = line.match(Textarea.MATCHER_SINGLE).slice(1)
			rules.push({find: `^${key}(.*?)\$`, style: value.trim()})
		}
		return rules
	}

	input() {
		this.autosize()
		this.parse()
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
		this.parse()
	}

	save() {
		localStorage.setItem(this.$.id, this.$.value)
	}
}
