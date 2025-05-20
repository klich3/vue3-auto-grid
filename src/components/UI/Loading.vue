<template>
	<div
		v-if="loading"
		class="absolute inset-0 bg-black/20 flex items-center justify-center"
	>
		<div
			class="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"
		></div>
	</div>
</template>

<script setup>
defineProps({
	loading: {
		type: Boolean,
		default: true,
	},
});
</script>
