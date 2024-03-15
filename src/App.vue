<template>
  <a-config-provider :locale="zh_CN">
    <Index />
  </a-config-provider>
</template>

<script>
import Index from '@/pages/Index/Index.vue'
import zh_CN from 'ant-design-vue/lib/locale-provider/zh_CN'

export default {
  name: 'App',
  components: {
    Index,
  },
  data() {
    return {
      zh_CN,
    }
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
