/* eslint-disable @typescript-eslint/explicit-function-return-type */
import '../../assets/styles/tailwind.postcss'

import FeathersVuexFormWrapper from '../src/FeathersVuexFormWrapper'
import Readme from './README.md'

import store from '../../store/store.dev'
import { models } from 'feathers-vuex'

export default {
  title: 'FeathersVuexFormWrapper',
  parameters: {
    component: FeathersVuexFormWrapper,
    readme: {
      sidebar: Readme,
    },
  },
}

export const Basic = () => ({
  components: { FeathersVuexFormWrapper },
  data: () => ({
    date: null,
    UserModel: models.api.User,
  }),
  store,
  template: `<div class="p-3">
  <FeathersVuexFormWrapper
    :id="'new'"
    :model="UserModel"
  >
    <template v-slot="{ clone, isNew, isDirty, save, reset, remove }">
      <FormComponent
        :item="clone"
        :is-new="isNew"
        :is-dirty="isDirty"
        @save="save"
        @reset="reset"
        @remove="remove"
      >
      </FormComponent>
    </template>
  </FeathersVuexFormWrapper>
</div>`,
})
