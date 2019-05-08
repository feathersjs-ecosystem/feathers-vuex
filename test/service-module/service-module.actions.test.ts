/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { ServiceState } from './types'
import { assert } from 'chai'
import feathersVuex from '../../src/index'
import { feathersRestClient as feathersClient } from '../fixtures/feathers-client'
import Vuex, { mapActions } from 'vuex'
import memory from 'feathers-memory'
import { clearModels } from '../../src/service-module/global-models'
import { makeStore } from '../test-utils'

interface RootState {
  'my-todos': ServiceState
  'my-tasks': ServiceState
  broken: ServiceState
}
interface NumberedList {
  0?: {}
  1?: {}
}

function makeContext() {
  feathersClient.use(
    'my-todos',
    memory({
      store: makeStore()
    })
  )
  feathersClient.use(
    'my-tasks',
    memory({
      store: makeStore(),
      paginate: {
        default: 10,
        max: 50
      }
    })
  )
  const todoService = feathersClient.service('my-todos')
  const taskService = feathersClient.service('my-tasks')
  const noIdService = feathersClient.use(
    'no-ids',
    // @ts-ignore
    memory({
      store: makeStore(),
      paginate: {
        default: 10,
        max: 50
      }
    })
  )
  const brokenService = feathersClient.use('broken', {
    find() {
      return Promise.reject(new Error('find error'))
    },
    get() {
      return Promise.reject(new Error('get error'))
    },
    create() {
      return Promise.reject(new Error('create error'))
    },
    update() {
      return Promise.reject(new Error('update error'))
    },
    patch() {
      return Promise.reject(new Error('patch error'))
    },
    remove() {
      return Promise.reject(new Error('remove error'))
    },
    setup() { }
  })

  const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
    serverAlias: 'default'
  })
  class Todo extends BaseModel {
    public static modelName = 'Todo'
    public static test: boolean = true
  }
  class Task extends BaseModel {
    public static modelName = 'Task'
    public static test: boolean = true
  }
  class NoId extends BaseModel {
    public static modelName = 'NoId'
    public static test: boolean = true
  }
  class Broken extends BaseModel {
    public static modelName = 'Broken'
    public static test: boolean = true
  }
  return {
    makeServicePlugin,
    BaseModel,
    todoService,
    taskService,
    noIdService,
    brokenService,
    Todo,
    Task,
    NoId,
    Broken
  }
}

const assertRejected = (promise, done, callback) => {
  // resolve handler
  promise.then(
    () => done(new Error('expected promise to be rejected')),
    // reject handler
    () => {
      try {
        callback()
        done()
      } catch (e) {
        done(e)
      }
    }
  )
}

