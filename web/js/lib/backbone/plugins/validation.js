// Backbone.Validation v0.5.2
//
// Copyright (C)2011-2012 Thomas Pedersen
// Distributed under MIT License
//
// Documentation and full license available at:
// http://thedersen.github.com/backbone.validation

// Note: we require our Backbone+LayoutManager ('../_bootstrap') module instead of the original, vanilla Backbone

define(function(require, undefined) {
  'use strict';

  var $, _, Backbone;

  $ = require('jquery');
  _ = require('underscore');
  Backbone = require('../_bootstrap');

  var defaultOptions = {
    forceUpdate: true,
    selector: 'box_'
  };

  function getValidatedAttrs(model) {
    return _.reduce(_.keys(model.validation), function(memo, key) {
      memo[key] = undefined;
      return memo;
    }, {});
  }

  function getValidators(model, validation, attr) {
    var attrValidation = validation[attr] || {};

    if (_.isFunction(attrValidation)) {
      return attrValidation;
    } else if (_.isString(attrValidation)) {
      return model[attrValidation];
    } else if (!_.isArray(attrValidation)) {
      attrValidation = [attrValidation];
    }

    return _.reduce(attrValidation, function(memo, attrValidation) {
      _.each(_.without(_.keys(attrValidation), 'msg'), function(validator) {
        memo.push({
          fn: Backbone.Validation.validators[validator],
          val: attrValidation[validator],
          msg: attrValidation.msg
        });
      });
      return memo;
    }, []);
  }

  function hasChildValidaton(validation, attr) {
    return _.isObject(validation) && _.isObject(validation[attr]) && _.isObject(validation[attr].validation);
  }

  // jshint -W072: This function has too many parameters.
  function validateAttr(model, validation, attr, value, computed, validators) {
    validators = validators || getValidators(model, validation, attr);
    if (_.isFunction(validators)) {
      return validators.call(model, value, attr, computed);
    }

    return _.reduce(validators, function(memo, validator) {
      var result = validator.fn.call(Backbone.Validation.validators, value, attr, validator.val, model, computed);
      if (result === false || memo === false) {
        return false;
      }
      if (result && !memo) {
        return validator.msg || result;
      }
      return memo;
    }, '');
  }

  // jshint +W072

  // jshint -W072: This function has too many parameters.
  function validateObject(model, validation, attrs, options, attrPath) {

    attrPath = attrPath || '';
    var result, error, changedAttr,
      errorMessages = [],
      invalidAttrs = [],
      isValid = true,
      computed = _.extend(model.toJSON(), attrs);

    for (changedAttr in attrs) {
      var validators = getValidators(model, validation, changedAttr);
      if (!_.isEmpty(validators)) {
        errorMessages = [];
        error = validateAttr(model, validation, changedAttr, attrs[changedAttr], computed, validators);
        if (error) {
          errorMessages.push(error);
          invalidAttrs.push(attrPath + changedAttr);
          isValid = false;
          //triggerInvalid(model, changedAttr, error);
        } else {
          // if(view){
          triggerValid(model, changedAttr, error);
          //options.valid(view, changedAttr, options.selector);
          // }
        }

        if (error !== false && hasChildValidaton(validation, changedAttr)) {

          result = validateObject(model, validation[changedAttr].validation, attrs[changedAttr], options,
            attrPath + changedAttr + '.');

          Array.prototype.push.apply(errorMessages, result.errorMessages);
          Array.prototype.push.apply(invalidAttrs, result.invalidAttrs);
          isValid = isValid && result.isValid;
        }
        if (errorMessages.length > 0) {
          triggerInvalid(model, changedAttr, errorMessages);
        }
      }
    }
    // jshint +W072

    return {
      errorMessages: errorMessages,
      invalidAttrs: invalidAttrs,
      isValid: isValid
    };
  }

  function triggerInvalid(model, attr, error) {
    model.trigger('invalid', attr, error);
    model.trigger('invalid:' + attr, attr, error, {validatedModel: model});
  }

  function triggerValid(model, attr) {
    model.trigger('valid', attr);
    model.trigger('valid:' + attr, attr, {validatedModel: model});
  }

  function mixin(options) {
    return {
      isValid: function(option) {
        if (_.isString(option)) {
          return !validateAttr(this, this.validation, option, this.get(option), this.toJSON());
        }
        if (_.isArray(option)) {
          for (var i = 0; i < option.length; i++) {
            if (validateAttr(this, this.validation, option[i], this.get(option[i]), this.toJSON())) {
              return false;
            }
          }
          return true;
        }
        if (option === true) {
          this.validate();
        }
        return this.validation ? this._isValid : true;
      },
      validate: function(attrs, setOptions) {
        var model = this,
          opt = _.extend({}, options, setOptions);

        if (!attrs) {
          return model.validate.call(model, _.extend(getValidatedAttrs(model), model.toJSON()));
        }

        var result = validateObject(model, model.validation, attrs, opt);
        model._isValid = result.isValid;

        _.defer(function() {
          model.trigger('validated', model._isValid, model, result.invalidAttrs);
          model.trigger('validated:' + (model._isValid ? 'valid' : 'invalid'), model, result.invalidAttrs);
        });

        if (!opt.forceUpdate && result.errorMessages.length > 0) {
          return result.errorMessages;
        }
      }
    };
  }

  function isValidDate(format, text) {
    try {
      $.datepicker.parseDate(format, text);
      return true;
    }
    catch (exc) {
      var regExp = /\d{2}-\d{2}-\d{4} (\d{2}):(\d{2})/;
      if (!_.isEmpty(text) && regExp.test(text)) {
        var match = regExp.exec(text);
        if (0 <= parseInt(stripLeadingZero(match[1]), 10) <= 23 && 0 <= parseInt(stripLeadingZero(match[2]), 10) <= 59) {
          return isValidDate(format.substr(0, 8), text.substr(0, 10));
        }
      }
      return false;
    }
  }

  function stripLeadingZero(text) {
    if (/0\d/.test(text)) {
      return text.substr(1);
    }
    return text;
  }

  Backbone.Validation = {
    version: '0.5.2',

    configure: function(options) {
      _.extend(defaultOptions, options);
    },

    launchValidation: function(model, parent) {
      var isValidModel = true;
      if (_.isUndefined(model.noValidateModel) || model.noValidateModel()) {
        var self = this;

        if (model) {
          if (model.validation) {
            isValidModel = validateObject(model, model.validation, model.attributes, model.toJSON()).isValid;
          }
          if (isValidModel) {
            model.trigger('validModel');
          }
          _.each(model.attributes, function(attr) {
            var isValidCollection = self.launchModelAndCollectionValidation(attr);
            if (isValidModel) {
              isValidModel = isValidCollection;
            }
          });
          if (!isValidModel && parent) {
            model.trigger('invalid');
          }
          if (isValidModel) {
            model.trigger('validModel');
          }
        }
      }
      return isValidModel;
    },

    launchModelAndCollectionValidation: function(attr) {
      var self = this;
      var isValidModel = true;
      if (attr && attr.models) {
        //Si .models -> Collection backbone
        _.each(attr.models, function(modelCollec) {
          var validTmp = true;
          validTmp = self.launchValidation(modelCollec, attr);
          if (isValidModel) {
            isValidModel = validTmp;
          }
        });
      }
      if (attr && attr.attributes) {
        //Si .attribute -> Model backbone
        if (attr.validation) {
          isValidModel = self.launchValidation(attr);
        }
      }
      return isValidModel;
    },

    mixin: mixin(null, defaultOptions)
  };

  Backbone.Validation.callbacks = {
    valid: function(view, attr, selector) {
      var domElement = view.$('#' + selector + attr);
      domElement.removeClass('cms_error');
      domElement.find('ul').children().remove();
    },

    invalid: function(view, attr, error, selector) {
      var domElement = view.$('#' + selector + attr);
      domElement.find('ul').append('<li>' + error + '</li>');
      domElement.find('.cms_errorlist').attr('style', 'display: block;');
      domElement.addClass('cms_error');
    }
  };

  // jshint -W101
  Backbone.Validation.patterns = {
    hour: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    digits: /^\d+$/,
    number: /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/,
    email: /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i,
    url: /^(https?:\/\/|\/)(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i,
    urlWithEpBow: /^(https?:\/\/|\/)(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|\[|\]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i
    //urlWithEpBow is only used for the product PCT
  };
  // jshint +W101

  Backbone.Validation.messages = {
    required: '{0} is required',
    acceptance: '{0} must be accepted',
    min: '{0} must be grater than or equal to {1}',
    max: '{0} must be less than or equal to {1}',
    range: '{0} must be between {1} and {2}',
    length: '{0} must be {1} characters',
    minLength: '{0} must be at least {1} characters',
    maxLength: '{0} must be at most {1} characters',
    rangeLength: '{0} must be between {1} and {2} characters',
    oneOf: '{0} must be one of: {1}',
    equalTo: '{0} must be the same as {1}',
    pattern: '{0} must be a valid {1}',
    object: '{0} must be an object',
    date: '{0} must be a date'
  };

  Backbone.Validation.ViewMixin = {

    showError: function(attribute, message) {
      var elem = this.$('.dev_' + attribute + '_block');
      elem.addClass('cms_error');
      elem.find('div.cms_error > span').remove();
      elem.find('div.cms_error').append('<span>' + message + '</span>');
    },

    hideError: function(attribute) {
      var elem = this.$('.dev_' + attribute + '_block');
      elem.removeClass('cms_error');
      elem.find('div.cms_error > span').remove();
    },

    renderError: function(attribute, message) {
      this.$('div.cms_data').addClass('cms_error');
      this.$('div.dev_error > span').remove();
      this.$('div.dev_error').append('<span>' + message + '</span>');
    },

    clearError: function() {
      this.$('div.cms_data').removeClass('cms_error');
      this.$('div.dev_error > span').remove();
    },

    /*
     The following functions are intended to be used to display validation error message regarding distinct attribute
     withing a same view
     */
    renderAttributeError: function(attribute, message) {
      this.$('div.cms_data.dev_' + attribute).addClass('cms_error');
      this.$('div.dev_error.dev_' + attribute + ' > span').remove();
      this.$('div.dev_error.dev_' + attribute).append('<span>' + message + '</span>');
    },

    clearAttributeError: function(attribute) {
      this.$('div.cms_data.dev_' + attribute).removeClass('cms_error');
      this.$('div.dev_error.dev_' + attribute + ' > span').remove();
    },

    clearAutoErrorMessage: function(event) {
      var divBox = $(event.currentTarget);
      var count = 0;
      while (count < 5 && !this.hasClassContains(divBox)) {
        if (divBox.parent()) {
          divBox = divBox.parent();
        } else {
          break;
        }
        count++;
      }
      this.clearErrorMessage(divBox);
    },

    clearErrorMessage: function(divBox) {
      if (divBox.hasClass('cms_error')) {
        divBox.removeClass('cms_error');
        divBox.find('textarea').removeClass('dev_error');
        divBox.find('.dev_error > span').remove();
      }
    },

    hasClassContains: function(divBox) {
      var stopPropagationClass = ['cms_error', 'cms_element', 'cms_data', 'cms_description', 'cms_code'];
      for (var i = 0; i < stopPropagationClass.length; i++) {
        if (divBox.hasClass(stopPropagationClass[i])) {
          return true;
        }
      }
      return false;
    },
  };

  Backbone.Validation.ModelMixin = {

    validateModel: function() {
      this.trigger('validateModel');
      var validated = Backbone.Validation.launchValidation(this);
      this.trigger('validateModelCompleted');

      return validated;

    }
  };

  Backbone.Validation.validators = (function(patterns, messages, _) {
    var trim = String.prototype.trim ?
      function(text) {
        return text === null ? '' : String.prototype.trim.call(text);
      } :
      function(text) {
        var trimLeft = /^\s+/,
          trimRight = /\s+$/;

        return text === null ? '' : text.toString().replace(trimLeft, '').replace(trimRight, '');
      };

    function format() {
      var args = Array.prototype.slice.call(arguments);
      var text = args.shift();
      return text.replace(/\{(\d+)\}/g, function(match, number) {
        return typeof args[number] !== 'undefined' ? args[number] : match;
      });
    }

    function isNumber(value) {
      return _.isNumber(value) || (_.isString(value) && value.match(patterns.number));
    }

    function hasValue(value) {
      return !( _.isUndefined(value) || _.isNull(value) || (_.isString(value) && trim(value) === '') ||
        (_.isArray(value) && _.isEmpty(value)) || (value.length === 0));
    }

    return {
      // jshint -W072:  This function has too many parameters.
      fn: function(value, attr, fn, model, computed) {
        if (_.isString(fn)) {
          fn = model[fn];
        }
        return fn.call(model, value, attr, computed);
      },
      // jshint +W072

      required: function(value, attr, required, model) {
        var isRequired = _.isFunction(required) ? required.call(model) : required;
        if (!isRequired && !hasValue(value)) {
          return false; // overrides all other validators
        }
        if (isRequired && !hasValue(value)) {
          return format(messages.required, attr);
        }
      },
      acceptance: function(value, attr) {
        if (value !== 'true' && (!_.isBoolean(value) || value === false)) {
          return format(messages.acceptance, attr);
        }
      },
      min: function(value, attr, minValue) {
        if (!isNumber(value) || value < minValue) {
          return format(messages.min, attr, minValue);
        }
      },
      max: function(value, attr, maxValue) {
        if (!isNumber(value) || value > maxValue) {
          return format(messages.max, attr, maxValue);
        }
      },
      range: function(value, attr, range) {
        if (!isNumber(value) || value < range[0] || value > range[1]) {
          return format(messages.range, attr, range[0], range[1]);
        }
      },
      length: function(value, attr, length) {
        if (!hasValue(value) || trim(value).length !== length) {
          return format(messages.length, attr, length);
        }
      },
      minLength: function(value, attr, minLength) {
        if (trim(value).length < minLength) {
          return format(messages.minLength, attr, minLength);
        }
      },
      maxLength: function(value, attr, maxLength) {
        //No trim here -> ENG-8248
        if (value && value.length > maxLength) {
          return format(messages.maxLength, attr, maxLength);
        }
      },
      rangeLength: function(value, attr, range) {
        if (!hasValue(value) || trim(value).length < range[0] || trim(value).length > range[1]) {
          return format(messages.rangeLength, attr, range[0], range[1]);
        }
      },
      oneOf: function(value, attr, values) {
        if (!_.include(values, value)) {
          return format(messages.oneOf, attr, values.join(', '));
        }
      },
      // jshint -W072:  This function has too many parameters.
      equalTo: function(value, attr, equalTo, model, computed) {
        if (value !== computed[equalTo]) {
          return format(messages.equalTo, attr, equalTo);
        }
      },
      // jshint +W072

      pattern: function(value, attr, pattern) {
        if (!hasValue(value) || !value.toString().match(patterns[pattern] || pattern)) {
          return format(messages.pattern, attr, pattern);
        }
      },
      validation: function(value, attr) {
        if (!_.isObject(value)) {
          return format(messages.object, attr);
        }
      },
      date: function(value, attr, customPattern) {
        if (!_.isEmpty(value) && !isValidDate(customPattern || 'dd-mm-yy', value)) {
          return format(messages.date, attr);
        }
      }
    };
  }(Backbone.Validation.patterns, Backbone.Validation.messages, _));

  Backbone.Validation.Model = Backbone.Model.extend({

    validateModel: function() {
      this.trigger('validateModel');
      var validated = Backbone.Validation.launchValidation(this);
      this.trigger('validateModelCompleted');

      return validated;

    }
  });

  Backbone.Validation.View = Backbone.View.extend({

    invalid: function(field, error) {
      //Permet de nettoyer les anciens message d'erreur avant d'afficher les nouveaux messages d'erreurs
      this.valid(field);
      var ulErrorBox = this.$el.find('.dev_error:not(textarea)');
      var divBox = this.getDivBoxView(field, ulErrorBox.length);
      this.displayErrorMessage(divBox, error);
    },

    valid: function(field) {
      var ulErrorBox = this.$el.find('.dev_error');
      var divBox = this.getDivBoxView(field, ulErrorBox.length);
      this.clearErrorMessage(divBox);
    },

    getDivBoxView: function(field, numberUlIntoView) {
      var divBox = this.$el.find('.cms_data_dev');
      if (!divBox.html()) {
        divBox = this.$el.find('.cms_data');
      }
      if (numberUlIntoView > 1) {
        //Si plusieurs ul, alors on a plusieurs champs dans la vue, on va  selectionner celui concernee par l'erreur -> field
        divBox = this.$('*[id^=\'box_' + field + '\']');
      }
      if (divBox.html()) {
        return divBox;
      }
      else {
        return this.$el;
      }
    },

    clearErrorMessage: function(divBox) {
      if (divBox.hasClass('cms_error')) {
        divBox.removeClass('cms_error');
        divBox.find('textarea').removeClass('dev_error');
        divBox.find('.dev_error > span').remove();
      }
    },

    clearAutoErrorMessage: function(event) {
      var divBox = $(event.currentTarget);
      //Compteur permettant de ne pas remonter a plus de 5 parent
      // (largement suffisant pour retrouver la box contenant le div error)
      var count = 0;
      while (count < 5 && !this.hasClassContains(divBox)) {
        if (divBox.parent()) {
          divBox = divBox.parent();
        } else {
          break;
        }
        count++;
      }
      this.clearErrorMessage(divBox);
    },

    hasClassContains: function(divBox) {
      var stopPropagationClass = ['cms_error', 'cms_element', 'cms_data', 'cms_description', 'cms_code'];
      for (var i = 0; i < stopPropagationClass.length; i++) {
        if (divBox.hasClass(stopPropagationClass[i])) {
          return true;
        }
      }
      return false;
    },

    displayErrorMessage: function(divBox, errors) {
      var ulErrorBox = divBox.find('.dev_error');
      divBox.addClass('cms_error');
      divBox.find('textarea').addClass('dev_error');
      _.each(errors, function(error) {
        var alreadyDisplay = false;
        _.each(ulErrorBox.find('span'), function(li) {
          //On affiche que si le message n existe pas deja
          if (li.textContent === error) {
            alreadyDisplay = true;
          }
        });
        if (!alreadyDisplay) {
          ulErrorBox.append('<span>' + error + '</span>');
        }
      });
    },

    showView: function() {
      this.$el.show();
    },

    hideView: function() {
      this.$el.hide();
    }
  });

});


