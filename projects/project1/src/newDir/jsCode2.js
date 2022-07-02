const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const path = require('path');

module.exports = {
    entry: './src/index.tsx',
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

function aa () {
    
}