describe('Service Module - Actions', () => {
  beforeEach(() => {
    clearModels()
  })
  describe('Find', () => {
    describe('without pagination', () => {
      it('Find without pagination', done => {
        const { makeServicePlugin, Todo } = makeContext()
        const todosPlugin = makeServicePlugin({
          servicePath: 'my-todos',
          Model: Todo,
          service: feathersClient.service('my-todos')
        })
        const store = new Vuex.Store<RootState>({
          plugins: [todosPlugin]
        })
        const todoState = store.state['my-todos']
        const actions = mapActions('my-todos', ['find'])

        assert(todoState.ids.length === 0, 'no ids before find')
        assert(todoState.errorOnFind === null, 'no error before find')
        assert(todoState.isFindPending === false, 'isFindPending is false')
        assert(todoState.idField === 'id', 'idField is `id`')

        actions.find.call({ $store: store }, {}).then(response => {
          assert(todoState.ids.length === 10, 'three ids populated')
          assert(todoState.errorOnFind === null, 'errorOnFind still null')
          assert(todoState.isFindPending === false, 'isFindPending is false')
          let expectedKeyedById: NumberedList = makeStore()
          const currentKeyedById = JSON.parse(
            JSON.stringify(todoState.keyedById)
          )
          assert.deepEqual(
            currentKeyedById,
            expectedKeyedById,
            'keyedById matches'
          )

          assert(
            typeof todoState.keyedById[1].save === 'function',
            'added FeathersVuexModel class methods to the data'
          )

          done()
        })

        // Make sure proper state changes occurred before response
        assert(todoState.ids.length === 0)
        assert(todoState.errorOnFind === null)
        assert(todoState.isFindPending === true)
        assert.deepEqual(todoState.keyedById, {})
      })

      it('find with limit', done => {
        const { makeServicePlugin, Todo } = makeContext()
        const store = new Vuex.Store<RootState>({
          plugins: [
            makeServicePlugin({
              servicePath: 'my-todos',
              Model: Todo,
              service: feathersClient.service('my-todos')
            })
          ]
        })
        const actions = mapActions('my-todos', ['find'])

        actions.find
          .call({ $store: store }, { query: { $limit: 1 } })
          .then(response => {
            const returnedRecord = JSON.parse(JSON.stringify(response[0]))
            assert(response.length === 1, 'only one record was returned')
            assert.deepEqual(
              returnedRecord,
              { id: 0, description: 'Do the first' },
              'the first record was returned'
            )
            done()
          })
      })

      it('find with skip', done => {
        const { makeServicePlugin, Todo } = makeContext()
        const store = new Vuex.Store<RootState>({
          plugins: [
            makeServicePlugin({
              servicePath: 'my-todos',
              Model: Todo,
              service: feathersClient.service('my-todos')
            })
          ]
        })
        const actions = mapActions('my-todos', ['find'])

        actions.find
          .call({ $store: store }, { query: { $skip: 9 } })
          .then(response => {
            const returnedRecord = JSON.parse(JSON.stringify(response[0]))
            assert(response.length === 1, 'one record was returned')
            assert.deepEqual(
              returnedRecord,
              { id: 9, description: 'Do the tenth' },
              'the tenth record was returned'
            )
            done()
          })
      })

      it('Find with limit and skip', done => {
        const { makeServicePlugin, Todo } = makeContext()
        const store = new Vuex.Store<RootState>({
          plugins: [
            makeServicePlugin({
              servicePath: 'my-todos',
              Model: Todo,
              service: feathersClient.service('my-todos')
            })
          ]
        })
        const actions = mapActions('my-todos', ['find'])

        actions.find
          .call({ $store: store }, { query: { $limit: 1, $skip: 8 } })
          .then(response => {
            const returnedRecord = JSON.parse(JSON.stringify(response[0]))
            assert(response.length === 1, 'one record was returned')
            assert.deepEqual(
              returnedRecord,
              { id: 8, description: 'Do the ninth' },
              'the ninth record was returned'
            )
            done()
          })
      })
    })

    describe('with pagination', () => {
      it('find with limit', done => {
        const { makeServicePlugin, Task } = makeContext()
        const store = new Vuex.Store<RootState>({
          plugins: [
            makeServicePlugin({
              servicePath: 'my-tasks',
              Model: Task,
              service: feathersClient.service('my-tasks')
            })
          ]
        })
        const actions = mapActions('my-tasks', ['find'])

        actions.find
          .call({ $store: store }, { query: { $limit: 1 } })
          .then(response => {
            const returnedRecord = JSON.parse(JSON.stringify(response.data[0]))
            assert(response.data.length === 1, 'only one record was returned')
            assert.deepEqual(
              returnedRecord,
              { id: 0, description: 'Do the first' },
              'the first record was returned'
            )
            assert(response.limit === 1, 'limit was correct')
            assert(response.skip === 0, 'skip was correct')
            assert(response.total === 10, 'total was correct')
            done()
          })
      })

      it('find with skip', done => {
        const { makeServicePlugin, Task } = makeContext()
        const store = new Vuex.Store<RootState>({
          plugins: [
            makeServicePlugin({
              servicePath: 'my-tasks',
              Model: Task,
              service: feathersClient.service('my-tasks')
            })
          ]
        })
        const actions = mapActions('my-tasks', ['find'])

        actions.find
          .call({ $store: store }, { query: { $skip: 9 } })
          .then(response => {
            const returnedRecord = JSON.parse(JSON.stringify(response.data[0]))
            assert(response.data.length === 1, 'only one record was returned')
            assert.deepEqual(
              returnedRecord,
              { id: 9, description: 'Do the tenth' },
              'the tenth record was returned'
            )
            assert(response.limit === 10, 'limit was correct')
            assert(response.skip === 9, 'skip was correct')
            assert(response.total === 10, 'total was correct')
            done()
          })
      })

      it('find with limit and skip', done => {
        const { makeServicePlugin, Task } = makeContext()
        const store = new Vuex.Store<RootState>({
          plugins: [
            makeServicePlugin({
              servicePath: 'my-tasks',
              Model: Task,
              service: feathersClient.service('my-tasks')
            })
          ]
        })
        const actions = mapActions('my-tasks', ['find'])

        actions.find
          .call({ $store: store }, { query: { $limit: 1, $skip: 8 } })
          .then(response => {
            const returnedRecord = JSON.parse(JSON.stringify(response.data[0]))
            assert(response.data.length === 1, 'only one record was returned')
            assert.deepEqual(
              returnedRecord,
              { id: 8, description: 'Do the ninth' },
              'the ninth record was returned'
            )
            assert(response.limit === 1, 'limit was correct')
            assert(response.skip === 8, 'skip was correct')
            assert(response.total === 10, 'total was correct')
            done()
          })
      })

      it('adds default pagination data to the store', done => {
        const { makeServicePlugin, Task } = makeContext()
        const store = new Vuex.Store<RootState>({
          plugins: [
            makeServicePlugin({
              servicePath: 'my-tasks',
              Model: Task,
              service: feathersClient.service('my-tasks')
            })
          ]
        })
        const actions = mapActions('my-tasks', ['find'])

        actions.find.call({ $store: store }, { query: {} }).then(() => {
          const { ids, limit, skip, total } = store.state[
            'my-tasks'
          ].pagination.default
          assert(ids.length === 10, 'ten ids were returned in this page')
          assert(
            limit === 10,
            'limit matches the default pagination limit on the server'
          )
          assert(skip === 0, 'skip was correct')
          assert(total === 10, 'total was correct')
          done()
        })
      })

      it('can provide a query identifier to store pagination', done => {
        const { makeServicePlugin, Task } = makeContext()
        const store = new Vuex.Store<RootState>({
          plugins: [
            makeServicePlugin({
              servicePath: 'my-tasks',
              Model: Task,
              service: feathersClient.service('my-tasks')
            })
          ]
        })
        const actions = mapActions('my-tasks', ['find'])
        const qid = 'component-name'

        actions.find.call({ $store: store }, { query: {}, qid }).then(() => {
          const { ids, limit, skip, total } = store.state[
            'my-tasks'
          ].pagination[qid]
          assert(ids.length === 10, 'ten ids were returned in this page')
          assert(
            limit === 10,
            'limit matches the default pagination limit on the server'
          )
          assert(skip === 0, 'skip was correct')
          assert(total === 10, 'total was correct')
          done()
        })
      })

      it('updates properly with limit and skip', done => {
        const { makeServicePlugin, Task } = makeContext()
        const store = new Vuex.Store<RootState>({
          plugins: [
            makeServicePlugin({
              servicePath: 'my-tasks',
              Model: Task,
              service: feathersClient.service('my-tasks')
            })
          ]
        })
        const actions = mapActions('my-tasks', ['find'])
        const qid = 'component-name'

        actions.find
          .call({ $store: store }, { query: { $limit: 5, $skip: 2 }, qid })
          .then(() => {
            const { ids, limit, skip, total } = store.state[
              'my-tasks'
            ].pagination[qid]
            assert(ids.length === 5, 'ten ids were returned in this page')
            assert(
              limit === 5,
              'limit matches the default pagination limit on the server'
            )
            assert(skip === 2, 'skip was correct')
            assert(total === 10, 'total was correct')
            done()
          })
      })

      it('works with multiple queries and identifiers', done => {
        const { makeServicePlugin, Task } = makeContext()
        const store = new Vuex.Store<RootState>({
          plugins: [
            makeServicePlugin({
              servicePath: 'my-tasks',
              Model: Task,
              service: feathersClient.service('my-tasks')
            })
          ]
        })
        const actions = mapActions('my-tasks', ['find'])
        const qids = ['component-query-zero', 'component-query-one']

        actions.find
          .call({ $store: store }, { query: {}, qid: qids[0] })
          .then(() =>
            actions.find.call({ $store: store }, { query: {}, qid: qids[1] })
          )
          .then(() => {
            qids.forEach(qid => {
              const { ids, limit, skip, total } = store.state[
                'my-tasks'
              ].pagination[qid]
              assert(ids.length === 10, 'ten ids were returned in this page')
              assert(
                limit === 10,
                'limit matches the default pagination limit on the server'
              )
              assert(skip === 0, 'skip was correct')
              assert(total === 10, 'total was correct')
            })

            done()
          })
      })

      it(`allows non-id'd data to pass through`, done => {
        const { makeServicePlugin, NoId } = makeContext()
        const store = new Vuex.Store<RootState>({
          plugins: [
            makeServicePlugin({
              servicePath: 'no-ids',
              Model: NoId,
              service: feathersClient.service('no-ids'),
              idField: '_id'
            })
          ]
        })
        const actions = mapActions('no-ids', ['find'])

        actions.find.call({ $store: store }, { query: {} }).then(response => {
          assert(response.data.length === 10, 'records were still returned')
          assert(
            store.state['no-ids'].ids.length === 0,
            'no records were stored in the state'
          )

          done()
        })
      })

      it(`runs the afterFind action`, done => {
        const { makeServicePlugin, NoId } = makeContext()
        const store = new Vuex.Store<RootState>({
          plugins: [
            makeServicePlugin({
              servicePath: 'no-ids',
              Model: NoId,
              service: feathersClient.service('no-ids'),
              idField: '_id',
              actions: {
                afterFind({ }, response) {
                  assert(
                    response.data.length === 10,
                    'records were still returned'
                  )
                  assert(
                    store.state['no-ids'].ids.length === 0,
                    'no records were stored in the state'
                  )

                  done()
                }
              }
            })
          ]
        })
        const actions = mapActions('no-ids', ['find'])

        actions.find.call({ $store: store }, { query: {} })
      })
    })

    it('updates errorOnFind state on service failure', done => {
      const { makeServicePlugin, Broken } = makeContext()
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            servicePath: 'broken',
            Model: Broken,
            service: feathersClient.service('broken')
          })
        ]
      })
      const brokenState = store.state.broken
      const actions = mapActions('broken', ['find'])

      assertRejected(actions.find.call({ $store: store }, {}), done, () => {
        assert(
          brokenState.errorOnFind.message === 'find error',
          'errorOnFind was set'
        )
        assert(brokenState.isFindPending === false, 'pending state was cleared')
        assert(brokenState.ids.length === 0)
      })

      // Make sure proper state changes occurred before response
      assert(brokenState.ids.length === 0)
      assert(brokenState.errorOnFind === null)
      assert(brokenState.isFindPending === true)
    })
  })

  describe('Get', function () {
    it('updates store list state on service success', done => {
      const { makeServicePlugin, Todo } = makeContext()
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            servicePath: 'my-todos',
            Model: Todo,
            service: feathersClient.service('my-todos')
          })
        ]
      })
      const todoState = store.state['my-todos']
      const actions = mapActions('my-todos', ['get'])

      assert(todoState.ids.length === 0)
      assert(todoState.errorOnGet === null)
      assert(todoState.isGetPending === false)
      assert(todoState.idField === 'id')

      actions.get.call({ $store: store }, 0).then(() => {
        assert(todoState.ids.length === 1, 'only one item is in the store')
        assert(todoState.errorOnGet === null, 'there was no errorOnGet')
        assert(todoState.isGetPending === false, 'isGetPending is set to false')

        let expectedKeyedById: NumberedList = {
          0: { id: 0, description: 'Do the first' }
        }
        assert.deepEqual(
          JSON.parse(JSON.stringify(todoState.keyedById)),
          expectedKeyedById
        )

        // Make a request with the array syntax that allows passing params
        actions.get.call({ $store: store }, [1, {}]).then(response2 => {
          expectedKeyedById = {
            0: { id: 0, description: 'Do the first' },
            1: { id: 1, description: 'Do the second' }
          }
          assert(response2.description === 'Do the second')
          assert.deepEqual(
            JSON.parse(JSON.stringify(todoState.keyedById)),
            expectedKeyedById
          )

          // Make a request to an existing record and return the existing data first, then update `keyedById`
          todoState.keyedById = {
            0: { id: 0, description: 'Do the FIRST' }, // twist the data to see difference
            1: { id: 1, description: 'Do the second' }
          }
          actions.get.call({ $store: store }, [0, {}]).then(response3 => {
            expectedKeyedById = {
              0: { id: 0, description: 'Do the FIRST' },
              1: { id: 1, description: 'Do the second' }
            }
            assert(response3.description === 'Do the FIRST')
            assert.deepEqual(
              JSON.parse(JSON.stringify(todoState.keyedById)),
              expectedKeyedById
            )

            // Wait for the remote data to arriive
            setTimeout(() => {
              expectedKeyedById = {
                0: { id: 0, description: 'Do the first' },
                1: { id: 1, description: 'Do the second' }
              }
              assert.deepEqual(
                JSON.parse(JSON.stringify(todoState.keyedById)),
                expectedKeyedById
              )
              done()
            }, 100)
          })
        })
      })

      // Make sure proper state changes occurred before response
      assert(todoState.ids.length === 0)
      assert(todoState.errorOnCreate === null)
      assert(todoState.isGetPending === true)
      assert.deepEqual(todoState.keyedById, {})
    })

    it('does not make remote call when skipRequestIfExists=true', done => {
      const { makeServicePlugin, Todo } = makeContext()
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            servicePath: 'my-todos',
            Model: Todo,
            service: feathersClient.service('my-todos')
          })
        ]
      })
      const todoState = store.state['my-todos']
      const actions = mapActions('my-todos', ['get'])

      assert(todoState.ids.length === 0)
      assert(todoState.errorOnGet === null)
      assert(todoState.isGetPending === false)
      assert(todoState.idField === 'id')

      actions.get.call({ $store: store }, 0).then(() => {
        assert(todoState.ids.length === 1, 'only one item is in the store')
        assert(todoState.errorOnGet === null, 'there was no errorOnGet')
        assert(todoState.isGetPending === false, 'isGetPending is set to false')
        let expectedKeyedById: NumberedList = {
          0: { id: 0, description: 'Do the first' }
        }
        assert.deepEqual(
          JSON.parse(JSON.stringify(todoState.keyedById)),
          expectedKeyedById
        )

        // Make a request with the array syntax that allows passing params
        actions.get.call({ $store: store }, [1, {}]).then(response2 => {
          expectedKeyedById = {
            0: { id: 0, description: 'Do the first' },
            1: { id: 1, description: 'Do the second' }
          }
          assert(response2.description === 'Do the second')
          assert.deepEqual(
            JSON.parse(JSON.stringify(todoState.keyedById)),
            expectedKeyedById
          )

          // Make a request to an existing record and return the existing data first, then update `keyedById`
          todoState.keyedById = {
            0: { id: 0, description: 'Do the FIRST' }, // twist the data to see difference
            1: { id: 1, description: 'Do the second' }
          }
          actions.get
            .call({ $store: store }, [0, { skipRequestIfExists: true }])
            .then(response3 => {
              expectedKeyedById = {
                0: { id: 0, description: 'Do the FIRST' },
                1: { id: 1, description: 'Do the second' }
              }
              assert(response3.description === 'Do the FIRST')
              assert.deepEqual(
                JSON.parse(JSON.stringify(todoState.keyedById)),
                expectedKeyedById
              )

              // The remote data will never arriive
              setTimeout(() => {
                expectedKeyedById = {
                  0: { id: 0, description: 'Do the FIRST' },
                  1: { id: 1, description: 'Do the second' }
                }
                assert.deepEqual(
                  JSON.parse(JSON.stringify(todoState.keyedById)),
                  expectedKeyedById
                )
                done()
              }, 100)
            })
        })
      })

      // Make sure proper state changes occurred before response
      assert(todoState.ids.length === 0)
      assert(todoState.errorOnCreate === null)
      assert(todoState.isGetPending === true)
      assert.deepEqual(JSON.parse(JSON.stringify(todoState.keyedById)), {})
    })

    it('updates errorOnGet state on service failure', done => {
      const { makeServicePlugin, Broken } = makeContext()
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            servicePath: 'broken',
            Model: Broken,
            service: feathersClient.service('broken')
          })
        ]
      })
      const brokenState = store.state.broken
      const actions = mapActions('broken', ['get'])

      assertRejected(actions.get.call({ $store: store }, {}), done, () => {
        assert(
          brokenState.errorOnGet.message === 'get error',
          'errorOnGet was set'
        )
        assert(brokenState.isGetPending === false, 'pending state was cleared')
        assert(brokenState.ids.length === 0)
      })

      // Make sure proper state changes occurred before response
      assert(brokenState.ids.length === 0)
      assert(brokenState.errorOnGet === null)
      assert(brokenState.isGetPending === true)
    })
  })

  describe('Create', function () {
    it('updates store list state on service success', done => {
      const { makeServicePlugin, Todo } = makeContext()
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            servicePath: 'my-todos',
            Model: Todo,
            service: feathersClient.service('my-todos')
          })
        ]
      })
      const todoState = store.state['my-todos']
      const actions = mapActions('my-todos', ['create'])

      actions.create
        .call({ $store: store }, { description: 'Do the second' })
        .then(response => {
          assert(todoState.ids.length === 1)
          assert(todoState.errorOnCreate === null)
          assert(todoState.isCreatePending === false)
          assert.deepEqual(todoState.keyedById[response.id], response)
          done()
        })

      // Make sure proper state changes occurred before response
      assert(todoState.ids.length === 0)
      assert(todoState.errorOnCreate === null)
      assert(todoState.isCreatePending === true)
      assert(todoState.idField === 'id')
      assert.deepEqual(JSON.parse(JSON.stringify(todoState.keyedById)), {})
    })

    it('updates errorOnCreate state on service failure', done => {
      const { makeServicePlugin, Broken } = makeContext()
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            servicePath: 'broken',
            Model: Broken,
            service: feathersClient.service('broken')
          })
        ]
      })
      const brokenState = store.state.broken
      const actions = mapActions('broken', ['create'])

      assertRejected(actions.create.call({ $store: store }, {}), done, () => {
        assert(
          brokenState.errorOnCreate.message === 'create error',
          'errorOnCreate was set'
        )
        assert(
          brokenState.isCreatePending === false,
          'pending state was cleared'
        )
        assert(brokenState.ids.length === 0)
      })

      // Make sure proper state changes occurred before response
      assert(brokenState.ids.length === 0)
      assert(brokenState.errorOnCreate === null)
      assert(brokenState.isCreatePending === true)
    })
  })

  describe('Update', () => {
    it('updates store list state on service success', done => {
      const { makeServicePlugin, Todo } = makeContext()
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            servicePath: 'my-todos',
            Model: Todo,
            service: feathersClient.service('my-todos')
          })
        ]
      })
      const todoState = store.state['my-todos']
      const actions = mapActions('my-todos', ['create', 'update'])

      actions.create
        .call({ $store: store }, { description: 'Do the second' })
        .then(() => {
          actions.update
            .call({ $store: store }, [
              0,
              { id: 0, description: 'Do da dishuz' }
            ])
            .then(responseFromUpdate => {
              assert(todoState.ids.length === 1)
              assert(todoState.errorOnUpdate === null)
              assert(todoState.isUpdatePending === false)
              assert.deepEqual(
                todoState.keyedById[responseFromUpdate.id],
                responseFromUpdate
              )
              done()
            })

          // Make sure proper state changes occurred before response
          assert(todoState.ids.length === 1)
          assert(todoState.errorOnUpdate === null)
          assert(todoState.isUpdatePending === true)
          assert(todoState.idField === 'id')
        })
        .catch(error => {
          assert(!error, error)
        })
    })

    it('updates errorOnUpdate state on service failure', done => {
      const { makeServicePlugin, Broken } = makeContext()
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            servicePath: 'broken',
            Model: Broken,
            service: feathersClient.service('broken')
          })
        ]
      })
      const brokenState = store.state.broken
      const actions = mapActions('broken', ['update'])

      assertRejected(
        actions.update.call({ $store: store }, [0, { id: 0 }]),
        done,
        () => {
          assert(
            brokenState.errorOnUpdate.message === 'update error',
            'errorOnUpdate was set'
          )
          assert(
            brokenState.isUpdatePending === false,
            'pending state was cleared'
          )
          assert(brokenState.ids.length === 0)
        }
      )

      // Make sure proper state changes occurred before response
      assert(brokenState.ids.length === 0)
      assert(brokenState.errorOnUpdate === null)
      assert(brokenState.isUpdatePending === true)
    })
  })

  describe('Patch', () => {
    it('updates only the changed properties', done => {
      const { makeServicePlugin, Todo } = makeContext()
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            servicePath: 'my-todos',
            Model: Todo,
            service: feathersClient.service('my-todos')
          })
        ]
      })
      const todoState = store.state['my-todos']
      const actions = mapActions('my-todos', ['create', 'patch'])

      const dataUnchanged = {
        unchanged: true,
        deep: { changed: false, unchanged: true }
      }
      const dataChanged = {
        unchanged: true,
        deep: { changed: true, unchanged: true }
      }

      actions.create
        .call(
          { $store: store },
          Object.assign({ description: 'Do the second' }, dataUnchanged)
        )
        .then(() => {
          actions.patch
            .call({ $store: store }, [
              0,
              Object.assign({ description: 'Write a Vue app' }, dataChanged)
            ])
            .then(responseFromPatch => {
              assert(todoState.ids.length === 1)
              assert(todoState.errorOnPatch === null)
              assert(todoState.isPatchPending === false)
              assert.deepEqual(
                todoState.keyedById[responseFromPatch.id],
                responseFromPatch
              )
              done()
            })

          // Make sure proper state changes occurred before response
          assert(todoState.ids.length === 1)
          assert(todoState.errorOnPatch === null)
          assert(todoState.isPatchPending === true)
          assert(todoState.idField === 'id')
        })
    })

    it('updates store state on service success', done => {
      const { makeServicePlugin, Todo } = makeContext()
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            servicePath: 'my-todos',
            Model: Todo,
            service: feathersClient.service('my-todos')
          })
        ]
      })
      const todoState = store.state['my-todos']
      const actions = mapActions('my-todos', ['create', 'patch'])

      actions.create
        .call({ $store: store }, { description: 'Do the second' })
        .then(() => {
          actions.patch
            .call({ $store: store }, [0, { description: 'Write a Vue app' }])
            .then(responseFromPatch => {
              assert(todoState.ids.length === 1)
              assert(todoState.errorOnPatch === null)
              assert(todoState.isPatchPending === false)
              assert.deepEqual(
                todoState.keyedById[responseFromPatch.id],
                responseFromPatch
              )
              done()
            })

          // Make sure proper state changes occurred before response
          assert(todoState.ids.length === 1)
          assert(todoState.errorOnPatch === null)
          assert(todoState.isPatchPending === true)
          assert(todoState.idField === 'id')
        })
    })

    it('updates errorOnPatch state on service failure', done => {
      const { makeServicePlugin, Broken } = makeContext()
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            servicePath: 'broken',
            Model: Broken,
            service: feathersClient.service('broken')
          })
        ]
      })
      const brokenState = store.state.broken
      const actions = mapActions('broken', ['patch'])

      assertRejected(
        actions.patch.call({ $store: store }, [0, { id: 0 }]),
        done,
        () => {
          assert(
            brokenState.errorOnPatch.message === 'patch error',
            'errorOnPatch was set'
          )
          assert(
            brokenState.isPatchPending === false,
            'pending state was cleared'
          )
          assert(brokenState.ids.length === 0)
        }
      )

      // Make sure proper state changes occurred before response
      assert(brokenState.ids.length === 0)
      assert(brokenState.errorOnPatch === null)
      assert(brokenState.isPatchPending === true)
    })
  })

  describe('Remove', () => {
    it('updates store state on service success', done => {
      const { makeServicePlugin, Todo } = makeContext()
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            servicePath: 'my-todos',
            Model: Todo,
            service: feathersClient.service('my-todos')
          })
        ]
      })
      const todoState = store.state['my-todos']
      const actions = mapActions('my-todos', ['create', 'remove'])

      actions.create
        .call({ $store: store }, { description: 'Do the second' })
        .then(() => {
          actions.remove
            .call({ $store: store }, 0)
            .then(() => {
              assert(todoState.ids.length === 0)
              assert(todoState.errorOnRemove === null)
              assert(todoState.isRemovePending === false)
              assert.deepEqual(todoState.keyedById, {})
              done()
            })
            .catch(error => {
              console.log(error)
            })

          // Make sure proper state changes occurred before response
          assert(todoState.ids.length === 1)
          assert(todoState.errorOnRemove === null)
          assert(todoState.isRemovePending === true)
          assert(todoState.idField === 'id')
        })
    })

    it('updates errorOnRemove state on service failure', done => {
      const { makeServicePlugin, Broken } = makeContext()
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            servicePath: 'broken',
            Model: Broken,
            service: feathersClient.service('broken')
          })
        ]
      })
      const brokenState = store.state.broken
      const actions = mapActions('broken', ['remove'])

      assertRejected(actions.remove.call({ $store: store }, 0), done, () => {
        assert(
          brokenState.errorOnRemove.message === 'remove error',
          'errorOnRemove was set'
        )
        assert(
          brokenState.isRemovePending === false,
          'pending state was cleared'
        )
        assert(brokenState.ids.length === 0)
      })

      // Make sure proper state changes occurred before response
      assert(brokenState.ids.length === 0)
      assert(brokenState.errorOnRemove === null)
      assert(brokenState.isRemovePending === true)
    })
  })
})
