/*
█▀ █▄█ █▀▀ █░█ █▀▀ █░█
▄█ ░█░ █▄▄ █▀█ ██▄ ▀▄▀

Author: <Anton Sychev> (anton at sychev dot xyz)
main.js (c) 2024
Created:  2024-07-08 17:40:31 
Desc: Main entry point
*/

import "normalize.css";
import "960.css";
import "@/assets/style.css";

import { createApp } from "vue";

import App from "@/App.vue";

const app = createApp(App);
app.mount("#app");
