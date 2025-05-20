<template>
	<div class="wrap" :class="{ grabbing: isGrabbing }">
		<div class="cursor" ref="cursorRef" :style="cursorStyle"></div>
		<div class="grid-container">
			<div
				class="grid-layout"
				ref="gridLayoutRef"
				:style="{ height: `${gridHeight}px` }"
			>
				<transition-group name="grid-transition" tag="div" v-if="isGridReady">
					<grid-item
						v-for="item in items"
						:key="item.id"
						:item="item"
						:is-dragging="item.isDragging"
						:style="getItemStyle(item)"
						:data-key="item.id"
						class="grid-item"
						@mousedown.prevent="onMouseDown($event, item)"
					>
						<component :is="getComponentType(item)" v-bind="item" />
					</grid-item>
				</transition-group>

				<div
					v-if="shouldShowGhostIndicator"
					class="grid-ghost-indicator"
					:style="ghostIndicatorStyle"
				></div>
			</div>
		</div>
	</div>
</template>
<script setup>
import {
	ref,
	reactive,
	computed,
	nextTick,
	onMounted,
	onUnmounted,
	watch,
} from "vue";
import { useDraggable } from "@/composables/useDraggable";
import { useMasonryLayout } from "@/composables/useMasonryLayout";
import { debounce } from "@/utils/gridUtils";

import itemsData from "@/assets/items.json";
import GridItem from "@/components/GridItem";

import ImageGridItem from "@/components/ImageGridItem";
import MapGridItem from "@/components/MapGridItem";
import UserGridItem from "@/components/UserGridItem";
import GithubGridItem from "@/components/GithubGridItem";
import GlbGridItem from "@/components/GlbGridItem";

const items = reactive(generateItemsWithTypes(itemsData));
const cursorRef = ref(null);
const gridLayoutRef = ref(null);
const gutter = ref(16);
const targetGridPosition = ref(null);

function generateItemsWithTypes(itemsData) {
	return itemsData.map((item) => {
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
	});
}

function getComponentType(item) {
	switch (item.type) {
		case "glb":
			return GlbGridItem;
		case "github":
			return GithubGridItem;
		case "map":
			return MapGridItem;
		case "user":
			return UserGridItem;
		case "image":
			return ImageGridItem;
		default:
			return null;
	}
}

const {
	draggingItem,
	isGrabbing,
	cursorPosition,
	dragOffset,
	startDrag,
	processDrag,
	endDrag,
	resetDragState,
} = useDraggable({
	onDragStart: handleDragStart,
	onDrag: handleDrag,
	onDragEnd: handleDragEnd,
});

const {
	gridHeight,
	cellSize,
	calculateResponsiveLayout,
	updateLayout,
	updateGhostPosition,
	finalizeDragAndLock,
	getItemAtPosition,
	pixelsToGridPosition,
} = useMasonryLayout(items, gridLayoutRef, gutter.value);

const isGridReady = computed(() => cellSize.value > 0);

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

const shouldShowGhostIndicator = computed(() => {
	return (
		targetGridPosition.value &&
		isGridReady.value &&
		isGrabbing.value &&
		draggingItem.value
	);
});

const cursorStyle = computed(() => {
	return {
		top: `${cursorPosition.value.y}px`,
		left: `${cursorPosition.value.x}px`,
		display: isGrabbing.value ? "block" : "none",
	};
});

function handleDragStart(item) {
	if (item?.style) {
		item.originalPosition = {
			left: item.style.left,
			top: item.style.top,
		};
	}
}

function handleDrag(item, event) {
	if (!item || !gridLayoutRef.value) return;

	const gridRect = gridLayoutRef.value.getBoundingClientRect();
	const relativeX = event.clientX - gridRect.left;
	const relativeY = event.clientY - gridRect.top;

	cursorPosition.value = {
		x: event.clientX,
		y: event.clientY,
	};

	updateTargetGridPosition(relativeX, relativeY, item);
}

function handleDragEnd(item) {
	if (!item) return;
	delete item.originalPosition;
	cleanupDisplacedState();
	finalizeDragAndLock(item);
	targetGridPosition.value = null;
}

function cleanupDisplacedState() {
	items.forEach((item) => {
		if (item.wasDisplaced) {
			item.wasDisplacedEnding = true;
			item.wasDisplaced = false;

			setTimeout(() => {
				item.wasDisplacedEnding = false;
			}, 350);
		}
	});
}

