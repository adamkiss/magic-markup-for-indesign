# 🌈 Magic Markup for Indesign

Define your markup in a simple a DSL and apply it to a text, in one click of a button (or a command with a keyboard shortcut).

## How to install

- Download `*.ccx` file from the dist folder
- Double click, install with Creative Cloud
- Profit

## Configuration

### Paragraph styles

```
# : Header
```

- Everything until `:` is part of the pattern, including spaces
- Last `:` on line counts as separator, so `::::: Weird` would match any line beginning with `::::`
- Paragraph style name is trimmed (unlike pattern), so it will be set to `Header`, not ` Header`
- **!** `raw` as a pattern isn't supported; see [Patterns: raw GREP](#patterns-raw-grep)

### Character styles

#### Symmetrical

```
__: Underlined
```

- Matches: `__This will be underlined__`
- Everything until `:` is part of the pattern, including spaces
- Character style name is trimmed when applied
- Is matched after Assymetrical character styles
- **!** `raw` as a pattern isn't supported; see [Patterns: raw GREP](#patterns-raw-grep)

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
- **!** `raw` as the opening pattern isn't supported; see [Patterns: raw GREP](#patterns-raw-grep)

### Patterns: raw GREP

All the patterns are escaped, so you may freely use any special GREP characters as a part of pattern without worrying. However, for the rare occasion you might want to use the full power of GREP in the patterns, you might prefix the line with `raw:`, and in that case you MUST escape any special GREP character.

One of rare useful examples (for an ordered list from markdown):

```
raw:\d+\. : List (Ordered)
```

### Replace Markers

You can turn on Marker replacement; within opening and/OR closing strings (at least one must be defined), you can enter either GREP shortcode or initials, and they will be replaced with the marker:

#### List of markers supporting replacement

Note: Examples use `[` and `]` as open and close strings respectively.

- Discretionary Hyphen: `[~-]` or `[dh]`
- Nonbreaking Hyphen: `[~~]` or `[nbh]`
- Flush Space: `[~f]` or `[fs]`
- Hair Space: `[~|]` or `[hs]`
- Forced Line Break: `[\n]` or `[flb]`
- Column Break: `[~M]` or `[cb]`
- Frame Break: `[~R]` or `[fb]`
- Page Break: `[~P]` or `[pb]`
- Tab: `[\t]` or `[tab]`
- Right Indent Tab: `[~y]` or `[rit]`
- Indent to Here: `[~i]` or `[ith]`

If you think another character/symbol/marker that isn't easily entered via keyboard might makes sense, let me know and I will add it.

## Known Issues

- _Very_ occasionally, scope fails to update; It usually happens when clicking _really, really fast_ between a story/textframe and a document. It's a timing issue between InDesign and the plugin and there's nothing to be done.
- Selection doesn't match the original selection with changes - less characters is selected; When the selection mode is selection (i.e. highlighted text inside a text frame or story), and the selection reaches the end of Story (or text column, or text frame – unclear), InDesign occasionaly resolves the selection post-changes differently. I've mitigated the worst of non-matching selection before and after magic (e.g., when the first matched hyperlink was also the start of selection), but I can't find this one.

## Copyright and License

Copyright 2023 Adam Kiss

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this plugin except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
