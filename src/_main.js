const { entrypoints } = require("uxp");
const { app } = require("indesign");

import MagicMarkupPlugin from "./plugin";
const plugin = new MagicMarkupPlugin(app);

console.log(app)

entrypoints.setup({
	/** Also removed from manifest.json
	{
		"type": "command",
		"id": "applyMagic",
		"description": "Apply Magic Markup to selection",
		"label": " ✨ Apply Magic Markup"
	},
	 */
	// commands: {
	// 	applyMagic: plugin.actionRun.bind(plugin)
	// },
	panels: {
		magicMarkup: {
			show(args) {
				plugin.showPanel();
			}
		}
	}
});
