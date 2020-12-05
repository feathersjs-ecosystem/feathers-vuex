<template>
  <div>
    <input type="text" v-model="description" @keyup.enter="createTask" />
    <button type="button" @click="createTask">Create Task</button>
  </div>
</template>

<script>
import { inject, ref } from 'vue'
export default {
  name: 'CreateTask',
  setup() {
    const models = inject('$fv')
    const description = ref('')

    async function createTask() {
      const task = await new models.api.Task({ description: description.value }).save()
      description.value = ''
    }

    return {
      description,
      createTask,
    }
  },
}
</script>

<style lang="scss" scoped></style>
