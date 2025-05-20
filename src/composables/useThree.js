/*
█▀ █▄█ █▀▀ █░█ █▀▀ █░█
▄█ ░█░ █▄▄ █▀█ ██▄ ▀▄▀

Author: <Anton Sychev> (anton at sychev dot xyz)
useThree.js (c) 2025
Created:  2025-05-20 22:02:56 
Desc: Three.js composable is a resusable component
*/

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ref } from "vue";

export function useThree() {
	const loading = ref(true);
	const threeCanvas = ref(null);

	let scene = null;
	let camera = null;
	let renderer = null;
	let model = null;
	let controls = null;
	let animationFrame = null;
	let mousePosition = { x: 0, y: 0 };
	let materials = {};

	const init = (canvas, options = {}) => {
		threeCanvas.value = canvas;
		const backgroundColor = options.backgroundColor || "#000000";

		scene = new THREE.Scene();
		scene.background = new THREE.Color(backgroundColor);

		const aspect = canvas.clientWidth / canvas.clientHeight;
		camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
		camera.position.z = 5;

		renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true,
			alpha: true,
		});
		renderer.setSize(canvas.clientWidth, canvas.clientHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.outputEncoding = THREE.sRGBEncoding;

		if (options.shadows) {
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		}

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight.position.set(0, 1, 2);

		if (options.shadows) {
			directionalLight.castShadow = true;
			directionalLight.shadow.mapSize.width = 1024;
			directionalLight.shadow.mapSize.height = 1024;
		}

		scene.add(directionalLight);

		controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;
		controls.enableZoom = true;
		controls.autoRotate = options.autoRotate || false;

		if (options.materials && Array.isArray(options.materials)) {
			initMaterials(options.materials);
		}
	};

	const initMaterials = (materialsConfig) => {
		materialsConfig.forEach((materialConfig) => {
			const { name, type, material } = materialConfig;

			if (!name || !type) {
				console.warn(
					"Material configuración incompleta: nombre y tipo son requeridos"
				);
				return;
			}

			let newMaterial;

			switch (type.toLowerCase()) {
				case "basic":
					newMaterial = new THREE.MeshBasicMaterial(material);
					break;
				case "standard":
					newMaterial = new THREE.MeshStandardMaterial(material);
					break;
				case "phong":
					newMaterial = new THREE.MeshPhongMaterial(material);
					break;
				case "lambert":
					newMaterial = new THREE.MeshLambertMaterial(material);
					break;
				case "physical":
					newMaterial = new THREE.MeshPhysicalMaterial(material);
					break;
				case "toon":
					newMaterial = new THREE.MeshToonMaterial(material);
					break;
				case "normal":
					newMaterial = new THREE.MeshNormalMaterial(material);
					break;
				default:
					console.warn(`Tipo de material desconocido: ${type}`);
					newMaterial = new THREE.MeshStandardMaterial(material);
			}

			materials[name] = newMaterial;
		});
	};

	const applyMaterialsToModel = (modelObject, materialAssignments) => {
		if (!modelObject || !materialAssignments) return;

		materialAssignments.forEach((assignment) => {
			const { meshName, materialName } = assignment;

			if (!meshName || !materialName || !materials[materialName]) {
				console.warn(
					`Configuración de asignación incorrecta o material no encontrado: ${meshName} -> ${materialName}`
				);
				return;
			}

			modelObject.traverse((child) => {
				if (child.isMesh && child.name === meshName) {
					if (!child.userData.originalMaterial) {
						child.userData.originalMaterial = child.material;
					}

					child.material = materials[materialName];
				}
			});
		});
	};

	const restoreOriginalMaterials = (modelObject) => {
		if (!modelObject) return;

		modelObject.traverse((child) => {
			if (child.isMesh && child.userData.originalMaterial) {
				child.material = child.userData.originalMaterial;
			}
		});
	};

	const loadModel = (modelPath, options = {}) => {
		loading.value = true;

		const loader = new GLTFLoader();

		if (options.useDraco && options.dracoPath) {
			const {
				DRACOLoader,
			} = require("three/examples/jsm/loaders/DRACOLoader.js");
			const dracoLoader = new DRACOLoader();
			dracoLoader.setDecoderPath(options.dracoPath);
			loader.setDRACOLoader(dracoLoader);
		}

		return new Promise((resolve, reject) => {
			loader.load(
				modelPath,
				(gltf) => {
					if (model) {
						scene.remove(model);
					}

					model = gltf.scene;

					const box = new THREE.Box3().setFromObject(model);
					const size = box.getSize(new THREE.Vector3()).length();
					const center = box.getCenter(new THREE.Vector3());

					model.position.x = -center.x;
					model.position.y = -center.y;
					model.position.z = -center.z;

					const scale = (options.scale || 4) / size;
					model.scale.set(scale, scale, scale);

					if (options.receiveShadows) {
						model.traverse((child) => {
							if (child.isMesh) {
								child.castShadow = true;
								child.receiveShadow = true;
							}
						});
					}

					if (options.materialAssignments) {
						applyMaterialsToModel(model, options.materialAssignments);
					}

					scene.add(model);
					loading.value = false;
					resolve(gltf);
				},
				(xhr) => {
					const progress = (xhr.loaded / xhr.total) * 100;
					console.log(`${Math.round(progress)}% loading`);
				},
				(error) => {
					console.error("Error cargando modelo:", error);
					loading.value = false;
					reject(error);
				}
			);
		});
	};

	const updateMaterial = (materialName, properties) => {
		if (!materials[materialName]) {
			console.warn(`Material no encontrado: ${materialName}`);
			return false;
		}

		Object.entries(properties).forEach(([key, value]) => {
			materials[materialName][key] = value;
		});

		materials[materialName].needsUpdate = true;
		return true;
	};

	const getMeshNames = () => {
		const names = [];
		if (model) {
			model.traverse((child) => {
				if (child.isMesh) {
					names.push(child.name);
				}
			});
		}
		return names;
	};

	const startAnimation = () => {
		const animate = () => {
			animationFrame = requestAnimationFrame(animate);

			if (model) {
				const targetRotationY = mousePosition.x * Math.PI * 0.5;
				const targetRotationX = -mousePosition.y * Math.PI * 0.2;

				model.rotation.y += (targetRotationY - model.rotation.y) * 0.05;
				model.rotation.x += (targetRotationX - model.rotation.x) * 0.05;
			}

			if (controls && controls.autoRotate) controls.update();

			renderer.render(scene, camera);
		};

		animate();
	};

	const handleMouseMove = (event) => {
		mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
		mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
	};

	const handleResize = () => {
		if (!camera || !renderer || !threeCanvas.value) return;

		const width = threeCanvas.value.clientWidth;
		const height = threeCanvas.value.clientHeight;

		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		renderer.setSize(width, height);
	};

	const cleanup = () => {
		window.removeEventListener("mousemove", handleMouseMove);
		window.removeEventListener("resize", handleResize);

		if (animationFrame) cancelAnimationFrame(animationFrame);

		Object.values(materials).forEach((material) => {
			if (material.dispose) {
				material.dispose();
			}
		});
		materials = {};

		if (renderer) renderer.dispose();
		if (model) scene.remove(model);
		if (controls) controls.dispose();

		scene = null;
		camera = null;
		renderer = null;
		model = null;
		controls = null;
	};

	return {
		loading,
		threeCanvas,
		init,
		loadModel,
		startAnimation,
		handleMouseMove,
		handleResize,
		cleanup,
		initMaterials,
		applyMaterialsToModel,
		restoreOriginalMaterials,
		updateMaterial,
		getMeshNames,
	};
}
