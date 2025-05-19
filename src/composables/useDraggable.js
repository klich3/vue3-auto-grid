import { ref } from "vue";

export function useDraggable(options = {}) {
	const draggingItem = ref(null);
	const isGrabbing = ref(false);
	const cursorPosition = ref({ x: 0, y: 0 });
	const ghostPosition = ref({ left: 0, top: 0 });
	const dragOffset = ref({ x: 0, y: 0 });

	const startDrag = (item, event) => {
		if (!item) return;

		draggingItem.value = item;
		item.isDragging = true;
		isGrabbing.value = true;

		const rect = event.currentTarget.getBoundingClientRect();
		dragOffset.value = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		};

		cursorPosition.value = {
			x: event.clientX,
			y: event.clientY,
		};

		if (options.onDragStart) {
			options.onDragStart(item);
		}
	};

	const processDrag = (event, container) => {
		if (!draggingItem.value || !isGrabbing.value) return;

		cursorPosition.value = {
			x: event.clientX,
			y: event.clientY,
		};

		if (options.onDrag) {
			options.onDrag(draggingItem.value, event);
		}
	};

	const endDrag = () => {
		if (!draggingItem.value) return;

		const item = draggingItem.value;
		item.isDragging = false;

		if (options.onDragEnd) {
			options.onDragEnd(item);
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
	};
}
