/*
█▀ █▄█ █▀▀ █░█ █▀▀ █░█
▄█ ░█░ █▄▄ █▀█ ██▄ ▀▄▀

Author: <Anton Sychev> (anton at sychev dot xyz)
useGridPositioning.js (c) 2025
Created:  2025-05-20 05:10:42 
Desc: Provides utility functions for converting between pixel coordinates and grid positions in a grid layout system, considering cell size, gutter, and number of columns.
*/

import { ref } from "vue";

export function useGridPositioning(cellSize, gutter, numColumns) {
	/**
	 * Converts pixel coordinates to a grid position based on cell size and gutter spacing.
	 *
	 * @param {number} x - The x-coordinate in pixels.
	 * @param {number} y - The y-coordinate in pixels.
	 * @param {number} [itemColSpan=1] - The number of columns the item spans.
	 * @param {number} [itemRowSpan=1] - The number of rows the item spans.
	 * @returns {Object|null} The grid position object containing `col`, `row`, `colSpan`, and `rowSpan`,
	 *                        or `null` if cell size or coordinates are invalid.
	 * @returns {number} return.col - The column index in the grid.
	 * @returns {number} return.row - The row index in the grid.
	 * @returns {number} return.colSpan - The column span of the item.
	 * @returns {number} return.rowSpan - The row span of the item.
	 */
	const pixelsToGridPosition = (x, y, itemColSpan = 1, itemRowSpan = 1) => {
		if (!cellSize.value || x == null || y == null) return null;

		const col = Math.floor(x / (cellSize.value + gutter));
		const row = Math.floor(y / (cellSize.value + gutter));

		const validCol = Math.min(Math.max(0, col), numColumns.value - itemColSpan);
		const validRow = Math.max(0, row);

		return {
			col: validCol,
			row: validRow,
			colSpan: itemColSpan,
			rowSpan: itemRowSpan,
		};
	};

	/**
	 * Converts grid position (column and row) to pixel coordinates.
	 *
	 * @param {number} col - The column index in the grid.
	 * @param {number} row - The row index in the grid.
	 * @returns {{ left: number, top: number }} An object containing the pixel coordinates
	 * for the left and top positions. Returns { left: 0, top: 0 } if `cellSize.value` is not defined.
	 */
	const gridPositionToPixels = (col, row) => {
		if (!cellSize.value) return { left: 0, top: 0 };

		return {
			left: col * (cellSize.value + gutter),
			top: row * (cellSize.value + gutter),
		};
	};

	return {
		pixelsToGridPosition,
		gridPositionToPixels,
	};
}
