"use strict";
exports.__esModule = true;
var chai_1 = require("chai");
// import Vuex from 'vuex'
// import { makeTodos } from '../../../test/fixtures/todos'
// import {
//     feathersRestClient as feathersClient, feathersSocketioClient, makeFeathersRestClient
// } from '../fixtures/feathers-client'
var model_1 = require("./model");
describe('makeModel', function () {
    it('can make a FeathersVuexModel', function () {
        var FeathersVuexModel = model_1["default"]({
            idField: '_id'
        });
        chai_1.assert(FeathersVuexModel);
    });
});
