<template>
	<div class="image-grid-item">
		<img v-if="imageData.src" :src="imageData.src" :alt="imageData.alt" />
		<div v-else class="placeholder">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				width="48"
				height="48"
			>
				<path fill="none" d="M0 0h24v24H0z" />
				<path
					d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
					fill="currentColor"
				/>
			</svg>
		</div>
		<div v-if="imageData.caption" class="caption">
			{{ imageData.caption }}
		</div>
	</div>
</template>

<script setup>
defineProps({
	imageData: {
		type: Object,
		default: () => ({
			src: "",
			alt: "Imagen",
			caption: "",
		}),
	},
});
</script>

<style scoped>
.image-grid-item {
	height: 100%;
	width: 100%;
	position: relative;
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
}

.image-grid-item img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	background-color: #f0f0f0;
	color: #999;
}

.caption {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background: rgba(0, 0, 0, 0.6);
	color: white;
	padding: 8px;
	font-size: 0.9rem;
	text-align: center;
}
</style>
