/**
 * @filename Backbone.relationalHelper.js
 */
(function (define) {
  'use strict';
  define(function (require, exports, module) {

    var _ = require('underscore');
    var Backbone = null;

    var Helper = {

      setBackbone: function(b){
        Backbone = b;
      },

      _relationsValidated: false,

      /**
       * Parse backend response, recursive function applied to all children models (related models)
       * @param response
       * @returns {*}
       */
      parse: function (response) {
        var self = this, relations = this.relations;

        if (this.beforeParse) {
          response = this.beforeParse(response);
        }

        if (response && relations) {
          this._validateRelations();
          _.each(relations, function (relation, key) {
            var oldColl, oldModel;

            /**
             * HasOne relation
             */
            if (relation.type === 'one') {
              oldModel = self.get(key);
              if (!(oldModel && oldModel instanceof Backbone.Model)) {
                oldModel = new relation.relatedModel();
              }
              if (response[key] instanceof Backbone.Model) {
                response[key] = response[key].attributes;
              }
              if (response[key]) {
                response[key] = oldModel.set(oldModel.parse(response[key]));
              }
            }
            /**
             * HasMany relation
             */
            else if (relation.type === 'many') {
              /**
               * If model property exist ... do merge
               */
              oldColl = self.get(key);
              if (!(oldColl && oldColl instanceof Backbone.Collection)) {
                oldColl = self._getNewCollectionFromRelation(relation);
              }
              response[key] = self._mergeDataCollections(response[key], oldColl, relation.relatedModel);
            }

            if (relation.reverseReference) {
              response[key]._reverse = self;
            }
          });
        }

        if (this.afterParse) {
          response = this.afterParse(response);
        }

        return response;
      },

      toJSON: function (options) {
        var self = this, relations = this.relations;
        var json = Backbone.Model.prototype.toJSON.call(this, options);
        if (relations) {
          this._validateRelations();
          _.each(relations, function (relation, key) {
            var value = self.get(key);
            if (relation.type === 'one') {
              if (value instanceof Backbone.Model) {
                json[key] = value.toJSON();
              }
            }
            else if (relation.type === 'many') {
              if (value instanceof Backbone.Collection) {
                json[key] = value.toJSON();
              }
            }
          });
        }
        return json;
      },

      /**
       * Backbone.Model.get
       * Init collection or model for relational attributes
       * @param attr
       * @returns {*}
       */
      get: function (attr) {
        var result = Backbone.Model.prototype.get.call(this, attr),
          relation, m;

        if (_.isNull(result)/* || _.isUndefined(result)*/) {
          return result;
        }

        if (result && (result instanceof Backbone.Collection || result instanceof Backbone.Model)) {
          if (result instanceof Backbone.Model) {
            this._propagateChange(result, attr);
          }
          return result;
        }

        if (this.relations && this.relations[attr]) {
          this._validateRelations();
          relation = this.relations[attr];
          if (relation.type === 'many') {
            if (result instanceof Array) {
              result = this._mergeDataCollections(result, this._getNewCollectionFromRelation(relation), relation.relatedModel);
            } else { // if is an object ??
              result = this._getNewCollectionFromRelation(relation);
            }
          } else if (relation.type === 'one') {
            m = new relation.relatedModel();
            if (result instanceof Object)  { // if is an array ??
              m.set(m.parse(result));
            }
            result = m;
            this._propagateChange(result, attr);
          }
          if (result && (result instanceof Backbone.Collection || result instanceof Backbone.Model)) {
            this.set(attr, result);
          }

          if (relation.reverseReference) {
            result._reverse = self;
          }

        }
        return result;
      },

      _propagateChange: function (model, attr) {
        var self = this;
        this.listenTo(model, 'change', function () {
          self.trigger('change:' + attr);
        });
      },

      /**
       * Generate new collection for "HasMany" relation
       * @param relation
       * @returns {*}
       * @private
       */
      _getNewCollectionFromRelation: function (relation) {
        var coll;
        if (relation.collectionType) {
          coll = new relation.collectionType();
        } else {
          coll = new Backbone.Collection();
          coll.model = relation.relatedModel;
        }
        return coll;
      },

      /**
       * Merge Array Data in existing collection
       * @param data
       * @param collection
       * @param Model
       * @returns {*}
       * @private
       */
      _mergeDataCollections: function (data, collection, Model) {
        var max, m;
        if (!data) {
          return collection;
        }

        max = (data.length > collection.length) ? data.length : collection.length;
        for (var i = 0; i < max; i++) {
          if (!_.isUndefined(collection.at(i)) && !_.isUndefined(data[i])) {
            collection.at(i).set(collection.at(i).parse(data[i]));
          } else if (_.isUndefined(collection.at(i)) && !_.isUndefined(data[i])) {
            if (!collection.model) {
              collection.model = Model;
            }
            m = new Model();
            m.set(m.parse(data[i]));
            collection.add(m, {at: i});
          } else if (!_.isUndefined(collection.at(i))) {
            collection.remove(collection.at(i));
          }
        }

        return collection;
      },

      /**
       * @TODO remove after removing Backbone Relational, because Relational overwrites setters
       */
      set: function (key, val, options) {
        return Backbone.Model.prototype.set.call(this, key, val, options);
      },

      /**
       * @TODO remove after removing Backbone Relational, because Relational overwrites getters
       */
      _get: function (attr) {
        return Backbone.Model.prototype.get.call(this, attr);
      },

      /**
       * Not used but i keep it (beta version of helper)
       * @param options
       */
      initRelations: function (options) {
        var self = this;
        options || (options = {});
        if (this.relations) {
          _.each(this.relations, function (relation, attr) {
            var value, temp;
            options[attr] || (options[attr] = null);
            value = (options[attr]) ? options[attr] : self.get(attr);

            if (relation.type === 'one') {
              if (!value) {
                value = new relation.relatedModel();
              } else if (!(value instanceof Backbone.Model)) {
                temp = new relation.relatedModel();
                if (value) {
                  temp.parse(value);
                }
                value = temp;
              }
            }
            else if (relation.type === 'many') {
              if (value instanceof Array) {
                value = self._mergeDataCollections(value, self._getNewCollectionFromRelation(relation), relation.relatedModel);
              } else if (!value || !(value instanceof Backbone.Collection)) {
                value = self._getNewCollectionFromRelation(relation);
              }
            }

            self.set(attr, value);

          });
        }
      },

      _setRelatedModelForRelation: function (relation) {
        if (!relation.collectionType.prototype.model) {
          throw new Error('you have defined a collection without a model as "CollectionType"');
        }
        relation.relatedModel = relation.collectionType.prototype.model;
      },

      _validateRelations: function () {
        var self = this;
        if (this._relationsValidated) {
          return true;
        }
        this._relationsValidated = true;
        _.each(this.relations, function (relation) {

          if (!relation.type) {
            throw new Error('You must specify relation type');
          }
          if (!relation.relatedModel && !relation.collectionType) {
            throw new Error('You must specify collectionType AND/OR relatedModel');
          }
          if (!relation.relatedModel) {
            self._setRelatedModelForRelation(relation);
          }
        });
      }
    };

    module.exports = Helper;
  });
}('function' === typeof define && define.amd ? define :
    function (factory) {
      'use strict';
      factory(require, exports, module);
    })
  );
