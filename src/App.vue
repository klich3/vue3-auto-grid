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
						:ghost-position="ghostPosition"
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

				<div
					v-if="isGrabbing && targetGridPosition"
					class="grid-ghost-indicator"
					:style="getGhostIndicatorStyle()"
				></div>
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

import itemsData from "@/assets/items.json";

const items = reactive(
	itemsData.map((item) => {
		const width = parseInt(item.style.width);
		const height = parseInt(item.style.height);

		if (width > height * 1.5) {
			item.gridType = "wide";
		} else if (height > width * 1.5) {
			item.gridType = "tall";
		} else {
			item.gridType = "square";
		}

		return item;
	})
);

const cursorRef = ref(null);
const gridLayoutRef = ref(null);
const gutter = ref(16);
const targetGridPosition = ref(null);

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
		if (item && item.style) {
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

		cursorPosition.value = {
			x: event.clientX,
			y: event.clientY,
		};

		updateTargetGridPosition(relativeX, relativeY, item);
	},
	onDragEnd: (item) => {
		if (item) {
			delete item.originalPosition;
			finalizeDrag(item);
		}
	},
});

const {
	numColumns,
	gridHeight,
	cellSize,
	calculateResponsiveLayout,
	updateLayout,
	updateGhostPosition,
	finalizeDrag,
} = useMasonryLayout(items, gridLayoutRef, gutter.value);

const updateTargetGridPosition = (mouseX, mouseY, dragItem) => {
	if (!cellSize.value) return;

	const snapToGridSize = cellSize.value + gutter.value;

	const col = Math.floor(mouseX / snapToGridSize);
	const row = Math.floor(mouseY / snapToGridSize);

	const validCol = Math.min(
		Math.max(0, col),
		numColumns.value - (dragItem.colSpan || 1)
	);
	const validRow = Math.max(0, row);

	if (
		!targetGridPosition.value ||
		targetGridPosition.value.col !== validCol ||
		targetGridPosition.value.row !== validRow
	) {
		const newPosition = {
			col: validCol,
			row: validRow,
			colSpan: dragItem.colSpan || 1,
			rowSpan: dragItem.rowSpan || 1,
			id: dragItem.id,
		};

		const isAvailable = checkPositionAvailability(newPosition, dragItem.id);

		if (isAvailable) {
			targetGridPosition.value = newPosition;
			updateGhostPosition(newPosition);
		}
	}
};

const checkPositionAvailability = (position, excludeItemId) => {
	if (!position || !gridLayoutRef.value) return false;

	const conflicts = items.filter((item) => {
		if (item.id === excludeItemId) return false;

		const itemCol = Math.floor(
			parseInt(item.style.left || 0) / (cellSize.value + gutter.value)
		);
		const itemRow = Math.floor(
			parseInt(item.style.top || 0) / (cellSize.value + gutter.value)
		);
		const itemColSpan = item.colSpan || 1;
		const itemRowSpan = item.rowSpan || 1;

		const horizontalOverlap =
			position.col < itemCol + itemColSpan &&
			position.col + position.colSpan > itemCol;

		const verticalOverlap =
			position.row < itemRow + itemRowSpan &&
			position.row + position.rowSpan > itemRow;

		return horizontalOverlap && verticalOverlap;
	});

	return conflicts.length === 0;
};

const getGhostIndicatorStyle = () => {
	if (!targetGridPosition.value || !cellSize.value) return {};

	const { col, row, colSpan, rowSpan } = targetGridPosition.value;

	return {
		position: "absolute",
		left: `${col * (cellSize.value + gutter.value)}px`,
		top: `${row * (cellSize.value + gutter.value)}px`,
		width: `${colSpan * cellSize.value + (colSpan - 1) * gutter.value}px`,
		height: `${rowSpan * cellSize.value + (rowSpan - 1) * gutter.value}px`,
		backgroundColor: "rgba(100, 100, 255, 0.2)",
		border: "2px dashed rgba(100, 100, 255, 0.6)",
		borderRadius: "8px",
		pointerEvents: "none",
		zIndex: 50,
	};
};

const cursorStyle = computed(() => {
	return {
		top: `${cursorPosition.value.y}px`,
		left: `${cursorPosition.value.x}px`,
		display: isGrabbing.value ? "block" : "none",
	};
});

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
			position: "absolute",
			left: `${cursorPosition.value.x - dragOffset.value.x}px`,
			top: `${cursorPosition.value.y - dragOffset.value.y}px`,
			width: item.style.width,
			height: item.style.height,
			zIndex: 100,
			pointerEvents: "none",
			transform: "scale(1.02)",
			boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)",
			background: item.style.background ? item.style.background : "white",
			opacity: 0.95,
		};
	}

	return {
		...item.style,
		position: "absolute",
	};
};

const onMouseDown = (event, item) => startDrag(item, event);
const onMouseMove = (event) => processDrag(event, gridLayoutRef.value);
const onMouseUp = () => endDrag();
const onMouseLeave = () => endDrag();

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
	max-width: 1200px;
}

.grid-layout {
	position: relative;
	width: 100%;
	transition: height 0.3s ease;
	min-height: 300px;
}

.grid-transition-move {
	transition: transform 0.3s ease;
}

.grid-transition-enter-active,
.grid-transition-leave-active {
	transition: all 0.3s ease;
}

.grid-transition-enter-from,
.grid-transition-leave-to {
	opacity: 0;
	transform: scale(0.9);
}

.grid-ghost-indicator {
	transition: all 0.15s ease;
	z-index: 50;
}

@media (max-width: 1200px) {
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
		padding: 20px 10px;
	}
}
</style>
