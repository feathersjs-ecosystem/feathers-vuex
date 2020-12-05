import { createApp } from 'vue'
import { store } from './store/index'
import { FeathersVuex } from '@feathersjs/vuex'

import App from './App.vue'
import './index.postcss'

const app = createApp(App)
app.use(FeathersVuex)
app.use(store)

app.mount('#app')
