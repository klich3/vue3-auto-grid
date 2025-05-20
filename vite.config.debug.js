import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import ViteRequireContext from "@originjs/vite-plugin-require-context";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
	//base: "/",
	mode: "development",
	server: {
		open: "/",
	},
	build: {
		brotliSize: false,
		manifest: false,
		sourcemap: false, //'inline'
		minify: "terser",
		publicDir: "public/",
		outDir: "dist/",
		rollupOptions: {
			external: [
				"**/*.mp4",
				"**/*.ogv",
				"**/*.ogg",
				"**/*.webm",
				"**/*.gltf",
				"**/*.glb",
				"**/*.drc",
				"**/*.ktx2",
				"**/*.bin",
			],
			output: {
				assetFileNames: "src/assets/[ext]/[name][extname]",
				chunkFileNames: "src/assets/js/[name].[hash].js",
				entryFileNames: "src/assets/js/[name].js",
				manualChunks: (id) => {
					if (id.includes("node_modules"))
						return id
							.toString()
							.split("node_modules/")[1]
							.split("/")[0]
							.toString();
				},
			},
		},
	},
	resolve: {
		extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"],
		alias: [
			{
				find: "@",
				replacement: path.resolve(__dirname, "src"),
			},
		],
	},
	optimizeDeps: {
		exclude: ["worker"],
	},
	plugins: [ViteRequireContext, vue(), tailwindcss()],
});
