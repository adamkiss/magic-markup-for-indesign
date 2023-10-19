# 🪄 Magic Markup for Indesign

Define your markup in a simple a DSL and apply it to a text, in one click of a button (or a command with a keyboard shortcut).

## How to install

- Download `*.ccx` file from the dist folder
- Double click, install with Creative Cloud
- Profit

## Configuration

### Paragraph styles

```
#{1,3} : Header
```

- Everything until `:` is part of the pattern, including spaces
- Last `:` on line counts as separator, so `::::: Weird` would match any line beginning with `::::`
- Paragraph style name is trimmed (unlike pattern), so it will be set to `Header`, not ` Header`

### Character styles

#### Symmetrical

```
__: Underlined
```

- Matches: `__This will be underlined__`
- Everything until `:` is part of the pattern, including spaces
- Character style name is trimmed when applied
- Is matched after Assymetrical character styles

#### Asymmetrical

```
_-:-_: Snake
```

- Would Match `_-Snakey snake-_`
- Both patterns - the beginning and the end - are accepted as they are (including spaces)
- Both patterns must have at least one character, but are greedy, so:
	- `:::: Woot` would parse as `[':', split, ':', split, 'Woot']`
	- `::::: Dumb Style` would parse as `['::', split, ':', split, 'Woot']`
	- `::: Double Colon` would not be matched (doesn't match `.+:.+:` pattern, that requires at least four characters)

### Invisibles

TBD. Will replace patterns inside configurable characters like `[\n]` into their invisble characters (`\n` is Forced Line Break, new line without ending Paragraph). will come in v0.6.0
