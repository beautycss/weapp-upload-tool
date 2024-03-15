const { generateTheme } = require('antd-theme-generator')
const path = require('path')

const options = {
  antDir: path.join(__dirname, './node_modules/ant-design-vue'),
  stylesDir: path.join(__dirname, './src'), // all files with .less extension will be processed
  varFile: path.join(__dirname, './src/styles/variables.less'), // default path is Ant Design default.less file
  themeVariables: [
    // '@primary-color',
    // '@btn-primary-bg',
    '@border-color-split',
    '@component-background',
    '@disabled-color',
    '@table-header-bg',
    '@table-header-color',
    '@table-body-selected-sort-bg', // color.less:1269
    '@table-row-hover-bg',
    '@table-selected-row-hover-bg',
    '@text-color',
    // '@link-color',
    // '@body-background',
  ],
  outputFilePath: path.join(__dirname, './public/color.less'), // if provided, file will be created with generated less/styles
  customColorRegexArray: [/^fade\(.*\)$/], // An array of regex codes to match your custom color variable values so that code can identify that it's a valid color. Make sure your regex does not adds false positives.
}

generateTheme(options).then(less => {
  console.log('Theme generated successfully')
})
.catch(error => {
  console.log('Error', error)
})
