'use strict'

import { app, protocol, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { switchApp, deploy, createProject, deleteProject, 
  sortProject, openProject, getSetting, setSetting } from './utils/command'
const isDevelopment = process.env.NODE_ENV !== 'production'

class wechatCli {
  constructor() {
    this.mainWindow = null
  }

  init() {
    this.bindAppEvents()
    this.bindMessageEvents()
  }
  
  bindAppEvents() {
    // Scheme must be registered before the app is ready
    protocol.registerSchemesAsPrivileged([
      { scheme: 'app', privileges: { secure: true, standard: true } }
    ])

    // Quit when all windows are closed.
    app.on('window-all-closed', () => {
      // On macOS it is common for applications and their menu bar
      // to stay active until the user quits explicitly with Cmd + Q
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) this.createWindow()
    })

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.on('ready', async () => {
      if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
          await installExtension(VUEJS_DEVTOOLS)
        } catch (e) {
          console.error('Vue Devtools failed to install:', e.toString())
        }
      }
      await this.createWindow()
      await this.initTheme()
    })

    // Exit cleanly on request from parent process in development mode.
    if (isDevelopment) {
      if (process.platform === 'win32') {
        process.on('message', (data) => {
          if (data === 'graceful-exit') {
            app.quit()
          }
        })
      } else {
        process.on('SIGTERM', () => {
          app.quit()
        })
      }
    }

  }

  bindMessageEvents() {
    // 切换操作
    ipcMain.on('switch', async (event, app, project) => {
      try {
        event.reply('log', '开始切换...')
        await switchApp(event, app, project)
      } catch(error){
        event.reply('log', error)
      }
    })

    // 部署项目
    ipcMain.on('deploy', async (event, version, description, appList, project) => {
      try {
        event.reply('log', '开始上传...')
        await deploy(event, version, description, appList, project)
      } catch(error){
        event.reply('log', error)
      }
    })

    // 添加项目
    ipcMain.on('createProject', async (event, project) => {
      try {
        await createProject(event, project)
      } catch(error){
        event.reply('log', error)
      }
    })

    // 删除项目
    ipcMain.on('deleteProject', async (event, project) => {
      try {
        await deleteProject(event, project)
      } catch(error){
        event.reply('log', error)
      }
    })

    // 项目排序
    ipcMain.on('sortProject', async (event, projects) => {
      try {
        await sortProject(event, projects)
      } catch(error){
        event.reply('log', error)
      }
    })

    // 打开项目
    ipcMain.on('openProject', async (event, project) => {
      try {
        await openProject(event, project)
      } catch(error){
        event.reply('log', error)
      }
    })

    // 变换主题
    ipcMain.on('toggleTheme', (event, theme) => {
      console.log('dark-mode:toggle')
      nativeTheme.themeSource = theme
    })

    // 设置主题
    ipcMain.on('setTheme', (event, theme) => {
      setSetting({ theme })
    })
  }

  async createWindow() {
    // Create the browser window.
    const win = new BrowserWindow({
      width: 1100,
      height: 700,
      minWidth: 1100,
      minHeight: 700,
      webPreferences: {
        
        // Use pluginOptions.nodeIntegration, leave this alone
        // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
        nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
        contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
        enableRemoteModule: true,
      },
    })

    win.setMenu(null)

    if (process.env.WEBPACK_DEV_SERVER_URL) {
      // Load the url of the dev server if in development mode
      await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
      if (!process.env.IS_TEST) win.webContents.openDevTools()
    } else {
      createProtocol('app')
      // Load the index.html when not in development
      win.loadURL('app://./index.html')
    }

    this.mainWindow = win
  }

  initTheme() {
    const setting = getSetting()
    if (setting && setting.theme) {
      nativeTheme.themeSource = setting.theme
      setTimeout(() => {
        this.mainWindow.webContents.send('theme', setting.theme)
      }, 500)
    }
  }
}

new wechatCli().init()
