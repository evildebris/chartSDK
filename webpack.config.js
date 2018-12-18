var webpack = require('webpack');
const path=require('path');

module.exports = [
    // 未压缩版
    {
        mode: 'development',
        entry: {
            'zzjzAppLib': './src/index.js'
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name].js',
            library: 'zzjzAppLib',
            libraryTarget: "umd"
        }
    },

    // 压缩版
    {
        mode: 'production',
        entry: {
            'zzjzAppLib.min': './src/index.js'
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name].js',
            library: 'zzjzAppLib',
            libraryTarget: "umd"
        }
    }
];