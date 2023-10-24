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
  var import_indesign = __require("indesign");

  // src/cconsole.js
  var cconsole_default = cconsole = {
    tags: [],
    _check(tag) {
      return this.tags.length && this.tags.includes(tag);
    },
    log(tag, ...args) {
      this._check(tag) && console.log(...args);
    },
    info(tag, ...args) {
      this._check(tag) && console.info(...args);
    },
    error(tag, ...args) {
      this._check(tag) && console.error(...args);
    },
    logAndPass(tag, ...args) {
      this._check(tag) && console.log(...args);
      return args[args.length - 1];
    },
    logAndTrue(tag, ...args) {
      this._check(tag) && console.log(...args);
      return true;
    }
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
  function itemByNameOrAdd(collection, name, options = {}) {
    try {
      const item = collection.itemByName(name);
      if (!item.isValid)
        throw new Error("Invalid: Create it instead");
      return item;
    } catch (error) {
      cconsole_default.info("itemByNameOrAdd", `itemByNameOrAdd: Creating ${name}`, error);
    }
    return collection.add(name, options);
  }
  function isSelectionOneOf(selection, ...types) {
    try {
      const name = selection.constructor.name;
      return types.includes(name);
    } catch (error) {
      cconsole_default.info("isSelectionOneOf", selection, error);
    }
    return false;
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
  function resetGrepPreferences(app3) {
    app3.findGrepPreferences = null;
    app3.changeGrepPreferences = null;
  }
  function createMenuItem({
    app: app3,
    pluginName,
    menuItemName,
    invokeCallback
  }) {
    try {
      const pluginMenu = app3.menus.item("Main").submenus.item("Plug-Ins").submenus.item(pluginName);
      const existingMenuItem = pluginMenu.menuItems.itemByName(menuItemName);
      if (!existingMenuItem.isValid) {
        const menuItem = app3.scriptMenuActions.add(menuItemName);
        menuItem.addEventListener("onInvoke", invokeCallback);
        pluginMenu.menuItems.add(menuItem);
      }
      return true;
    } catch (error) {
      cconsole_default.error("menu-items", "create", error);
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
  function cleanUpMenuItems({ app: app3, currentPluginName }) {
    try {
      const pluginMenu = app3.menus.item("Main").submenus.item("Plug-Ins");
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
      cconsole_default.error("menu-items", "cleanup", error);
      return false;
    }
  }

  // src/hyperlinks.js
  var { app, Story, Document: Document2, Text, Paragraph, TextStyleRange, TextFrame } = __require("indesign");
  var RE_MARKDOWN_LINK = new RegExp("\\[(?<text>.*?)\\]\\((?<url>(?:https?:\\/\\/|tel:|mailto:).*?)\\)", "i");
  var RE_RAW_LINK = new RegExp("(?<url>(?:https?:\\/\\/|tel:|mailto:)[A-z0-9\\.\\/\\-\\-\\?=&\\[\\]\\+@]+)", "gi");
  function replaceTextWithHyperlink({ story, index, replace, text, url, style }) {
    const doc = story.parent;
    if (!(story instanceof Story && story.parent instanceof Document2 || story instanceof TextFrame))
      return;
    const destination = itemByNameOrAdd(doc.hyperlinkURLDestinations, url, { name: url });
    story.characters.itemByRange(index, index + replace.length - 2).remove();
    const insertAt = story.contents.length === index ? story.insertionPoints.lastItem() : story.characters.item(index);
    insertAt.contents = text;
    const textSourceCharacters = story.characters.itemByRange(index, index + text.length - 1);
    const source = doc.hyperlinkTextSources.add(textSourceCharacters);
    textSourceCharacters.applyCharacterStyle(style);
    let name = text;
    let counter = 2;
    while (doc.hyperlinks.itemByName(name).isValid) {
      name = `${text} ${counter++}`;
    }
    doc.hyperlinks.add(source, destination, { name });
    return false;
  }
  function replaceMarkdownLinks({
    root,
    story,
    isSelection,
    hyperlinkStyle
  }) {
    RE_MARKDOWN_LINK.lastIndex = null;
    let nextMatch = null;
    while ((nextMatch = RE_MARKDOWN_LINK.exec(root.contents)) !== null) {
      const { index, 0: match, groups: { text, url } } = nextMatch;
      try {
        const breakout = replaceTextWithHyperlink({
          story,
          index: isSelection ? index + root.index : index,
          replace: match,
          text,
          url,
          style: hyperlinkStyle
        });
        if (breakout)
          break;
      } catch (error) {
        cconsole_default.error("hyperlink-md", error);
      }
      if (isSelection && index === 0) {
        const { index: newIndex, length: newLength } = root;
        try {
          root.parentStory.characters.itemByRange(
            -(text.length - 1) + newIndex,
            // <- shift index forward,
            newIndex + newLength - 1
            // <- the range stays the same
          ).select();
        } catch (e) {
        }
      }
      if (root instanceof Text || root instanceof Paragraph || root instanceof TextStyleRange) {
        root = app.selection[0];
      }
    }
    return root;
  }
  function replaceRawLinks({
    root,
    story,
    isSelection,
    hyperlinkStyle
  }) {
    RE_RAW_LINK.lastIndex = 0;
    let nextMatch = null;
    while ((nextMatch = RE_RAW_LINK.exec(root.contents)) !== null) {
      const { index, 0: match, groups: { url } } = nextMatch;
      const { index: originalIndex, length: originalLength } = root;
      try {
        const breakout = replaceTextWithHyperlink({
          story,
          index: isSelection ? index + root.index : index,
          replace: match,
          text: url,
          url,
          style: hyperlinkStyle
        });
        if (breakout)
          break;
      } catch (error) {
        cconsole_default.error("hyperlink-raw", error);
      }
      if (isSelection) {
        root.parentStory.characters.itemByRange(originalIndex, originalIndex + originalLength - 1).select();
        root = app.selection[0];
      }
    }
    return root;
  }

  // src/scope.js
  var { Document: Document3 } = __require("indesign");
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
      return this.scopeRoot instanceof Document3;
    }
    get grepTargets() {
      return Array.isArray(this.scopeRoot) ? this.scopeRoot.map((item) => item.parentStory || null).filter((item) => item !== null) : [this.scopeRoot];
    }
    get hyperlinkTargets() {
      const scopes = this.scopeRoot instanceof Document3 ? scopeRoot.stories.everyItem().getElements() : Array.isArray(this.scopeRoot) ? this.scopeRoot : [this.scopeRoot];
      return scopes;
    }
    /**
     * Scope changed, validate and emit event
     */
    onChange() {
      if (!this.plugin.loaded)
        return;
      const app3 = this.plugin.app;
      if (app3.documents.length === 0) {
        this.scopeRoot = null;
        this.scopeText = "invalid";
        return this.change();
      }
      if (app3.selection.length === 0) {
        this.scopeRoot = app3.activeDocument;
        this.scopeText = "document";
        return this.change();
      }
      if (app3.selection.length > 1) {
        this.scopeRoot = app3.selection;
        this.scopeText = "multiple objects";
        return this.change();
      }
      if (!isSelectionOneOf(app3.selection[0], "TextFrame", "Text", "Paragraph", "InsertionPoint", "TextStyleRange", "TextColumn")) {
        this.scopeRoot = null;
        this.scopeText = `${app3.selection[0].constructor.name}: unsupported`;
        return this.change();
      }
      if (isSelectionOneOf(app3.selection[0], "TextColumn")) {
        this.scopeRoot = app3.selection[0].texts.item(0);
        this.scopeText = "text (column)";
        return this.change();
      }
      if (isSelectionOneOf(app3.selection[0], "Text", "TextStyleRange", "Paragraph")) {
        this.scopeRoot = app3.selection[0];
        this.scopeText = "selected text";
        return this.change();
      }
      this.scopeRoot = app3.selection[0].parentStory;
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
          cconsole_default.info("loading", "Error loading presets, creating default");
          yield this.savePresets(_Storage.DEFAULT_PRESETS);
          presets = yield this.loadPresets();
        }
        this.activePresetFile = yield lfs.createEntryWithUrl("plugin-data:/active-preset.json", { overwrite: true });
        let activePreset;
        try {
          activePreset = yield this.loadActivePreset();
        } catch (e) {
          cconsole_default.info("loading", "Error loading active preset, creating default");
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
        const written = yield this.presetsFile.write(JSON.stringify(presets, null, 2));
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
      paragraph: {
        rules: [],
        raw: ""
      },
      character: {
        rules: [],
        raw: ""
      },
      markers: {
        rules: [],
        toggled: false,
        open: "[",
        close: "]"
      },
      "collapse-newlines": {
        rules: [],
        toggled: false
      },
      "markdown-links": false,
      "raw-links": false
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

  // src/checkbox.js
  var Checkbox = class {
    constructor({ name, onChange }) {
      __publicField(this, "name", null);
      __publicField(this, "toggled", false);
      __publicField(this, "onChangeFn", null);
      if (!name)
        throw new Error("Checkbox name is required");
      this.name = name;
      this.$label = $(`sp-field-label[for="${name}-switch"] > sp-detail`);
      this.$toggle = $(`#${name}-switch`);
      this.$toggle.addEventListener("change", this.onToggle.bind(this));
      this.onChangeFn = onChange;
    }
    onToggle() {
      this.toggled = this.$toggle.checked;
      this.$label.classList.toggle("disabled", !this.toggled);
      this.onChangeFn({ [this.name]: this.toggled });
    }
    get value() {
      return {
        toggled: this.toggled
      };
    }
    set value(value) {
      this.toggled = value;
      this.$toggle.checked = value;
      this.onToggle();
    }
  };

  // src/checkbox-newlines.js
  var CheckboxNewlines = class extends Checkbox {
    constructor({ onChange }) {
      super({ name: "collapse-newlines", onChange });
    }
    onToggle() {
      this.toggled = this.$toggle.checked;
      this.$label.classList.toggle("disabled", !this.toggled);
      this.onChangeFn(this.value);
    }
    get value() {
      return {
        toggled: this.toggled,
        rules: this.toggled ? [[{ findWhat: "\\r+" }, { changeTo: "\\r" }]] : []
      };
    }
    set value({ toggled }) {
      this.toggled = toggled;
      this.$toggle.checked = toggled;
      this.onToggle();
    }
  };

  // src/presets.js
  var Presets = class extends EventTarget {
    constructor(plugin) {
      super();
      __publicField(this, "plugin", null);
      __publicField(this, "storage", null);
      __publicField(this, "reloading", false);
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
      this.collapseNewlines = new CheckboxNewlines({
        onChange: ({ toggled, rules }) => this.onPresetChanged("collapse-newlines", { toggled, rules })
      });
      this.markdownLinks = new Checkbox({
        name: "markdown-links",
        onChange: (newValue) => this.onPresetChanged("markdown-links", newValue["markdown-links"])
      });
      this.rawLinks = new Checkbox({
        name: "raw-links",
        onChange: (newValue) => this.onPresetChanged("raw-links", newValue["raw-links"])
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
      if (this.reloading)
        return;
      this.activeConfiguration[type] = value;
      this.saveToStorage();
      this.plugin.scope.onChange();
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
      var _a, _b;
      this.reloading;
      this.$paraStyles.value = ((_a = this.activeConfiguration.paragraph) == null ? void 0 : _a.raw) || "";
      this.$charStyles.value = ((_b = this.activeConfiguration.character) == null ? void 0 : _b.raw) || "";
      this.markers.value = this.activeConfiguration.markers || { toggled: false, open: "<", close: ">" };
      this.collapseNewlines.value = this.activeConfiguration["collapse-newlines"] || { toggled: false, rules: [] };
      this.markdownLinks.value = this.activeConfiguration["markdown-links"] || false;
      this.rawLinks.value = this.activeConfiguration["raw-links"] || false;
      this.reloading = false;
    }
  };

  // src/button-run.js
  var { Application } = __require("indesign");
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
  var { app: app2, ScriptLanguage, UndoModes, Document: Document4, Story: Story2, TextFrame: TextFrame2 } = __require("indesign");
  var { shell } = __require("uxp");
  var PLUGIN_NAME = "Magic Markup";
  var PLUGIN_VERSION = __require("uxp").versions.plugin;
  var MagicMarkupPlugin = class {
    constructor(app3) {
      __publicField(this, "PRODUCTION", true);
      __publicField(this, "loaded", false);
      __publicField(this, "textareas", {});
      __publicField(this, "app", null);
      __publicField(this, "listeners", []);
      __publicField(this, "scope", null);
      __publicField(this, "runner", null);
      __publicField(this, "presets", null);
      this.app = app3;
      this.scope = new Scope(this);
      this.runButton = new RunButton(this);
      this.presets = new Presets(this);
      this.confirmDialog = new ConfirmDialog();
      this.promptDialog = new PromptDialog();
      this.applyMagic = this.applyMagic.bind(this);
      this.runButton.addEventListener("click", this.applyMagic);
      cleanUpMenuItems({ app: app3, currentPluginName: PLUGIN_NAME });
      createMenuItem({
        app: app3,
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
    _runGrepReplace({ findPrefs, changePrefs, targets }) {
      resetGrepPreferences(this.app);
      this.app.findGrepPreferences.properties = findPrefs;
      this.app.changeGrepPreferences.properties = changePrefs;
      for (const target of targets) {
        target.changeGrep();
      }
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
      ensureParagraphStyles(this.app.activeDocument, config.paragraph.rules.map((rule) => rule.style));
      ensureCharacterStyles(this.app.activeDocument, config.character.rules.map((rule) => rule.style));
      if (config["markdown-links"] || config["raw-links"]) {
        ensureCharacterStyles(this.app.activeDocument, ["Hyperlink"]);
      }
      const greps = [];
      for (const rule of config.paragraph.rules) {
        greps.push([
          { findWhat: rule.find },
          { changeTo: "$1", appliedParagraphStyle: rule.style }
        ]);
      }
      for (const rule of config.character.rules) {
        greps.push([
          { findWhat: rule.find },
          { changeTo: "$1", appliedCharacterStyle: rule.style }
        ]);
      }
      if ((_b = (_a = config.markers) == null ? void 0 : _a.rules) == null ? void 0 : _b.length) {
        greps.push(...config.markers.rules);
      }
      this.app.doScript(() => {
        var _a2, _b2, _c, _d;
        for (const [findPrefs, changePrefs] of greps) {
          this._runGrepReplace({ findPrefs, changePrefs, targets: this.scope.grepTargets });
        }
        resetGrepPreferences(this.app);
        if ((config["markdown-links"] || config["raw-links"]) !== true) {
          if ((_b2 = (_a2 = config["collapse-newlines"]) == null ? void 0 : _a2.rules) == null ? void 0 : _b2.length) {
            const [findPrefs, changePrefs] = config["collapse-newlines"].rules[0];
            this._runGrepReplace({ findPrefs, changePrefs, targets: this.scope.grepTargets });
            resetGrepPreferences(this.app);
          }
          return;
        }
        const hyperlinkStyle = this.app.activeDocument.characterStyles.itemByName("Hyperlink");
        cconsole_default.log("hyperlink-loop", "scope", this.scope);
        this.scope.hyperlinkTargets.forEach((root) => {
          const isSelection = isSelectionOneOf(root, "Text", "Paragraph", "TextStyleRange");
          const story = isSelection || root instanceof TextFrame2 ? root.parentStory : root;
          cconsole_default.log("hyperlink-loop", root);
          cconsole_default.log("hyperlink-loop", story);
          if (!(story instanceof Story2 && story.parent instanceof Document4 || story instanceof TextFrame2))
            return;
          if (config["markdown-links"] === true) {
            root = replaceMarkdownLinks({ root, story, isSelection, hyperlinkStyle });
          }
          if (config["raw-links"] === true) {
            root = replaceRawLinks({ root, story, isSelection, hyperlinkStyle });
          }
        });
        if ((_d = (_c = config["collapse-newlines"]) == null ? void 0 : _c.rules) == null ? void 0 : _d.length) {
          const [findPrefs, changePrefs] = config["collapse-newlines"].rules[0];
          this._runGrepReplace({ findPrefs, changePrefs, targets: this.scope.grepTargets });
          resetGrepPreferences(this.app);
        }
      }, ScriptLanguage.UXPSCRIPT, [], UndoModes.ENTIRE_SCRIPT, "Magic Markup: Apply");
    }
  };
  new MagicMarkupPlugin(app2);
})();
