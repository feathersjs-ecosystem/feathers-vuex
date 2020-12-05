<template>
  <h1 class="text-center">{{ msg }}</h1>

  <div class="w-64 mx-auto">
    <CreateTask />

    <ul v-if="tasks.length">
      <li v-for="task in tasks" :key="task._id" class="flex flex-row items-center space-x-2">
        <input
          type="checkbox"
          :model-value="task.isComplete"
          class="w-6 h-6 flex-none"
          @change="event => task.clone({ isComplete: event.target.checked }).save()"
        />
        <span
          class="py-2 flex-grow"
          :class="[task.isComplete ? 'line-through' : null]"
          contenteditable
          @blur="event => task.clone({ description: event.target.innerText }).save()"
        >
          {{ task.description }}
        </span>
        <button
          type="button"
          @click="() => task.remove()"
          class="flex-none bg-white text-red-900 rounded-full p-2 transition-colors duration-300 hover:bg-red-900 hover:text-white"
        >
          <Trash2Icon />
        </button>
      </li>
    </ul>

    <div v-else>No Tasks</div>
  </div>
</template>

<script>
import { models, useFind } from '@feathersjs/vuex'
import { computed } from 'vue'

import CreateTask from './CreateTask.vue'
import { Trash2Icon } from '@zhuowenli/vue-feather-icons'

export default {
  name: 'HelloWorld',
  components: {
    CreateTask,
    Trash2Icon,
  },
  props: {
    msg: String,
  },
  data() {
    return {
      count: 0,
    }
  },
  setup(props, context) {
    const { Task } = models.api
    const params = computed(() => {
      return {
        query: {},
        temps: true,
      }
    })
    const { items: tasks } = useFind({ model: Task, params })

    return { tasks }
  },
}
</script>
