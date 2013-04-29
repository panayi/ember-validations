var get = Ember.get, set = Ember.set;

/**
   @class

   This mixin is used to handle validations on ember objects.

   If you are implementing an object and want it to support validations, just include
   this mixin in your object and set the `validations` property.


   Here is an example of an object using validations :

       Ember.Object.create(Ember.Validations, {
         validations: {
           name: {presence: true}
         }
       });

   When calling the `validate` method on the object above, the method `validate` of the
   `Ember.Validators.PresenceValidator` is called, and add error messages if the `name`
   of the object is not present.

   Options can be passed to the validator, as shown in this example :

       Ember.Object.create(Ember.Validations, {
         validations: {
           name: {
             length: {
               moreThan: 3,
               lessThan: 10
             }
           }
         }
       });

   You could also set custom validations and pass options, like in this example :

       Ember.Object.create(Ember.Validations, {
         validations: {
           amount: {
             aCustomValidation: {
               validator: MyApp.CustomValidator,
               options: {
                 isNumber: true,
                 otherOption: 12
               }
             }
           }
         }
       });

   Or even directly set the validation function :

       Ember.Object.create(Ember.Validations, {
         validations: {
           amount: {
             aCustomValidation: {
               validator: function(obj, attr, value) {
                 var moreThan = this.get('options.moreThan');
                 if (value <= moreThan) {
                   obj.get('validationErrors').add(attr, "should not be falsy");
                 }
               },
               options: {
                 moreThan: 5
               }
             }
           }
         }
       });

   @extends Ember.Mixin
 */
Ember.Validations = Ember.Mixin.create(/**@scope Ember.Validations.prototype */{

  /** @private */
  init: function() {
    this._super();
    if (get(this, 'validationErrors') === undefined) {
      set(this, 'validationErrors', Ember.ValidationErrors.create());
    }

    this._setupAutoValidateObserves();
  },

  /** @private */
  _setupAutoValidateObserves: function() {
    var validations = this.get('validations');
    var validateOnValueChange = this.validateOnValueChange;
    var validateOnFocusOut = this.validateOnFocusOut;
    var observerKey;

    for (property in validations) {
      if (validateOnValueChange) {
        observerKey = '_observer' + property + '_value_change';
        if (!this[observerKey]) {
          this[observerKey] = Ember.addObserver(this, property, this, '_onValueChangeValidateAttribute');
        }
      }

      if (validateOnFocusOut) {
        var key = property + 'shouldValidate';
        observerKey = '_observer' + property + '_focus_out';
        if (!this[observerKey]) {
          this[observerKey] = Ember.addObserver(this, key, this, '_onFocusOutValidateAttribute');
        }
      }
    }
  }.observes('validations'),

  /** @private */
  _onValueChangeValidateAttribute: function(target, property) {
    var shouldValidatePath = property + 'shouldValidate';

    if (this.get(shouldValidatePath) || this._didValidateAllOnce) {
      this.validateProperty(property);
    }
  },

  _onFocusOutValidateAttribute: function(target, shouldValidatePath) {
    var property = shouldValidatePath.replace('shouldValidate', '');

    if (this.get(shouldValidatePath) || this._didValidateAllOnce) {
      this.validateProperty(property);
    }
  },

  /**
     Method used to verify that the object is valid, according to the `validations`
     hash.

     @returns {Boolean} true if the object if valid
  */
  validate: function() {
    this._didValidateAllOnce = true;

    var validations = get(this, 'validations'),
        errors = get(this, 'validationErrors');

    this.propertyWillChange('validationErrors');

    errors.clear();

    for (var attribute in validations) {
      if (!validations.hasOwnProperty(attribute)) continue;
      this._validateProperty(attribute);
    }

    this.propertyDidChange('validationErrors');
    return get(this, 'isValid');
  },

  /**
     Method used to verify that a property is valid, according to the `validations`
     hash.

     @returns {Boolean} true if the property is valid
   */
  validateProperty: function(attribute) {
    this.propertyWillChange('validationErrors');
    var isValid = this._validateProperty(attribute);
    this.propertyDidChange('validationErrors');
    return isValid;
  },

  /** @private */
  _validateProperty: function(attribute) {
    var validations = get(this, 'validations'),
        errors = get(this, 'validationErrors');

    errors.remove(attribute);

    var attributeValidations = validations[attribute];
    for (var validationName in attributeValidations) {
      if (!attributeValidations.hasOwnProperty(validationName)) continue;

      var options = attributeValidations[validationName];
      var validator = Ember.Validators.getValidator(validationName, options);
      validator.validate(this, attribute, this.get(attribute));
    }

    var isValid = !get(this, 'validationErrors.' + attribute + '.length');
    return isValid;
  },

  /**
     Property updated when calling `validate()` or `validateProperty()`.
     True when the object is valid.
   */
  isValid: Ember.computed(function() {
    return get(this, 'validationErrors.length') === 0;
  }).property('validationErrors.length').cacheable()
});