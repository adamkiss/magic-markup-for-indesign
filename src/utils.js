export function $ (selector) {
	return document.querySelector(selector)
}

export function $$ (selector) {
	return document.querySelectorAll(selector)
}

export function ensureParagraphStyles(document, names) {
	const paraStyles = document.paragraphStyles

	names.map(name => {
		const style = paraStyles.itemByName(name)
		if (! style.isValid) paraStyles.add({name})
	})
}

export function ensureCharacterStyles(document, names) {
	const charStyles = document.characterStyles

	names.map(name => {
		const style = charStyles.itemByName(name)
		if (! style.isValid) charStyles.add({name})
	})
}

export function resetGrepPreferences(app) {
	app.findGrepPreferences = null
	app.changeGrepPreferences = null
}

/**
 * Add or replace a menu item in "Plug-Ins" menu
 * for easier keyboard shortcut access.
 */
export function createMenuItem({
	app,
	pluginName,
	menuItemName,
	invokeCallback,
}) {
	try {
		const pluginMenu = app
			.menus.item('Main')
			.submenus.item('Plug-Ins')
			.submenus.item(pluginName)

		const existingMenuItem = pluginMenu.menuItems.itemByName(menuItemName);
		// if (existingMenuItem.isValid) { existingMenuItem.remove() }
		// ^ Keep if debugging/developing

		if (! existingMenuItem.isValid) {
			const menuItem = app.scriptMenuActions.add(menuItemName)
			menuItem.addEventListener('onInvoke', invokeCallback);
			pluginMenu.menuItems.add(menuItem)
		}

		return true
	} catch (error) {
		// Swallow the error
		console.error(error)
		return false
	}
}

function removeOldMenuItemsInSubmenu(menu) {
	for (let index = 0; index < menu.menuItems.length; index++) {
		const menuItem = menu.menuItems.item(index);

		if (!(menuItem.isValid && menuItem.name.includes('Apply Magic Markup'))) continue
		menuItem.remove()
	}
}

export function cleanUpMenuItems({app, currentPluginName}) {
	try {
		const pluginMenu = app
			.menus.item('Main')
			.submenus.item('Plug-Ins')

		removeOldMenuItemsInSubmenu(pluginMenu)

		for (let index = 0; index < pluginMenu.submenus.length; index++) {
			const submenu = pluginMenu.submenus.item(index);

			if (!submenu.isValid || !submenu.name.includes('Magic Markup')) continue

			if (submenu.name !== currentPluginName && submenu.isValid) {
				submenu.remove()
			} else if (submenu.isValid) {
				removeOldMenuItemsInSubmenu(submenu)
			}
		}

		return true
	} catch (error) {
		console.error('CLEANUP', error)
		return false
	}
}
