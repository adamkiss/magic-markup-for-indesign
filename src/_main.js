const { entrypoints } = require("uxp");
const { app } = require("indesign");

import MagicMarkupPlugin from "./plugin";
let plugin;

entrypoints.setup({
	plugin: {
		async create() {
			plugin = new MagicMarkupPlugin(app);
		},
		async destroy() {
			plugin.destroy()
			plugin = null
		}
	},
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
