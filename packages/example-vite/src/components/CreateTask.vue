<template>
  <div>
    <input type="text" v-model="description" />
    <button type="button" @click="createTask">Create Task</button>
  </div>
</template>

<script>
import { inject, ref } from 'vue'
export default {
  name: 'CreateTask',
  setup() {
    const $FV = inject('$FV')
    const description = ref('')

    async function createTask(description) {
      console.log($FV)
      debugger
      // await new Task({ description }).save()
      // description.value = ''
    }

    return {
      description,
      createTask,
    }
  },
}
</script>

<style lang="scss" scoped></style>
