import { ref } from "vue";

export function useMasonryLayout(items, containerRef, gutter = 16) {
	const numColumns = ref(0);
	const gridHeight = ref(0);

	const calculateResponsiveLayout = () => {
		if (!containerRef.value) {
			console.warn("El contenedor no está disponible");
			return;
		}

		const containerWidth = containerRef.value.offsetWidth;
		console.log("Container width:", containerWidth);

		let baseWidth = 280;
		let columnGutter = gutter;

		// Determinar el número de columnas y ajustar los elementos para móvil
		if (containerWidth <= 768) {
			numColumns.value = 2;

			items.forEach((item) => {
				const originalWidth = parseInt(item.style.width);
				const originalHeight = parseInt(item.style.height);

				if (originalWidth > 400) {
					// Elementos grandes ocupan todo el ancho
					item.mobileStyle = {
						width: `${containerWidth - 32}px`,
						height: `${Math.floor(
							(originalHeight * (containerWidth - 32)) / originalWidth
						)}px`,
						isFull: true,
					};
				} else {
					// Elementos pequeños ocupan media columna
					const halfWidth = Math.floor(containerWidth / 2 - columnGutter * 1.5);
					item.mobileStyle = {
						width: `${halfWidth}px`,
						height: `${Math.floor(
							(originalHeight * halfWidth) / originalWidth
						)}px`,
						isFull: false,
					};
				}
			});
		} else {
			// En pantallas grandes, usamos el tamaño original
			items.forEach((item) => {
				item.mobileStyle = null;
			});
		}

		updateLayout();
	};

	const updateLayout = () => {
		if (!containerRef.value) {
			console.warn("El contenedor no está disponible para updateLayout");
			return;
		}

		const containerWidth = containerRef.value.offsetWidth;
		const isMobile = containerWidth <= 768;

		// Determinar número de columnas basado en el ancho del contenedor
		if (isMobile) {
			numColumns.value = 2;
		} else {
			numColumns.value = Math.floor(containerWidth / (280 + gutter));
			if (numColumns.value < 1) numColumns.value = 1;
		}

		console.log(
			`Layout with ${numColumns.value} columns (mobile: ${isMobile}), container width: ${containerWidth}px`
		);

		// Asegurarse de que numColumns siempre sea un número positivo válido
		if (isNaN(numColumns.value) || numColumns.value <= 0) {
			console.warn("Número inválido de columnas, ajustando a 1");
			numColumns.value = 1;
		}

		// Inicializar alturas de columnas con un tamaño válido
		const columnHeights = new Array(numColumns.value).fill(0);

		console.log(`Creado array de alturas con ${numColumns.value} columnas`);

		// Colocar cada elemento en la columna más corta
		items.forEach((item, index) => {
			// Si el elemento está siendo arrastrado y tiene posición original, no recalcular
			if (item.isDragging && item.originalPosition) {
				console.log(
					`Item ${item.id} está siendo arrastrado, manteniendo posición original`
				);
				return;
			}

			const useStyle =
				isMobile && item.mobileStyle ? item.mobileStyle : item.style;

			// Asegurarnos de que los valores son números válidos
			const itemWidth = parseInt(useStyle.width) || 280;
			const itemHeight = parseInt(useStyle.height) || 280;

			// Asignar dimensiones
			item.style.width = `${itemWidth}px`;
			item.style.height = `${itemHeight}px`;

			// Calcular cuántas columnas ocupa este elemento
			const columnWidth = Math.floor(
				(containerWidth - gutter * (numColumns.value - 1)) / numColumns.value
			);

			// Calcular cuántas columnas ocupa (mínimo 1, máximo numColumns)
			let colSpan = 1;
			if (isMobile && useStyle.isFull) {
				colSpan = numColumns.value;
			} else {
				colSpan = Math.min(
					Math.ceil(itemWidth / columnWidth),
					numColumns.value
				);
			}

			// Garantizar que colSpan sea válido
			colSpan = Math.max(1, Math.min(colSpan, numColumns.value));

			// Encontrar la columna más corta donde cabe el elemento
			let minColumnIndex = 0;
			let minHeight = Number.MAX_VALUE;

			// Asegurarnos de no exceder el límite del array
			const maxStartCol = Math.max(0, numColumns.value - colSpan);

			for (let i = 0; i <= maxStartCol; i++) {
				// Garantizar que no leemos fuera del array
				const endCol = Math.min(i + colSpan, columnHeights.length);
				const heightsSlice = columnHeights.slice(i, endCol);

				// Si el slice está vacío, usar 0 como altura
				const maxHeightInSpan =
					heightsSlice.length > 0 ? Math.max(...heightsSlice) : 0;

				if (maxHeightInSpan < minHeight) {
					minHeight = maxHeightInSpan;
					minColumnIndex = i;
				}
			}

			// Calcular posición del elemento
			const left = minColumnIndex * (columnWidth + gutter);
			const top = minHeight;

			// Asignar posición
			item.style.left = `${left}px`;
			item.style.top = `${top}px`;

			// Actualizar alturas de columnas
			for (let i = 0; i < colSpan; i++) {
				const colIndex = minColumnIndex + i;
				if (colIndex < columnHeights.length) {
					columnHeights[colIndex] = top + itemHeight + gutter;
				}
			}
		});

		// Actualizar altura del contenedor
		if (columnHeights.length > 0) {
			gridHeight.value = Math.max(...columnHeights);

			// Aplicar altura al contenedor si hay elementos
			if (items.length > 0 && containerRef.value) {
				containerRef.value.style.height = `${gridHeight.value}px`;
				console.log(`Grid height set to ${gridHeight.value}px`);
			}
		} else {
			gridHeight.value = 0;
			if (containerRef.value) {
				containerRef.value.style.height = "300px"; // Altura mínima si no hay elementos
			}
		}
	};

	return {
		numColumns,
		gridHeight,
		calculateResponsiveLayout,
		updateLayout,
	};
}
