const feathers = require('feathers')
const rest = require('feathers-rest')
const hooks = require('feathers-hooks')
const socketio = require('feathers-socketio')
const bodyParser = require('body-parser')
const auth = require('feathers-authentication')
const jwt = require('feathers-authentication-jwt')
const memory = require('feathers-memory')

const app = feathers()
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .configure(hooks())
  .configure(rest())
  .configure(socketio())
  .use('/users', memory())
  .use('/todos', memory())
  .use('/errors', memory())
  .configure(auth({
    secret: 'test',
    service: '/users'
  }))
  .configure(jwt())

app.use('/errors').hooks({
  before: {
    all: [hook => {
      throw new Error(`${hook.method} Denied!`)
    }]
  }
})

const port = 3030
const server = app.listen(port)

process.on('unhandledRejection', (reason, p) =>
  console.log('Unhandled Rejection at: Promise ', p, reason)
)

server.on('listening', () => {
  console.log(`Feathers application started on localhost:${port}`)

  setTimeout(function () {
    server.close()
  }, 50000)
})
