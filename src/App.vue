<template>
	<div class="wrap" :class="{ grabbing: isGrabbing }">
		<div class="cursor" ref="cursorRef" :style="cursorStyle"></div>
		<div class="grid-container">
			<div
				class="grid-layout"
				ref="gridLayoutRef"
				:style="{ height: `${gridHeight}px` }"
			>
				<transition-group name="grid-transition" tag="div" v-if="cellSize > 0">
					<grid-item
						v-for="item in items"
						:key="item.id"
						:item="item"
						:is-dragging="item.isDragging"
						:style="getItemStyle(item)"
						:data-key="item.id"
						class="grid-item"
						@mousedown.stop.prevent="onMouseDown($event, item)"
					>
						<component
							:is="getComponentType(item)"
							:userData="item.userData"
							:imageData="item.imageData"
						/>
					</grid-item>
				</transition-group>

				<div
					v-if="showGhostIndicator"
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
	resetDragState,
} = useDraggable({
	onDragStart: (item) => {
		if (item && item.style) {
			item.originalPosition = {
				left: item.style.left,
				top: item.style.top,
			};
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
			const itemId = item.id;
			delete item.originalPosition;

			items.forEach((gridItem) => {
				if (gridItem.wasDisplaced) {
					gridItem.wasDisplaced = false;
				}
			});

			finalizeDrag(item);

			targetGridPosition.value = null;

			setTimeout(() => {
				nextTick(() => {
					updateLayout(null, false, null, itemId);
				});
			}, 50);
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
	getItemAtPosition,
} = useMasonryLayout(items, gridLayoutRef, gutter.value);

const displacedItemId = computed(() => {
	if (!targetGridPosition.value || !gridLayoutRef.value) return null;

	const item = getItemAtPosition(
		targetGridPosition.value.row,
		targetGridPosition.value.col,
		draggingItem.value
	);

	if (item && item.id !== draggingItem.value?.id) {
		item.wasDisplaced = true;
		return item.id;
	}

	return null;
});

const updateTargetGridPosition = (mouseX, mouseY, dragItem) => {
	if (!cellSize.value || mouseX == null || mouseY == null || !dragItem) return;

	const snapToGridSize = cellSize.value + gutter.value;

	const numericMouseX = Number(mouseX);
	const numericMouseY = Number(mouseY);

	if (isNaN(numericMouseX) || isNaN(numericMouseY)) return;

	const col = Math.floor(numericMouseX / snapToGridSize);
	const row = Math.floor(numericMouseY / snapToGridSize);

	const validCol = Math.min(
		Math.max(0, col),
		numColumns.value - (dragItem.colSpan || 1)
	);
	const validRow = Math.max(0, row);

	const newPosition = {
		col: validCol,
		row: validRow,
		colSpan: dragItem.colSpan || 1,
		rowSpan: dragItem.rowSpan || 1,
		id: dragItem.id,
	};

	targetGridPosition.value = { ...newPosition };

	nextTick(() => {
		updateGhostPosition(newPosition);
	});
};

const showGhostIndicator = computed(() => {
	return (
		targetGridPosition.value &&
		cellSize.value > 0 &&
		isGrabbing.value &&
		draggingItem.value
	);
});

const getGhostIndicatorStyle = () => {
	if (!targetGridPosition.value || !cellSize.value) return {};

	const { col, row, colSpan = 1, rowSpan = 1 } = targetGridPosition.value;

	if (
		col == null ||
		row == null ||
		!Number.isFinite(col) ||
		!Number.isFinite(row)
	) {
		return {};
	}

	return {
		position: "absolute",
		left: `${col * (cellSize.value + gutter.value)}px`,
		top: `${row * (cellSize.value + gutter.value)}px`,
		width: `${colSpan * cellSize.value + (colSpan - 1) * gutter.value}px`,
		height: `${rowSpan * cellSize.value + (rowSpan - 1) * gutter.value}px`,
		zIndex: 60,
		opacity: 0.9,
		pointerEvents: "none",
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
	if (item.id === displacedItemId.value) {
		return {
			...item.style,
			position: "absolute",
			zIndex: 90,
			transition: "all 0.2s ease",
			boxShadow: "0 0 0 3px rgba(0, 100, 255, 0.7)",
			opacity: 0.9,
		};
	}
	const wasDisplaced = item.wasDisplaced;
	if (wasDisplaced) {
		setTimeout(() => {
			item.wasDisplaced = false;
		}, 300);

		return {
			...item.style,
			position: "absolute",
			transition: "all 0.3s ease",
			boxShadow: "none",
		};
	}

	if (item.isDragging) {
		return {
			position: "absolute",
			left: `${cursorPosition.value.x - dragOffset.value.x}px`,
			top: `${cursorPosition.value.y - dragOffset.value.y}px`,
			width: item.style.width,
			height: item.style.height,
			zIndex: 100,
			pointerEvents: "none",
			transform: "scale(1.05)",
			boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
			background: item.style.background ? item.style.background : "white",
			opacity: 0.8,
		};
	}

	return {
		...item.style,
		position: "absolute",
		transition: item.style.transition || "none",
	};
};

const onMouseDown = (event, item) => {
	try {
		startDrag(item, event);
	} catch (error) {
		console.error("Error en onMouseDown:", error);
	}
};

const onMouseMove = (event) => {
	try {
		processDrag(event, gridLayoutRef.value);
	} catch (error) {
		console.error("Error en onMouseMove:", error);
	}
};

const onMouseUp = () => {
	try {
		endDrag();

		nextTick(() => {
			items.forEach((item) => {
				if (item.wasDisplaced && !item.isDragging) {
					setTimeout(() => {
						item.wasDisplaced = false;
					}, 300);
				}
			});
		});
	} catch (error) {
		console.error("Error en onMouseUp:", error);
		resetDragState();
	}
};
const onMouseLeave = () => {
	try {
		endDrag();
	} catch (error) {
		console.error("Error en onMouseLeave:", error);
		resetDragState();
	}
};

const resizeObserver = new ResizeObserver(() => calculateResponsiveLayout());

onMounted(() => {
	nextTick(() => {
		calculateResponsiveLayout();

		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);

		window.addEventListener("error", () => {
			if (isGrabbing.value) {
				resetDragState();
				updateLayout(null, true);
			}
		});
	});

	if (gridLayoutRef.value) {
		resizeObserver.observe(gridLayoutRef.value);
	}
});

onUnmounted(() => {
	window.removeEventListener("mousemove", onMouseMove);
	window.removeEventListener("mouseup", onMouseUp);

	if (gridLayoutRef.value) resizeObserver.unobserve(gridLayoutRef.value);

	window.removeEventListener("error", resetDragState);
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
	position: absolute;
	transition: all 0.15s ease;
	z-index: 50;
	background-color: rgba(0, 100, 255, 0.2);
	border-radius: 8px;
	box-sizing: border-box;
	pointer-events: none;
	box-shadow: 0 0 10px rgba(0, 100, 255, 0.3);
	animation: pulse 1.5s infinite alternate;
}

@keyframes pulse {
	0% {
		opacity: 0.5;
	}
	100% {
		opacity: 1;
	}
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
