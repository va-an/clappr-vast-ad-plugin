module.exports = {
    entry: ['./src/vastPlugin', './src/adPlugin'],
    watch: true,
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel'
            }
        ]
    },

    output: {
        filename: 'dist/clappr_ad_plugin.js',
        library: 'adPlugin'
    },
};

