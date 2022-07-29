const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const path = require('path');

const env = process.env.mode || 'development';

module.exports = {
    entry: './src/index.tsx',
    mode: env,
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