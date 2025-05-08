<template>
	<div class="wrap" :class="{ grabbing: isGrabbing }">
		<div class="cursor" ref="cursorRef" :style="cursorStyle"></div>
		<div class="grid-container">
			<div
				class="grid-layout"
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

const items = reactive([
	{
		id: "1",
		style: { width: "576px", height: "280px", background: "red" },
		type: "image",
		imageData: {
			src: "https://picsum.photos/576/280?random=1",
			alt: "Imagen 1",
			caption: "Imagen panorámica 1",
		},
	},
	{
		id: "2",
		style: { width: "280px", height: "280px", background: "yellow" },
		type: "user",
		userData: {
			name: "Juan Pérez",
			description: "Desarrollador Frontend",
		},
	},
	{
		id: "3",
		style: { width: "280px", height: "576px", background: "green" },
		type: "image",
		imageData: {
			src: "https://picsum.photos/280/576?random=2",
			alt: "Imagen 2",
			caption: "Imagen vertical",
		},
	},
	{
		id: "9",
		style: { width: "280px", height: "280px", background: "rose" },
		type: "user",
		userData: {
			name: "María García",
			description: "Diseñadora UX",
		},
	},
	{
		id: "10",
		style: { width: "576px", height: "280px", background: "pink" },
		type: "image",
		imageData: {
			src: "https://picsum.photos/576/280?random=3",
			alt: "Imagen 3",
		},
	},
	{
		id: "4",
		style: { width: "280px", height: "280px", background: "orange" },
		type: "user",
		userData: {
			name: "Carlos López",
			description: "Product Manager",
		},
	},
	{
		id: "5",
		style: { width: "280px", height: "280px", background: "blue" },
		type: "user",
		userData: {
			name: "Ana Martínez",
			description: "Data Scientist",
		},
	},
	{
		id: "6",
		style: { width: "280px", height: "576px", background: "grey" },
		type: "image",
		imageData: {
			src: "https://picsum.photos/280/576?random=4",
			alt: "Imagen 4",
			caption: "Foto vertical 2",
		},
	},
	{
		id: "7",
		style: { width: "576px", height: "280px", background: "black" },
		type: "image",
		imageData: {
			src: "https://picsum.photos/576/280?random=5",
			alt: "Imagen 5",
			caption: "Panorámica oscura",
		},
	},
	{
		id: "8",
		style: { width: "576px", height: "280px", background: "white" },
		type: "image",
		imageData: {
			src: "https://picsum.photos/576/280?random=6",
			alt: "Imagen 6",
		},
	},
]);

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
	},
	onDrag: (item, event) => {
		const gridRect = gridLayoutRef.value.getBoundingClientRect();
		const relativeX = event.clientX - gridRect.left;
		const relativeY = event.clientY - gridRect.top;

		const draggedIndex = items.findIndex((i) => i.id === item.id);
		const targetIndex = findClosestItemIndex(
			relativeX,
			relativeY,
			items,
			gridLayoutRef.value,
			item.id
		);

		if (
			draggedIndex !== targetIndex &&
			targetIndex >= 0 &&
			targetIndex < items.length
		) {
			moveArrayItem(items, draggedIndex, targetIndex);

			nextTick(() => {
				updateLayout();

				const foundItem = items[targetIndex];
				if (foundItem) {
					ghostPosition.value = {
						left: parseInt(foundItem.style.left || 0),
						top: parseInt(foundItem.style.top || 0),
					};
				}
			});
		}
	},
	onDragEnd: () => {
		nextTick(() => {
			updateLayout();
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
	if (!item.isDragging) {
		return { left: 0, top: 0 };
	}
	return ghostPosition.value;
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
		return {
			...item.style,
			left: `${cursorPosition.value.x - dragOffset.value.x}px`,
			top: `${cursorPosition.value.y - dragOffset.value.y}px`,
			zIndex: 100,
			pointerEvents: "none",
		};
	}

	if (window.innerWidth <= 768 && item.mobileStyle) {
		return {
			...item.style,
			width: item.mobileStyle.width,
			height: item.mobileStyle.height,
		};
	}

	return item.style;
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
	max-width: 1200px;
	position: relative;
	margin: 0 auto;
	padding: 40px 0;
	width: 100%;
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
