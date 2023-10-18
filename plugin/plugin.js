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
    static MATCHER_SINGLE = /^(.+):\s*(.+)$/;
    static MATCHER_BEGIN_END = /^(.+):(.+):\s*(.+)$/;
    paragraphStyles = true;
    $ = null;
    document = null;
    rules = [];
    constructor($element, paragraphStyles = true) {
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

  // src/menu-item.js
  function createMenuItem({
    app: app2,
    pluginName,
    menuItemName,
    invokeCallback
  }) {
    try {
      const pluginMenu = app2.menus.item("Main").submenus.item("Plug-Ins").submenus.item(pluginName);
      const existingMenuItem = pluginMenu.menuItems.itemByName(menuItemName);
      if (existingMenuItem.isValid) {
        existingMenuItem.remove();
      }
      if (!existingMenuItem.isValid) {
        const menuItem = app2.scriptMenuActions.add(menuItemName);
        menuItem.addEventListener("onInvoke", invokeCallback);
        pluginMenu.menuItems.add(menuItem);
      }
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  // src/scope.js
  var { Application, Document } = __require("indesign");
  var Scope = class extends EventTarget {
    plugin = null;
    scopeRoot = null;
    scopeText = "\u2026";
    constructor(plugin) {
      super();
      this.plugin = plugin;
      this.$ui = $("#scope");
      this.onChange = this.onChange.bind(this);
      if (this.plugin.PRODUCTION === true) {
        this.plugin.app.addEventListener("afterSelectionChanged", this.onChange);
        this.plugin.app.addEventListener("afterContextChanged", this.onChange);
      } else {
      }
      this.onChange();
    }
    /**
     * Return scope text formatted for display
     */
    get text() {
      return `SCOPE<br>${this.scopeText.toUpperCase()}`;
    }
    /**
     * Return validity of scope
     */
    get isValid() {
      return this.scopeRoot !== null;
    }
    get isDocument() {
      return this.scopeRoot instanceof Document;
    }
    /**
     * Scope changed, validate and emit event
     */
    onChange() {
      const app2 = this.plugin.app;
      if (app2.documents.length === 0) {
        this.scopeRoot = null;
        this.scopeText = "invalid";
        return this.change();
      }
      if (app2.selection.length === 0) {
        this.scopeRoot = app2.activeDocument;
        this.scopeText = "document";
        return this.change();
      }
      if (app2.selection.length > 1) {
        this.scopeRoot = app2.selection;
        this.scopeText = "multiple objects";
        return this.change();
      }
      if (![
        "TextFrame",
        "Text",
        "InsertionPoint",
        "TextStyleRange",
        "TextColumn"
      ].includes(app2.selection[0].constructor.name)) {
        this.scopeRoot = null;
        this.scopeText = `${app2.selection[0].constructor.name}: unsupported`;
        return this.change();
      }
      if (["Text", "TextStyleRange"].includes(app2.selection[0].constructor.name)) {
        this.scopeRoot = app2.selection[0];
        this.scopeText = "selected text";
        return this.change();
      }
      this.scopeRoot = app2.selection[0].parentStory;
      this.scopeText = "selected story";
      return this.change();
    }
    /**
     * Emit scope change event
     */
    change() {
      this.$ui.innerHTML = this.text;
      this.dispatchEvent(new Event("change"));
    }
  };

  // src/dialog-confirm.js
  var ConfirmDialog = class extends EventTarget {
    onSuccessFn = null;
    successListener = null;
    cancelListener = null;
    constructor() {
      super();
      this.$dialog = $("dialog#confirm");
      this.$title = this.$dialog.querySelector("sp-heading");
      this.$body = this.$dialog.querySelector("#confirm-body");
      this.$buttonConfirm = this.$dialog.querySelector('sp-button[action="confirm"]');
      this.$buttonCancel = this.$dialog.querySelector('sp-button[action="cancel"]');
      this.confirm = this.confirm.bind(this);
      this.close = this.close.bind(this);
    }
    show({
      title = "",
      body = "",
      destructive = false,
      onSuccess = null
    }) {
      this.onSuccessFn = onSuccess;
      this.$title.innerHTML = title;
      this.$body.innerHTML = `<sp-body>${body}</sp-body>`;
      this.$buttonConfirm.setAttribute("variant", destructive ? "negative" : "cta");
      this.$buttonConfirm.addEventListener("click", this.confirm);
      this.$buttonCancel.addEventListener("click", this.close);
      this.$dialog.showModal();
      this.$dialog.focus();
    }
    confirm() {
      this.onSuccessFn();
      this.close();
    }
    close() {
      this.onSuccessFn = null;
      this.$buttonConfirm.removeEventListener("click", this.confirm);
      this.$buttonCancel.removeEventListener("click", this.close);
      this.$dialog.close();
    }
  };

  // src/button-run.js
  var { Application: Application2 } = __require("indesign");
  var RunButton = class extends EventTarget {
    $button = null;
    constructor(plugin) {
      super();
      this.plugin = plugin;
      this.$button = $("#button-run");
      this.plugin.scope.addEventListener("change", this.onScopeChange.bind(this));
      this.$button.addEventListener("click", this.dispatchClick.bind(this));
      this.onScopeChange();
    }
    get disabled() {
      return this.$button.disabled;
    }
    set disabled(value) {
      this.$button.disabled = value;
    }
    onScopeChange() {
      this.$button.disabled = !this.plugin.scope.isValid;
    }
    dispatchClick() {
      this.dispatchEvent(new Event("click"));
    }
  };

  // src/presets.js
  var { Application: Application3 } = __require("indesign");
  var Presets = class extends EventTarget {
    plugin = null;
    presets = [
      {
        name: "Default",
        paragraph: [],
        character: [],
        invisibles: []
      },
      {
        name: "Another",
        paragraph: [],
        character: [],
        invisibles: []
      }
    ];
    activePreset = "Default";
    constructor(plugin) {
      super();
      this.plugin = plugin;
      this.$picker = $("#presets");
      this.updatePresetList();
      this.$picker.disabled = false;
    }
    _presetToMenuItem(preset) {
      return `
			<sp-menu-item value="${preset.name}"${this.activePreset === preset.name ? ' selected="selected"' : ""}>${preset.name}</sp-menu-item>
		`;
    }
    updatePresetList() {
      this.$picker.querySelector("sp-menu").innerHTML = `
		${this.presets.map((p) => this._presetToMenuItem(p)).join("")}
		<sp-menu-divider></sp-menu-divider>
		<sp-menu-item id="preset-rename" ${this.activePreset === "Default" ? "disabled" : ""}>Rename preset</sp-menu-item>
		<sp-menu-item id="preset-duplicate">Duplicate preset</sp-menu-item>
		<sp-menu-item id="preset-delete" ${this.activePreset === "Default" ? "disabled" : ""}>Delete preset</sp-menu-item>
		`;
      this.$picker.setAttribute("value", this.activePreset);
      console.log(this.$picker.value);
    }
  };

  // src/dialog-prompt.js
  var PromptDialog = class extends EventTarget {
    onSuccessFn = null;
    successListener = null;
    cancelListener = null;
    constructor() {
      super();
      this.$dialog = $("dialog#prompt");
      this.$title = this.$dialog.querySelector("sp-heading");
      this.$input = this.$dialog.querySelector("dialog#prompt");
      this.$buttonConfirm = this.$dialog.querySelector('sp-button[action="confirm"]');
      this.$buttonCancel = this.$dialog.querySelector('sp-button[action="cancel"]');
      this.confirm = this.confirm.bind(this);
      this.close = this.close.bind(this);
    }
    show({
      title = "",
      input = "",
      destructive = false,
      onSuccess = null
    }) {
      this.$title.innerHTML = title;
      this.$buttonConfirm.setAttribute("variant", destructive ? "negative" : "cta");
      this.$buttonConfirm.addEventListener("click", this.confirm);
      this.$buttonCancel.addEventListener("click", this.close);
      this.$dialog.showModal();
      this.$input.focus();
    }
    confirm() {
      this.onSuccessFn(this.$input.value || "");
      this.close();
    }
    close() {
      this.onSuccessFn = null;
      this.$buttonConfirm.removeEventListener("click", this.confirm);
      this.$buttonCancel.removeEventListener("click", this.close);
      this.$dialog.close();
    }
  };

  // src/plugin.js
  var { app, ScriptLanguage, UndoModes } = __require("indesign");
  var PLUGIN_NAME = "\u{1FA84} Magic Markup";
  var MagicMarkupPlugin = class {
    PRODUCTION = false;
    textareas = {};
    app = null;
    listeners = [];
    scope = null;
    runner = null;
    presets = null;
    rules = {
      paragraph: [],
      character: [],
      invisibles: []
    };
    constructor(app2) {
      this.app = app2;
      this.scope = new Scope(this);
      this.runButton = new RunButton(this);
      this.presets = new Presets(this);
      this.confirmDialog = new ConfirmDialog();
      this.promptDialog = new PromptDialog();
      this.textareas.pstyles = new Textarea($("#pstyles"));
      this.textareas.cstyles = new Textarea($("#cstyles"), false);
      this.runButton.addEventListener("click", this.actionRun.bind(this));
      $("#test").addEventListener("click", (_) => this.promptDialog.show({
        title: "Rename the preset to:",
        input: "New preset name",
        onSuccess: (val) => console.log("success", val)
      }));
      createMenuItem({
        app: app2,
        pluginName: PLUGIN_NAME,
        menuItemName: "\u2728 Apply Magic Markup",
        invokeCallback: this.actionRun.bind(this)
      });
    }
    destroy() {
      console.log("destroying plugin");
    }
    showPanel() {
    }
    actionRun(agreedToDocumentMagic = false) {
      if (!this.app.activeDocument)
        return;
      if (!this.scope)
        return;
      if (this.scope.isDocument && agreedToDocumentMagic !== true) {
        return this.confirmDialog.show({
          title: "Whole document selected!",
          body: "Are you sure you want to apply Magic Markup to the whole document?",
          onSuccess: () => this.actionRun(true)
        });
      }
      this.buttonRun.disabled = true;
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
      this.buttonRun.disabled = false;
    }
  };
  new MagicMarkupPlugin(app);
})();
