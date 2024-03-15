const path = require('path')

module.exports = {
  css: {  
    loaderOptions: {
      less: {
        lessOptions:{
          modifyVars: {},
          javascriptEnabled: true,
        }
      }
    }
  },
  chainWebpack: config =>{
    // 路径别名
    // config.resolve.alias
      // .set('@', path.resolve(__dirname, 'src'))
      // .set('src', path.resolve(__dirname, 'src'))
      // .set('assets', path.resolve(__dirname, 'src/assets'))
      // .set('pages', path.resolve(__dirname, 'src/pages'))
      // .set('utils', path.resolve(__dirname, 'src/utils'))
    config.plugin('html')
      .tap(args => {
        args[0].title = "微信小程序切换上传工具"
        return args
      })
  },
  pluginOptions: {
    'style-resources-loader': {
      preProcessor: 'less',
      patterns: [
        path.resolve(__dirname, 'src/global.less')
      ]
    },
    electronBuilder: {
      builderOptions: {
        extraResources: {
          from: './public/data',
          to: './data'
        },
        mac: {
          icon: './public/app.png'
        },
        win: {
          icon: './public/app.ico'
        },
        productName: 'weapp-upload-tool',
        // asar: false,
      },
      nodeIntegration: true
    }
  }
}