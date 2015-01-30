'use strict';

var _ = require('underscore');
var Backbone = require('backbone');
var helper = require('../index');
helper.setBackbone(Backbone);
Backbone.relationalHelper = helper;

var Data = {};

Data.User = Backbone.Model.extend();
Data.Job = Backbone.Model.extend({
  defaults: {
    'startDate': null,
    'endDate': null
  }
});

Data.Person = Backbone.Model.extend({});
_.extend(Data.Person.prototype, {
  relations: {
    'likesALot': {
      type: 'one',
      relatedModel: Data.Person
    },
    'user': {
      type: 'one',
      relatedModel: Data.User
    },
    'jobs': {
      type: 'many',
      relatedModel: Data.Job
    }
  }
});

Data.PersonCollection = Backbone.Collection.extend({
  model: Data.Person
});

Data.House = Backbone.Model.extend({
  relations: {
    'occupants': {
      type: 'many',
      collectionType: Data.PersonCollection
    }
  }
});

Data.Password = Backbone.Model.extend({
  relations: {
    'user': {
      type: 'one',
      relatedModel: Data.User
    }
  }
});

Data.Company = Backbone.Model.extend({
  relations: {
    'ceo': {
      type: 'one',
      relatedModel: Data.Person
    },
    'employees': {
      type: 'many',
      relatedModel: Data.Job
    }
  }
});

_.extend(Data.House.prototype, Backbone.relationalHelper);
_.extend(Data.Person.prototype, Backbone.relationalHelper);
_.extend(Data.Company.prototype, Backbone.relationalHelper);
_.extend(Data.Job.prototype, Backbone.relationalHelper);
_.extend(Data.Password.prototype, Backbone.relationalHelper);


Data.person1 = new Data.Person({
  id: 'person-1',
  name: 'boy',
  likesALot: 'person-2',
  resource_uri: 'person-1',
  user: { id: 'user-1', login: 'dude', email: 'me@gmail.com', resource_uri: 'user-1' }
});

Data.person2 = new Data.Person({
  id: 'person-2',
  name: 'girl',
  likesALot: 'person-1',
  resource_uri: 'person-2'
});

Data.person3 = new Data.Person({
  id: 'person-3',
  resource_uri: 'person-3'
});

Data.oldCompany = new Data.Company({
  id: 'company-1',
  name: 'Big Corp.',
  ceo: {
    name: 'Big Boy'
  },
  employees: [ { person: 'person-3' } ], // uses the 'Job' link table to achieve many-to-many. No 'id' specified!
  resource_uri: 'company-1'
});

Data.newCompany = new Data.Company({
  id: 'company-2',
  name: 'New Corp.',
  employees: [ { person: 'person-2' } ],
  resource_uri: 'company-2'
});

Data.ourHouse = new Data.House({
  id: 'house-1',
  location: 'in the middle of the street',
  occupants: ['person-2'],
  resource_uri: 'house-1'
});

Data.theirHouse = new Data.House({
  id: 'house-2',
  location: 'outside of town',
  occupants: [],
  resource_uri: 'house-2'
});

module.exports = Data;