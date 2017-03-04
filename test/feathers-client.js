import feathers from 'feathers/client'
import hooks from 'feathers-hooks'
import socketio from 'feathers-socketio/client'
import rest from 'feathers-rest/client'
import axios from 'axios'
import auth from 'feathers-authentication-client'
import io from 'socket.io-client'

const baseUrl = 'http://localhost:3030'

export function makeFeathersSocketClient () {
  const socket = io(baseUrl)

  return feathers()
    .configure(hooks())
    .configure(socketio(socket))
    .configure(auth())
}

export function makeFeathersRestClient () {
  const feathersClient = feathers()
    .configure(hooks())
    .configure(rest(baseUrl).axios(axios))
    .configure(auth())

  return feathersClient
}
