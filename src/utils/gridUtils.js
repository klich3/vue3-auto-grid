export function findClosestItemIndex(x, y, items, container, excludeId) {
	let minDistance = Infinity;
	let closestIndex = -1;

	const gridItems = Array.from(container.querySelectorAll(".grid-item"));

	//eslint-disable-next-line no-console
	console.log(`Buscando elemento más cercano a (${x}, ${y})`);
	//eslint-disable-next-line no-console
	console.log(`Elementos disponibles: ${gridItems.length}`);

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

		//eslint-disable-next-line no-console
		console.log(
			`Ítem ${item.id}: distancia = ${distance}, centro en (${itemCenterX}, ${itemCenterY})`
		);

		if (distance < minDistance) {
			minDistance = distance;
			closestIndex = index;
		}
	});

	//eslint-disable-next-line no-console
	console.log(
		`Elemento más cercano encontrado en índice: ${closestIndex}, distancia: ${minDistance}`
	);
	return closestIndex;
}

export function moveArrayItem(array, fromIndex, toIndex) {
	if (fromIndex === toIndex) return array;

	const item = array.splice(fromIndex, 1)[0];
	array.splice(toIndex, 0, item);

	return array;
}

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

export function getGridPosition(x, y, cellSize, gutter, numColumns) {
	const col = Math.floor(x / (cellSize + gutter));
	const row = Math.floor(y / (cellSize + gutter));

	return {
		col: Math.min(Math.max(0, col), numColumns - 1),
		row: Math.max(0, row),
	};
}
