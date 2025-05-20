<template>
	<div
		class="w-full h-full p-4 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-md hover:shadow-lg transition-all duration-300"
		:class="{ 'p-3': isCompact }"
	>
		<div class="flex flex-col h-full gap-3">
			<div
				class="flex items-center gap-4"
				:class="{ 'flex-col text-center': isCompact }"
			>
				<div class="relative">
					<img
						:src="userData?.avatar || defaultAvatar"
						:alt="`Avatar de ${userData?.name || 'Usuario'}`"
						class="w-[70px] h-[70px] rounded-full object-cover border-3 border-white shadow-sm transition-transform duration-300 hover:scale-105"
						:class="{ 'w-[60px] h-[60px]': isCompact }"
						@error="handleImageError"
					/>
					<span
						v-if="userData?.status"
						class="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white"
						:class="{
							'bg-green-500': userData.status === 'online',
							'bg-gray-400': userData.status === 'offline',
							'bg-yellow-400': userData.status === 'away',
						}"
					></span>
				</div>
				<div class="flex-1">
					<h1
						class="text-lg font-semibold text-gray-800 leading-tight m-0"
						:class="{ 'text-base': isCompact }"
					>
						{{ userData?.name || "Usuario" }}
					</h1>
					<h5
						class="text-sm font-medium text-gray-500 opacity-80 mt-1 m-0"
						:class="{ 'text-xs': isCompact }"
					>
						{{ userData?.role || "Sin rol asignado" }}
					</h5>
				</div>
			</div>

			<div v-if="userData?.bio" class="pt-1">
				<p
					class="m-0 text-sm leading-relaxed text-gray-600 line-clamp-3"
					:class="{ 'text-xs line-clamp-2': isCompact }"
				>
					{{ userData.bio }}
				</p>
			</div>

			<div v-if="userData?.stats" class="flex justify-around gap-3 py-2">
				<div
					v-for="(value, key) in userData.stats"
					:key="key"
					class="flex flex-col items-center text-center"
				>
					<span class="text-base font-semibold text-gray-800">{{ value }}</span>
					<span class="text-xs uppercase text-gray-500">{{ key }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
	userData: {
		type: Object,
		default: () => ({
			name: "Anton Sychev",
			role: "Full Stack Developer",
			bio: "Full Stack Developer and CTO with more than 25 years of programming experience (I started in 1996). Passionate about technology, self-taught and constantly learning.",
			avatar: "/images/avatar.png",
			status: "online",
			stats: {
				proyectos: 120,
				seguidores: 1250,
				años: 25,
			},
		}),
	},
	isCompact: {
		type: Boolean,
		default: false,
	},
	showActions: {
		type: Boolean,
		default: true,
	},
	primaryAction: String,
	secondaryAction: String,
});

const defaultAvatar = ref("/images/default-avatar.png");

const handleImageError = (e) => {
	e.target.src = defaultAvatar.value;
};
</script>
