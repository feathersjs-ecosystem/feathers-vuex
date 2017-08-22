import feathers from 'feathers/client'
import hooks from 'feathers-hooks'
import socketio from 'feathers-socketio/client'
import rest from 'feathers-rest/client'
import axios from 'axios'
import auth from 'feathers-authentication-client'
import io from 'socket.io-client/dist/socket.io'

const baseUrl = 'http://localhost:3030'

export function makeFeathersSocketClient () {
  const socket = io(baseUrl)

  return feathers()
    .configure(hooks())
    .configure(socketio(socket))
    .configure(auth())
}

export function makeFeathersRestClient () {
  return feathers()
    .configure(hooks())
    .configure(rest(baseUrl).axios(axios))
    .configure(auth())
}

const sock = io(baseUrl)

export const feathersSocketioClient = feathers()
  .configure(hooks())
  .configure(socketio(sock))
  .configure(auth())

export const feathersRestClient = feathers()
  .configure(hooks())
  .configure(rest(baseUrl).axios(axios))
  .configure(auth())
