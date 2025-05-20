<template>
	<div class="relative h-full w-full rounded-lg overflow-hidden">
		<div
			ref="mapContainer"
			class="w-full h-full"
			:class="{
				'opacity-80 hover:opacity-100 transition-opacity duration-300':
					hoverEffect,
			}"
		></div>

		<Loading v-if="loading" />
	</div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import Loading from "@/components/Loading.vue";

const props = defineProps({
	mapData: {
		type: Object,
		default: () => ({
			lat: 41.385063,
			lng: 2.173404,
			zoom: 12,
			title: "Barcelona, Spain",
		}),
	},

	markers: {
		type: Array,
		default: () => [],
	},

	showControls: {
		type: Boolean,
		default: true,
	},

	showOverlay: {
		type: Boolean,
		default: false,
	},

	hoverEffect: {
		type: Boolean,
		default: true,
	},

	//https://leaflet-extras.github.io/leaflet-providers/preview/
	tileLayer: {
		type: String,
		//default: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
		default:
			"https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png",
	},

	style: Object,
	type: String,
});

const mapContainer = ref(null);
const map = ref(null);
const loading = ref(true);
const markersLayer = ref(null);

const addMarkers = () => {
	if (markersLayer.value) markersLayer.value.clearLayers();

	if (!props.markers || props.markers.length === 0) {
		const { lat, lng } = props.mapData;
		L.marker([lat, lng]).addTo(markersLayer.value);
		return;
	}

	props.markers.forEach((markerData) => {
		let markerOptions = {};
		if (markerData.icon) {
			markerOptions.icon = L.icon({
				iconUrl: markerData.icon,
				iconSize: [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [1, -34],
				shadowSize: [41, 41],
			});
		}

		const marker = L.marker(
			[markerData.lat, markerData.lng],
			markerOptions
		).addTo(markersLayer.value);
	});
};

const zoomIn = () => {
	if (map.value) map.value.zoomIn();
};

const zoomOut = () => {
	if (map.value) map.value.zoomOut();
};

const flyTo = (coordinates, zoomLevel) => {
	if (map.value) {
		map.value.flyTo(coordinates, zoomLevel || map.value.getZoom());
	}
};

const fitBounds = () => {
	if (
		map.value &&
		markersLayer.value &&
		markersLayer.value.getLayers().length > 0
	) {
		const bounds = L.featureGroup(markersLayer.value.getLayers()).getBounds();
		map.value.fitBounds(bounds, {
			padding: [30, 30],
		});
	}
};

defineExpose({
	flyTo,
	zoomIn,
	zoomOut,
	fitBounds,
	getMap: () => map.value,
});

watch(
	() => props.markers,
	() => {
		if (map.value) {
			addMarkers();
		}
	},
	{ deep: true }
);

onMounted(() => {
	const { lat, lng, zoom } = props.mapData;

	map.value = L.map(mapContainer.value, {
		attributionControl: false,
		zoomControl: false,
		dragging: false,
	}).setView([lat, lng], zoom || 13);

	L.tileLayer(props.tileLayer, {
		maxZoom: 19,
	}).addTo(map.value);

	markersLayer.value = L.layerGroup().addTo(map.value);
	addMarkers();

	map.value.on("click", (event) => {
		event.preventDefault();
	});

	loading.value = false;
});

onBeforeUnmount(() => {
	if (map.value) {
		map.value.remove();
	}
});
</script>

<style scoped>
:deep(.leaflet-container) {
	width: 100%;
	height: 100%;
	z-index: 1;
}

:deep(.leaflet-popup-content-wrapper) {
	border-radius: 8px;
	padding: 2px;
}

:deep(.leaflet-popup-content) {
	margin: 10px;
}
</style>
