/*
█▀ █▄█ █▀▀ █░█ █▀▀ █░█
▄█ ░█░ █▄▄ █▀█ ██▄ ▀▄▀

Author: <Anton Sychev> (anton at sychev dot xyz)
useGridCollision.js (c) 2025
Created:  2025-05-20 05:10:29 
Desc: detect collision of grid items
*/

import { ref } from "vue";

/**
 * Provides utilities for detecting grid collisions and retrieving items at specific positions.
 *
 * @param {Array} items - The list of grid items.
 * @param {Ref<number>} cellSize - The size of each grid cell (reactive reference).
 * @param {number} gutter - The spacing between grid cells.
 * @returns {Object} An object containing methods for collision detection and cache management.
 */
export function useGridCollision(items, cellSize, gutter) {
	const collisionCache = ref({
		key: null,
		result: null,
	});

	/**
	 * Generates a unique cache key based on the row, column, and dragged item ID.
	 *
	 * @param {number} row - The row index.
	 * @param {number} col - The column index.
	 * @param {string|null} draggedItemId - The ID of the dragged item (or null if none).
	 * @returns {string} The generated cache key.
	 */
	const generateCacheKey = (row, col, draggedItemId) => {
		return `${row}-${col}-${draggedItemId || "null"}`;
	};

	/**
	 * Detects if there is a collision between the dragged positions and a grid item.
	 *
	 * @param {Array<Object>} dragPositions - The positions occupied by the dragged item.
	 * @param {Object} item - The grid item to check for collision.
	 * @returns {boolean} True if a collision is detected, false otherwise.
	 */
	const detectCollision = (dragPositions, item) => {
		if (!item || item.isDragging) return false;

		const itemRow = Math.floor(
			parseInt(item.style.top || 0) / (cellSize.value + gutter)
		);
		const itemCol = Math.floor(
			parseInt(item.style.left || 0) / (cellSize.value + gutter)
		);
		const itemColSpan = item.colSpan || 1;
		const itemRowSpan = item.rowSpan || 1;

		const itemPositions = [];
		for (let r = 0; r < itemRowSpan; r++) {
			for (let c = 0; c < itemColSpan; c++) {
				itemPositions.push({
					row: itemRow + r,
					col: itemCol + c,
				});
			}
		}

		return dragPositions.some((dragPos) =>
			itemPositions.some(
				(itemPos) => dragPos.row === itemPos.row && dragPos.col === itemPos.col
			)
		);
	};

	/**
	 * Retrieves the grid item at a specific position, considering the dragged item.
	 *
	 * @param {number} row - The row index.
	 * @param {number} col - The column index.
	 * @param {Object|null} draggedItem - The currently dragged item (or null if none).
	 * @returns {Object|null} The grid item at the specified position, or null if none.
	 */
	const getItemAtPosition = (row, col, draggedItem = null) => {
		if (row == null || col == null || !cellSize.value) return null;

		const cacheKey = generateCacheKey(row, col, draggedItem?.id);
		if (collisionCache.value.key === cacheKey) {
			return collisionCache.value.result;
		}

		const dragColSpan = draggedItem ? draggedItem.colSpan || 1 : 1;
		const dragRowSpan = draggedItem ? draggedItem.rowSpan || 1 : 1;

		const dragPositions = [];
		for (let r = 0; r < dragRowSpan; r++) {
			for (let c = 0; c < dragColSpan; c++) {
				dragPositions.push({
					row: row + r,
					col: col + c,
				});
			}
		}

		const result = items.find((item) => {
			if (draggedItem && item.id === draggedItem.id) return false;
			return detectCollision(dragPositions, item);
		});

		collisionCache.value = {
			key: cacheKey,
			result,
		};

		return result;
	};

	/**
	 * Resets the collision cache to its initial state.
	 */
	const resetCollisionCache = () => {
		collisionCache.value = {
			key: null,
			result: null,
		};
	};

	return {
		getItemAtPosition,
		detectCollision,
		resetCollisionCache,
	};
}
