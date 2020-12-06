---
title: Example Applications
description: ''
position: 4
category: 'Examples'
---

# Example Applications

On this page you will find any example applications using Feathers-Vuex that have been shared by the community. If there's something you would like to see here, feel free to make a PR to add it to the [Community Examples list](#community-examples).

## Feathers Chat

The [Feathers Chat Example for Feathers Vuex](https://github.com/feathersjs-ecosystem/feathers-chat-vuex) has been updated to `feathers-vuex@3.x` and everything has been rewritten with the Vue composition API. The old repo is now available at [https://github.com/feathersjs-ecosystem/feathers-chat-vuex-0.7](https://github.com/feathersjs-ecosystem/feathers-chat-vuex-0.7). The following information will assist you in seeing the "before" and "after" of the refactor to feathers-vuex@3.x.

![Feathers Chat](https://camo.githubusercontent.com/14b6b2d6dd2475c3b83eb1ade6aedbcd8cf94139/68747470733a2f2f646f63732e66656174686572736a732e636f6d2f6173736574732f696d672f66656174686572732d636861742e39313936303738352e706e67)

### Before and After Comparisons

- The folder structure is similar, since this is a VueCLI application. Some of the components in the old version have been moved into the `views` folder.
  - `/components/Home.vue` is now `/views/Home.vue`
  - `/components/Signup.vue` is now `/views/Signup.vue`
  - `/components/Login.vue` is now `/views/Login.vue`
  - `/components/Chat/Chat.vue` is now `/views/Chat.vue`
- The `/components` folder has been flattened. There are no more subfolders.
- Component refactors:
  - [Login.vue](https://github.com/feathersjs-ecosystem/feathers-chat-vuex/commit/eb9ba377c5705c1378bee72661a13dd0db48be05)
  - [Signup.vue](https://github.com/feathersjs-ecosystem/feathers-chat-vuex/commit/478710ed84869d33a9286078496c1e5974a95067)
  - [Users.vue](https://github.com/feathersjs-ecosystem/feathers-chat-vuex/commit/02b47149c80c27cdeb611c2f4438b4c62159c644)
  - [Messages.vue](https://github.com/feathersjs-ecosystem/feathers-chat-vuex/commit/930743c1679cc4ed9d691532a7dff1d6a34398e6)
  - [Compuser.vue](https://github.com/feathersjs-ecosystem/feathers-chat-vuex/commit/cd5c8898ede270d5e22f9c6ef1450d3f3c6278c9)
  - [Chat.vue](https://github.com/feathersjs-ecosystem/feathers-chat-vuex/commit/39eb3e13f6921b0d0524ae4ac7942b9ce78b222c)
  - [Messages.vue](https://github.com/feathersjs-ecosystem/feathers-chat-vuex/commit/e5cf7fb0cc8eab80ee3dc441afafb1399d69059e)

### More to Come

The Feathers Chat example is a pretty simple application. Its primary purpose is to show off how easy it is to do realtime with FeathersJS. (FeathersJS continues to be the only framework that treats real-time communication as a first-class citizen with the same API across multiple transports.) But it doesn't properly showcase all of the great features in Feathers-Vuex 3.0. This requires a solution that:

1. Still allows comparison of Feathers Chat applications made with other frameworks.
2. Allows the version of Feathers Chat built with Feathers-Vuex to add features and showcase things you might actually use in production.

If there are features which you would like to see implemented, please open an issue in the [feathers-chat-vuex Repo](https://github.com/feathersjs-ecosystem/feathers-chat-vuex) for your idea to be considered.

## Community Examples

If you have created or know of an example application, please add it, here.

- [Feathers-Chat-Vuex](https://github.com/feathersjs-ecosystem/feathers-chat-vuex)
