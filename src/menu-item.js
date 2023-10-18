/**
 * Add or replace a menu item in "Plug-Ins" menu
 * for easier keyboard shortcut access.
 */
export default function createMenuItem({
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
		if (existingMenuItem.isValid) { existingMenuItem.remove() }
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
