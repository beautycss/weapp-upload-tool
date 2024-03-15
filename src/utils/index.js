import fs from 'fs'
import path from 'path'

const getProjectData = () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      return require('../../public/data/project.json')
    }
    const file = path.resolve(`${process.resourcesPath}/data/project.json`)
    const fileData = fs.readFileSync(file, 'utf8')
    return fileData ? JSON.parse(fileData) : []
  } catch (err) {
    return []
  }
}

export const getSetting = () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      return require('../../public/data/setting.json')
    }
    const file = path.resolve(`${process.resourcesPath}/data/setting.json`)
    const fileData = fs.readFileSync(file, 'utf8')
    return fileData ? JSON.parse(fileData) : {}
  } catch (err) {
    return {}
  }
}

export const getProjects = () => {
  const data = []
  const projects = getProjectData()
  // console.log('projects', projects)
  projects.forEach((item, index) => {
    const file = path.resolve(`${item.path}/weapp.config.json`)
    const fileData = fs.readFileSync(file, 'utf8')
    const itemData = fileData ? JSON.parse(fileData) : {}
    data[index] = {...itemData, ...item}
  })
  return data
}

export const getCurrentApp = (project) => {
  try {
    const file = path.resolve(`${project.path}${project.currentAppIdFilePath}`)
    const fileData = fs.readFileSync(file, 'utf8')
    const reg = /(?<=(?:export const CURRENT_APPID = ('|"))).{1,30}(?=(?:('|")))/;
    const result = fileData.match(reg)
    const currentAppId = result[0]
    const currentProjectApps = Object.keys(project.appList).map(env => project.appList[env]).flat()
    return currentProjectApps.filter(app => app.appId === currentAppId)
  } catch(error) {
    console.log(error)
  }
}

export const getThemeConfig = (theme = 'light') => {
  const themeConfig = {
    light: {
      '@border-color-split': '#e8e8e8',
      '@component-background': '#fff',
      '@disabled-color': 'rgba(0, 0, 0, 0.25)',
      '@table-header-bg': '#fff',
      '@table-header-color': 'rgba(0, 0, 0, 0.65)',
      '@table-body-selected-sort-bg': '#e6f7ff',
      '@table-row-hover-bg': '#e6f7ff',
      '@table-selected-row-hover-bg': '#e6f7ff',
      '@text-color': 'rgba(0, 0, 0, 0.65)',
    },
    dark: {
      '@border-color-split': '#303030',
      '@component-background': '#141414',
      '@disabled-color': 'rgba(255, 255, 255, 0.25)',
      '@table-header-bg': '#141414',
      '@table-header-color': 'rgba(255, 255, 255, 0.85)',
      '@table-body-selected-sort-bg': '#262626',
      '@table-row-hover-bg': '#262626',
      '@table-selected-row-hover-bg': '#262626',
      '@text-color': 'rgba(255, 255, 255, 0.85)',
    },
  }
  return themeConfig[theme]
}
