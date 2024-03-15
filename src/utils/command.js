import fs, { promises as fsPromises } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import fixPath from 'fix-path'
if (process.env.NODE_ENV === 'production') {
  fixPath()
}

const resourcePath = process.env.NODE_ENV === 'development' ? __static : process.resourcesPath

const getJsonFileData = async (filePath = '', defaultData = []) => {
  try {
    const result = await fsPromises.readFile(filePath, 'utf8')
    return result ? JSON.parse(result) : defaultData
  } catch(err) {
    // throw new Error(`read file fail:\n${err}`)
    return defaultData
  }
}


// 读取设置
export const getSetting = async () => {
  const settingFile = path.join(resourcePath, './data/setting.json')
  const settting = await getJsonFileData(settingFile, {})
  return settting
}

// 写入设置
export const setSetting = async (config) => {
  const settingFile = path.join(resourcePath, './data/setting.json')
  const setting = await getSetting()
  const newSetting = { ...setting, ...config }
  fs.writeFile(settingFile, JSON.stringify(newSetting), (err) => {
    if (err) throw new Error(`write json fail:\n${err}`)
  })
}

const readCliPath = async (event) => {
  if ( process.platform === 'win32') {
    const setting = await getSetting()
    if (!setting.wechatDevToolPath) {
      event.reply('log', {type: 'error',text: '找不到「微信开发者工具」的安装目录'})
      return
    }
    return(setting.wechatDevToolPath)
  } else {
    return('/Applications/wechatwebdevtools.app/Contents/MacOS/cli')
  }
}

const changeFileAppId = async (filePath, appId, reg) => {
  const configFile = path.resolve(filePath)
  try {
    const data = await fsPromises.readFile(configFile, 'utf8')
    let result = data.replace(reg, appId)
    await fsPromises.writeFile(configFile, result, 'utf8')
  } catch(err) {
    throw new Error(`${configFile} error:\n${err}`)
  }
}

