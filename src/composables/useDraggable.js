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
	const initialCursorPosition = ref({ x: 0, y: 0 });
	const ghostPosition = ref({ left: 0, top: 0 });
	const dragOffset = ref({ x: 0, y: 0 });
	const dragInitiated = ref(false);
	const dragStartTimer = ref(null);

	//Note: Motion pixels to initiate dragging
	const DRAG_THRESHOLD = options.dragThreshold || 5;

	//Note: Milliseconds before the start of the trace
	const DRAG_DELAY = options.dragDelay || 150;

	const startDragProcess = (item, event) => {
		if (!item || !event) return;

		try {
			initialCursorPosition.value = {
				x: event.clientX,
				y: event.clientY,
			};

			cursorPosition.value = {
				x: event.clientX,
				y: event.clientY,
			};

			const rect = event.currentTarget?.getBoundingClientRect();
			if (!rect) return;

			dragOffset.value = {
				x: event.clientX - rect.left,
				y: event.clientY - rect.top,
			};

			draggingItem.value = item;

			dragStartTimer.value = setTimeout(() => {
				if (!dragInitiated.value) cancelDragAttempt();
			}, DRAG_DELAY);
		} catch (error) {
			console.error("Error en startDragProcess:", error);
			cancelDragAttempt();
		}
	};

	const checkDragThreshold = (event) => {
		if (!draggingItem.value || !event || dragInitiated.value) return;

		const dx = event.clientX - initialCursorPosition.value.x;
		const dy = event.clientY - initialCursorPosition.value.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		if (distance > DRAG_THRESHOLD) {
			clearTimeout(dragStartTimer.value);
			initiateDrag(draggingItem.value, event);
		}
	};

	const initiateDrag = (item, event) => {
		if (!item || dragInitiated.value) return;

		dragInitiated.value = true;
		item.isDragging = true;
		isGrabbing.value = true;

		if (options.onDragStart && typeof options.onDragStart === "function") {
			options.onDragStart(item, event);
		}
	};

	const startDrag = (item, event) => startDragProcess(item, event);

	const processDrag = (event, container) => {
		if (!draggingItem.value || !event) return;

		try {
			cursorPosition.value = {
				x: event.clientX,
				y: event.clientY,
			};

			if (!dragInitiated.value) checkDragThreshold(event);

			if (dragInitiated.value && isGrabbing.value) {
				if (options.onDrag && typeof options.onDrag === "function") {
					options.onDrag(draggingItem.value, event);
				}
			}
		} catch (error) {
			console.error("Error en processDrag:", error);
		}
	};

	const cancelDragAttempt = () => {
		if (dragStartTimer.value) {
			clearTimeout(dragStartTimer.value);
			dragStartTimer.value = null;
		}

		if (!dragInitiated.value) draggingItem.value = null;
	};

	const endDrag = () => {
		if (dragStartTimer.value) {
			clearTimeout(dragStartTimer.value);
			dragStartTimer.value = null;
		}

		if (!dragInitiated.value) {
			draggingItem.value = null;
			return;
		}

		if (!draggingItem.value) return;

		try {
			const item = draggingItem.value;
			item.isDragging = false;

			if (options.onDragEnd && typeof options.onDragEnd === "function")
				options.onDragEnd(item);
		} catch (error) {
			console.error("Error en endDrag:", error);
		} finally {
			draggingItem.value = null;
			isGrabbing.value = false;
			dragInitiated.value = false;
		}
	};

	const resetDragState = () => {
		if (dragStartTimer.value) {
			clearTimeout(dragStartTimer.value);
			dragStartTimer.value = null;
		}

		if (draggingItem.value) draggingItem.value.isDragging = false;

		draggingItem.value = null;
		isGrabbing.value = false;
		dragInitiated.value = false;
	};

	return {
		draggingItem,
		isGrabbing,
		cursorPosition,
		ghostPosition,
		dragOffset,
		dragInitiated,
		startDrag,
		processDrag,
		endDrag,
		resetDragState,
		cancelDragAttempt,
	};
}
