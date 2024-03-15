import Vue from 'vue'
import App from './App.vue'

import {
  Badge, Button, Card, ConfigProvider, Divider, Empty, Form, Icon, Input, 
  Modal, Menu, notification, Popconfirm, Radio, 
  Space, Switch, Table, Tabs, Tooltip, Upload
} from 'ant-design-vue'

Vue.use(Badge)
Vue.use(Button)
Vue.use(Card)
Vue.use(ConfigProvider)
Vue.use(Divider)
Vue.use(Empty)
Vue.use(Form)
Vue.use(Icon)
Vue.use(Input)
Vue.use(Modal)
Vue.use(Menu)
Vue.use(Popconfirm)
Vue.use(Radio)
Vue.use(Space)
Vue.use(Switch)
Vue.use(Table)
Vue.use(Tabs)
Vue.use(Tooltip)
Vue.use(Upload)

notification.config({
  duration: 3,
});

Vue.config.productionTip = false
Vue.prototype.$notification = notification

new Vue({
  render: h => h(App),
}).$mount('#app')
