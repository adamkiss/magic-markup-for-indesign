export default class Textarea {
	static MIN_HEIGHT = 5
	static MATCHER_SINGLE = /^(.+):\s*(.+)$/
	static MATCHER_BEGIN_END = /^(.+):(.+):\s*(.+)$/

	$ = null
	parseAsParagraphStyles = true
	debounce = null

	constructor({
		$element,
		parseAsParagraphStyles = true,
		onChange = () => {}
	}) {
		this.$ = $element
		this.parseAsParagraphStyles = parseAsParagraphStyles

		this.$.addEventListener('input', this.input.bind(this))
		this.$.addEventListener('keydown', this.keydown.bind(this))
		this.onChange = onChange
	}

	parse() {
		if (! this.$.value) return

		const rules = this.parseAsParagraphStyles
			? this.parseParagraphStyles()
			: this.parseCharacterStyles()

		this.onChange({rules, raw: this.value})
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
		clearTimeout(this.debounce)
		this.debounce = setTimeout(_ => {
			this.autosize()
			this.parse()
		}, 1000)
	}

	keydown(event) {
		// refresh on paste
		if (event.key === 'v' && (event.ctrlKey || event.metaKey)) {
			setTimeout(this.input.bind(this), 0)
		}
	}

	autosize() {
		this.$.style.height = `calc(
			(var(--textarea-font-size) * (var(--textarea-line-height)))
				* ${Math.max(Textarea.MIN_HEIGHT, this.lines.length) + 1}
		)`;
	}

	get lines() {
		return this.value.split('\n')
	}

	get value() {
		return this.$.value || ''
	}

	set value(value) {
		this.$.value = value
		this.autosize()
	}
}
