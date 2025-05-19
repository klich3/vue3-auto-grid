import { ref } from "vue";

export function useGridPositioning(cellSize, gutter, numColumns) {
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
