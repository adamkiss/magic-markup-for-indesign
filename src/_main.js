const { entrypoints } = require("uxp");
const {app} = require("indesign");

import MicroMarkupPlugin from "./plugin";
const plugin = new MicroMarkupPlugin(app);

entrypoints.setup({
  panels: {
    microMarkup: {
      show(args) {
		plugin.showPanel();
      }
    }
  }
});
