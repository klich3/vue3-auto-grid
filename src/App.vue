<template>
	<div class="wrap debug" :class="{ grabbing: isGrabbing }">
		<div class="cursor" ref="cursorRef"></div>
		<div class="grid-container debug">
			<div class="grid-layout" ref="gridLayoutRef" @dragover.prevent @drop="onDrop">
				<transition-group name="grid-transition" tag="div">
					<div v-for="(item, index) in items" :key="item.id" :style="item.style"
						:class="['grid-item', { drag: item.isDragging }]" draggable="true"
						@dragstart="onDragStart(item, $event)" @dragend="onDragEnd(item, $event)"
						@drag="onDrag(item, $event)">
						{{ item.content }}
					</div>
				</transition-group>
			</div>
		</div>
	</div>
</template>

<script setup>
//sample https://nevflynn.com/?ref=godly
import { ref, reactive, nextTick, onMounted, onUnmounted } from "vue";

const cursorRef = ref(null);
const isGrabbing = ref(false);
const items = reactive([
	{
		id: "1",
		style: { width: "576px", height: "280px", background: "red" },
		content: "Item 1",
	},
	{
		id: "2",
		style: { width: "280px", height: "280px", background: "yellow" },
		content: "Item 2",
	},
	{
		id: "3",
		style: { width: "280px", height: "576px", background: "green" },
		content: "Item 3",
	},
	{
		id: "9",
		style: { width: "280px", height: "280px", background: "rose" },
		content: "Item 9",
	},
	{
		id: "10",
		style: { width: "576px", height: "280px", background: "pink" },
		content: "Item 10",
	},
	{
		id: "4",
		style: { width: "280px", height: "280px", background: "orange" },
		content: "Item 4",
	},
	{
		id: "5",
		style: { width: "280px", height: "280px", background: "blue" },
		content: "Item 5",
	},
	{
		id: "6",
		style: { width: "280px", height: "576px", background: "grey" },
		content: "Item 6",
	},
	{
		id: "7",
		style: { width: "576px", height: "280px", background: "black" },
		content: "Item 7",
	},
	{
		id: "8",
		style: { width: "576px", height: "280px", background: "white" },
		content: "Item 8",
	},
]);

const gridLayoutRef = ref(null);
const draggingItem = ref(null);
const gutter = 16;
const numColumns = ref(0);

const updateMasonryLayout = () => {
	const containerWidth = gridLayoutRef.value.offsetWidth;
	numColumns.value = Math.floor(containerWidth / (280 + gutter));

	// Inicializa las alturas de las columnas
	const columnHeights = new Array(numColumns.value).fill(0);

	items.forEach((item) => {
		//item.isSmall = containerWidth < parseInt(item.style.width) ? true : false;

		const itemWidth = parseInt(item.style.width);
		const itemHeight = parseInt(item.style.height);

		item.style.width = `${itemWidth}px`;
		item.style.height = `${itemHeight}px`;

		const colSpan = Math.ceil(itemWidth / (280 + gutter));

		// Encuentra la columna con la menor altura
		let minColumnIndex = 0;
		let minHeight = Number.MAX_VALUE;
		for (let i = 0; i <= numColumns.value - colSpan; i++) {
			const maxHeightInSpan = Math.max(...columnHeights.slice(i, i + colSpan));
			if (maxHeightInSpan < minHeight) {
				minHeight = maxHeightInSpan;
				minColumnIndex = i;
			}
		}

		// Calcular la posición de izquierda y arriba para el elemento
		const left = minColumnIndex * (280 + gutter);
		const top = minHeight;

		item.style.left = `${left}px`;
		item.style.top = `${top}px`;

		// Actualizar las alturas de las columnas para las que el elemento ocupa espacio
		for (let i = minColumnIndex; i < minColumnIndex + colSpan; i++) {
			columnHeights[i] = top + itemHeight + gutter;
		}
	});

	// Ajustar la altura del contenedor para abarcar todo el contenido
	const maxHeight = Math.max(...columnHeights);
	gridLayoutRef.value.style.height = `${maxHeight}px`;
};

const onDragStart = (item, event) => {
	item.isDragging = true;
	draggingItem.value = item;
	isGrabbing.value = true;

	draggingItem.value.startX = event.clientX;
	draggingItem.value.startY = event.clientY;
	draggingItem.value.initialTop = parseInt(item.style.top);
	draggingItem.value.initialLeft = parseInt(item.style.left);
};

