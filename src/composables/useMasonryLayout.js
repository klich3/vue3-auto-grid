/*
█▀ █▄█ █▀▀ █░█ █▀▀ █░█
▄█ ░█░ █▄▄ █▀█ ██▄ ▀▄▀

Author: <Anton Sychev> (anton at sychev dot xyz)
useMasonryLayout.js (c) 2025
Created:  2025-05-20 05:10:16 
Desc: layout for masonry grid
*/

import { ref } from "vue";
import { useGridPositioning } from "@/composables/useGridPositioning";
import { useGridCollision } from "@/composables/useGridCollision";

/**
 * Custom composable for managing a masonry grid layout with drag-and-drop functionality.
 *
 * @param {Array<Object>} items - The list of items to be displayed in the grid. Each item should have an `id` and `style` properties.
 * @param {Ref<HTMLElement>} containerRef - A Vue ref pointing to the container element of the grid.
 * @param {number} [gutter=16] - The spacing (in pixels) between grid items.
 * @returns {Object} - An object containing reactive properties and methods for managing the grid layout.
 */
export function useMasonryLayout(items, containerRef, gutter = 16) {
	const numColumns = ref(4);
	const gridHeight = ref(0);
	const cellSize = ref(0);
	const ghostPosition = ref(null);
	const draggedItemId = ref(null);
	const displacedItemId = ref(null);
	const previousPositions = ref(new Map());

	const { pixelsToGridPosition, gridPositionToPixels } = useGridPositioning(
		cellSize,
		gutter,
		numColumns
	);

	const { getItemAtPosition, resetCollisionCache } = useGridCollision(
		items,
		cellSize,
		gutter
	);

	let updateTimeoutId = null;
	let isLayoutUpdating = false;
	let layoutUpdateScheduled = false;

	/**
	 * Creates an empty grid matrix with the specified number of rows and columns.
	 * @param {number} [maxRows=100] - The maximum number of rows in the grid.
	 * @returns {Array<Array<null>>} A 2D array representing the grid matrix.
	 */
	const createEmptyGridMatrix = (maxRows = 100) => {
		const matrix = [];
		for (let row = 0; row < maxRows; row++) {
			matrix[row] = [];
			for (let col = 0; col < numColumns.value; col++) {
				matrix[row][col] = null;
			}
		}
		return matrix;
	};

	/**
	 * Recalculates the layout based on the container's width and updates item dimensions.
	 * @returns {void}
	 */
	const calculateResponsiveLayout = () => {
		if (!containerRef.value) return;

		const containerWidth = containerRef.value.offsetWidth;
		const totalGutterWidth = gutter * (numColumns.value - 1);

		cellSize.value = Math.floor(
			(containerWidth - totalGutterWidth) / numColumns.value
		);

		items.forEach((item) => setItemDimensions(item));
		updateLayout(null, true);
	};

	/**
	 * Sets the dimensions and grid type of an item based on its original size.
	 * @param {Object} item - The item to set dimensions for.
	 * @returns {void}
	 */
	const setItemDimensions = (item) => {
		const originalWidth = parseInt(item.style.width || 0);
		const originalHeight = parseInt(item.style.height || 0);

		if (!item.gridType) {
			if (originalWidth > originalHeight * 1.5) {
				item.gridType = "wide";
			} else if (originalHeight > originalWidth * 1.5) {
				item.gridType = "tall";
			} else {
				item.gridType = "square";
			}
		}

		switch (item.gridType) {
			case "wide":
				item.style.width = `${cellSize.value * 2 + gutter}px`;
				item.style.height = `${cellSize.value}px`;
				item.colSpan = 2;
				item.rowSpan = 1;
				break;
			case "tall":
				item.style.width = `${cellSize.value}px`;
				item.style.height = `${cellSize.value * 2 + gutter}px`;
				item.colSpan = 1;
				item.rowSpan = 2;
				break;
			case "square":
			default:
				item.style.width = `${cellSize.value}px`;
				item.style.height = `${cellSize.value}px`;
				item.colSpan = 1;
				item.rowSpan = 1;
		}
	};

	/**
	 * Checks if a specific position in the grid matrix is occupied.
	 * @param {Array<Array<null|string>>} matrix - The grid matrix.
	 * @param {number} row - The row index.
	 * @param {number} col - The column index.
	 * @param {string|null} [excludeId=null] - An ID to exclude from the check.
	 * @returns {boolean} True if the position is occupied, false otherwise.
	 */
	const isPositionOccupied = (matrix, row, col, excludeId = null) => {
		if (row >= matrix.length || col >= numColumns.value) return true;

		const cellContent = matrix[row][col];
		return (
			cellContent !== null &&
			cellContent !== excludeId &&
			cellContent !== "ghost"
		);
	};

	/**
	 * Finds all items affected by the ghost position in the grid matrix.
	 * @param {Array<Array<null|string>>} matrix - The grid matrix.
	 * @param {Object|null} ghostPos - The ghost position object.
	 * @returns {Array<string>} An array of affected item IDs.
	 */
	const findAffectedItems = (matrix, ghostPos) => {
		if (!ghostPos) return [];

		const affected = new Set();
		const { row, col, rowSpan = 1, colSpan = 1 } = ghostPos;

		for (let r = 0; r < rowSpan; r++) {
			for (let c = 0; c < colSpan; c++) {
				const currentRow = row + r;
				const currentCol = col + c;

				if (
					currentRow < matrix.length &&
					currentCol < numColumns.value &&
					matrix[currentRow][currentCol] !== null &&
					matrix[currentRow][currentCol] !== "ghost"
				) {
					affected.add(matrix[currentRow][currentCol]);
				}
			}
		}

		return [...affected];
	};

	/**
	 * Places an item in the grid layout, recalculating its position if necessary.
	 * @param {Object} item - The item to place.
	 * @param {Array<Array<null|string>>} gridMatrix - The grid matrix.
	 * @param {number} maxRows - The maximum number of rows in the grid.
	 * @param {boolean} needsRecalculation - Whether the item's position needs recalculation.
	 * @returns {void}
	 */
	const placeItemInLayout = (item, gridMatrix, maxRows, needsRecalculation) => {
		if (!needsRecalculation) {
			const prevPosition = previousPositions.value.get(item.id);

			if (prevPosition) {
				const colSpan = item.colSpan || 1;
				const rowSpan = item.rowSpan || 1;
				const { row, col } = prevPosition;

				let canStay = true;
				for (let r = 0; r < rowSpan && canStay; r++) {
					for (let c = 0; c < colSpan && canStay; c++) {
						if (isPositionOccupied(gridMatrix, row + r, col + c, item.id)) {
							canStay = false;
						}
					}
				}

				if (canStay) {
					for (let r = 0; r < rowSpan; r++) {
						for (let c = 0; c < colSpan; c++) {
							if (row + r < maxRows && col + c < numColumns.value) {
								gridMatrix[row + r][col + c] = item.id;
							}
						}
					}

					const { left, top } = gridPositionToPixels(col, row);
					item.style.left = `${left}px`;
					item.style.top = `${top}px`;
					return;
				}
			}
		}

		findNewPosition(item, gridMatrix, maxRows);
	};

	/**
	 * Finds a new position for an item in the grid matrix.
	 * @param {Object} item - The item to place.
	 * @param {Array<Array<null|string>>} gridMatrix - The grid matrix.
	 * @param {number} maxRows - The maximum number of rows in the grid.
	 * @returns {boolean} True if a position was found, false otherwise.
	 */
	const findNewPosition = (item, gridMatrix, maxRows) => {
		const colSpan = item.colSpan || 1;
		const rowSpan = item.rowSpan || 1;

		for (let row = 0; row < maxRows; row++) {
			for (let col = 0; col <= numColumns.value - colSpan; col++) {
				if (checkSpaceAvailability(gridMatrix, row, col, rowSpan, colSpan)) {
					placeItemAtPosition(item, gridMatrix, row, col, rowSpan, colSpan);
					return true;
				}
			}
		}

		return false;
	};

	/**
	 * Checks if a specific space in the grid matrix is available.
	 * @param {Array<Array<null|string>>} matrix - The grid matrix.
	 * @param {number} row - The starting row index.
	 * @param {number} col - The starting column index.
	 * @param {number} rowSpan - The number of rows the item spans.
	 * @param {number} colSpan - The number of columns the item spans.
	 * @returns {boolean} True if the space is available, false otherwise.
	 */
	const checkSpaceAvailability = (matrix, row, col, rowSpan, colSpan) => {
		for (let r = 0; r < rowSpan; r++) {
			for (let c = 0; c < colSpan; c++) {
				if (matrix[row + r][col + c] !== null) {
					return false;
				}
			}
		}
		return true;
	};

	/**
	 * Places an item at a specific position in the grid matrix.
	 * @param {Object} item - The item to place.
	 * @param {Array<Array<null|string>>} gridMatrix - The grid matrix.
	 * @param {number} row - The row index.
	 * @param {number} col - The column index.
	 * @param {number} rowSpan - The number of rows the item spans.
	 * @param {number} colSpan - The number of columns the item spans.
	 * @returns {boolean} True if the item was placed successfully, false otherwise.
	 */
	const placeItemAtPosition = (
		item,
		gridMatrix,
		row,
		col,
		rowSpan,
		colSpan
	) => {
		for (let r = 0; r < rowSpan; r++) {
			for (let c = 0; c < colSpan; c++) {
				gridMatrix[row + r][col + c] = item.id;
			}
		}

		const { left, top } = gridPositionToPixels(col, row);
		const currentLeft = parseInt(item.style.left || "0");
		const currentTop = parseInt(item.style.top || "0");

		if (Math.abs(currentLeft - left) > 1 || Math.abs(currentTop - top) > 1) {
			item.style.transition = "all 0.25s ease-out";
			if (!item.isDragging) item.style.transition = "none";
		}

		item.style.left = `${left}px`;
		item.style.top = `${top}px`;

		return true;
	};

	/**
	 * Updates the ghost position in the grid layout.
	 * @param {Object|null} position - The new ghost position.
	 * @returns {void}
	 */
	const updateGhostPosition = (position) => {
		if (!position) return;

		if (updateTimeoutId) clearTimeout(updateTimeoutId);

		const draggedItem = items.find((item) => item.isDragging);
		const itemAtPosition = getItemAtPosition(
			position.row,
			position.col,
			draggedItem
		);

		if (
			itemAtPosition &&
			(!draggedItem || itemAtPosition.id !== draggedItem.id)
		) {
			displacedItemId.value = itemAtPosition.id;
		} else {
			displacedItemId.value = null;
		}

		ghostPosition.value = position;

		updateTimeoutId = setTimeout(() => {
			updateLayout(position, false, displacedItemId.value);
			updateTimeoutId = null;
		}, 25);
	};

	/**
	 * Updates the grid layout based on the current state and parameters.
	 * @param {Object|null} [targetPosition=null] - The target position for the ghost.
	 * @param {boolean} [forceRecalculate=false] - Whether to force recalculation of the layout.
	 * @param {string|null} [displacedId=null] - The ID of the displaced item.
	 * @param {string|null} [fixedItemId=null] - The ID of the fixed item.
	 * @returns {void}
	 */
	const updateLayout = (
		targetPosition = null,
		forceRecalculate = false,
		displacedId = null,
		fixedItemId = null
	) => {
		if (!containerRef.value || isLayoutUpdating || layoutUpdateScheduled)
			return;

		isLayoutUpdating = true;

		try {
			if (targetPosition) ghostPosition.value = targetPosition;

			const maxRows = 100;
			const gridMatrix = createEmptyGridMatrix(maxRows);

			resetCollisionCache();
			storeCurrentPositions();
			processGhostAndDraggedItem(gridMatrix, maxRows, fixedItemId);

			const affectedIds = findAffectedItems(gridMatrix, ghostPosition.value);
			if (displacedId && !affectedIds.includes(displacedId))
				affectedIds.push(displacedId);

			if (displacedId)
				processDisplacedItem(displacedId, gridMatrix, maxRows, fixedItemId);

			processRemainingItems(
				gridMatrix,
				maxRows,
				affectedIds,
				fixedItemId,
				forceRecalculate
			);

			updatePreviousPositions();
			updateGridHeight(gridMatrix, maxRows);
		} catch (error) {
			console.error("Error durante la actualización del layout:", error);
		} finally {
			setTimeout(() => {
				isLayoutUpdating = false;
			}, 25);
		}
	};

	/**
	 * Stores the current positions of all items in the grid.
	 * @returns {void}
	 */
	const storeCurrentPositions = () => {
		const currentPositions = new Map();
		items.forEach((item) => {
			if (!item.isDragging) {
				const row = Math.floor(
					parseInt(item.style.top || 0) / (cellSize.value + gutter)
				);
				const col = Math.floor(
					parseInt(item.style.left || 0) / (cellSize.value + gutter)
				);
				currentPositions.set(item.id, { row, col });
			}
		});
	};

	/**
	 * Processes the ghost and dragged item in the grid layout.
	 * @param {Array<Array<null|string>>} gridMatrix - The grid matrix.
	 * @param {number} maxRows - The maximum number of rows in the grid.
	 * @param {string|null} fixedItemId - The ID of the fixed item.
	 * @returns {void}
	 */
	const processGhostAndDraggedItem = (gridMatrix, maxRows, fixedItemId) => {
		const draggedItem = items.find((item) => item.isDragging);

		if (draggedItem && ghostPosition.value) {
			draggedItemId.value = draggedItem.id;

			const { col, row, colSpan = 1, rowSpan = 1 } = ghostPosition.value;
			for (let r = 0; r < rowSpan; r++) {
				for (let c = 0; c < colSpan; c++) {
					if (row + r < maxRows && col + c < numColumns.value) {
						gridMatrix[row + r][col + c] = "ghost";
					}
				}
			}
		} else if (fixedItemId) {
			const fixedItem = items.find((item) => item.id === fixedItemId);
			if (fixedItem) {
				const pos = previousPositions.value.get(fixedItem.id);
				if (pos) {
					const { row, col } = pos;
					const colSpan = fixedItem.colSpan || 1;
					const rowSpan = fixedItem.rowSpan || 1;

					for (let r = 0; r < rowSpan; r++) {
						for (let c = 0; c < colSpan; c++) {
							if (row + r < maxRows && col + c < numColumns.value) {
								gridMatrix[row + r][col + c] = fixedItem.id;
							}
						}
					}
				}
			}
		} else if (draggedItemId.value && !draggedItem && ghostPosition.value) {
			processReleasedItem(gridMatrix, maxRows);
		}
	};

	/**
	 * Processes a released item in the grid layout.
	 * @param {Array<Array<null|string>>} gridMatrix - The grid matrix.
	 * @param {number} maxRows - The maximum number of rows in the grid.
	 * @returns {void}
	 */
	const processReleasedItem = (gridMatrix, maxRows) => {
		const releasedItem = items.find((item) => item.id === draggedItemId.value);

		if (releasedItem) {
			const { col, row } = ghostPosition.value;
			const { left, top } = gridPositionToPixels(col, row);

			releasedItem.style.left = `${left}px`;
			releasedItem.style.top = `${top}px`;

			const colSpan = releasedItem.colSpan || 1;
			const rowSpan = releasedItem.rowSpan || 1;

			for (let r = 0; r < rowSpan; r++) {
				for (let c = 0; c < colSpan; c++) {
					if (row + r < maxRows && col + c < numColumns.value) {
						gridMatrix[row + r][col + c] = releasedItem.id;
					}
				}
			}

			previousPositions.value.set(releasedItem.id, { row, col });
			draggedItemId.value = null;
			ghostPosition.value = null;
		}
	};

	/**
	 * Processes a displaced item in the grid layout.
	 * @param {string} displacedId - The ID of the displaced item.
	 * @param {Array<Array<null|string>>} gridMatrix - The grid matrix.
	 * @param {number} maxRows - The maximum number of rows in the grid.
	 * @param {string|null} fixedItemId - The ID of the fixed item.
	 * @returns {void}
	 */
	const processDisplacedItem = (
		displacedId,
		gridMatrix,
		maxRows,
		fixedItemId
	) => {
		const displacedItem = items.find((item) => item.id === displacedId);
		if (displacedItem && displacedItem.id !== fixedItemId) {
			placeItemInLayout(displacedItem, gridMatrix, maxRows, true);
		}
	};

	/**
	 * Processes the remaining items in the grid layout.
	 * @param {Array<Array<null|string>>} gridMatrix - The grid matrix.
	 * @param {number} maxRows - The maximum number of rows in the grid.
	 * @param {Array<string>} affectedIds - The IDs of affected items.
	 * @param {string|null} fixedItemId - The ID of the fixed item.
	 * @param {boolean} forceRecalculate - Whether to force recalculation of the layout.
	 * @returns {void}
	 */
	const processRemainingItems = (
		gridMatrix,
		maxRows,
		affectedIds,
		fixedItemId,
		forceRecalculate
	) => {
		items.forEach((item) => {
			if (item.isDragging) return;
			if (item.id === fixedItemId) return;
			if (item.id === displacedItemId.value) return;
			if (gridMatrix.flat().includes(item.id)) return;

			placeItemInLayout(
				item,
				gridMatrix,
				maxRows,
				forceRecalculate || affectedIds.includes(item.id)
			);
		});
	};

	/**
	 * Updates the previous positions of all items in the grid.
	 * @returns {void}
	 */
	const updatePreviousPositions = () => {
		previousPositions.value = new Map();
		items.forEach((item) => {
			if (!item.isDragging) {
				const row = Math.floor(
					parseInt(item.style.top || 0) / (cellSize.value + gutter)
				);
				const col = Math.floor(
					parseInt(item.style.left || 0) / (cellSize.value + gutter)
				);
				previousPositions.value.set(item.id, { row, col });
			}
		});
	};

	/**
	 * Updates the height of the grid based on its content.
	 * @param {Array<Array<null|string>>} gridMatrix - The grid matrix.
	 * @param {number} maxRows - The maximum number of rows in the grid.
	 * @returns {void}
	 */
	const updateGridHeight = (gridMatrix, maxRows) => {
		let maxRow = 0;

		for (let row = 0; row < maxRows; row++) {
			for (let col = 0; col < numColumns.value; col++) {
				if (gridMatrix[row][col] !== null && row > maxRow) {
					maxRow = row;
				}
			}
		}

		let additionalRows = 0;
		for (let col = 0; col < numColumns.value; col++) {
			if (gridMatrix[maxRow][col] !== null) {
				const itemId = gridMatrix[maxRow][col];
				const item = items.find((i) => i.id === itemId);
				if (item && item.rowSpan > 1) {
					additionalRows = Math.max(additionalRows, item.rowSpan - 1);
				}
			}
		}

		const gridHeightValue =
			(maxRow + 1 + additionalRows) * (cellSize.value + gutter) + gutter;
		gridHeight.value = gridHeightValue;

		if (containerRef.value) {
			containerRef.value.style.height = `${gridHeightValue}px`;
		}
	};

	/**
	 * Finalizes the drag operation for a dragged item.
	 * @param {Object} draggedItem - The dragged item.
	 * @returns {void}
	 */
	const finalizeDrag = (draggedItem) => {
		if (ghostPosition.value && draggedItem) {
			const { col, row } = ghostPosition.value;
			const { left, top } = gridPositionToPixels(col, row);

			draggedItem.style.left = `${left}px`;
			draggedItem.style.top = `${top}px`;
			draggedItem.style.transition = "all 0.25s ease-out";
			draggedItem.style.zIndex = "95";
			previousPositions.value.set(draggedItem.id, { row, col });

			const lastGhostPos = { ...ghostPosition.value };
			ghostPosition.value = null;
			displacedItemId.value = null;

			setTimeout(() => {
				updateLayout(null, false, null, draggedItem.id);

				draggedItemId.value = null;

				if (draggedItem) {
					draggedItem.style.transition = "none";
					draggedItem.style.zIndex = "";
				}
			}, 10);
		}
	};

	/**
	 * Finalizes the drag operation for a dragged item and locks its position.
	 * @param {Object} draggedItem - The dragged item.
	 * @returns {void}
	 */
	const finalizeDragAndLock = (draggedItem) => {
		if (!ghostPosition.value || !draggedItem) return;

		if (updateTimeoutId) {
			clearTimeout(updateTimeoutId);
			updateTimeoutId = null;
		}

		if (isLayoutUpdating || layoutUpdateScheduled) return;

		layoutUpdateScheduled = true;

		try {
			const { col, row } = ghostPosition.value;
			const { left, top } = gridPositionToPixels(col, row);

			draggedItem.style.left = `${left}px`;
			draggedItem.style.top = `${top}px`;
			draggedItem.style.transition = "all 0.25s ease-out";
			draggedItem.style.zIndex = "95";

			previousPositions.value.set(draggedItem.id, { row, col });

			const maxRows = 100;
			const gridMatrix = createEmptyGridMatrix(maxRows);

			const colSpan = draggedItem.colSpan || 1;
			const rowSpan = draggedItem.rowSpan || 1;

			for (let r = 0; r < rowSpan; r++) {
				for (let c = 0; c < colSpan; c++) {
					if (row + r < maxRows && col + c < numColumns.value) {
						gridMatrix[row + r][col + c] = draggedItem.id;
					}
				}
			}

			ghostPosition.value = null;
			displacedItemId.value = null;

			updateTimeoutId = setTimeout(() => {
				isLayoutUpdating = true;
				layoutUpdateScheduled = false;

				try {
					processRemainingItems(gridMatrix, maxRows, [], draggedItem.id, false);

					updateGridHeight(gridMatrix, maxRows);
					updatePreviousPositions();
				} finally {
					draggedItemId.value = null;
					setTimeout(() => {
						if (draggedItem) {
							draggedItem.style.transition = "none";
							draggedItem.style.zIndex = "";
						}
						isLayoutUpdating = false;
					}, 250);
				}
			}, 20);
		} catch (error) {
			layoutUpdateScheduled = false;
		}
	};

	return {
		numColumns,
		gridHeight,
		cellSize,
		ghostPosition,
		calculateResponsiveLayout,
		updateLayout,
		updateGhostPosition,
		finalizeDrag,
		finalizeDragAndLock,
		getItemAtPosition,
		pixelsToGridPosition,
	};
}
