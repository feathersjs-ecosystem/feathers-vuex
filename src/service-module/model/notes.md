# API Notes

```ts
import feathers from './feathers-client'
import Vuex from 'vuex'
import feathersVuex from 'feathers-vuex'

const { makeServicePlugin, BaseModel } = feathersVuex(feathers, {
  idField: '_id',
  serverAlias: 'myApiServer'
})

// @service('todos')
class Todo extends BaseModel {
  servicePath: 'todos'
  store: any
  firstName: string
  constructor(data) {
    this.firstName = data.firstName
  }
}

const servicePath = 'todos'
const todos = makeServicePlugin({
  servicePath,
  Model: Todo,
  service: feathers.service(servicePath)
})

const store = new Vuex.Store({
  plugins: [
    todos
  ]
})
```
