<template>
	<div class="wrap debug" :class="{ grabbing: isGrabbing }">
		<div class="cursor" ref="cursorRef" :style="cursorStyle"></div>
		<div class="grid-container debug">
			<div
				class="grid-layout debug"
				ref="gridLayoutRef"
				@mousemove="onMouseMove"
				@mouseup="onMouseUp"
				@mouseleave="onMouseLeave"
			>
				<transition-group name="grid-transition" tag="div">
					<grid-item
						v-for="item in items"
						:key="item.id"
						:item="item"
						:is-dragging="item.isDragging"
						:style="getItemStyle(item)"
						:ghost-position="getGhostPosition(item)"
						:data-key="item.id"
						@mousedown.stop.prevent="(e) => onMouseDown(e, item)"
					>
						<component
							:is="getComponentType(item)"
							:userData="item.userData"
							:imageData="item.imageData"
						/>
					</grid-item>
				</transition-group>
			</div>
		</div>
	</div>
</template>
<script setup>
/*
Grid maxion de 4 columnas con elemento peuqeño
o dos grandes uno al lado de

*/

import { ref, reactive, computed, nextTick, onMounted, onUnmounted } from "vue";
import GridItem from "@/components/GridItem.vue";
import UserGridItem from "@/components/UserGridItem.vue";
import ImageGridItem from "@/components/ImageGridItem.vue";

import { useDraggable } from "@/composables/useDraggable";
import { useMasonryLayout } from "@/composables/useMasonryLayout";

import {
	findClosestItemIndex,
	moveArrayItem,
	debounce,
} from "@/utils/gridUtils";

import itesmData from "@/assets/items.json";
const items = reactive(itesmData || []);

const cursorRef = ref(null);
const gridLayoutRef = ref(null);
const gutter = ref(16);

const {
	draggingItem,
	isGrabbing,
	cursorPosition,
	ghostPosition,
	dragOffset,
	startDrag,
	processDrag,
	endDrag,
} = useDraggable({
	onDragStart: (item) => {
		console.log("Drag started:", item);
		// Guardar la posición original del elemento al iniciar el arrastre
		if (item && item.style) {
			// Guardamos la posición original para el ghost
			item.originalPosition = {
				left: item.style.left,
				top: item.style.top,
			};

			console.log("Drag started on item:", item.id);
		}
	},
	onDrag: (item, event) => {
		if (!item) return;

		const gridRect = gridLayoutRef.value.getBoundingClientRect();
		const relativeX = event.clientX - gridRect.left;
		const relativeY = event.clientY - gridRect.top;

		// Actualizar la posición del cursor para el elemento arrastrado
		cursorPosition.value = {
			x: event.clientX,
			y: event.clientY,
		};

		// Log para depurar la posición
		console.log(`Cursor position: X=${relativeX}, Y=${relativeY}`);

		const draggedIndex = items.findIndex((i) => i.id === item.id);
		const targetIndex = findClosestItemIndex(
			relativeX,
			relativeY,
			items,
			gridLayoutRef.value,
			item.id
		);

		console.log(
			`Índice actual: ${draggedIndex}, Índice objetivo: ${targetIndex}`
		);

		// Sólo reordenar elementos si cambiamos a una nueva posición
		if (
			draggedIndex !== targetIndex &&
			targetIndex >= 0 &&
			targetIndex < items.length
		) {
			console.log(`Reordenando: ${draggedIndex} -> ${targetIndex}`);

			// Mover el elemento en el array
			moveArrayItem(items, draggedIndex, targetIndex);

			// Actualizar el layout inmediatamente
			nextTick(() => {
				// Forzar un recálculo completo del layout
				calculateResponsiveLayout();
				console.log("Layout actualizado después de reordenar");
			});
		}
	},
	onDragEnd: (item) => {
		if (item) {
			console.log("Drag ended on item:", item.id);
			// Limpiar la posición original al finalizar
			delete item.originalPosition;
		}

		// Actualizar el layout después de soltar
		nextTick(() => {
			updateLayout();
			console.log("Layout actualizado después de soltar");
		});
	},
});

const { numColumns, calculateResponsiveLayout, updateLayout } =
	useMasonryLayout(items, gridLayoutRef, gutter.value);

const cursorStyle = computed(() => {
	return {
		top: `${cursorPosition.value.y}px`,
		left: `${cursorPosition.value.x}px`,
		display: isGrabbing.value ? "block" : "none",
	};
});

const getGhostPosition = (item) => {
	if (!item.isDragging) return { left: 0, top: 0 };

	return {
		left: parseInt(ghostPosition.value.left || 0),
		top: parseInt(ghostPosition.value.top || 0),
	};
};

const getComponentType = (item) => {
	switch (item.type) {
		case "user":
			return UserGridItem;
		case "image":
			return ImageGridItem;
		default:
			return null;
	}
};

const getItemStyle = (item) => {
	if (item.isDragging) {
		// El elemento que se arrastra sigue al cursor
		return {
			position: "absolute",
			left: `${cursorPosition.value.x - dragOffset.value.x}px`,
			top: `${cursorPosition.value.y - dragOffset.value.y}px`,
			width: item.style.width,
			height: item.style.height,
			zIndex: 100,
			pointerEvents: "none",
			transform: "scale(1.05)",
			boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)",
			background: item.style.background ? item.style.background : "white",
			opacity: 0.9,
		};
	}

	// Para elementos normales, asegúrate de que tengan posición absoluta
	return {
		...item.style,
		position: "absolute",
	};
};

const onMouseDown = (event, item) => startDrag(item, event);
const onMouseMove = (event) => processDrag(event, gridLayoutRef.value);
const onMouseUp = () => endDrag();
const onMouseLeave = () => endDrag();

const debouncedUpdateLayout = debounce(() => updateLayout(), 300);
const resizeObserver = new ResizeObserver(() => calculateResponsiveLayout());

onMounted(() => {
	nextTick(() => {
		if (gridLayoutRef.value) {
			calculateResponsiveLayout();
			resizeObserver.observe(gridLayoutRef.value);
		}
	});
});

onUnmounted(() => {
	if (gridLayoutRef.value) {
		resizeObserver.unobserve(gridLayoutRef.value);
	}
});
</script>

<style scoped>
.grid-container {
	position: relative;
	margin: 0 auto;
	padding: 40px 0;
}

.grid-layout {
	position: relative;
	width: 100%;
	transition: height 0.3s ease;
	min-height: 300px;
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

/* Estilos responsive */
@media (max-width: 1280px) {
	.grid-container {
		max-width: 960px;
	}
}

@media (max-width: 960px) {
	.grid-container {
		max-width: 720px;
	}
}

@media (max-width: 768px) {
	.grid-container {
		max-width: 100%;
		padding: 20px 0;
	}
}
</style>
