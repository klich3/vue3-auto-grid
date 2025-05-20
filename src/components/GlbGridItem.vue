<template>
	<div class="glb-container h-full w-full relative">
		<canvas ref="canvas" class="w-full h-full"></canvas>

		<Loading v-if="loading" />
	</div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useThree } from "@/composables/useThree";
import Loading from "@/components/Loading";

const props = defineProps({
	modelPath: {
		type: String,
		default: "/glb/copilot-5751dc22c3aa.glb",
	},
	autoRotate: {
		type: Boolean,
		default: false,
	},
	backgroundColor: {
		type: String,
		default: "#000000",
	},
	scale: {
		type: Number,
		default: 4,
	},
	materials: {
		type: Array,
		default: () => [
			{
				name: "glass",
				type: "physical",
				material: {
					color: 0x363030,
					reflectivity: 1,
					metallness: 0.9,
				},
			},
			{
				name: "black",
				type: "physical",
				material: {
					color: 0x363030,
				},
			},
			{
				name: "normals",
				type: "normal",
			},
		],
	},
	materialAssignments: {
		type: Array,
		default: () => [
			{ meshName: "glass", materialName: "glass" },
			{ meshName: "face", materialName: "black" },
			{ meshName: "goggle", materialName: "normals" },
			{ meshName: "head", materialName: "normals" },
		],
	},
	enableShadows: {
		type: Boolean,
		default: false,
	},
	useDraco: {
		type: Boolean,
		default: false,
	},
	dracoPath: {
		type: String,
		default: "/draco/",
	},
	style: Object,
	type: String,
});

const canvas = ref(null);
const {
	loading,
	init,
	loadModel,
	startAnimation,
	handleMouseMove,
	handleResize,
	cleanup,
	initMaterials,
} = useThree();

onMounted(() => {
	init(canvas.value, {
		backgroundColor: props.backgroundColor,
		autoRotate: props.autoRotate,
		shadows: props.enableShadows,
		materials: props.materials,
	});

	loadModel(props.modelPath, {
		scale: props.scale,
		receiveShadows: props.enableShadows,
		useDraco: props.useDraco,
		dracoPath: props.dracoPath,
		materialAssignments: props.materialAssignments,
	});

	startAnimation();

	window.addEventListener("mousemove", handleMouseMove);
	window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
	cleanup();
});

watch(
	() => props.modelPath,
	(newPath) => {
		loadModel(newPath, {
			scale: props.scale,
			receiveShadows: props.enableShadows,
			useDraco: props.useDraco,
			dracoPath: props.dracoPath,
			materialAssignments: props.materialAssignments,
		});
	},
	{ immediate: false }
);

watch(
	() => props.materials,
	(newMaterials) => {
		if (newMaterials && newMaterials.length > 0) {
			initMaterials(newMaterials);
		}
	},
	{ immediate: false, deep: true }
);
</script>

<style scoped>
.glb-container {
	position: relative;
	overflow: hidden;
	border-radius: 0.5rem;
}
</style>
