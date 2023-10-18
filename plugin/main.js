(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // src/textarea.js
  var _Textarea = class _Textarea {
    constructor($element, paragraphStyles = true) {
      __publicField(this, "paragraphStyles", true);
      __publicField(this, "$", null);
      __publicField(this, "document", null);
      __publicField(this, "rules", []);
      this.$ = $element;
      this.paragraphStyles = paragraphStyles;
      this.$.addEventListener("input", this.input.bind(this));
      this.$.addEventListener("keydown", this.keydown.bind(this));
      this.load();
      this.autosize();
    }
    parse() {
      this.rules = this.paragraphStyles ? this.parseParagraphStyles() : this.parseCharacterStyles();
    }
    parseCharacterStyles() {
      const rules = [];
      for (const line of this.lines) {
        if (!line.trim())
          continue;
        if (!line.includes(":"))
          continue;
        if (line.match(_Textarea.MATCHER_BEGIN_END)) {
          const [begin, end, value] = line.match(_Textarea.MATCHER_BEGIN_END).slice(1);
          rules.push({ find: `${begin}(.*?)${end}`, style: value.trim() });
        } else if (line.match(_Textarea.MATCHER_SINGLE)) {
          const [key, value] = line.match(_Textarea.MATCHER_SINGLE).slice(1);
          rules.push({ find: `${key}(.*?)${key}`, style: value.trim() });
        }
      }
      return rules;
    }
    parseParagraphStyles() {
      const rules = [];
      for (const line of this.lines) {
        if (!line.match(_Textarea.MATCHER_SINGLE))
          continue;
        const [key, value] = line.match(_Textarea.MATCHER_SINGLE).slice(1);
        rules.push({ find: `^${key}(.*?)$`, style: value.trim() });
      }
      return rules;
    }
    input() {
      this.autosize();
      this.parse();
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
      this.parse();
    }
    save() {
      localStorage.setItem(this.$.id, this.$.value);
    }
  };
  __publicField(_Textarea, "MIN_HEIGHT", 5);
  __publicField(_Textarea, "MATCHER_SINGLE", /^(.+):\s*(.+)$/);
  __publicField(_Textarea, "MATCHER_BEGIN_END", /^(.+):(.+):\s*(.+)$/);
  var Textarea = _Textarea;

  // src/utils.js
  function $(selector) {
    return document.querySelector(selector);
  }
  function ensureParagraphStyles(document2, names) {
    const paraStyles = document2.paragraphStyles;
    names.map((name) => {
      const style = paraStyles.itemByName(name);
      if (!style.isValid)
        paraStyles.add({ name });
    });
  }
  function ensureCharacterStyles(document2, names) {
    const charStyles = document2.characterStyles;
    names.map((name) => {
      const style = charStyles.itemByName(name);
      if (!style.isValid)
        charStyles.add({ name });
    });
  }

  // src/plugin.js
  var { ScriptLanguage, UndoModes } = __require("indesign");
  var MicroMarkupPlugin = class {
    constructor(app2) {
      __publicField(this, "$els", {});
      __publicField(this, "textareas", {});
      __publicField(this, "app", null);
      __publicField(this, "document", null);
      __publicField(this, "scope", null);
      __publicField(this, "scopeText", "unknown");
      this.app = app2;
      this.$els = {
        scopeDetail: $("sp-detail#scope"),
        runButton: $("#button-run")
      };
      this.textareas.pstyles = new Textarea($("#pstyles"));
      this.textareas.cstyles = new Textarea($("#cstyles"), false);
      this.app.addEventListener("afterSelectionChanged", this.listenerSelectionChanged.bind(this));
      this.app.addEventListener("afterContextChanged", this.listenerAfterContextChanged.bind(this));
      this.$els.runButton.addEventListener("click", this.actionRun.bind(this));
      this.listenerAfterContextChanged();
    }
    showPanel() {
      this.updateScope();
    }
    listenerSelectionChanged() {
      this.updateScope();
    }
    listenerAfterContextChanged() {
      this.updateScope();
    }
    updateScope() {
      if (this.app.documents.length === 0) {
        this.scope = null;
        this.scopeText = "invalid";
        return this.updateScopeUI();
      }
      if (this.app.selection.length === 0) {
        this.scope = this.app.activeDocument;
        this.scopeText = "document";
        return this.updateScopeUI();
      }
      if (this.app.selection.length > 1) {
        this.scope = null;
        this.scopeText = "multiple (unsupported)";
        return this.updateScopeUI();
      }
      if (![
        "TextFrame",
        "Text",
        "InsertionPoint",
        "TextStyleRange",
        "TextColumn"
      ].includes(this.app.selection[0].constructor.name)) {
        this.scope = null;
        this.scopeText = `${this.app.selection[0].constructor.name} (unsupported)`;
        return this.updateScopeUI();
      }
      if (["Text", "TextStyleRange"].includes(this.app.selection[0].constructor.name)) {
        this.scope = this.app.selection[0];
        this.scopeText = "selected text";
        return this.updateScopeUI();
      }
      this.scope = this.app.selection[0].parentStory;
      this.scopeText = "selected story";
      return this.updateScopeUI();
    }
    updateScopeUI() {
      this.setRunButtonDisabled(!this.scope);
      this.$els.scopeDetail.innerHTML = `scope<br>${this.scopeText}`.toUpperCase();
    }
    setRunButtonDisabled(disabled = true) {
      this.$els.runButton.disabled = disabled;
    }
    actionRun() {
      if (!this.app.activeDocument)
        return;
      if (!this.scope)
        return;
      this.setRunButtonDisabled(true);
      ensureParagraphStyles(this.app.activeDocument, this.textareas.pstyles.rules.map((rule) => rule.style));
      ensureCharacterStyles(this.app.activeDocument, this.textareas.cstyles.rules.map((rule) => rule.style));
      const greps = [];
      for (const rule of this.textareas.pstyles.rules) {
        greps.push([
          { findWhat: rule.find },
          { changeTo: "$1", appliedParagraphStyle: rule.style }
        ]);
      }
      for (const rule of this.textareas.cstyles.rules) {
        greps.push([
          { findWhat: rule.find },
          { changeTo: "$1", appliedCharacterStyle: rule.style }
        ]);
      }
      this.app.doScript(() => {
        for (const [findPrefs, changePrefs] of greps) {
          this.app.findGrepPreferences = null;
          this.app.findGrepPreferences.properties = findPrefs;
          this.app.changeGrepPreferences = null;
          this.app.changeGrepPreferences.properties = changePrefs;
          this.scope.changeGrep();
        }
        this.app.findGrepPreferences = null;
        this.app.changeGrepPreferences = null;
      }, ScriptLanguage.UXPSCRIPT, [], UndoModes.ENTIRE_SCRIPT, "Micro Markup to styles");
      this.setRunButtonDisabled(false);
    }
  };

  // src/_main.js
  var { entrypoints } = __require("uxp");
  var { app } = __require("indesign");
  var plugin = new MicroMarkupPlugin(app);
  entrypoints.setup({
    panels: {
      microMarkup: {
        show(args) {
          plugin.showPanel();
        }
      }
    }
  });
})();
