const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const fs = require('fs');
const path = require('path');
const mode = process.env.mode || 'development';
const env = process.env.env || 'dev';

fs.cpSync(`src/config/config.${env}.ts`, 'src/config.ts');
module.exports = {
    entry: './src/index.tsx',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].[hash].js',
        clean: true
    },
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
    },
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    }
}