/**
 * Updates the target grid position based on the mouse coordinates and the dragged item.
 * @param mouseX {float} - The x-coordinate of the mouse position.
 * @param mouseY  {float} - The y-coordinate of the mouse position.
 * @param dragItem {Object} - The item being dragged.
 */
function updateTargetGridPosition(mouseX, mouseY, dragItem) {
	if (!cellSize.value || mouseX == null || mouseY == null || !dragItem) return;

	const numericMouseX = Number(mouseX);
	const numericMouseY = Number(mouseY);

	if (isNaN(numericMouseX) || isNaN(numericMouseY)) return;

	const position = pixelsToGridPosition(
		numericMouseX,
		numericMouseY,
		dragItem.colSpan || 1,
		dragItem.rowSpan || 1
	);

	if (!position) return;

	targetGridPosition.value = {
		...position,
		id: dragItem.id,
	};

	nextTick(() => updateGhostPosition(targetGridPosition.value));
}

/**
 * Style for the ghost indicator.
 * @returns {Object} - The style object for the ghost indicator.
 */
const ghostIndicatorStyle = computed(() => {
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
});

/**
 * Style for the grid item.
 * In transition speeds are set for transitions
 * @param {Object} item - The grid item object.
 */
function getItemStyle(item) {
	if (item.id === displacedItemId.value) {
		return {
			...item.style,
			position: "absolute",
			zIndex: 90,
			transition: "all 820ms ease-in-out",
			boxShadow: "0 0 0 3px rgba(0, 100, 255, 0.7)",
			opacity: 0.9,
		};
	}

	if (item.wasDisplaced || item.wasDisplacedEnding) {
		return {
			...item.style,
			position: "absolute",
			transition: "all 620ms ease-in-out",
			boxShadow: item.wasDisplacedEnding
				? "none"
				: "0 0 0 2px rgba(0, 100, 255, 0.3)",
			zIndex: item.wasDisplacedEnding ? 5 : 80,
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
			background: item.style.background || "white",
			opacity: 0.8,
		};
	}

	return {
		...item.style,
		position: "absolute",
		transition: item.style.transition || "none",
	};
}

const onMouseUp = () => {
	try {
		endDrag();
	} catch (error) {
		console.error("Error en onMouseUp:", error);
		resetDragState();
	}
};

const onMouseDown = (event, item) => {
	try {
		const isInteractiveElement = isInteractiveTarget(event.target);

		if (isInteractiveElement) {
			resetDragState();
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		startDrag(item, event);
	} catch (error) {
		console.error("Error en onMouseDown:", error);
	}
};

const isInteractiveTarget = (target) => {
	const interactiveSelectors = [
		"button",
		"a",
		"input",
		"select",
		"textarea",
		'[role="button"]',
		'[role="link"]',
		'[role="checkbox"]',
		".interactive",
		"[data-interactive]",
	];

	let currentElement = target;

	while (currentElement) {
		if (
			interactiveSelectors.some(
				(selector) => currentElement.matches && currentElement.matches(selector)
			)
		) {
			return true;
		}

		if (currentElement.dataset && currentElement.dataset.interactive === "true")
			return true;

		currentElement = currentElement.parentElement;

		if (
			currentElement &&
			currentElement.classList &&
			currentElement.classList.contains("grid-item")
		) {
			break;
		}
	}

	return false;
};

const onMouseMove = (event) => {
	try {
		processDrag(event, gridLayoutRef.value);
	} catch (error) {
		console.error("Error en onMouseMove:", error);
	}
};

const resizeObserver = new ResizeObserver(
	debounce(() => calculateResponsiveLayout(), 100)
);

const handleGlobalError = () => {
	if (isGrabbing.value) {
		resetDragState();
		updateLayout(null, true);
	}
};

watch(
	() => window.innerWidth,
	debounce(() => calculateResponsiveLayout(), 200)
);

onMounted(() => {
	nextTick(() => {
		calculateResponsiveLayout();
		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);
		window.addEventListener("error", handleGlobalError);
	});

	if (gridLayoutRef.value) resizeObserver.observe(gridLayoutRef.value);
});

onUnmounted(() => {
	window.removeEventListener("mousemove", onMouseMove);
	window.removeEventListener("mouseup", onMouseUp);
	window.removeEventListener("error", handleGlobalError);

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
