<template>
	<div :style="mergedStyle" :class="classList">
		<div v-if="isDragging" class="ghost-element">
			<div class="ghost-inner"></div>
		</div>

		<div class="grid-item-content">
			<slot></slot>
		</div>
	</div>
</template>

<script setup>
import { defineProps, computed } from "vue";

const props = defineProps({
	item: {
		type: Object,
		required: true,
	},
	isDragging: {
		type: Boolean,
		default: false,
	},
	ghostPosition: Object,
	style: Object,
});

const mergedStyle = computed(() => {
	if (!props.isDragging) {
		return {
			...props.style,
			cursor: "grab",
		};
	}

	return {
		...props.style,
		zIndex: 100,
		transition: "none",
		pointerEvents: "none",
	};
});

const classList = computed(() => [
	"grid-item",
	{
		dragging: props.isDragging,
		wide: props.item?.colSpan === 2,
		tall: props.item?.rowSpan === 2,
		square: props.item?.colSpan === 1 && props.item?.rowSpan === 1,
	},
]);
</script>

<style scoped>
.grid-item {
	overflow: hidden;
	border-radius: 8px;
	user-select: none;
	position: absolute;
	transition: all 0.2s ease;
	cursor: grab;
	box-sizing: border-box;
	max-width: 100%;
	max-height: 100%;
	border: 1px solid rgba(0, 0, 0, 0.1);
	-webkit-user-drag: none;
	will-change: transform, opacity;
	backface-visibility: hidden;
}

.grid-item.dragging {
	opacity: 1;
	z-index: 100;
	box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
	cursor: grabbing;
}

.ghost-element {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border-radius: 8px;
	background-color: rgba(100, 100, 100, 0.2);
	border: 2px dashed rgba(80, 80, 80, 0.4);
	pointer-events: none;
}

.ghost-inner {
	width: 100%;
	height: 100%;
	opacity: 0.3;
	background: rgba(150, 150, 150, 0.1);
}

.grid-item-content {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
}
</style>
