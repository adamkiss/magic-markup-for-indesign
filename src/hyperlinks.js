const {app,Story, Document, Text, Paragraph, TextStyleRange, TextFrame} = require('indesign')

import cconsole from "./cconsole.js";
import { itemByNameOrAdd } from "./utils.js";

/*
Note: Markdown link ISN'T GLOBAL, because when we replace it with a hyperlink,
the internal match index of the regexp no longer matches the end the URL,
and we might miss some links

[First link](https://example.com) - has length of 33
First link [Second Link](https://example.com)
                                 ^ the next match starts here, and we miss the second link

On the other hand, the URL link MUST be global, because the length doesn't
change when we replace it, 	and we get stuck in a neverending loop
of matching the same link (actually: we don't, the script fails when try to
create hyperlink out of existing hyperlink)
*/
export const RE_MARKDOWN_LINK = /\[(?<text>.*?)\]\((?<url>(?:https?:\/\/|tel:|mailto:).*?)\)/i
export const RE_RAW_LINK = /(?<url>(?:https?:\/\/|tel:|mailto:)[A-z0-9\.\/\-\-\?=&\[\]\+@]+)/gi

/**
 * Replaces a text with a hyperlink.
 *
 * @param {Object} options Options object
 * @param {Story} options.story Story to work on
 * @param {number} options.index Index of the text to replace
 * @param {string} options.replace Text to replace
 * @param {string} options.text Text to replace with
 * @param {string} options.url URL to link to
 * @param {CharacterStyle} options.style Character style to apply
 * @returns boolean Indicates whether we should break the loop in the calling function, to prevent infinite loop
 */
export function replaceTextWithHyperlink({story, index, replace, text, url, style}) {
	const doc = story.parent

	if (!(
		(story instanceof Story && story.parent instanceof Document)
		|| story instanceof TextFrame
	)) return

	// get or create destination
	const destination = itemByNameOrAdd(doc.hyperlinkURLDestinations, url, {name: url})

	// remove original text
	story.characters.itemByRange(index, index + replace.length - 2).remove()

	// Find insertion point: either at the end of the story, or at the index
	const insertAt = story.contents.length === index
		? story.insertionPoints.lastItem()
		: story.characters.item(index)

	// insert new text, and create InDesign Objects out of it
	insertAt.contents = text
	const textSourceCharacters = story.characters.itemByRange(index, index + text.length - 1)
	const source = doc.hyperlinkTextSources.add(textSourceCharacters)

	// apply style
	textSourceCharacters.applyCharacterStyle(style)

	// get unique hyperlink name
	let name = text
	let counter = 2
	while(doc.hyperlinks.itemByName(name).isValid) {
		name = `${text} ${counter++}`
	}

	// finally: create hyperlink
	doc.hyperlinks.add(source, destination, {name})

	// return indicates whether we should break the loop
	return false
}

export function replaceMarkdownLinks ({
	root, story, isSelection, hyperlinkStyle
}) {
	RE_MARKDOWN_LINK.lastIndex = null
	let nextMatch = null
	while ((nextMatch = RE_MARKDOWN_LINK.exec(root.contents)) !== null) {
		const {index, 0: match, groups: {text, url}} = nextMatch

		try {
			const breakout = replaceTextWithHyperlink({
				story,
				index: isSelection ? index + root.index : index,
				replace: match, text, url,
				style: hyperlinkStyle
			})

			if (breakout) break
		} catch (error) {
			// Show the error for debugging, but continue with the execution
			// The most probable error: the selection is already a link
			// We don't want to stop the execution because of this
			cconsole.error('hyperlink-md', error)
		}

		// If we're working over selection, and first match occured at index 0
		// Indesign won't update the selection to include the new hyperlink
		// We need to adjust the selection manually
		if (isSelection && index === 0) {
			const {index: newIndex, length: newLength} = root

			// reset the selection to <replaced text> + "new selection"
			// note: the second part says "length", but it's actually the "end index",
			// so by adding the length to index before adjustment,
			// we're actually increasing the "length" of the selection
			try {
				root.parentStory.characters.itemByRange(
					-(text.length - 1) + newIndex , // <- shift index forward,
										 newIndex + newLength - 1 // <- the range stays the same
				).select()
			} catch (e) {}
		}
		// Sometimes (?) the root is invalid, and while it works, even resolving `root.isValid`
		// breaks the root.content in the next iteration. resetting the root to selection (again)
		// fixes the issue. This applies only for root being a selection, which identifies as
		if (
			root instanceof Text
			|| root instanceof Paragraph
			|| root instanceof TextStyleRange
		) {
			root = app.selection[0]
		}
	}
	return root
}

export function replaceRawLinks ({
	root, story, isSelection, hyperlinkStyle
}) {
	RE_RAW_LINK.lastIndex = 0
	let nextMatch = null
	while ((nextMatch = RE_RAW_LINK.exec(root.contents)) !== null) {
		const {index, 0: match, groups: {url}} = nextMatch

		// Capture original selection index & length size
		// Indesign updates the selection if the contents change,
		// but raw .contents actually didn't change.
		const {index: originalIndex, length: originalLength} = root

		try {
			const breakout = replaceTextWithHyperlink({
				story,
				index: isSelection ? index + root.index : index,
				replace: match, text: url, url,
				style: hyperlinkStyle
			})
			if (breakout) break
		} catch (error) {
			// Show the error for debugging, but continue with the execution
			// The most probable error: the selection is already a link
			// We don't want to stop the execution because of this
			// The end result is working link anyway
			cconsole.error('hyperlink-raw', error)
		}

		if (isSelection) {
			// Reset the selection to before the hyperlink creation
			root.parentStory.characters.itemByRange(originalIndex, originalIndex + originalLength - 1).select()
			root = app.selection[0]
		}
	}
	return root
}
