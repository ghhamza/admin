'use strict';

var chai = require('chai');
var expect = require('chai').expect;
var sinon = require('sinon');
chai.use(require('sinon-chai'));

var data = require('./data');
var Backbone = require('backbone');
var _ = require('underscore');

var helper = require('../index');
helper.setBackbone(Backbone);
Backbone.relationalHelper = helper;

describe('Relational Helper: Exceptions', function () {
  var House, model, Occupants,
    YOU_MUST_SPE_TYPE = 'You must specify relation type',
    YOU_MUST_SPE_CollectionType_ANDOR_RelatedModel = 'You must specify collectionType AND/OR relatedModel',
    CollectionType_WITHOUT_RelatedModel = 'you have defined a collection without a model as "CollectionType"';

  it('should throw if relation is defined without type', function () {
    House = Backbone.Model.extend({
      relations: {
        'neighbors': {}
      }
    });
    _.extend(House.prototype, Backbone.relationalHelper);
    model = new House();
    sinon.spy(model, 'get');
    try {
      model.get('neighbors');
    }
    catch (e) {
      if (YOU_MUST_SPE_TYPE !== e.message) {
        throw e;
      }
    }
    expect(model.get).to.have.thrown('Error');
  });

  it('should throw if collection is defined without relatedModel', function () {
    Occupants = Backbone.Collection.extend({model: undefined});
    House = Backbone.Model.extend({
      relations: {
        'occupants': {
          type: 'many',
          collectionType: Occupants
        }
      }
    });
    _.extend(House.prototype, Backbone.relationalHelper);
    model = new House();
    sinon.spy(model, 'get');
    try {
      model.get('occupants');
    }
    catch (e) {
      if (CollectionType_WITHOUT_RelatedModel !== e.message) {
        throw e;
      }
    }

    expect(model.get).to.have.thrown('Error');
  });

  it('should throw if called without collectionType and relatedModel', function () {
    House = Backbone.Model.extend({
      relations: {
        'occupants': {
          type: 'many'
        }
      }
    });
    _.extend(House.prototype, Backbone.relationalHelper);
    model = new House();
    sinon.spy(model, 'get');
    try {
      model.get('occupants');
    }
    catch (e) {
      if (YOU_MUST_SPE_CollectionType_ANDOR_RelatedModel !== e.message) {
        throw e;
      }
    }
    expect(model.get).to.have.thrown('Error');
  });
});

describe('Relational Helper: type of initial objects', function () {

  it('house should be an instance of Backbone Model', function () {
    var house = new data.House();
    expect(house).to.be.an.instanceof(Backbone.Model);
  });

  it('user should be an instance of Backbone Model', function () {
    var user = new data.User();
    expect(user).to.be.an.instanceof(Backbone.Model);
  });

  it('person should be an instance of Backbone Model', function () {
    var person = new data.Person();
    expect(person).to.be.an.instanceof(Backbone.Model);
  });

  it('password should be an instance of Backbone Model', function () {
    var password = new data.Password();
    expect(password).to.be.an.instanceof(Backbone.Model);
  });

  it('job should be an instance of Backbone Model', function () {
    var job = new data.Job();
    expect(job).to.be.an.instanceof(Backbone.Model);
  });

  it('company should be an instance of Backbone Model', function () {
    var company = new data.Company();
    expect(company).to.be.an.instanceof(Backbone.Model);
  });

});

describe('Relational Helper: type of relations', function () {

  it('house.get("occupants") should be an instance of Backbone Collection', function () {
    var house = new data.House();
    expect(house.get('occupants')).to.be.an.instanceof(Backbone.Collection);
  });

  it('person.get("likesALot") should be an instance of Backbone Model', function () {
    var person = new data.Person();
    expect(person.get('likesALot')).to.be.an.instanceof(Backbone.Model);
  });

  it('person.get("user") should be an instance of Backbone Model', function () {
    var person = new data.Person();
    expect(person.get('likesALot')).to.be.an.instanceof(Backbone.Model);
  });

  it('person.get("jobs") should be an instance of Backbone Model', function () {
    var person = new data.Person();
    expect(person.get('likesALot')).to.be.an.instanceof(Backbone.Model);
  });

  it('password.get("user"); should be an instance of Backbone Model', function () {
    var password = new data.Password();
    expect(password.get('user')).to.be.an.instanceof(Backbone.Model);
  });

  it('company.get("ceo") should be an instance of Backbone Model', function () {
    var company = new data.Company();
    expect(company.get('ceo')).to.be.an.instanceof(Backbone.Model);
  });

  it('company.get("employees") should be an instance of Backbone Collection', function () {
    var company = new data.Company();
    expect(company.get('employees')).to.be.an.instanceof(Backbone.Collection);
  });

});

describe('Relational Helper: type of sub-relations', function () {
  var house;
  before(function () {
    house = new data.House({
      street: 'Rue Montoyer 75',
      occupants: [
        {
          firstName: 'John',
          lastName: 'Doe',
          user: {
            email: 'email1@eurparl.eu'
          },
          jobs: [
            {
              startDate: '2002-01-01',
              endDate: '2004-05-30'
            },
            {
              startDate: '2004-11-01',
              endDate: '2008-10-31'
            }
          ]
        },
        {
          firstName: 'Jane',
          lastName: 'Doo',
          user: {
            email: 'email2@eurparl.eu'
          }
        }
      ]
    });
  });

  it('house.get("occupants").length should be equal 2', function () {
    expect(house.get('occupants').length).to.equal(2);
  });

  it('Each occupants should be an instance of Person', function () {
    expect(house.get('occupants').at(0)).to.be.an.instanceof(data.Person);
    expect(house.get('occupants').at(1)).to.be.an.instanceof(data.Person);
  });

  it('house.get("occupants").at(0).get("user") should be an instance of User', function () {
    expect(house.get('occupants').at(0).get('user')).to.be.an.instanceof(data.User);
  });

  it('house.get("occupants").at(0).get("jobs") should be an instance of Backbone Collection', function () {
    expect(house.get('occupants').at(0).get('jobs')).to.be.an.instanceof(Backbone.Collection);
  });

  it('Each item of jobs should be an instance of Job Model', function () {
    house.get('occupants').at(0).get('jobs').each(function(item){
      expect(item).to.be.an.instanceof(data.Job);
    });
  });

  it('house.get("occupants").at(0).get("jobs").at(0).get("startDate") should be equal "2002-01-01"', function () {
    expect(house.get('occupants').at(0).get('jobs').at(0).get('startDate')).to.equal('2002-01-01');
  });

});