const onDrag = (item, event) => {
	if (draggingItem.value) {
		// Calcular las diferencias en las coordenadas del ratón
		const dx = event.clientX - draggingItem.value.startX;
		const dy = event.clientY - draggingItem.value.startY;

		// Ajustar la posición del elemento arrastrado basándose en las diferencias calculadas
		const newLeft = draggingItem.value.initialLeft + dx;
		const newTop = draggingItem.value.initialTop + dy;

		draggingItem.value.style.left = `${newLeft}px`;
		draggingItem.value.style.top = `${newTop}px`;

		// Actualizar la posición del cursor visual para dar una sensación de arrastre
		cursorRef.value.style.top = `${event.pageY}px`;
		cursorRef.value.style.left = `${event.pageX}px`;

		// Recalcular la posición de los elementos y actualizar la cuadrícula
		const draggedIndex = items.findIndex((i) => i.id === draggingItem.value.id);
		const targetIndex = calculateTargetIndex(newLeft, newTop);

		// Mover el elemento en el array y actualizar el diseño
		moveArrayItem(draggedIndex, targetIndex);
		updateMasonryLayout();
	}
};

const onDragEnd = (item, event) => {
	item.isDragging = false;
	isGrabbing.value = false;
	draggingItem.value = null;
};

const calculateTargetIndex = (left, top) => {
	const row = Math.floor(top / (parseInt(items[0].style.height) + gutter));
	const column = Math.floor(left / (parseInt(items[0].style.width) + gutter));
	return Math.min(row * numColumns.value + column, items.length - 1);
};

const moveArrayItem = (fromIndex, toIndex) => {
	const element = items.splice(fromIndex, 1)[0];
	items.splice(toIndex, 0, element);
};

const debounce = (func, wait) => {
	let timeout;
	return (...args) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), wait);
	};
};

// Crear la función debounced
const debouncedUpdateMasonryLayout = debounce(() => {
	updateMasonryLayout();
}, 300);

// Crear el ResizeObserver con la función debounced
const resizeObserver = new ResizeObserver(() => {
	debouncedUpdateMasonryLayout();
});

onMounted(() => {
	nextTick(() => {
		updateMasonryLayout(); // Inicializa el layout
		if (gridLayoutRef.value) {
			resizeObserver.observe(gridLayoutRef.value); // Observa el contenedor
		}
	});
});

onUnmounted(() => {
	if (gridLayoutRef.value) {
		resizeObserver.unobserve(gridLayoutRef.value); // Deja de observar
	}
});
</script>

<style scoped>
.wrap {
	will-change: transform, opacity;
	height: 100%;
}

.grid-container {
	max-width: 1200px;
	position: relative;
	margin: -16px auto 0px;
	padding: 80px 0;
}

.grid-layout {
	position: relative;
	width: 100%;
	transition: height 0.2s ease;
}

.grid-item {
	overflow: hidden;
	border-radius: 8px;
	user-select: none;
	position: absolute;
	transition: all 0.2s ease;
	background-color: antiquewhite;
	cursor: grab;
	box-sizing: border-box;
	max-width: 100%;
	max-height: 100%;
}

.grid-item.drag {
	position: absolute;
	background-color: #f00;
	border: 2px dashed #000;
}

.grabbing,
.grabbing .grid-item {
	cursor: grabbing;
}

.cursor {
	position: absolute;
	top: 0;
	left: 0;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: rgba(255, 0, 0, 0.9);
	z-index: 99;
	touch-action: none;
	pointer-events: none;
}

.grid-transition-move {
	transition: transform 0.5s ease;
}

.grid-transition-enter-active,
.grid-transition-leave-active {
	transition: all 0.5s ease;
}

.grid-transition-enter-from,
.grid-transition-leave-to {
	opacity: 0;
	transform: scale(0.9);
}

.grid-item-ghost {
	opacity: 0.5;
	background-color: #c8ebfb !important;
	border: 2px dashed #2196F3 !important;
}

@media (max-width: 1024px) {
	.grid-container {
		max-width: 1200px;
	}
}

@media (max-width: 960px) {
	.grid-container {
		max-width: 800px;
	}
}

@media (max-width: 768px) {
	.grid-container {
		max-width: 768px;
	}
}
</style>
