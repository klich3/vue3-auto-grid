import { ref } from "vue";

export function useMasonryLayout(items, containerRef, gutter = 16) {
	const numColumns = ref(4);
	const gridHeight = ref(0);
	const cellSize = ref(0);
	const ghostPosition = ref(null);
	const draggedItemId = ref(null);

	const previousPositions = ref(new Map());

	let updateTimeoutId = null;

	const calculateResponsiveLayout = () => {
		if (!containerRef.value) return;

		const containerWidth = containerRef.value.offsetWidth;
		console.log("Container width:", containerWidth);

		const totalGutterWidth = gutter * (numColumns.value - 1);
		cellSize.value = Math.floor(
			(containerWidth - totalGutterWidth) / numColumns.value
		);

		items.forEach((item) => {
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
		});

		updateLayout(null, true);
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

	const conflictsWithGhost = (row, col, colSpan, rowSpan) => {
		if (!ghostPosition.value) return false;

		const ghost = ghostPosition.value;

		for (let r = 0; r < rowSpan; r++) {
			for (let c = 0; c < colSpan; c++) {
				const currentRow = row + r;
				const currentCol = col + c;

				for (let gr = 0; gr < ghost.rowSpan; gr++) {
					for (let gc = 0; gc < ghost.colSpan; gc++) {
						if (
							currentRow === ghost.row + gr &&
							currentCol === ghost.col + gc
						) {
							return true;
						}
					}
				}
			}
		}

		return false;
	};

	const findAffectedItems = (matrix, ghostPos) => {
		if (!ghostPos) return [];

		const affected = new Set();
		const { row, col, rowSpan, colSpan } = ghostPos;

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

	const updateLayout = (targetPosition = null, forceRecalculate = false) => {
		if (!containerRef.value) return;

		if (targetPosition) ghostPosition.value = targetPosition;

		const gridMatrix = [];
		const maxRows = 100;

		// Inicializar matriz
		for (let row = 0; row < maxRows; row++) {
			gridMatrix[row] = [];
			for (let col = 0; col < numColumns.value; col++) {
				gridMatrix[row][col] = null;
			}
		}

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

		const draggedItem = items.find((item) => item.isDragging);

		if (draggedItem && ghostPosition.value) {
			draggedItemId.value = draggedItem.id;

			const { col, row, colSpan, rowSpan } = ghostPosition.value;
			for (let r = 0; r < rowSpan; r++) {
				for (let c = 0; c < colSpan; c++) {
					if (row + r < maxRows && col + c < numColumns.value) {
						gridMatrix[row + r][col + c] = "ghost";
					}
				}
			}
		} else if (draggedItemId.value && !draggedItem && ghostPosition.value) {
			const releasedItem = items.find(
				(item) => item.id === draggedItemId.value
			);

			if (releasedItem) {
				const { col, row } = ghostPosition.value;
				releasedItem.style.left = `${col * (cellSize.value + gutter)}px`;
				releasedItem.style.top = `${row * (cellSize.value + gutter)}px`;

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
		}
		const affectedIds = ghostPosition.value
			? findAffectedItems(gridMatrix, ghostPosition.value)
			: [];

		items.forEach((item) => {
			if (item.isDragging) return;
			if (gridMatrix.flat().includes(item.id)) return;

			if (!forceRecalculate && !affectedIds.includes(item.id)) {
				const prevPosition = previousPositions.value.get(item.id);

				if (prevPosition) {
					const colSpan = item.colSpan || 1;
					const rowSpan = item.rowSpan || 1;

					let canStay = true;
					for (let r = 0; r < rowSpan && canStay; r++) {
						for (let c = 0; c < colSpan && canStay; c++) {
							if (
								isPositionOccupied(
									gridMatrix,
									prevPosition.row + r,
									prevPosition.col + c,
									item.id
								)
							) {
								canStay = false;
							}
						}
					}

					if (canStay) {
						for (let r = 0; r < rowSpan; r++) {
							for (let c = 0; c < colSpan; c++) {
								const currentRow = prevPosition.row + r;
								const currentCol = prevPosition.col + c;
								if (currentRow < maxRows && currentCol < numColumns.value) {
									gridMatrix[currentRow][currentCol] = item.id;
								}
							}
						}

						item.style.left = `${
							prevPosition.col * (cellSize.value + gutter)
						}px`;
						item.style.top = `${
							prevPosition.row * (cellSize.value + gutter)
						}px`;
						return;
					}
				}
			}

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

						const currentLeft = parseInt(item.style.left || "0");
						const currentTop = parseInt(item.style.top || "0");

						if (
							Math.abs(currentLeft - left) > 1 ||
							Math.abs(currentTop - top) > 1
						) {
							item.style.transition = "all 0.25s ease-out";
							setTimeout(() => {
								if (!item.isDragging) {
									item.style.transition = "none";
								}
							}, 250);
						}

						item.style.left = `${left}px`;
						item.style.top = `${top}px`;
						placed = true;
					}
				}
			}
		});

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

	const updateGhostPosition = (position) => {
		if (!position) return;

		if (updateTimeoutId) {
			clearTimeout(updateTimeoutId);
		}

		ghostPosition.value = position;

		updateTimeoutId = setTimeout(() => {
			updateLayout(position);
			updateTimeoutId = null;
		}, 50);
	};

	const finalizeDrag = (draggedItem) => {
		if (ghostPosition.value && draggedItem) {
			const { col, row } = ghostPosition.value;

			draggedItem.style.left = `${col * (cellSize.value + gutter)}px`;
			draggedItem.style.top = `${row * (cellSize.value + gutter)}px`;
			draggedItem.style.transition = "all 0.25s ease-out";

			previousPositions.value.set(draggedItem.id, { row, col });

			setTimeout(() => {
				draggedItem.style.transition = "none";
			}, 250);

			const lastGhostPos = { ...ghostPosition.value };
			ghostPosition.value = null;

			updateLayout(null, false);
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
	};
}
