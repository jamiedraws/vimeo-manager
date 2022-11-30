const path = require("path");
const glob = require("glob");
const autoprefixer = require("autoprefixer");

// Tells webpack to transpile code down to ES5 to serve legacy browsers. For webpack to compile code upwards to modern browsers, set the boolean to false instead.
const legacy = true;

// Webpack will look for any .ts and .scss file matching this file name.
const inputFilename = "app";

// Using the legacy variable, Webpack will output either the legacy script (.es5.js) or the modern script (.js)
const outputFilename = legacy
    ? `${inputFilename}.es5.js`
    : `${inputFilename}.js`;

const mode = process.env.NODE_ENV || "development";

const target =
    process.env.NODE_ENV === "production"
        ? legacy
            ? "browserslist"
            : "web"
        : "es5";

const createEntryContext = function (entryName, regexExtension) {
    const search = `${entryName}.+${regexExtension.source}`;
    const searchRegex = new RegExp(search);

    const files = glob.sync(
        `./{shared/js/template/**/,shared/customers/**/js/template/**/,/**/}${search}`
    );
    console.log({ files });
    const entries = {};

    files.forEach((path) => {
        const directory = path.replace(searchRegex, "");
        if (!entries[directory]) {
            entries[directory] = { import: [] };
        }

        entries[directory].import.push(path);
    });

    return entries;
};

let babelBrowserTargets = {};

if (!legacy) {
    babelBrowserTargets = {
        browsers: [
            "Chrome >= 60",
            "Safari >= 10.1",
            "iOS >= 10.3",
            "Firefox >= 54",
            "Edge >= 15"
        ]
    };
}

module.exports = {
    target: target,
    mode: mode,
    entry: createEntryContext(inputFilename, /(ts)/i),
    output: {
        filename: `./[name]/${outputFilename}`,
        path: path.resolve(__dirname),
        chunkFormat: "array-push"
    },
    watch: true,
    watchOptions: {
        ignored: /node_modules/
    },
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.s[ac]ss$/i,
                type: "asset/resource",
                generator: {
                    filename: "[path][name].css"
                },
                use: [
                    { loader: "extract-loader" },
                    { loader: "css-loader" },
                    {
                        loader: "postcss-loader",
                        options: {
                            postcssOptions: {
                                plugins: [autoprefixer()]
                            }
                        }
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            implementation: require("sass"),
                            webpackImporter: false,
                            sassOptions: {
                                includePaths: ["./node_modules"]
                            }
                        }
                    }
                ]
            },
            {
                test: /\.ts$/,
                loader: "ts-loader",
                include: path.resolve(__dirname),
                exclude: /node_modules/,
                options: {
                    onlyCompileBundledFiles: true,
                    transpileOnly: true
                }
            },
            {
                test: /\.ts|.js$/,
                loader: "babel-loader",
                exclude: /node_modules/,
                options: {
                    presets: [
                        [
                            "@babel/preset-env",
                            {
                                modules: false,
                                useBuiltIns: "usage",
                                corejs: 3,
                                loose: true,
                                targets: babelBrowserTargets
                            }
                        ],
                        "@babel/typescript"
                    ],
                    plugins: [
                        [
                            "@babel/plugin-proposal-class-properties",
                            {
                                loose: true
                            }
                        ]
                    ]
                }
            }
        ]
    },
    resolve: {
        extensions: [".scss", ".sass", ".ts", ".js"],
        alias: {
            shared: path.resolve(__dirname, "shared"),
            Shared: path.resolve(__dirname, "Shared"),
            ts: path.resolve(__dirname, "ts")
        }
    },
    optimization: {
        usedExports: true
    }
};
