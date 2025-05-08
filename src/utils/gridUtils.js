export function findClosestItemIndex(x, y, items, container, excludeId) {
	let minDistance = Infinity;
	let closestIndex = -1;

	// Obtener todos los elementos grid-item
	const gridItems = Array.from(container.querySelectorAll(".grid-item"));

	console.log(`Buscando elemento más cercano a (${x}, ${y})`);
	console.log(`Elementos disponibles: ${gridItems.length}`);

	items.forEach((item, index) => {
		// Saltamos el elemento que se está arrastrando
		if (item.id === excludeId) {
			console.log(`Ignorando item ${item.id} (elemento arrastrado)`);
			return;
		}

		// Buscamos el elemento en el DOM que coincide con este item
		const itemEl = gridItems.find(
			(el) => el.getAttribute("data-key") === String(item.id)
		);

		if (!itemEl) {
			console.warn(`No se encontró el elemento DOM para el item ${item.id}`);
			return;
		}

		const rect = itemEl.getBoundingClientRect();
		const containerRect = container.getBoundingClientRect();

		// Coordenadas del centro del item
		const itemCenterX = rect.left - containerRect.left + rect.width / 2;
		const itemCenterY = rect.top - containerRect.top + rect.height / 2;

		// Calcular distancia euclídea al punto de arrastre
		const distance = Math.sqrt(
			Math.pow(x - itemCenterX, 2) + Math.pow(y - itemCenterY, 2)
		);

		console.log(
			`Ítem ${item.id}: distancia = ${distance}, centro en (${itemCenterX}, ${itemCenterY})`
		);

		// Actualizar si encontramos una distancia menor
		if (distance < minDistance) {
			minDistance = distance;
			closestIndex = index;
		}
	});

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
