<template>
	<div class="relative h-full w-full group overflow-hidden rounded-lg">
		<img
			v-if="imageData?.src"
			:src="imageData.src"
			:alt="imageData?.alt || 'Imagen'"
			:style="computedImageStyle"
			class="w-full h-full transition-transform duration-500 group-hover:scale-105"
			@error="handleImageError"
		/>

		<div
			v-else
			class="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				class="w-12 h-12"
			>
				<path fill="none" d="M0 0h24v24H0z" />
				<path
					d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
					fill="currentColor"
				/>
			</svg>
		</div>

		<div
			class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
		></div>

		<div
			v-if="imageData?.caption"
			class="absolute bottom-0 left-0 right-0 p-3 bg-black/60 text-white transform transition-transform duration-300"
			:class="[
				captionAlwaysVisible
					? 'translate-y-0'
					: 'translate-y-full group-hover:translate-y-0',
			]"
		>
			<p class="text-sm font-medium">{{ imageData.caption }}</p>
			<p v-if="imageData?.description" class="text-xs text-gray-300 mt-1">
				{{ imageData.description }}
			</p>
		</div>

		<div
			v-if="showStats && imageData?.stats"
			class="absolute top-3 right-3 flex items-center space-x-3"
		>
			<div
				v-if="imageData.stats.likes"
				class="flex items-center space-x-1 bg-black/50 text-white px-2 py-1 rounded-full text-xs"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-3 w-3"
					fill="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
					/>
				</svg>
				<span>{{ imageData.stats.likes }}</span>
			</div>

			<div
				v-if="imageData.stats.views"
				class="flex items-center space-x-1 bg-black/50 text-white px-2 py-1 rounded-full text-xs"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-3 w-3"
					fill="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
					/>
				</svg>
				<span>{{ imageData.stats.views }}</span>
			</div>
		</div>

		<button
			v-if="showActions"
			class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 text-gray-800 hover:bg-white px-4 py-2 rounded-full font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
			@click="$emit('action-click', imageData)"
		>
			{{ actionText || "Show more" }}
		</button>
	</div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
	imageData: {
		type: Object,
		default: () => ({}),
	},
	imageStyle: {
		type: Object,
		default: () => ({}),
	},
	objectFit: {
		type: String,
		default: "cover",
	},
	captionAlwaysVisible: {
		type: Boolean,
		default: false,
	},
	showStats: {
		type: Boolean,
		default: false,
	},
	showActions: {
		type: Boolean,
		default: false,
	},
	actionText: String,

	style: Object,
	type: String,
});

const emit = defineEmits(["action-click"]);

const computedImageStyle = computed(() => {
	return {
		...props.imageStyle,
		objectFit: props.objectFit || "cover",
	};
});

const handleImageError = (e) => {
	e.target.src = "/images/placeholder-image.jpg";
};
</script>
