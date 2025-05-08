import { ref } from "vue";

export function useMasonryLayout(items, containerRef, gutter = 16) {
	const numColumns = ref(0);

	const calculateResponsiveLayout = () => {
		if (!containerRef.value) return;

		const containerWidth = containerRef.value.offsetWidth;
		let baseWidth = 280;
		let columnGutter = gutter;

		if (containerWidth <= 768) {
			numColumns.value = Math.floor(
				containerWidth / (baseWidth / 2 + columnGutter)
			);

			items.forEach((item) => {
				const originalWidth = parseInt(item.style.width);
				const originalHeight = parseInt(item.style.height);

				if (originalWidth > 400) {
					item.mobileStyle = {
						width: `${containerWidth - 32}px`,
						height: `${Math.floor(
							(originalHeight * (containerWidth - 32)) / originalWidth
						)}px`,
						isFull: true,
					};
				} else {
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
			items.forEach((item) => {
				item.mobileStyle = null;
			});
		}

		updateLayout();
	};

	const updateLayout = () => {
		if (!containerRef.value) return;

		const containerWidth = containerRef.value.offsetWidth;
		const isMobile = containerWidth <= 768;

		if (isMobile) {
			numColumns.value = 2;
		} else {
			numColumns.value = Math.floor(containerWidth / (280 + gutter));
			if (numColumns.value < 1) numColumns.value = 1;
		}

		const columnHeights = new Array(numColumns.value).fill(0);

		items.forEach((item) => {
			if (item.isDragging) return;

			const useStyle =
				isMobile && item.mobileStyle ? item.mobileStyle : item.style;
			const itemWidth = parseInt(useStyle.width);
			const itemHeight = parseInt(useStyle.height);

			item.style.width = `${itemWidth}px`;
			item.style.height = `${itemHeight}px`;

			const colSpan =
				isMobile && useStyle.isFull
					? numColumns.value
					: Math.ceil(itemWidth / (280 + gutter));

			const effectiveColSpan = Math.min(colSpan, numColumns.value);

			let minColumnIndex = 0;
			let minHeight = Number.MAX_VALUE;

			for (let i = 0; i <= numColumns.value - effectiveColSpan; i++) {
				const maxHeightInSpan = Math.max(
					...columnHeights.slice(i, i + effectiveColSpan)
				);
				if (maxHeightInSpan < minHeight) {
					minHeight = maxHeightInSpan;
					minColumnIndex = i;
				}
			}

			const left = minColumnIndex * (280 + gutter);
			const top = minHeight;

			item.style.left = `${left}px`;
			item.style.top = `${top}px`;

			for (
				let i = minColumnIndex;
				i < minColumnIndex + effectiveColSpan && i < numColumns.value;
				i++
			) {
				columnHeights[i] = top + itemHeight + gutter;
			}
		});

		const maxHeight = Math.max(...columnHeights, 100);
		containerRef.value.style.height = `${maxHeight}px`;
	};

	return {
		numColumns,
		calculateResponsiveLayout,
		updateLayout,
	};
}
