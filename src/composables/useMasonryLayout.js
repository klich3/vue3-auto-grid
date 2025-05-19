import { ref } from "vue";

export function useMasonryLayout(items, containerRef, gutter = 16) {
	const numColumns = ref(4);
	const gridHeight = ref(0);
	const cellSize = ref(0);

	const calculateResponsiveLayout = () => {
		if (!containerRef.value) return;

		const containerWidth = containerRef.value.offsetWidth;
		console.log("Container width:", containerWidth);

		const totalGutterWidth = gutter * (numColumns.value - 1);
		cellSize.value = Math.floor(
			(containerWidth - totalGutterWidth) / numColumns.value
		);

		items.forEach((item) => {
			if (!item.gridType) {
				const originalWidth = parseInt(item.style.width);
				const originalHeight = parseInt(item.style.height);

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
		});

		updateLayout();
	};

	const updateLayout = () => {
		if (!containerRef.value) return;

		const gridMatrix = [];
		const maxRows = 100;

		for (let row = 0; row < maxRows; row++) {
			gridMatrix[row] = [];
			for (let col = 0; col < numColumns.value; col++) {
				gridMatrix[row][col] = null;
			}
		}

		items.forEach((item) => {
			if (item.isDragging && item.originalPosition) return;

			const colSpan = item.colSpan || 1;
			const rowSpan = item.rowSpan || 1;

			let placed = false;
			for (let row = 0; row < maxRows && !placed; row++) {
				for (let col = 0; col <= numColumns.value - colSpan && !placed; col++) {
					let canPlace = true;
					for (let r = 0; r < rowSpan && canPlace; r++) {
						for (let c = 0; c < colSpan && canPlace; c++) {
							if (gridMatrix[row + r][col + c] !== null) {
								canPlace = false;
							}
						}
					}

					if (canPlace) {
						for (let r = 0; r < rowSpan; r++) {
							for (let c = 0; c < colSpan; c++) {
								gridMatrix[row + r][col + c] = item.id;
							}
						}

						const left = col * (cellSize.value + gutter);
						const top = row * (cellSize.value + gutter);

						item.style.left = `${left}px`;
						item.style.top = `${top}px`;
						placed = true;
					}
				}
			}
		});

		let maxRow = 0;
		for (let row = 0; row < maxRows; row++) {
			for (let col = 0; col < numColumns.value; col++) {
				if (gridMatrix[row][col] !== null && row > maxRow) {
					maxRow = row;
				}
			}
		}

		const gridHeightValue = (maxRow + 1) * (cellSize.value + gutter) + gutter;
		gridHeight.value = gridHeightValue;

		if (containerRef.value) {
			containerRef.value.style.height = `${gridHeightValue}px`;
			//eslint-disable-next-line no-console
			console.log(`Grid height set to ${gridHeightValue}px`);
		}
	};

	return {
		numColumns,
		gridHeight,
		cellSize,
		calculateResponsiveLayout,
		updateLayout,
	};
}
