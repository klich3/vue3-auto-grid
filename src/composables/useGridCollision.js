import { ref } from "vue";

export function useGridCollision(items, cellSize, gutter) {
	const collisionCache = ref({
		key: null,
		result: null,
	});

	const generateCacheKey = (row, col, draggedItemId) => {
		return `${row}-${col}-${draggedItemId || "null"}`;
	};

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
