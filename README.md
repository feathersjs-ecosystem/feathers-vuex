# feathers-vuex

[![Build Status](https://travis-ci.org/feathersjs-ecosystem/feathers-vuex.png?branch=master)](https://travis-ci.org/feathers-plus/feathers-vuex)
[![Dependency Status](https://img.shields.io/david/feathersjs-ecosystem/feathers-vuex.svg?style=flat-square)](https://david-dm.org/feathers-plus/feathers-vuex)
[![Download Status](https://img.shields.io/npm/dm/feathers-vuex.svg?style=flat-square)](https://www.npmjs.com/package/feathers-vuex)

![feathers-vuex service logo](./service-logo.png)

> Integrate the Feathers Client into Vuex

`feathers-vuex` is a first class integration of the Feathers Client and Vuex.  It implements many Redux best practices under the hood, eliminates *a lot* of boilerplate code, and still allows you to easily customize the Vuex store.

## Demo & Documentation

[Demo](https://codesandbox.io/s/xk52mqm7o)

See [https://feathers-vuex.netlify.com/index.html](https://feathers-vuex.netlify.com) for full documentation.

## Installation

```bash
npm install feathers-vuex --save
```

```bash
yarn add feathers-vuex
```

IMPORTANT: Feathers-Vuex is (and requires to be) published in ES6 format for full compatibility with JS classes.  If your project uses Babel, it must be configured properly.  See the [Project Configuration](#projectconfiguration) section for more information.

## Contributing

This repo is pre-configured to work with the Visual Studio Code debugger.  After running `yarn install`, use the "Mocha Tests" debug script for a smooth debugging experience.

## License

Copyright (c) Forever and Ever, or at least the current year.

Licensed under the [MIT license](https://github.com/feathers-plus/feathers-vuex/blob/master/LICENSE).
