/**
 * Encuentra el índice del elemento más cercano a las coordenadas dadas
 */
export function findClosestItemIndex(
	x,
	y,
	items,
	containerRef,
	draggingItemId
) {
	// Verificaciones de seguridad
	if (!containerRef || !items.length) return 0;

	const containerWidth = containerRef.offsetWidth;
	const containerHeight = containerRef.offsetHeight;

	// Si estamos fuera de los límites, usar el último elemento
	if (x < 0 || y < 0 || x > containerWidth || y > containerHeight) {
		return items.length - 1;
	}

	// Encontrar el elemento más cercano a las coordenadas del cursor
	let closestDistance = Infinity;
	let closestIndex = 0;

	items.forEach((item, index) => {
		// Saltar el elemento que estamos arrastrando
		if (draggingItemId && item.id === draggingItemId) return;

		const itemLeft = parseInt(item.style.left || 0);
		const itemTop = parseInt(item.style.top || 0);
		const itemWidth = parseInt(item.style.width || 0);
		const itemHeight = parseInt(item.style.height || 0);

		// Calcular la distancia al centro del elemento
		const centerX = itemLeft + itemWidth / 2;
		const centerY = itemTop + itemHeight / 2;
		const distance = Math.sqrt(
			Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
		);

		if (distance < closestDistance) {
			closestDistance = distance;
			closestIndex = index;
		}
	});

	return closestIndex;
}

/**
 * Mueve un elemento de un índice a otro en un array
 */
export function moveArrayItem(array, fromIndex, toIndex) {
	const element = array.splice(fromIndex, 1)[0];
	array.splice(toIndex, 0, element);
}

/**
 * Función de utilidad para debounce
 */
export function debounce(func, wait) {
	let timeout;
	return (...args) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(null, args), wait);
	};
}
