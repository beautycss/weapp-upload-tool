<template>
  <div class="home">
    <div class="content">
      <div v-if="projects.length === 0" class="main-content empty">
        <a-empty class="no-data">
          <a-button icon="plus" type="primary" @click="createModalVisible=true">添加项目</a-button>
        </a-empty>
      </div>
      <div v-if="projects.length > 0" class="main-content">
        <a-card :bordered="false">
          <div class="project-tab">
            <a-menu v-model="currentMenu" mode="horizontal">
              <a-menu-item @click="handleMenuChange" v-for="(projectItem, index) in projects" :key="`m${index}`">{{projectItem.description}}</a-menu-item>
            </a-menu>
          </div>
          <div class="project-content">
            <a-tabs :default-active-key="`m${currentIndex}-0`" @change="handleTabChange">
              <a-tab-pane v-for="(envItem, envIndex) in Object.keys(projects[currentIndex].appList)" :key="`m${currentIndex}-${envIndex}`" :tab="envItem">
                <a-table :row-selection="{selectedRowKeys: selectedRowKeys, onChange: handleSelectChange }" 
                  :columns="columns" :rowKey="(record, index) => index" 
                  :data-source="projects[currentIndex].appList[envItem]"
                  :scroll="{ y: tableHeight }" :pagination="{ hideOnSinglePage: true, pageSize: 500 }"
                >
                  <template slot="env" slot-scope="text">
                    <a-badge :status="status[text.toUpperCase()]" :text="envs[text.toUpperCase()]" />
                  </template>
                  <template slot="operation" slot-scope="text, record">
                    <a @click="() => handleSwitch(record)">切换</a>
                  </template>
                </a-table>
              </a-tab-pane>
            </a-tabs>
          </div>
        </a-card>
      </div>
      <div class="side-content">
        <a-card id="logCard" class="log-card">
          <p :class="`text-${logItem.type}`" v-for="(logItem, logIndex) in logList" :key="logIndex">{{ logItem.text }}</p>
        </a-card>
      </div>
    </div>
    <div class="footer">
      <a-card>
        <div>
          <a-space>
            <a-button type="primary" icon="upload" @click="handleVersionModal">上传</a-button>
            <a-button icon="sync" @click="handleRefresh">刷新</a-button>
            <a-button icon="appstore" @click="projectModalVisible=true">管理</a-button>
            <a-button icon="plus" @click="handleOpenCreateModal">添加</a-button>
          </a-space>
        </div>
        <div class="current-app">
          <template v-if="currentApp.name">
            当前：{{ currentApp.name }}
            <a-divider type="vertical" />
            {{ currentApp.appId }}
            <a-divider type="vertical" />
            {{ currentApp.env ? envs[currentApp.env.toUpperCase()] : '' }}
          </template>
        </div>
        <div>
          <a-space>
            <a-switch checked-children="亮白" un-checked-children="暗黑" 
              :checked="themeChecked" @change="handleThemeChange" />
            <a-tooltip title="使用说明">
              <a-button type="default" size="small" icon="question" shape="round" @click="readmeModalVisible=true"></a-button>
            </a-tooltip>
            <a-tooltip title="清除日志">
              <a-button type="default" size="small" icon="delete" shape="round" @click="handleClear"></a-button>
            </a-tooltip>
          </a-space>
        </div>
      </a-card>
    </div>
    <a-modal
      title="添加项目"
      v-model="createModalVisible"
      :maskClosable="false"
      @ok="handleCreate"
    >
      <a-form :form="createForm">
        <a-form-item
          :label-col="formItemLayout.labelCol"
          :wrapper-col="formItemLayout.wrapperCol"
          label="项目根目录"
        >
          <a-upload
            v-decorator="[
              'jsonFile',
              {
                valuePropName: 'jsonFileList',
                getValueFromEvent: uploadList,
                rules: [{ required: true, message: '请选择weapp.config.json文件' }]
              },
            ]"
            :before-upload="beforeJsonUpload"
            :showUploadList="false"
          >
            <a-button> <a-icon type="search" /> 选择json文件 </a-button>
          </a-upload>
          <template slot="extra">
            <p v-if="jsonFileList.length > 0">{{jsonFileList[0].name}}</p>
            <p>选择项目根目录的weapp.config.json文件，没有则先新建。 
            <a @click="readmeModalVisible=true">使用说明</a></p>
          </template>
        </a-form-item>
        <a-form-item
          v-if="isWindows"
          :label-col="formItemLayout.labelCol"
          :wrapper-col="formItemLayout.wrapperCol"
          label="微信开发者工具目录"
        >
          <a-upload
            v-decorator="[
              'wechatDevToolFile',
              {
                valuePropName: 'wechatDevToolFileList',
                getValueFromEvent: uploadList,
                rules: [{ required: true, message: '请选择cli.bat文件' }]
              },
            ]"
            :before-upload="beforeFileUpload"
            :showUploadList="false"
          >
            <a-button> <a-icon type="search" /> 选择bat文件 </a-button>
          </a-upload>
          <template slot="extra">
            <p v-if="wechatDevToolFileList.length > 0">{{wechatDevToolFileList[0].name}}</p>
            <p>选择微信开发者工具安装目录下的cli.bat文件</p>
          </template>
        </a-form-item>
        <a-form-item
          :label-col="formItemLayout.labelCol"
          :wrapper-col="formItemLayout.wrapperCol"
          label="本地构建工具"
        >
          <a-radio-group
            v-decorator="[
              'buildTool',
              { rules: [{ required: true, message: '请选择本地构建工具' }] },
            ]"
          >
            <a-radio-button value="yarn">
              yarn
            </a-radio-button>
            <a-radio-button value="npm">
              npm
            </a-radio-button>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
    <a-modal
      title="版本号和描述"
      v-model="versionModalVisible"
      :maskClosable="false"
      @ok="handleDeploy"
      okText="确定(Enter)"
    >
      <a-form :form="deployForm">
        <a-form-item
          :label-col="formItemLayout.labelCol"
          :wrapper-col="formItemLayout.wrapperCol"
          label="线上版本号"
        >
          {{ projects.length > 0 ? projects[currentIndex].version : '' }}
        </a-form-item>
        <a-form-item
          :label-col="formItemLayout.labelCol"
          :wrapper-col="formItemLayout.wrapperCol"
          label="版本号"
        >
          <a-input
            ref="versionInput"
            v-decorator="[
              'version',
              { rules: [{ required: true, message: '请输入版本号' }] },
            ]"
            placeholder="请输入版本号"
          />
        </a-form-item>
        <a-form-item
          :label-col="formItemLayout.labelCol"
          :wrapper-col="formItemLayout.wrapperCol"
          label="备注"
        >
          <a-input
            v-decorator="[
              'commit',
              { rules: [{ required: true, message: '请输入备注' }] },
            ]"
            placeholder="请输入备注"
            @pressEnter="handleEnter"
          />
        </a-form-item>
      </a-form>
    </a-modal>
    <a-modal
      title="项目管理"
      v-model="projectModalVisible"
      width="62%"
      :footer="null"
    >
      <div class="modal-project-list">
        <draggable v-model="projects" @end="handleSaveProject">
          <div class="modal-project-item" v-for="(projectItem, projectIndex) in projects" :key="projectIndex">
            <div class="description">{{projectItem.description}}</div>
            <div class="path">{{projectItem.path}}</div>
            <div class="buildTool">{{projectItem.buildTool}}</div>
            <div class="operation">
              <a-tooltip title="在微信开发者工具中打开">
                <a @click="() => handleOpenProject(projectItem)">打开</a>
              </a-tooltip>
              <a-divider type="vertical" />
              <a-popconfirm
                :title="`确定删除 ${projectItem.description} 吗？`"
                @confirm="() => handleDeleteProject(projectItem)"
              >
                <a href="javascript:;">删除</a>
              </a-popconfirm>
            </div>
          </div>
        </draggable>
      </div>
    </a-modal>
    <a-modal
      title="使用说明"
      v-model="readmeModalVisible"
      width="62%"
      :footer="null"
      :centered="true"
      class="readme-modal"
    >
      <Readme />
    </a-modal>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import { ipcRenderer } from 'electron'
