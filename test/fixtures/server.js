import feathers from '@feathersjs/feathers'
import rest from '@feathersjs/express/rest'
import socketio from '@feathersjs/socketio'
import bodyParser from 'body-parser'
import auth from '@feathersjs/authentication'
import jwt from '@feathersjs/authentication-jwt'
import memory from 'feathers-memory'

const app = feathers()
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .configure(rest())
  .configure(socketio())
  .use('/users', memory())
  .use('/todos', memory())
  .use('/errors', memory())
  .configure(
    auth({
      secret: 'test',
      service: '/users'
    })
  )
  .configure(jwt())

app.service('/errors').hooks({
  before: {
    all: [
      hook => {
        throw new Error(`${hook.method} Denied!`)
      }
    ]
  }
})

const port = 3030
const server = app.listen(port)

process.on('unhandledRejection', (reason, p) =>
  console.log('Unhandled Rejection at: Promise ', p, reason)
)

server.on('listening', () => {
  console.log(`Feathers application started on localhost:${port}`)

  setTimeout(function() {
    server.close()
  }, 50000)
})
