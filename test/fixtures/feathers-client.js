import feathers from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio-client'
import rest from '@feathersjs/rest-client'
import axios from 'axios'
import auth from '@feathersjs/authentication-client'
import io from 'socket.io-client/dist/socket.io'
import fixtureSocket from 'can-fixture-socket'

const mockServer = new fixtureSocket.Server(io)
const baseUrl = 'http://localhost:3030'

// These are fixtures used in the service-modulet.test.js under socket events.
let id = 0
mockServer.on('things::create', function (data, params, cb) {
  data.id = id
  id++
  mockServer.emit('things created', data)
  cb(null, data)
})
mockServer.on('things::patch', function (id, data, params, cb) {
  Object.assign(data, { id, test: true })
  mockServer.emit('things patched', data)
  cb(null, data)
})
mockServer.on('things::update', function (id, data, params, cb) {
  Object.assign(data, { id, test: true })
  mockServer.emit('things updated', data)
  cb(null, data)
})
mockServer.on('things::remove', function (id, obj, cb) {
  const response = { id, test: true }
  mockServer.emit('things removed', response)
  cb(null, response)
})

let idDebounce = 0

mockServer.on('things-debounced::create', function (data, obj, cb) {
  data.id = idDebounce
  idDebounce++
  mockServer.emit('things-debounced created', data)
  cb(null, data)
})
mockServer.on('things-debounced::patch', function (id, data, params, cb) {
  Object.assign(data, { id, test: true })
  mockServer.emit('things-debounced patched', data)
  cb(null, data)
})
mockServer.on('things-debounced::update', function (id, data, params, cb) {
  Object.assign(data, { id, test: true })
  mockServer.emit('things-debounced updated', data)
  cb(null, data)
})
mockServer.on('things-debounced::remove', function (id, params, cb) {
  const response = { id, test: true }
  mockServer.emit('things-debounced removed', response)
  cb(null, response)
})

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function makeFeathersSocketClient(baseUrl) {
  const socket = io(baseUrl)

  return feathers().configure(socketio(socket)).configure(auth())
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function makeFeathersRestClient(baseUrl) {
  return feathers().configure(rest(baseUrl).axios(axios)).configure(auth())
}

const sock = io(baseUrl)

export const feathersSocketioClient = feathers()
  .configure(socketio(sock))
  .configure(auth())

export const feathersRestClient = feathers()
  .configure(rest(baseUrl).axios(axios))
  .configure(auth())
