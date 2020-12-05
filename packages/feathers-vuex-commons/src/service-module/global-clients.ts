/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import _get from 'lodash/get'

/**
 * A global object that holds references to all Model Classes in the application.
 */
export const clients: { [k: string]: any } = {
  byAlias: {},
  byHost: {},
}

/**
 * prepareAddModel wraps options in a closure around addModel
 * @param options
 */
export function addClient({ client, serverAlias }) {
  // Save reference to the clients by host uri, if it was available.
  let uri = ''
  if (client.io) {
    uri = _get(client, 'io.io.uri')
  }
  if (uri) {
    clients.byHost[uri] = client
  }
  // Save reference to clients by serverAlias.
  clients.byAlias[serverAlias] = client
}

export function clearClients() {
  function deleteKeys(path) {
    Object.keys(clients[path]).forEach(key => {
      delete clients[path][key]
    })
  }
  deleteKeys('byAlias')
  deleteKeys('byHost')
}
