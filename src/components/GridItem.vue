<template>
	<div
		:style="mergedStyle"
		:class="['grid-item', { dragging: isDragging }]"
		@mousedown.prevent="handleMouseDown"
	>
		<slot v-bind="{ drag: isDragging }"></slot>
		<div v-if="isDragging" class="ghost-element" :style="ghostStyle"></div>
	</div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from "vue";

const props = defineProps({
	item: {
		type: Object,
		required: true,
	},
	isDragging: {
		type: Boolean,
		default: false,
	},
	style: {
		type: Object,
		required: true,
	},
	ghostPosition: {
		type: Object,
		default: () => ({ left: 0, top: 0 }),
	},
});

const emit = defineEmits(["dragStart", "dragEnd", "drag"]);

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
		opacity: 0.8,
		pointerEvents: "none",
	};
});

const ghostStyle = computed(() => {
	return {
		position: "absolute",
		width: props.style.width,
		height: props.style.height,
		left: `${props.ghostPosition?.left || 0}px`,
		top: `${props.ghostPosition?.top || 0}px`,
		opacity: 0.4,
		background: "#aaa",
		zIndex: 90,
		pointerEvents: "none",
		borderRadius: "36px",
		boxShadow: "inset 0 0 0 2px rgba(255, 255, 255, 0.5)",
	};
});

const handleMouseDown = (event) => {
	emit("dragStart", props.item, event);
};
</script>

<style scoped>
.grid-item {
	overflow: hidden;
	border-radius: 36px;
	user-select: none;
	position: absolute;
	transition: all 0.2s ease;
	background-color: antiquewhite;
	cursor: grab;
	box-sizing: border-box;
	max-width: 100%;
	max-height: 100%;
	border: 1px solid rgba(0, 0, 0, 0.1);
	-webkit-user-drag: none;
	/* Deshabilitar arrastre nativo */
}

.grid-item.dragging {
	opacity: 0.95;
	transform: scale(1.02);
	z-index: 100;
	box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
	cursor: grabbing;
}

.ghost-element {
	position: absolute;
	border-radius: 36px;
	background-color: rgba(100, 100, 100, 0.3);
	box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.5);
	pointer-events: none;
}
</style>
