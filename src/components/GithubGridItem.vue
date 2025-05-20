<template>
	<div
		class="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl"
	>
		<div class="github-logo mb-4">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="60"
				height="60"
				viewBox="0 0 24 24"
				fill="currentColor"
				class="transition-transform duration-500 transform group-hover:scale-110"
			>
				<path
					d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
				/>
			</svg>
		</div>

		<div class="text-center px-6">
			<h3 class="text-xl font-bold mb-2">GitHub</h3>
			<p class="text-gray-300 text-sm">Visita mi perfil en GitHub</p>
		</div>

		<div
			class="github-button mt-4 py-2 px-4 bg-gray-700/50 rounded-full transition-all duration-300 hover:bg-gray-700"
			data-interactive="true"
		>
			<a :href="profileUrl" target="_blank" rel="noopener noreferrer">
				<span class="font-mono text-sm">@{{ username }}</span>
			</a>
		</div>
	</div>
</template>

<script setup>
const props = defineProps({
	profileUrl: {
		type: String,
		default: "https://github.com/klich3",
	},
	username: {
		type: String,
		default: "klich3",
	},
	style: Object,
	type: String,
});
</script>

<style scoped>
.github-logo {
	animation: subtle-pulse 3s ease-in-out infinite;
}

@keyframes subtle-pulse {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.85;
	}
}

.github-grid-item:hover::after {
	content: "";
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 0.5rem;
	pointer-events: none;
}

.github-button {
	position: relative;
	transition: box-shadow 0.2s ease-out;
}

.github-button:hover {
	box-shadow: rgb(255, 255, 255) 0px 0px 0px 1px,
		rgba(255, 255, 255, 0.5) 0px 0px 0px 6px;
}
</style>
