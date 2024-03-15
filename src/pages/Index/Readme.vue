<template>
  <div class="readme">
    <div class="content">
      <h2>工具介绍</h2>
      <p>该工具是一款用于在多环境多个appId的微信小程序工程里切换、批量打包上传小程序的工具。</p>

      <p>实现的功能有：</p>
      <ul>
        <li>多个小程序之间的热切换；</li>
        <li>多个小程序的批量打包和上传；</li>
        <li>多个小程序在微信开发者工具里打开；</li>
      </ul>

      <h2>使用场景</h2>
      <p>1. 快速切换一个项目里不同appId的小程序，无需每次修改代码和进入微信开发者工具-详情里切换；</p>
      <p>2. 本地小程序工程一套代码要根据不同appId打包成多个，并上传到对应appId的小程序；</p>

      <h2>使用前配置</h2>
      <p>1. 在小程序工程的根目录新建一个`weapp.config.json`文件，内容格式如下：</p>
      <pre>
      {
        "name": "fe-lady-shoes-weapp",
        "description": "千选小程序3.0",
        "currentAppIdFilePath": "/src/constant/weapp.config.ts",
        "appList": {
          "DEV": [
            {
              "appId": "wxade5887785697f40",
              "name": "滔博运动北京",
              "code": "DEV",
              "env": "dev"
            }
          ],
          "TEST": [
            {
              "appId": "wxb4c45e3f0340e0f7",
              "name": "NiuQianXuan",
              "code": "TEST",
              "env": "test"
            }
          ],
          "PROD": [
            {
              "appId": "wx8ecf4cf92108f320",
              "name": "NiuQianXuan",
              "code": "PROD",
              "env": "prod"
            }
          ]
        }
      }
      </pre>
      <p>说明：</p>
      <ul>
        <li>修改`currentAppIdFilePath`相对路径，是你电脑上当前小程序工程里`CURRENT_APPID`所在文件的路径，如果没有参照下面第2步添加；</li>
        <li>修改`name`和`description`的值；</li>
        <li>修改和添加每个环境下小程序信息，`code`需设为`整个json里唯一`；</li>
        <li>以上json属性都是必须的，该工具会用到。可以增加额外属性以便项目中使用；</li>
        <li>每个小程序工程对应的全部appId都放在这个文件里，以便在项目里引用和后续维护。</li>
      </ul>

      <p>2. 在你的小程序项目配置常量的文件里，加上如下代码：</p>
      <pre>
      export const CURRENT_APPID = 'wxb4c45e3f0340e0f7'
      </pre>
      <p>说明：</p>
      <ul>
        <li>写法需要按照上面来，使用该工具切换小程序后，会自动更新上面的`CURRENT_APPID`。</li>
        <li>以上步骤只需配置一次，后面根据情况修改即可。</li>
      </ul>


      <h2>使用前确认</h2>
      <p>1. ⚠ 打开微信开发者工具顶部菜单「设置 -> 安全设置」，开启服务端口。</p>

      <p>2. 确认已在微信开发者工具打开了当前小程序工程；</p>
      <p>该工具只能在微信开发者工具当前小程序下切换不同appId，不能切换微信开发者工具里导入的不同小程序。</p>

      <p>3. 确认你的小程序工程根目录下有微信开发者工具生成的`project.config.json`文件；</p>

      <p>4. 开始使用吧。</p>


      <h2>小程序工程改造</h2>
      <p>上面添加了`CURRENT_APPID`后，你的小程序工程需要修改对应的常量和获取`BASE_URL`的代码，方便调试和后期维护。修改如下：</p>

      <p>1. 在配置常量的文件里，如果小程序项目已使用其他常量，可以添加如下代码：</p>
      <pre>
      export const YOUR_APPID = CURRENT_APPID
      </pre>

      <p>2. 在配置常量的文件里，添加如下代码：</p>
      <pre>
      import weappData from '../../weapp.config.json'

      const getAppInfoMap = () => {
        const data = {}
        Object.keys(weappData.appList).forEach(env => {
          weappData.appList[env].forEach(item => {
            data[item.appId] = {
              appName: item.appName,
              env: item.env,
            }
          });
        })
        return data
      }

      export const APP_INFO_MAP = getAppInfoMap()
      </pre>

      <p>3. 打开小程序工程的`http.config.ts`文件，统一使用如下方式获取`BASE_URL`：</p>
      <pre>
      // 从配置常量的文件里引入以下两个常量
      import { CURRENT_APPID, APP_INFO_MAP } from "./index"

      const envUrlList = {
        dev: 'https://dev.qxclub.cn',    // 开发域名
        test: 'https://test.qxclub.cn',  // 测试域名
        prod: 'https://wx.qxclub.cn',    // 生产域名
      }
      const env = APP_INFO_MAP[CURRENT_APPID] ? APP_INFO_MAP[CURRENT_APPID].env : 'test'
      export const BASE_URL = envUrlList[env]
      </pre>

    </div>
  </div>
</template>

<script>
import './index.less'

export default {
  components: {
  },
  data() {
    return {      
    }
  },
  mounted() {
  },
  methods: {
  }
}
</script>

<style lang="less">
.readme {
  pre {
    padding: 20px 0 0;
  }
}
.readme-modal {
  .ant-modal-wrap {
    z-index: 1010;
  }
  .ant-modal-body {
    max-height: 80vh;
    overflow: hidden auto;
  }
}
</style>
