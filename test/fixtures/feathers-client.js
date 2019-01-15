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
mockServer.on('things::create', function (data) {
  data.id = id
  id++
  mockServer.emit('things created', data)
})
mockServer.on('things::patch', function (id, data) {
  Object.assign(data, { id, test: true })
  mockServer.emit('things patched', data)
})
mockServer.on('things::update', function (id, data) {
  Object.assign(data, { id, test: true })
  mockServer.emit('things updated', data)
})
mockServer.on('things::remove', function (id, data) {
  mockServer.emit('things removed', { id, test: true })
})

export function makeFeathersSocketClient () {
  const socket = io(baseUrl)

  return feathers()
    .configure(socketio(socket))
    .configure(auth())
}

export function makeFeathersRestClient () {
  return feathers()
    .configure(rest(baseUrl).axios(axios))
    .configure(auth())
}

const sock = io(baseUrl)

export const feathersSocketioClient = feathers()
  .configure(socketio(sock))
  .configure(auth())

export const feathersRestClient = feathers()
  .configure(rest(baseUrl).axios(axios))
  .configure(auth())
