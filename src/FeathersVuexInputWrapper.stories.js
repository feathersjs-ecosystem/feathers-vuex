import FeathersVuexInputWrapper from './FeathersVuexInputWrapper.vue'
import { makeModel } from '@rovit/test-model'
import { debounce } from 'lodash'

const User = makeModel()

const user = new User({
  _id: 1,
  email: 'marshall@rovit.com',
  carColor: '#FFF'
})

export default {
  title: 'FeathersVuexInputWrapper',
  component: FeathersVuexInputWrapper
}

export const basic = () => ({
  components: {
    FeathersVuexInputWrapper
  },
  data: () => ({
    user
  }),
  methods: {
    save({ clone, data }) {
      const user = clone.commit()
      user.patch(data)
    }
  },
  template: `
  <div class="p-3">
    <FeathersVuexInputWrapper :item="user" prop="email">
      <template #default="{ current, prop, createClone, handler }">
        <input
          v-model="current[prop]"
          type="text"
          @focus="createClone"
          @blur="e => handler(e, save)"
        />
      </template>
    </FeathersVuexInputWrapper>

    <pre class="bg-black text-white text-xs mt-2 p-1">{{user}}</pre>
  </div>
  `
})

export const handlerAsPromise = () => ({
  components: {
    FeathersVuexInputWrapper
  },
  data: () => ({
    user
  }),
  methods: {
    async save({ clone, data }) {
      const user = clone.commit()
      return user.patch(data)
    }
  },
  template: `
  <div class="p-3">
    <FeathersVuexInputWrapper :item="user" prop="email">
      <template #default="{ current, prop, createClone, handler }">
        <input
          v-model="current[prop]"
          type="text"
          @focus="createClone"
          @blur="e => handler(e, save)"
          class="bg-gray-200 rounded"
        />
      </template>
    </FeathersVuexInputWrapper>

    <pre class="bg-black text-white text-xs mt-2 p-1">{{user}}</pre>
  </div>
  `
})

export const multipleOnDistinctProperties = () => ({
  components: {
    FeathersVuexInputWrapper
  },
  data: () => ({
    user
  }),
  methods: {
    async save({ event, clone, prop, data }) {
      const user = clone.commit()
      return user.patch(data)
    }
  },
  template: `
  <div class="p-3">
    <FeathersVuexInputWrapper :item="user" prop="email">
      <template #default="{ current, prop, createClone, handler }">
        <input
          v-model="current[prop]"
          type="text"
          @focus="createClone"
          @blur="e => handler(e, save)"
        />
      </template>
    </FeathersVuexInputWrapper>

    <FeathersVuexInputWrapper :item="user" prop="carColor">
      <template #default="{ current, prop, createClone, handler }">
        <input
          v-model="current[prop]"
          type="color"
          @click="createClone"
          @change="e => handler(e, save)"
        />
      </template>
    </FeathersVuexInputWrapper>

    <pre class="bg-black text-white text-xs mt-2 p-1">{{user}}</pre>
  </div>
  `
})

export const noInputInSlot = () => ({
  components: {
    FeathersVuexInputWrapper
  },
  data: () => ({
    user
  }),
  methods: {
    async save({ clone, data }) {
      const user = clone.commit()
      user.patch(data)
    }
  },
  template: `
  <div class="p-3">
    <FeathersVuexInputWrapper :item="user" prop="email" />
  </div>
  `
})
