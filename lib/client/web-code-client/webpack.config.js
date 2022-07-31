const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const fs = require('fs');
const path = require('path');
const mode = process.env.mode || 'development';
const env = process.env.env || 'dev';

fs.cpSync(`src/config/config.${env}.js`, 'src/config.js');
module.exports = {
    entry: './src/index.tsx',
    mode: mode,
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: ['ts-loader']
            },
            {
                test: /\.tsx$/,
                use: ['ts-loader']
            },
            {
                test: /\.scss$/,
                use: ['style-loader', 'css-loader', 'sass-loader']
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'src/index.html')
        })
        
    ],
    resolve: {
        extensions: ['.js', '.ts', '.tsx'],
        plugins: [
            new TsconfigPathsPlugin({
                baseUrl: './libs'
            })
        ]
    }
}