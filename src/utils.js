export function $ (selector) {
	return document.querySelector(selector)
}

export function $$ (selector) {
	return document.querySelectorAll(selector)
}

export function ensureParagraphStyles(document, names) {
	const paraStyles = document.paragraphStyles

	names.map(name => {
		const style = paraStyles.itemByName(name)
		if (! style.isValid) paraStyles.add({name})
	})
}

export function ensureCharacterStyles(document, names) {
	const charStyles = document.characterStyles

	names.map(name => {
		const style = charStyles.itemByName(name)
		if (! style.isValid) charStyles.add({name})
	})
}

export function resetGrepPreferences(app) {
	app.findGrepPreferences = null
	app.changeGrepPreferences = null
}
