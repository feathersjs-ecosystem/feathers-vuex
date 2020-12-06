---
title: API Overview
description: ''
position: 2
category: 'API'
---

<!--- Usage ------------------------------------------------------------------------------------ -->

[![Build Status](https://travis-ci.org/feathersjs-ecosystem/feathers-vuex.png?branch=master)](https://travis-ci.org/feathersjs-ecosystem/feathers-vuex)
[![Dependency Status](https://img.shields.io/david/feathersjs-ecosystem/feathers-vuex.svg?style=flat-square)](https://david-dm.org/feathersjs-ecosystem/feathers-vuex)
[![Download Status](https://img.shields.io/npm/dm/feathers-vuex.svg?style=flat-square)](https://www.npmjs.com/package/feathers-vuex)

![feathers-vuex service logo](https://github.com/feathersjs-ecosystem/feathers-vuex/raw/master/service-logo.png)

> Integrate the Feathers Client into Vuex

`feathers-vuex` is a first class integration of the Feathers Client and Vuex. It implements many Redux best practices under the hood, eliminates _a lot_ of boilerplate code, and still allows you to easily customize the Vuex store.

These docs are for version 2.x. For feathers-vuex@1.x, please go to [https://feathers-vuex-v1.netlify.com](https://feathers-vuex-v1.netlify.com).

## Features

- Fully powered by Vuex & Feathers
- Realtime By Default
- Actions With Reactive Data
- Local Queries
- Live Queries
- Feathers Query Syntax
- Vuex Strict Mode Support
- [Client-Side Pagination Support](./service-plugin.md#pagination-and-the-find-getter)
- Fall-Through Caching
- [`$FeathersVuex` Plugin for Vue](./vue-plugin.md)
- [Per-Service Data Modeling](./common-patterns.md#Basic-Data-Modeling-with-instanceDefaults)
- [Clone & Commit](./feathers-vuex-forms.md#the-clone-and-commit-pattern)
- Simplified Auth
- [Per-Record Defaults](./model-classes.md#instancedefaults)
- [Data Level Computed Properties](./2.0-major-release.md#getter-and-setter-props-go-on-the-model-classes)
- [Improved Relation Support](./2.0-major-release.md#define-relationships-and-modify-data-with-setupinstance)
- [Powerful Mixins](./mixins.md)
- [Renderless Data Components](./data-components.md)
- [Renderless Form Component](./feathers-vuex-forms.md#feathersvuexformwrapper) for Simplified Vuex Forms
- [Temporary (Local-only) Record Support](./2.0-major-release.md#support-for-temporary-records) \*
- New `useFind` and `useGet` Vue Composition API super powers! <Badge text="3.0.0+" />
- [Server-Powered Pagination Support](./service-plugin.md#pagination-and-the-find-action) \*
- [VuePress Dark Mode Support](https://tolking.github.io/vuepress-theme-default-prefers-color-scheme/) for the Docs

`** Improved in v3.0.0`

## License

Licensed under the [MIT license](LICENSE).

Feathers-Vuex is developed and maintained by [Marshall Thompson](https://www.github.com/marshallswain).
