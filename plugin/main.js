(() => {
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });

  // src/textarea.js
  var Textarea = class _Textarea {
    static MIN_HEIGHT = 5;
    constructor($element) {
      this.$ = $element;
      this.$.addEventListener("input", this.input.bind(this));
      this.$.addEventListener("keydown", this.keydown.bind(this));
      this.load();
      this.autosize();
    }
    input() {
      this.autosize();
      this.save();
    }
    keydown(event) {
      if (event.key === "v" && (event.ctrlKey || event.metaKey)) {
        setTimeout(this.input.bind(this), 0);
      }
      if (event.key === "Tab" && !event.shiftKey) {
        event.preventDefault();
        const start = this.$.selectionStart;
        const end = this.$.selectionEnd;
        const value = this.$.value;
        this.$.value = value.substring(0, start) + "	" + value.substring(end);
      }
    }
    autosize() {
      this.$.style.height = `calc(
			(var(--textarea-font-size) * (var(--textarea-line-height)))
				* ${Math.max(_Textarea.MIN_HEIGHT, this.lines.length)}
		)`;
    }
    get lines() {
      return (this.$.value || "").split("\n");
    }
    load() {
      this.$.value = localStorage.getItem(this.$.id) || "";
    }
    save() {
      localStorage.setItem(this.$.id, this.$.value);
    }
  };

  // src/selection-info.js
  var SelectionInfo = class {
    $el = null;
    app = null;
    listener = null;
    constructor(app2, debug = false) {
      this.app = app2;
      this.$el = document.querySelector("#selection-info");
      this.listener = this.app.addEventListener("afterSelectionChanged", this.update.bind(this));
      this.update();
    }
    update() {
      this.$el.innerHTML = this.app.selection.length ? `${this.app.selection.length}, first: ${this.app.selection[0].constructor.name}` : "Nothing selected";
    }
    destroy() {
      this.app.removeEventListener("afterSelectionChanged", this.listener);
    }
  };

  // src/plugin.js
  var { entrypoints, storage } = __require("uxp");
  var { app } = __require("indesign");
  var selectionInfo = new SelectionInfo(app);
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
})();
