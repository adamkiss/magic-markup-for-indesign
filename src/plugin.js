const { entrypoints, storage } = require("uxp");
const { app } = require("indesign");
import Textarea from "./textarea";
import SelectionInfo from "./selection-info";

const selectionInfo = new SelectionInfo(app)

// app.addEventListener("afterContextChanged", event => console.log("afterContextChanged", event.target));
// console.log(uxp, xmp, uxp.host);
entrypoints.setup({
  panels: {
    microMarkup: {
      show(args) {
		for (const ta of document.querySelectorAll("textarea")) {
		  new Textarea(ta);
		}
      }
    }
  }
});
