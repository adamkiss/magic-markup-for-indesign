export default cconsole = {
	tags: [

	],

	_check(tag) {
		return this.tags.length && this.tags.includes(tag)
	},

	log(tag, ...args) {
		this._check(tag) && console.log(...args)
	},

	info(tag, ...args) {
		this._check(tag) && console.info(...args)
	},

	error(tag, ...args) {
		this._check(tag) && console.error(...args)
	},

	logAndPass(tag, ...args) {
		this._check(tag) && console.log(...args)

		return args[args.length - 1]
	},

	logAndTrue(tag, ...args) {
		this._check(tag) && console.log(...args)

		return true
	}
}
