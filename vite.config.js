import { defineConfig } from "vite";
import path from "path";

import vue from "@vitejs/plugin-vue";
import ViteRequireContext from "@originjs/vite-plugin-require-context";

import stripCode from "rollup-plugin-strip-code";
import creditslog from "credits-log";
import { splitVendorChunkPlugin } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
	//base: "/",
	mode: "production",
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
				assetFileNames: "src/assets/[ext]/[hash][extname]",
				chunkFileNames: "src/assets/js/[hash].[format].js",
				entryFileNames: "src/assets/js/[hash].[format].js",
			},
		},
	},
	resolve: {
		extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"],
		alias: [
			{
				find: "@",
				replacement: path.resolve(__dirname, "./src"),
			},
		],
	},
	optimizeDeps: {
		exclude: ["worker"],
	},
	plugins: [
		ViteRequireContext,
		vue(),
		splitVendorChunkPlugin(),
		stripCode({
			start_comment: "develblock:start",
			end_comment: "develblock:end",
		}),
		creditslog(),
	],
});
