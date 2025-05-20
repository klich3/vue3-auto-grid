/*
█▀ █▄█ █▀▀ █░█ █▀▀ █░█
▄█ ░█░ █▄▄ █▀█ ██▄ ▀▄▀

Author: <Anton Sychev> (anton at sychev dot xyz)
gridUtils.js (c) 2025
Created:  2025-05-20 05:25:59 
Desc: Finds the index of the closest item to the given coordinates (x, y) within a container
Docs: documentation
*/

/**
 * @param {number} x - The x-coordinate to compare against.
 * @param {number} y - The y-coordinate to compare against.
 * @param {Array<Object>} items - An array of item objects, each containing an `id` property.
 * @param {HTMLElement} container - The container element that holds the grid items.
 * @param {string|number} excludeId - The ID of the item to exclude from the search.
 * @returns {number} The index of the closest item in the `items` array, or -1 if no item is found.
 */
export function findClosestItemIndex(x, y, items, container, excludeId) {
	let minDistance = Infinity;
	let closestIndex = -1;

	const gridItems = Array.from(container.querySelectorAll(".grid-item"));

	items.forEach((item, index) => {
		if (item.id === excludeId) return;

		const itemEl = gridItems.find(
			(el) => el.getAttribute("data-key") === String(item.id)
		);

		if (!itemEl) return;

		const rect = itemEl.getBoundingClientRect();
		const containerRect = container.getBoundingClientRect();

		const itemCenterX = rect.left - containerRect.left + rect.width / 2;
		const itemCenterY = rect.top - containerRect.top + rect.height / 2;

		const distance = Math.sqrt(
			Math.pow(x - itemCenterX, 2) + Math.pow(y - itemCenterY, 2)
		);

		if (distance < minDistance) {
			minDistance = distance;
			closestIndex = index;
		}
	});

	return closestIndex;
}

/**
 * Moves an item in an array from one index to another.
 *
 * @param {Array} array - The array containing the item to move.
 * @param {number} fromIndex - The index of the item to move.
 * @param {number} toIndex - The index to move the item to.
 * @returns {Array} The modified array with the item moved to the new position.
 */
export function moveArrayItem(array, fromIndex, toIndex) {
	if (fromIndex === toIndex) return array;

	const item = array.splice(fromIndex, 1)[0];
	array.splice(toIndex, 0, item);

	return array;
}

/**
 * Creates a debounced function that delays the invocation of the provided function
 * until after the specified wait time has elapsed since the last time the debounced
 * function was invoked.
 *
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to delay.
 * @returns {Function} A new debounced function.
 */
export function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

/**
 * Calculates the grid position (column and row) based on the given coordinates, cell size, gutter, and number of columns.
 *
 * @param {number} x - The x-coordinate in pixels.
 * @param {number} y - The y-coordinate in pixels.
 * @param {number} cellSize - The size of each grid cell in pixels.
 * @param {number} gutter - The spacing between grid cells in pixels.
 * @param {number} numColumns - The total number of columns in the grid.
 * @returns {{col: number, row: number}} An object containing the column (`col`) and row (`row`) indices of the grid position.
 */
export function getGridPosition(x, y, cellSize, gutter, numColumns) {
	const col = Math.floor(x / (cellSize + gutter));
	const row = Math.floor(y / (cellSize + gutter));

	return {
		col: Math.min(Math.max(0, col), numColumns - 1),
		row: Math.max(0, row),
	};
}