import { getCurrentApp, getProjects, getThemeConfig, getSetting } from '@/utils/index'
import Readme from './Readme'
import './index.less'

const columns = [
  {
    title: '小程序名称',
    dataIndex: 'name',
    width: '30%',
  },
  {
    title: 'appId',
    dataIndex: 'appId',
    width: '35%',
  },
  {
    title: '环境',
    dataIndex: 'env',
    scopedSlots: { customRender: 'env' },
  },
  {
    title: '操作',
    dataIndex: 'operation',
    scopedSlots: { customRender: 'operation' },
  },
]

export default {
  components: {
    draggable,
    Readme,
  },
  data() {
    return {
      projects: [],
      columns,
      selectedRowKeys: [],
      selectedRows: [],
      currentIndex: 0,
      currentMenu: ['m0'],
      currentApp: {},
      envs: { DEV: '开发', TEST: '测试', PROD: '生产' },
      status: { DEV: 'processing', TEST: 'warning', PROD: 'success' },
      logList: [],
      tableHeight: 445,
      themeChecked: true,
      jsonFileList: [],
      wechatDevToolFileList: [],
      createModalVisible: false,
      versionModalVisible: false,
      formItemLayout: {
        labelCol: { span: 8 },
        wrapperCol: { span: 14 },
      },
      createForm: this.$form.createForm(this, { name: 'createForm' }),
      deployForm: this.$form.createForm(this, { name: 'deployForm' }),
      projectModalVisible: false,
      readmeModalVisible: false,
      isWindows: false,
    }
  },
  created () {
    const _this = this
    this.initProjects()
    this.getIsWindows()
    ipcRenderer.on('log', (event, msg) => {
      Array.isArray(msg) ? _this.logList.concat(msg) : _this.logList.push(msg)
      setTimeout(() => {
        _this.scrollToBottom()
      }, 500)
    })
    ipcRenderer.on('switchSuccess', (event, app) => {
      _this.currentApp = app
    })
    ipcRenderer.on('refresh', () => {
      _this.handleRefresh(false)
    })
    ipcRenderer.on('notification', (event, { type, text}) => {
      _this.$notification[type||'info']({ message: text })
    })
    ipcRenderer.on('theme', function(event, theme) {
      _this.handleThemeChange(theme === 'light', false)
    })
  },
  mounted() {
    const _this = this
    setTimeout(()=> {
      this.getTableBodyHeight()
    }, 300)
    window.addEventListener('resize', () => {
      setTimeout(()=> {
        _this.getTableBodyHeight()
      }, 300)
    })
  },
  methods: {
    getTableBodyHeight() {
      const mainContentRect = document.querySelector('.main-content').getBoundingClientRect()
      this.tableHeight = mainContentRect.height - 48 - 44 - 54
    },
    initCurrentProject() {
      this.currentApp = this.projects.length > 0 ? 
        getCurrentApp(this.projects[this.currentIndex])[0] :
        {}
    },
    initProjects() {
      this.projects = getProjects()
      this.initCurrentProject()
      console.log('projects', this.projects)
    },
    clearSelection() {
      this.selectedRows = []
      this.selectedRowKeys = []
    },
    getIsWindows() {
      const { wechatDevToolPath } = getSetting()
      this.isWindows = process.platform === 'win32' && !wechatDevToolPath
    },
    handleClear() {
      this.logList = []
      // this.$notification.success({ message: '清除成功' })
    },
    handleMenuChange(arg) {
      this.currentIndex = arg.key.split('m')[1]
      this.clearSelection()
      this.initCurrentProject()
    },
    handleRefresh(notification = true) {
      this.initProjects()
      this.currentIndex = 0
      this.clearSelection()
      this.getIsWindows()
      this.getTableBodyHeight()
      notification && this.$notification.success({ message: '数据刷新成功' })
    },
    handleSelectChange(selectedRowKeys, selectedRows) {
      this.selectedRowKeys = selectedRowKeys
      this.selectedRows = selectedRows
    },
    handleSwitch(item) {
      const currentProject = this.projects[this.currentIndex]
      ipcRenderer.send('switch', item, {
        currentAppIdFilePath: currentProject.currentAppIdFilePath,
        path: currentProject.path,
        buildTool: currentProject.buildTool,
      })
    },
    handleTabChange() {
      this.clearSelection()
    },
    async handleThemeChange(checked, setTheme=true) {
      try {
        const theme = checked ? 'light' : 'dark'
        const themeConfig = getThemeConfig(theme)
        ipcRenderer.send('toggleTheme', theme)
        if (setTheme && process.env.NODE_ENV === 'production') {
          ipcRenderer.send('setTheme', theme)
        }
        await window.less.modifyVars(themeConfig)
        this.themeChecked = checked
      } catch (error) {
        this.$notification.error({ message: '主题切换失败' })
        console.log(error)
      }
    },
    uploadList(event) {
      if (Array.isArray(event)) {
        return event
      }
      return event && [event.file]
    },
    beforeJsonUpload(file) {
      this.jsonFileList = [file]
      return false
    },
    beforeFileUpload(file) {
      this.wechatDevToolFileList = [file]
      return false
    },
    handleOpenCreateModal() {
      this.jsonFileList = []
      this.wechatDevToolFileList = []
      this.createForm.resetFields()
      this.createModalVisible = true
    },
    handleCreate() {
      this.createForm.validateFields(err => {
        if (!err) {
          const { jsonFile, wechatDevToolFile, buildTool } = this.createForm.getFieldsValue()
          if (jsonFile[0].name !== 'weapp.config.json') {
            this.createForm.setFields({
              jsonFile: {
                value: [],
                errors: [new Error('请选择 weapp.config.json 文件')],
              }
            })
            return
          }
          if (this.isWindows && !wechatDevToolFile[0].name !== 'cli.bat') {
            this.createForm.setFields({
              wechatDevToolFile: {
                value: [],
                errors: [new Error('请选择 cli.bat 文件')],
              }
            })
            return
          }
          const project = { weappJsonFile: jsonFile[0].path, buildTool }
          if (this.isWindows) {
            project.wechatDevToolFile = wechatDevToolFile[0].path
          }
          ipcRenderer.send('createProject', project)
          this.createModalVisible = false
        }
      })
    },
    handleDeleteProject(project) {
      ipcRenderer.send('deleteProject', project)
      this.projectModalVisible = false
    },
    handleSaveProject() {
      ipcRenderer.send('sortProject', this.projects)
    },
    handleOpenProject(project) {
      ipcRenderer.send('openProject', {
        name: project.name,
        path: project.path,
      })
    },
    handleVersionModal() {
      if(this.selectedRows.length === 0) {
        this.$notification.warning({ message: '请至少选择一项' })
        return
      }
      this.versionModalVisible = true
      this.$nextTick(() => {
        this.$refs.versionInput.focus()
      })
    },
    handleEnter() {
      this.$nextTick(() => {
        this.handleDeploy()
      })
    },
    handleDeploy() {
      this.deployForm.validateFields(err => {
        if (!err) {
          const { version, commit } = this.deployForm.getFieldsValue()
          const { name, currentAppIdFilePath, path, buildTool, wechatDevToolFile } = this.projects[this.currentIndex]
          const projectData = { name, currentAppIdFilePath, path, buildTool }
          if (wechatDevToolFile) {
            projectData.wechatDevToolFile = wechatDevToolFile
          }
          ipcRenderer.send('deploy', version, commit, this.selectedRows, projectData)
          this.versionModalVisible = false
        }
      })
    },
    scrollToBottom() {
      var ele = document.querySelector('#logCard')
      ele.scrollTop = ele.scrollHeight
    }
  }
}
</script>
