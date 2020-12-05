<template>
  <div class="flex flex-row items-center">
    <input
      type="text"
      v-model="description"
      @keyup.enter="addTask"
      class="bg-gray-300 rounded-l-lg px-2 py-1 flex-grow"
      placeholder="Add a task"
    />
    <button
      type="button"
      @click="addTask"
      class="bg-blue-600 text-white rounded-r-lg px-2 py-1 whitespace-no-wrap"
    >
      Add
    </button>
  </div>
</template>

<script>
import { inject, ref } from 'vue'
export default {
  name: 'CreateTask',
  setup() {
    const models = inject('$fv')
    const description = ref('')

    async function addTask() {
      const task = await new models.api.Task({ description: description.value }).save()
      description.value = ''
    }

    return {
      description,
      addTask,
    }
  },
}
</script>

<style lang="scss" scoped></style>
