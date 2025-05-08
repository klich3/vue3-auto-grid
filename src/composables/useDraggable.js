import { ref } from "vue";

export function useDraggable(options = {}) {
	const draggingItem = ref(null);
	const isGrabbing = ref(false);
	const cursorPosition = ref({ x: 0, y: 0 });
	const ghostPosition = ref({ left: 0, top: 0 });
	const dragOffset = ref({ x: 0, y: 0 });

	const {
		onDragStart: onDragStartCallback,
		onDrag: onDragCallback,
		onDragEnd: onDragEndCallback,
	} = options;

	const startDrag = (item, event) => {
		item.isDragging = true;
		draggingItem.value = item;
		isGrabbing.value = true;

		cursorPosition.value.x = event.clientX || 0;
		cursorPosition.value.y = event.clientY || 0;

		const rect = event.currentTarget.getBoundingClientRect();
		dragOffset.value = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		};

		ghostPosition.value = {
			left: parseInt(item.style.left || 0),
			top: parseInt(item.style.top || 0),
		};

		document.body.classList.add("grabbing");
		document.body.style.userSelect = "none";

		if (onDragStartCallback) onDragStartCallback(item, event);
	};

	const processDrag = (event, container) => {
		if (!draggingItem.value || !isGrabbing.value) return;

		cursorPosition.value.x = event.clientX;
		cursorPosition.value.y = event.clientY;

		if (onDragCallback) onDragCallback(draggingItem.value, event, container);

		event.preventDefault();
	};

	const endDrag = () => {
		if (!draggingItem.value) return;

		const item = draggingItem.value;

		item.style.left = `${ghostPosition.value.left}px`;
		item.style.top = `${ghostPosition.value.top}px`;

		item.isDragging = false;
		isGrabbing.value = false;

		const finishedItem = draggingItem.value;
		draggingItem.value = null;

		document.body.classList.remove("grabbing");
		document.body.style.userSelect = "";

		if (onDragEndCallback) onDragEndCallback(finishedItem);
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
