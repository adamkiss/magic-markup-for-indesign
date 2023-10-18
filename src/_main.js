const { entrypoints } = require("uxp");
const {app} = require("indesign");

import MagicMarkupPlugin from "./plugin";
const plugin = new MagicMarkupPlugin(app);

entrypoints.setup({
  panels: {
    magicMarkup: {
      show(args) {
		plugin.showPanel();
      }
    }
  }
});