const changeCurrentAppid = async (event, app, project) => {
  try {
    const reg = /(?<=(?:"appid": ")).{1,30}(?=(?:",))/
    await changeFileAppId(`${project.path}/project.config.json`, app.appId, reg)
    const settingReg = /(?<=(?:export const CURRENT_APPID = ('|"))).{1,30}(?=(?:('|")))/
    await changeFileAppId(project.path + project.currentAppIdFilePath, app.appId, settingReg)
    event.reply('log', {type: 'default', text: `📦 当前小程序已切换至 「${app.name}」，开始重新打包编译，请稍后...`})
  } catch(err) {
    event.reply('log', {type: 'error', text: err})
  }
}

const pack = (event, app, project) => {
  return new Promise(resolve => {
    const buildCommand = project.buildTool === 'yarn' ?  `yarn build:weapp` : `npm run build:weapp`
    exec(buildCommand, { cwd: project.path, encoding: 'utf8' }, err => {
      if (err) {
        event.reply('log', {type: 'error', text: err})
        throw new Error(`build fail:\n${err}`)
      }
      event.reply('log', {type: 'default', text: `📦 「${app.name}」 小程序打包完成`})
      resolve()
    })
  })
}

const uploadFlowHandle = async (event, app, project, version, description, cli) => {
  await changeCurrentAppid(event, app, project)
  await pack(event, app, project)
  event.reply('log', {type: 'default', text: `⏫ 开始上传 「${app.name}」 小程序，请稍后...`})
  await upload(event, app, project, version, description, cli)
}

const upload = (event, app, project, version, description, cli) => {
  return new Promise((resolve, reject) => {
    event.reply('log', {type: 'default', text: '上传中...'})
    // event.reply('log', {type: 'loading', state: true })
    const command = `${cli} upload --project ${project.path} -v ${version} -d '${description}'`
    exec(command, { encoding: 'utf8' }, (err, stdout, stderr) => {
      if (err) {
        event.reply('log', {type: 'error', text: err})
        throw new Error(`build fail:\n${err}`)
      }
      event.reply('log', {type: 'default', text: stderr})
      if (stdout.match(/\[error\]/g)) {
        event.reply('log', {type: 'error', text: stdout})
        reject()
      } else {
        event.reply('log', {type: 'success', text: `🎉 ${app.name} 小程序上传完成`})
        resolve()
      }
    })
  })
}

const uploadAllApp = async (event, version, description, cli, appList, project) => {
  const uploadResultList = []
  for (let i = 0; i < appList.length; i++) {
    await uploadFlowHandle(
      event,
      appList[i],
      project,
      version,
      description,
      cli
    )
      .then(() => {
        uploadResultList.push({
          type: 'success',
          text: `🎉 小程序「${appList[i].name}」上传成功`
        })
      })
      .catch(() => {
        uploadResultList.push({
          type: 'error',
          text: `❌ 小程序「${appList[i].name}」上传失败`
        })
      })
  }
  if (appList.length > 1) {
    // console.table(uploadResultList)
    event.reply('log', {type: 'default', text: '────────────────────'})
    event.reply('log', uploadResultList)
  }
  event.reply('refresh')
}

// 写入版本号和注释
const setProjectVersion = async (event, name, version, commit) => {
  const projectFile = path.join(resourcePath, './data/project.json')
  const projects = await getJsonFileData(projectFile, [])
  const index = projects.findIndex(item => item.name === name)
  if(index < 0) {
    event.reply('notification', {type: 'error', text: '文件写入失败'})
    return
  }
  projects[index].version = version
  projects[index].commit = commit
  fs.writeFile(projectFile, JSON.stringify(projects), (err) => {
    if (err) throw new Error(`write json fail:\n${err}`)
  })
}

// 切换小程序
export const switchApp = async (event, app, project) => {
  try {
    await changeCurrentAppid(event, app, project)
    await pack(event, app, project)
    event.reply('log', {type: 'success', text: `🎉 已成功切换并编译了 「${app.name}」 小程序`})
    event.reply('switchSuccess', app)
  } catch (err) {
    event.reply('log', {type: 'default', text: err})
  }
}

// 上传小程序
export const deploy = async ( event, version, description, appList, project) => {
  try {
    // 写入版本号和注释
    setProjectVersion(event, project.name, version, description)
    // 上传代码到小程序
    const cli = await readCliPath(event)
    uploadAllApp(event, version, description, cli, appList, project)
  } catch (err) {
    event.reply('log', {type: 'error', text: err})
  }
}

// 添加项目
export const createProject = async (event, projectData) => {
  const projectFile = path.join(resourcePath, './data/project.json')
  const projectPath = path.parse(projectData.weappJsonFile).dir
  const packageData = await getJsonFileData(path.join(projectPath, './package.json'), {})
  const projects = await getJsonFileData(projectFile, [])
  const hasProject = projects.some(item => item.name === packageData.name)
  if (hasProject) {
    event.reply('notification', {type: 'error', text: '项目已存在'})
  } else {
    const project = {
      name: packageData.name,
      path: projectPath,
      buildTool: projectData.buildTool,
    }
    if(projectData.wechatDevToolFile) {
      const wechatDevToolPath = projectData.wechatDevToolFile.split(path.sep).join('/')
      setSetting({ wechatDevToolPath })
    }
    const newProjects = [
      ...projects,
      project,
    ]
    event.reply('refresh')
    event.reply('notification', {type: 'success', text: '项目添加成功'})
    fs.writeFile(projectFile, JSON.stringify(newProjects), (err) => {
      if (err) throw new Error(`write json fail:\n${err}`)
    })
  }
}

// 删除项目
export const deleteProject = async (event, project) => {
  const projectFile = path.join(resourcePath, './data/project.json')
  const projects = await getJsonFileData(projectFile, [])
  const projectIndex = projects.findIndex(item => item.name === project.name)
  if (projectIndex < 0) {
    event.reply('notification', {type: 'error', text: '删除失败，找不到项目'})
  } else {
    const newProjects = projects
    newProjects.splice(projectIndex, 1)
    event.reply('refresh')
    event.reply('notification', {type: 'success', text: '项目删除成功'})
    fs.writeFile(projectFile, JSON.stringify(newProjects), (err) => {
      if (err) throw new Error(`write json fail:\n${err}`)
    })
  }
}

// 项目排序
export const sortProject = (event, projects) => {
  const projectFile = path.join(resourcePath, './data/project.json')
  const newProjects = projects.map(item => {
    const {name, path, description, buildTool, version, commit} = item
    const itemData = { name, path, description, buildTool }
    if(version) itemData.version = version
    if(commit) itemData.commit = commit
    return itemData
  })
  event.reply('refresh')
  event.reply('notification', {type: 'success', text: '项目排序成功'})
  fs.writeFile(projectFile, JSON.stringify(newProjects), (err) => {
    if (err) throw new Error(`write json fail:\n${err}`)
  })
}

// 打开项目（在微信开发中工具中打开）
export const openProject = async (event, project) => {
  const cli = await readCliPath(event)
  return new Promise(resolve => {
    exec(`${cli} open --project ${project.path}`, { encoding: 'utf8' }, (err, stdout, stderr) => {
      if (err) {
        event.reply('log', {type: 'error', text: err})
        throw new Error(`build fail:\n${err}`)
      }
      event.reply('log', {type: 'default', text: stderr})
      if (stdout.match(/\[error\]/g)) {
        event.reply('log', {type: 'error', text: stdout})
        reject()
      } else {
        event.reply('log', {type: 'success', text: `🎉 ${project.name} 项目打开成功`})
        resolve()
      }
    })
  })
}
