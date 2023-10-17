import Textarea from "./textarea";
import SelectionInfo from "./selection-info";

export default class App {
	selectionInfo = null
	textareas = []

	constructor(app, debug = false) {
		this.selectionInfo = new SelectionInfo(app, debug)
	}

	showPanel() {
		// append textareas
		for (const ta of document.querySelectorAll("textarea")) {
			this.textareas.push(new Textarea(ta));
		}

		// append Destroy button
	}

	actionDestroy() {
		this.selectionInfo.destroy()
	}
}
