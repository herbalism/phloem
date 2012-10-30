var config = module.exports;

config["browser tests"] = {
    environment: "browser",
    sources: ["src/**/*.js",
	      "modules/when/*.js",
	      "modules/curl/src/curl/plugin/**/*.js"],
    tests: ["test/**/*.js"],
    libs: ["modules/curl/src/curl.js", "loaderconf.js"],
    extensions: [require("buster-amd")]
};
