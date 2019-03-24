"use strict";
exports.__esModule = true;
var fast_copy_1 = require("fast-copy");
var lodash_isplainobject_1 = require("lodash.isplainobject");
var lodash_merge_1 = require("lodash.merge");
function makeModel(options) {
    if (options === void 0) { options = { idField: 'id', preferUpdate: false }; }
    var _a;
    var idField = options.idField, preferUpdate = options.preferUpdate;
    return _a = /** @class */ (function () {
            function FeathersVuexModel() {
            }
            FeathersVuexModel.getFromStore = function (id) { };
            FeathersVuexModel.getId = function (record) {
                return record[FeathersVuexModel.idField];
            };
            FeathersVuexModel.prototype.clone = function () {
                if (this.isClone) {
                    throw new Error('You cannot clone a copy');
                }
                var id = this[FeathersVuexModel.idField];
                return this._clone(id);
            };
            FeathersVuexModel.prototype._clone = function (id) { };
            FeathersVuexModel.prototype.reset = function () {
                if (this.isClone) {
                    var id = this[FeathersVuexModel.idField];
                    this._reset(id);
                }
                else {
                    throw new Error('You cannot reset a non-copy');
                }
            };
            FeathersVuexModel.prototype._reset = function (id) { };
            FeathersVuexModel.prototype.commit = function () {
                if (this.isClone) {
                    var id = this[FeathersVuexModel.idField];
                    return this._commit(id);
                }
                else {
                    throw new Error('You cannnot call commit on a non-copy');
                }
            };
            FeathersVuexModel.prototype._commit = function (id) { };
            FeathersVuexModel.prototype.save = function (params) {
                if (this[idField]) {
                    return preferUpdate
                        ? this.update(params)
                        : this.patch(params);
                }
                else {
                    return this.create(params);
                }
            };
            FeathersVuexModel.prototype.create = function (params) {
                var data = Object.assign({}, this);
                if (data[idField] === null) {
                    delete data[idField];
                }
                return store.dispatch(namespace + "/create", [data, params]);
                // return this._create(data, params)
            };
            FeathersVuexModel.prototype._create = function (data, params) { };
            FeathersVuexModel.prototype.patch = function (params) {
                if (!this[idField]) {
                    var error = new Error("Missing " + idField + " property. You must create the data before you can patch with this data");
                    return Promise.reject(error);
                }
                // return this._patch(this[idField], this, params)
            };
            FeathersVuexModel.prototype._patch = function (idField) { };
            FeathersVuexModel.prototype.update = function (params) {
                if (!this[idField]) {
                    var error = new Error("Missing " + idField + " property. You must create the data before you can update with this data");
                    return Promise.reject(error);
                }
                // return this._update(this[idField], this, params)
            };
            FeathersVuexModel.prototype._update = function () { };
            FeathersVuexModel.prototype.remove = function (params) {
                // return this._remove(this[idField], params)
            };
            FeathersVuexModel.prototype._remove = function () { };
            FeathersVuexModel.prototype.toJSON = function () {
                return lodash_merge_1["default"]({}, this);
            };
            return FeathersVuexModel;
        }()),
        // static copiesById: Object
        _a.idField = idField,
        _a.preferUpdate = preferUpdate,
        _a;
}
function createRelatedInstance(_a) {
    var item = _a.item, Model = _a.Model, idField = _a.idField, store = _a.store;
    // Create store instances (if data contains an idField)
    var model = new Model(item);
    var id = model[idField];
    var storedModel = store.state[model.constructor.namespace].keyedById[id];
    return { model: model, storedModel: storedModel };
}
function cloneWithAccessors(obj) {
    var clone = {};
    var props = Object.getOwnPropertyNames(obj);
    props.forEach(function (key) {
        var desc = Object.getOwnPropertyDescriptor(obj, key);
        // Do not allow sharing of deeply-nested objects between instances
        if (lodash_isplainobject_1["default"](desc.value)) {
            desc.value = fast_copy_1["default"](desc.value);
        }
        Object.defineProperty(clone, key, desc);
    });
    return clone;
}
exports["default"] = makeModel;
