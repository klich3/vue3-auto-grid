const { publicPath, pwa_name } = require("./package.json");

module.exports = {
	assetsDir: "src/assets",
	publicPath: `${publicPath}/`,

	css: {
		sourceMap: false,
	},

	productionSourceMap: false,
	devServer: {},

	pwa: {
		name: pwa_name,
		themeColor: "#ccc",
	},
};
