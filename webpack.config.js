const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = [
  // Extension (Node.js target)
  {
    target: 'node',
    mode: 'none', // 'production' for release, 'none' for development
    entry: {
      extension: './src/extension.ts'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      libraryTarget: 'commonjs2',
      devtoolModuleFilenameTemplate: '../[resource-path]',
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [{ loader: 'ts-loader' }]
        }
      ]
    },
    externals: {
      vscode: 'commonjs vscode'
    },
    devtool: 'source-map',
  },
  // MCP Server (Node.js target, no vscode dependencies)
  {
    target: 'node',
    mode: 'none', // 'production' for release, 'none' for development
    entry: {
      'mcp-server': './src/mcp/mcp-server-standalone.ts'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      libraryTarget: 'commonjs2',
      devtoolModuleFilenameTemplate: '../[resource-path]',
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [{ loader: 'ts-loader' }]
        }
      ]
    },
    externals: {
      // Exclude VS Code from MCP server bundle
      vscode: 'commonjs vscode',
      fs: 'commonjs fs',
      path: 'commonjs path',
      'fs/promises': 'commonjs fs/promises'
    },
    devtool: 'source-map',
  },
  // Webview (Browser target)
  {
    target: 'web',
    mode: 'none', // 'production' for release, 'none' for development
    entry: {
      webview: './src/ui/webview/index.tsx' // New SolidJS entry point
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js'
    },
    resolve: {
      extensions: ['.ts', '.js', '.tsx', '.jsx'],
      fallback: {
        "path": false,
        "fs": false
      }
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: ['babel-preset-solid', '@babel/preset-typescript']
              }
            },
            { 
              loader: 'ts-loader',
              options: {
                compilerOptions: {
                  module: 'esnext'
                }
              }
            }
          ]
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: 'src/ui/webview/style.css', to: 'style.css' },
          // No need to copy index.html as it's generated in the provider
        ],
      }),
    ],
    devtool: 'source-map',
  }
];
