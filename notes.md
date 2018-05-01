## Extending the built-in Model classes

If you desire to extend the built-in Models

**store/index.js:**
```js
import Vue from 'vue'
import Vuex from 'vuex'
import feathersVuex from 'feathers-vuex'
import feathersClient from '../feathers-client'

const { service, auth, FeathersVuex } = feathersVuex(feathersClient, { idField: '_id' })
const { serviceModule, serviceModel, servicePlugin } = service

const api1Client = feathersVuex(feathersClient, { idField: '_id', apiPrefix: 'api1' })
const api2Client = feathersVuex(feathersClient2, { idField: '_id' })

Vue.use(FeathersVuex)

const todoModule = serviceModule('todos')

// const Model = serviceModel(todoModule) // TodoModel is an extensible class
const Model = serviceModel()
class TodoModel = extends Model {}
const todoPlugin = servicePlugin(todoModule, TodoModel)

const TaskModel extends Model {}

export { TaskModel }


created () {
  this.todo = new this.$FeathersVuex.api1.Todo(data)
}

Vue.use(Vuex)
Vue.use(FeathersVuex)

export default new Vuex.Store({
  plugins: [
    servicePlugin('/tasks', TaskModel), // With our potentially customized TodoModel

    service('todos'),

    // Specify custom options per service
    service('/v1/tasks', {
      idField: '_id', // The field in each record that will contain the id
      nameStyle: 'path', // Use the full service path as the Vuex module name, instead of just the last section
      namespace: 'custom-namespace', // Customize the Vuex module name.  Overrides nameStyle.
      autoRemove: true, // Automatically remove records missing from responses (only use with feathers-rest)
      enableEvents: false, // Turn off socket event listeners. It's true by default
      addOnUpsert: true, // Add new records pushed by 'updated/patched' socketio events into store, instead of discarding them. It's false by default
      skipRequestIfExists: true, // For get action, if the record already exists in store, skip the remote request. It's false by default
      modelName: 'Task'
    })

    // Add custom state, getters, mutations, or actions, if needed.  See example in another section, below.
    service('things', {
      state: {},
      getters: {},
      mutations: {},
      actions: {}
    })

    auth()
  ]
})
```