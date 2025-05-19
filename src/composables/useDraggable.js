/*
█▀ █▄█ █▀▀ █░█ █▀▀ █░█
▄█ ░█░ █▄▄ █▀█ ██▄ ▀▄▀

Author: <Anton Sychev> (anton at sychev dot xyz)
useDraggable.js (c) 2025
Created:  2025-05-20 05:27:38 
Desc: A composable function to enable draggable functionality for items.
*/

import { ref } from "vue";

/**
 * @param {Object} [options={}] - Configuration options for the draggable behavior.
 */
export function useDraggable(options = {}) {
	const draggingItem = ref(null);
	const isGrabbing = ref(false);
	const cursorPosition = ref({ x: 0, y: 0 });
	const ghostPosition = ref({ left: 0, top: 0 });
	const dragOffset = ref({ x: 0, y: 0 });

	const startDrag = (item, event) => {
		if (!item || !event) return;

		try {
			draggingItem.value = item;
			item.isDragging = true;
			isGrabbing.value = true;

			const rect = event.currentTarget?.getBoundingClientRect();
			if (!rect) return;

			dragOffset.value = {
				x: event.clientX - rect.left,
				y: event.clientY - rect.top,
			};

			cursorPosition.value = {
				x: event.clientX,
				y: event.clientY,
			};

			if (options.onDragStart && typeof options.onDragStart === "function") {
				options.onDragStart(item);
			}
		} catch (error) {
			console.error("Error en startDrag:", error);
			if (item) item.isDragging = false;
			draggingItem.value = null;
			isGrabbing.value = false;
		}
	};

	const processDrag = (event, container) => {
		if (!draggingItem.value || !isGrabbing.value || !event) return;

		try {
			cursorPosition.value = {
				x: event.clientX,
				y: event.clientY,
			};

			if (options.onDrag && typeof options.onDrag === "function") {
				options.onDrag(draggingItem.value, event);
			}
		} catch (error) {
			console.error("Error en processDrag:", error);
		}
	};

	const endDrag = () => {
		if (!draggingItem.value) return;

		try {
			const item = draggingItem.value;
			item.isDragging = false;

			if (options.onDragEnd && typeof options.onDragEnd === "function") {
				options.onDragEnd(item);
			}
		} catch (error) {
			console.error("Error en endDrag:", error);
		} finally {
			draggingItem.value = null;
			isGrabbing.value = false;
		}
	};

	const resetDragState = () => {
		if (draggingItem.value) {
			draggingItem.value.isDragging = false;
		}
		draggingItem.value = null;
		isGrabbing.value = false;
	};

	return {
		draggingItem,
		isGrabbing,
		cursorPosition,
		ghostPosition,
		dragOffset,
		startDrag,
		processDrag,
		endDrag,
		resetDragState,
	};
}
