import { ref, computed } from "vue";
import { useGridPositioning } from "@/composables/useGridPositioning";
import { useGridCollision } from "@/composables/useGridCollision";

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

	const isPositionOccupied = (matrix, row, col, excludeId = null) => {
		if (row >= matrix.length || col >= numColumns.value) return true;

		const cellContent = matrix[row][col];
		return (
			cellContent !== null &&
			cellContent !== excludeId &&
			cellContent !== "ghost"
		);
	};

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

	let layoutUpdateScheduled = false;

	const finalizeDragAndLock = (draggedItem) => {
		if (!ghostPosition.value || !draggedItem) return;

		if (updateTimeoutId) {
			clearTimeout(updateTimeoutId);
			updateTimeoutId = null;
		}

		if (isLayoutUpdating || layoutUpdateScheduled) {
			console.log("Actualización de layout ya en curso, no se iniciará otra.");
			return;
		}

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
			console.error("Error durante finalizeDragAndLock:", error);
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
