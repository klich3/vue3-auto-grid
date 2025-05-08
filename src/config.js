/*
█▀ █▄█ █▀▀ █░█ █▀▀ █░█
▄█ ░█░ █▄▄ █▀█ ██▄ ▀▄▀

Author: <Anton Sychev> (anton at sychev dot xyz)
config.js (c) 2024
Created:  2024-07-08 17:52:04 
Desc: Configuration file
Docs:
	* https://unhead.unjs.io/usage/guides/
*/

const { MODE, ENV_MODE } = import.meta.env;

const common = {
	pageTitle: "Auto Grid - Sychev",
	pageTitleSeparator: "|",

	uid: "auto-grid-sychev",

	api: "",
	assetsPath: "/src/assets/",
	backend: "/",
};

const dev = {
	debug: true,
	/* develblock:start */
	backend: `http://${window.location.hostname}:3001/`,
	/* develblock:end */
};

const prod = {
	//Note: prod values are set in .env.production
};

export default /production/gim.test(MODE || ENV_MODE)
	? { ...common, ...prod }
	: { ...common, ...dev };
