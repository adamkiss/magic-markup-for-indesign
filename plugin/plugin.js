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
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/utils.js
  function $(selector) {
    return document.querySelector(selector);
  }
  function $$(selector) {
    return document.querySelectorAll(selector);
  }
  function esc(str) {
    return str.replace(/([.^$*+?~()\[\]{}\\|])/g, "\\$1");
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
  function resetGrepPreferences(app2) {
    app2.findGrepPreferences = null;
    app2.changeGrepPreferences = null;
  }
  function createMenuItem({
    app: app2,
    pluginName,
    menuItemName,
    invokeCallback
  }) {
    try {
      const pluginMenu = app2.menus.item("Main").submenus.item("Plug-Ins").submenus.item(pluginName);
      const existingMenuItem = pluginMenu.menuItems.itemByName(menuItemName);
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
  function removeOldMenuItemsInSubmenu(menu) {
    for (let index = 0; index < menu.menuItems.length; index++) {
      const menuItem = menu.menuItems.item(index);
      if (!(menuItem.isValid && menuItem.name.includes("Apply Magic Markup")))
        continue;
      menuItem.remove();
    }
  }
  function cleanUpMenuItems({ app: app2, currentPluginName }) {
    try {
      const pluginMenu = app2.menus.item("Main").submenus.item("Plug-Ins");
      removeOldMenuItemsInSubmenu(pluginMenu);
      for (let index = 0; index < pluginMenu.submenus.length; index++) {
        const submenu = pluginMenu.submenus.item(index);
        if (!submenu.isValid || !submenu.name.includes("Magic Markup"))
          continue;
        if (submenu.name !== currentPluginName && submenu.isValid) {
          submenu.remove();
        } else if (submenu.isValid) {
          removeOldMenuItemsInSubmenu(submenu);
        }
      }
      return true;
    } catch (error) {
      console.error("CLEANUP", error);
      return false;
    }
  }

  // src/scope.js
  var { Application, Document } = __require("indesign");
  var Scope = class extends EventTarget {
    constructor(plugin) {
      super();
      __publicField(this, "plugin", null);
      __publicField(this, "scopeRoot", null);
      __publicField(this, "scopeText", "\u2026");
      this.plugin = plugin;
      this.$ui = $("#scope");
      this.onChange = this.onChange.bind(this);
      if (this.plugin.PRODUCTION === true) {
        this.plugin.app.addEventListener("afterSelectionChanged", this.onChange);
        this.plugin.app.addEventListener("afterContextChanged", this.onChange);
      } else {
        setInterval(this.onChange, 500);
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
    get grepTargets() {
      return Array.isArray(this.scopeRoot) ? this.scopeRoot.map((item) => item.parentStory || null).filter((item) => item !== null) : [this.scopeRoot];
    }
    /**
     * Scope changed, validate and emit event
     */
    onChange() {
      if (!this.plugin.loaded)
        return;
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

  // src/storage.js
  var lfs = __require("uxp").storage.localFileSystem;
  var _Storage = class _Storage {
    constructor({
      presets,
      onLoad = (_) => {
      },
      onChange = (_) => {
      }
    }) {
      __publicField(this, "intialized", false);
      __publicField(this, "onChange", () => {
      });
      __publicField(this, "pluginDataFolder", null);
      __publicField(this, "presetsFile", null);
      __publicField(this, "activePresetFile", null);
      __publicField(this, "presets", null);
      this.presets = presets;
      this.onChange = onChange;
      this.onChange(true);
      this.init(onLoad);
    }
    init(onLoadCallback) {
      return __async(this, null, function* () {
        if (this.intialized)
          return;
        this.pluginDataFolder = (yield lfs.getDataFolder()).nativePath;
        this.presetsFile = yield lfs.createEntryWithUrl("plugin-data:/presets.json", { overwrite: true });
        let presets;
        try {
          presets = yield this.loadPresets();
        } catch (e) {
          yield this.savePresets(_Storage.DEFAULT_PRESETS);
          presets = yield this.loadPresets();
        }
        this.activePresetFile = yield lfs.createEntryWithUrl("plugin-data:/active-preset.json", { overwrite: true });
        let activePreset;
        try {
          activePreset = yield this.loadActivePreset();
        } catch (e) {
          yield this.saveActivePreset(_Storage.DEFAULT_ACTIVE_PRESET);
          activePreset = yield this.loadActivePreset();
        }
        this.intialized = true;
        this.onChange(false);
        return onLoadCallback({ presets, activePreset });
      });
    }
    _emitWorking() {
      this.onChange(true);
    }
    _emitDone() {
      this.onChange(false);
    }
    loadPresets() {
      return __async(this, null, function* () {
        this._emitWorking();
        const data = yield this.presetsFile.read();
        const parsed = JSON.parse(data);
        this._emitDone();
        return parsed;
      });
    }
    savePresets(presets) {
      return __async(this, null, function* () {
        this._emitWorking();
        const written = yield this.presetsFile.write(JSON.stringify(presets));
        this._emitDone();
        return written > 0;
      });
    }
    loadActivePreset() {
      return __async(this, null, function* () {
        this._emitWorking();
        const data = yield this.activePresetFile.read();
        const parsed = JSON.parse(data);
        this._emitDone();
        return parsed;
      });
    }
    saveActivePreset(activePreset) {
      return __async(this, null, function* () {
        this._emitWorking();
        const written = yield this.activePresetFile.write(JSON.stringify(activePreset));
        this._emitDone();
        return written > 0;
      });
    }
    saveAll(_0) {
      return __async(this, arguments, function* ({ presets, activePreset }) {
        yield this.savePresets(presets);
        yield this.saveActivePreset(activePreset);
      });
    }
  };
  __publicField(_Storage, "DEFAULT_PRESETS", {
    "Default": {
      paragraph: [],
      paragraphRaw: "",
      character: [],
      characterRaw: "",
      markers: { toggled: false, open: "[", close: "]", rules: [] }
    }
  });
  __publicField(_Storage, "DEFAULT_ACTIVE_PRESET", "Default");
  var Storage = _Storage;

  // src/textarea.js
  var _Textarea = class _Textarea {
    constructor({
      $element,
      parseAsParagraphStyles = true,
      onChange = () => {
      }
    }) {
      __publicField(this, "$", null);
      __publicField(this, "parseAsParagraphStyles", true);
      __publicField(this, "debounce", null);
      this.$ = $element;
      this.parseAsParagraphStyles = parseAsParagraphStyles;
      this.$.addEventListener("input", this.input.bind(this));
      this.$.addEventListener("keydown", this.keydown.bind(this));
      this.onChange = onChange;
    }
    parse() {
      const rules = this.parseAsParagraphStyles ? this.parseParagraphStyles() : this.parseCharacterStyles();
      this.onChange({ rules, raw: this.value });
    }
    parseCharacterStyles() {
      const rules = [];
      for (let line of this.lines) {
        if (!line.trim())
          continue;
        if (!line.includes(":"))
          continue;
        const raw = line.startsWith("raw:");
        if (raw)
          line = line.replace(/^raw:/, "");
        if (line.match(_Textarea.MATCHER_BEGIN_END)) {
          const [begin, end, value] = line.match(_Textarea.MATCHER_BEGIN_END).slice(1);
          const b = raw ? begin : esc(begin);
          const e = raw ? end : esc(end);
          rules.push({ find: `${b}(.*?)${e}`, style: value.trim() });
        } else if (line.match(_Textarea.MATCHER_SINGLE)) {
          const [key, value] = line.match(_Textarea.MATCHER_SINGLE).slice(1);
          const k = raw ? key : esc(key);
          rules.push({ find: `${k}(.*?)${k}`, style: value.trim() });
        }
      }
      return rules;
    }
    parseParagraphStyles() {
      const rules = [];
      for (let line of this.lines) {
        const raw = line.startsWith("raw:");
        if (raw)
          line = line.replace(/^raw:/, "");
        if (!line.match(_Textarea.MATCHER_SINGLE))
          continue;
        const [key, value] = line.match(_Textarea.MATCHER_SINGLE).slice(1);
        const k = raw ? key : esc(key);
        rules.push({ find: `^${k}(.*?)$`, style: value.trim() });
      }
      return rules;
    }
    input() {
      clearTimeout(this.debounce);
      this.debounce = setTimeout((_) => {
        this.autosize();
        this.parse();
      }, 1e3);
    }
    keydown(event) {
      if (event.key === "v" && (event.ctrlKey || event.metaKey)) {
        setTimeout(this.input.bind(this), 0);
      }
    }
    autosize() {
      this.$.style.height = `calc(
			(var(--textarea-font-size) * (var(--textarea-line-height)))
				* ${Math.max(_Textarea.MIN_HEIGHT, this.lines.length) + 1}
		)`;
    }
    get lines() {
      return this.value.split("\n");
    }
    get value() {
      return this.$.value || "";
    }
    set value(value) {
      this.$.value = value;
      this.autosize();
    }
  };
  __publicField(_Textarea, "MIN_HEIGHT", 5);
  __publicField(_Textarea, "MATCHER_SINGLE", /^(.+):\s*(.+)$/);
  __publicField(_Textarea, "MATCHER_BEGIN_END", /^(.+):(.+):\s*(.+)$/);
  var Textarea = _Textarea;

  // src/markers.js
  var _Markers = class _Markers {
    constructor({ onChange }) {
      __publicField(this, "toggled", false);
      __publicField(this, "onChangeFn", null);
      this.$labels = $$('sp-field-label[for^="markers-"] > sp-detail');
      this.$toggle = $("#markers-switch");
      this.$inputOpen = $("#markers-open");
      this.$inputClose = $("#markers-close");
      this.$toggle.addEventListener("change", this.onToggle.bind(this));
      this.$inputOpen.addEventListener("input", this.onCharacterChanged.bind(this));
      this.$inputClose.addEventListener("input", this.onCharacterChanged.bind(this));
      this.onChangeFn = onChange;
    }
    onToggle() {
      this.toggled = this.$toggle.checked;
      this.$inputOpen.disabled = !this.toggled;
      this.$inputClose.disabled = !this.toggled;
      for (const $label of this.$labels) {
        $label.classList.toggle("disabled", !this.toggled);
      }
      this.onChangeFn({ markers: this.value });
    }
    onCharacterChanged() {
      this.onChangeFn({ markers: this.value });
    }
    get open() {
      return this.$inputOpen.value;
    }
    get close() {
      return this.$inputClose.value;
    }
    get rules() {
      if (this.toggled !== true || !(this.open || this.close))
        return [];
      const op = esc(this.open || "");
      const cl = esc(this.close || "");
      return Object.keys(_Markers.CODES).map((key) => {
        const { char, code } = _Markers.CODES[key];
        return [
          { findWhat: `${op}(?:${esc(char)}|${code})${cl}` },
          { changeTo: char }
        ];
      });
    }
    get value() {
      return {
        toggled: this.toggled,
        open: this.open,
        close: this.close,
        rules: this.rules
      };
    }
    set value({ toggled, open, close }) {
      this.toggled = toggled;
      this.$toggle.checked = toggled;
      this.$inputOpen.value = open;
      this.$inputClose.value = close;
      this.onToggle();
    }
  };
  __publicField(_Markers, "CODES", {
    "Discretionary Hyphen": {
      char: "~-",
      code: "dh",
      description: "Invisible hyphen that only appears at the end of a line when the word breaks. Placed at the start of a word, it prevents the word from breaking."
    },
    "Nonbreaking Hyphen": {
      char: "~~",
      code: "nbh",
      description: "Visible hyphen that prevents the word from breaking."
    },
    "Flush Space": {
      char: "~f",
      code: "fs",
      description: "Grows to equal space for each flush space in paragraphs that are Fully Justified."
    },
    "Hair Space": {
      char: "~|",
      code: "hs",
      description: "Hair space"
    },
    "Forced Line Break": {
      char: "\\n",
      code: "flb",
      description: "Forces a line break without breaking paragraph."
    },
    "Column Break": {
      char: "~M",
      code: "cb",
      description: "Forces following text to begin in the next column."
    },
    "Frame Break": {
      char: "~R",
      code: "fb",
      description: "Forces following text to begin in the next text frame."
    },
    "Page Break": {
      char: "~P",
      code: "pb",
      description: "Forces following text to begin on the next page."
    },
    "Tab": {
      char: "\\t",
      code: "tab",
      description: "Tab character"
    },
    "Right Indent Tab": {
      char: "~y",
      code: "rit",
      description: "Forces text beyond this marker to align to the right margin."
    },
    "Indent to Here": {
      char: "~i",
      code: "ith",
      description: "Forces every following line in a paragraph to indent to the position of this marker."
    }
  });
  var Markers = _Markers;

  // src/presets.js
  var { Application: Application2 } = __require("indesign");
  var Presets = class extends EventTarget {
    constructor(plugin) {
      super();
      __publicField(this, "plugin", null);
      __publicField(this, "storage", null);
      __publicField(this, "presets", null);
      __publicField(this, "activePresetName", null);
      __publicField(this, "$picker", null);
      __publicField(this, "$paraStyles", null);
      __publicField(this, "$charStyles", null);
      this.plugin = plugin;
      this.$storageActive = $("#storage-active");
      this.onStorageLoaded = this.onStorageLoaded.bind(this);
      this.onStorageChange = this.onStorageChange.bind(this);
      this.storage = new Storage({
        presets: this,
        onLoad: this.onStorageLoaded,
        onChange: this.onStorageChange
      });
      this.$picker = $("#presets");
      this.$picker.addEventListener("change", this.onPickerChange.bind(this));
      this.$paraStyles = new Textarea({
        $element: $("#pstyles"),
        parseAsParagraphStyles: true,
        onChange: ({ rules, raw }) => this.onPresetChanged("paragraph", { rules, raw })
      });
      this.$charStyles = new Textarea({
        $element: $("#cstyles"),
        parseAsParagraphStyles: false,
        onChange: ({ rules, raw }) => this.onPresetChanged("character", { rules, raw })
      });
      this.markers = new Markers({
        onChange: ({ markers }) => this.onPresetChanged("markers", markers)
      });
    }
    onStorageLoaded({ presets, activePreset }) {
      this.presets = presets;
      this.activePreset = activePreset;
      this.updatePresetSelect();
      this.updatePresetConfig();
      this.$picker.disabled = false;
      this.plugin.loaded = true;
      this.plugin.scope.onChange();
    }
    onStorageChange(active = false) {
      this.$storageActive.textContent = active ? "\u2026" : " ";
    }
    onPickerChange(e) {
      const value = e.target.value;
      if (value === this.activePreset)
        return;
      switch (e.target.value) {
        case "__command__delete":
          this.plugin.confirmDialog.show({
            title: "Delete preset?",
            destructive: true,
            onSuccess: () => {
              this.deletePreset(this.activePreset);
            }
          });
          this.updatePresetSelect();
          break;
        case "__command__rename":
          this.plugin.promptDialog.show({
            title: "Rename the preset to:",
            input: this.activePreset,
            onSuccess: (val) => {
              this.renamePreset(this.activePreset, val);
            }
          });
          this.updatePresetSelect();
          break;
        case "__command__duplicate":
          this.plugin.promptDialog.show({
            title: "Duplicate the preset as:",
            input: this.activePreset + " copy",
            onSuccess: (val) => {
              this.duplicatePreset(this.activePreset, val);
            }
          });
          this.updatePresetSelect();
          break;
        default:
          this.activePreset = value;
      }
    }
    onPresetChanged(type, value) {
      if (type === "markers") {
        this.activeConfiguration.markers = value;
      } else if (["paragraph", "character"].includes(type)) {
        const { rules, raw } = value;
        this.activeConfiguration[type] = rules;
        this.activeConfiguration[`${type}Raw`] = raw;
      } else {
      }
      this.saveToStorage();
    }
    get activeConfiguration() {
      return this.presets[this.activePreset];
    }
    get lastPreset() {
      const keys = Object.keys(this.presets);
      return keys[keys.length - 1];
    }
    get activePreset() {
      return this.activePresetName;
    }
    set activePreset(name) {
      if (!(name in this.presets)) {
        this.activePreset = this.lastPreset;
      }
      this.activePresetName = name;
      this.storage.activePreset = name;
      this.updatePresetSelect();
      this.updatePresetConfig();
      this.storage.saveActivePreset(this.activePresetName);
    }
    deletePreset(name) {
      if (name === "Default")
        return;
      delete this.presets[name];
      this.activePreset = this.lastPreset;
      this.saveToStorage();
    }
    renamePreset(name, newName) {
      if (name === "Default")
        return;
      const preset = this.presets[name];
      this.presets[newName] = preset;
      delete this.presets[name];
      this.activePreset = newName;
      this.saveToStorage();
    }
    duplicatePreset(name, newName) {
      const preset = this.presets[name];
      this.presets[newName] = Object.assign({}, preset);
      this.activePreset = newName;
      this.saveToStorage();
    }
    saveToStorage() {
      this.storage.saveAll({
        presets: this.presets,
        activePreset: this.activePreset
      });
    }
    _mi_preset(name) {
      return `
			<sp-menu-item value="${name}"${this.activePreset === name ? ' selected="selected"' : ""}>${name}</sp-menu-item>
		`;
    }
    _mi_divider() {
      return `<sp-menu-divider></sp-menu-divider>`;
    }
    _mi_command({ command, text, disabled }) {
      return `
			<sp-menu-item value="__command__${command}"${disabled ? ' disabled="disabled"' : ""}>${text}</sp-menu-item>
		`;
    }
    updatePresetSelect() {
      const HTML = [
        ...Object.keys(this.presets).map(this._mi_preset.bind(this)),
        this._mi_divider(),
        this._mi_command({
          command: "rename",
          text: "Rename preset",
          disabled: this.activePreset === "Default"
        }),
        this._mi_command({
          command: "duplicate",
          text: "Duplicate preset"
        }),
        this._mi_command({
          command: "delete",
          text: "Delete preset",
          disabled: this.activePreset === "Default"
        })
      ].join("");
      this.$picker.querySelector("sp-menu").innerHTML = HTML;
    }
    updatePresetConfig() {
      this.$paraStyles.value = this.activeConfiguration.paragraphRaw || "";
      this.$charStyles.value = this.activeConfiguration.characterRaw || "";
      this.markers.value = this.activeConfiguration.markers || { toggled: false, open: "<", close: ">" };
    }
  };

  // src/button-run.js
  var { Application: Application3 } = __require("indesign");
  var RunButton = class extends EventTarget {
    constructor(plugin) {
      super();
      __publicField(this, "$button", null);
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

  // src/dialog-confirm.js
  var ConfirmDialog = class extends EventTarget {
    constructor() {
      super();
      __publicField(this, "onSuccessFn", null);
      __publicField(this, "successListener", null);
      __publicField(this, "cancelListener", null);
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
      this.$buttonConfirm.setAttribute("variant", destructive ? "warning" : "cta");
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

  // src/dialog-prompt.js
  var PromptDialog = class extends EventTarget {
    constructor() {
      super();
      __publicField(this, "onSuccessFn", null);
      __publicField(this, "successListener", null);
      __publicField(this, "cancelListener", null);
      this.$dialog = $("dialog#prompt");
      this.$title = this.$dialog.querySelector("sp-heading");
      this.$input = this.$dialog.querySelector("#prompt-input");
      this.$buttonConfirm = this.$dialog.querySelector('sp-button[action="confirm"]');
      this.$buttonCancel = this.$dialog.querySelector('sp-button[action="cancel"]');
      this.confirm = this.confirm.bind(this);
      this.close = this.close.bind(this);
      this.confirmByEnter = this.confirmByEnter.bind(this);
    }
    show({
      title = "",
      input = "",
      destructive = false,
      onSuccess = null
    }) {
      this.onSuccessFn = onSuccess;
      this.$title.innerHTML = title;
      this.$input.setAttribute("value", input);
      this.$buttonConfirm.setAttribute("variant", destructive ? "negative" : "cta");
      this.$buttonConfirm.addEventListener("click", this.confirm);
      this.$buttonCancel.addEventListener("click", this.close);
      this.$input.addEventListener("keydown", this.confirmByEnter);
      this.$dialog.showModal();
      setTimeout(() => {
        this.$input.focus();
      }, 100);
    }
    confirmByEnter(e) {
      if (e.key === "Enter") {
        this.confirm();
      }
    }
    confirm() {
      this.onSuccessFn(this.$input.value || "");
      this.close();
    }
    close() {
      this.onSuccessFn = null;
      this.$buttonConfirm.removeEventListener("click", this.confirm);
      this.$buttonCancel.removeEventListener("click", this.close);
      this.$input.removeEventListener("keydown", this.confirmByEnter);
      this.$dialog.close();
    }
  };

  // src/plugin.js
  var { app, ScriptLanguage, UndoModes } = __require("indesign");
  var { shell, entrypoints } = __require("uxp");
  var PLUGIN_NAME = "\u{1F308} Magic Markup";
  var PLUGIN_VERSION = __require("uxp").versions.plugin;
  var MagicMarkupPlugin = class {
    constructor(app2) {
      __publicField(this, "PRODUCTION", false);
      __publicField(this, "loaded", false);
      __publicField(this, "textareas", {});
      __publicField(this, "app", null);
      __publicField(this, "listeners", []);
      __publicField(this, "scope", null);
      __publicField(this, "runner", null);
      __publicField(this, "presets", null);
      this.app = app2;
      this.scope = new Scope(this);
      this.runButton = new RunButton(this);
      this.presets = new Presets(this);
      this.confirmDialog = new ConfirmDialog();
      this.promptDialog = new PromptDialog();
      this.applyMagic = this.applyMagic.bind(this);
      this.runButton.addEventListener("click", this.applyMagic);
      cleanUpMenuItems({ app: app2, currentPluginName: PLUGIN_NAME });
      createMenuItem({
        app: app2,
        pluginName: PLUGIN_NAME,
        menuItemName: "\u2728 Apply Magic Markup",
        invokeCallback: this.applyMagic.bind(this)
      });
      this.setupInfo();
    }
    destroy() {
    }
    showPanel() {
    }
    setupInfo() {
      $("#info .version").textContent = `\u{1F308} v${PLUGIN_VERSION}`;
      $("#info .help").addEventListener("click", (_) => __async(this, null, function* () {
        yield shell.openExternal("https://github.com/adamkiss/magic-markup-for-indesign#readme");
      }));
      const $markerTemplate = $("#cheatsheet-marker-template");
      for (const markerName in Markers.CODES) {
        const marker = Markers.CODES[markerName];
        const $marker = $markerTemplate.cloneNode(true);
        $marker.removeAttribute("id");
        if (marker.code === "dh") {
          $marker.classList.add("double");
        }
        $marker.querySelector(".marker-name").innerHTML = `${markerName}
				<span class="font-normal"><code>[${marker.code}]</code> or <code>[${marker.char}]</code></span>
			`;
        $marker.querySelector(".marker-description").textContent = marker.description;
        $markerTemplate.parentNode.appendChild($marker);
      }
      $markerTemplate.remove();
      $("#info .cheatsheet").addEventListener("click", (_) => {
        $("#cheatsheet-plugin-data-folder").value = this.presets.storage.pluginDataFolder;
        $('dialog[id^="cheatsheet-"]').showModal();
      });
    }
    applyMagic({ wholeDocument = false }) {
      var _a, _b;
      if (!this.app.activeDocument)
        return;
      if (!this.scope)
        return;
      if (this.scope.isDocument && wholeDocument !== true) {
        return this.confirmDialog.show({
          title: "Whole document selected!",
          body: "Are you sure you want to apply Magic Markup to the whole document?",
          onSuccess: () => this.applyMagic({ wholeDocument: true })
        });
      }
      this.runButton.disabled = true;
      const config = this.presets.activeConfiguration;
      ensureParagraphStyles(this.app.activeDocument, config.paragraph.map((rule) => rule.style));
      ensureCharacterStyles(this.app.activeDocument, config.character.map((rule) => rule.style));
      const greps = [];
      for (const rule of config.paragraph) {
        greps.push([
          { findWhat: rule.find },
          { changeTo: "$1", appliedParagraphStyle: rule.style }
        ]);
      }
      for (const rule of config.character) {
        greps.push([
          { findWhat: rule.find },
          { changeTo: "$1", appliedCharacterStyle: rule.style }
        ]);
      }
      if ((_b = (_a = config.markers) == null ? void 0 : _a.rules) == null ? void 0 : _b.length) {
        greps.push(...config.markers.rules);
      }
      this.app.doScript(() => {
        for (const [findPrefs, changePrefs] of greps) {
          resetGrepPreferences(this.app);
          this.app.findGrepPreferences.properties = findPrefs;
          this.app.changeGrepPreferences.properties = changePrefs;
          for (const target of this.scope.grepTargets) {
            target.changeGrep();
          }
        }
        resetGrepPreferences(this.app);
      }, ScriptLanguage.UXPSCRIPT, [], UndoModes.ENTIRE_SCRIPT, "Magic Markup: Apply");
      this.runButton.disabled = false;
    }
  };
  new MagicMarkupPlugin(app);
  entrypoints.setup({
    commands: {
      applyMagic: () => {
        console.log("applyMagic");
      }
    }
  });
})();
