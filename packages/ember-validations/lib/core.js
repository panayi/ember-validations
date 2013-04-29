// Extend control views to detect when a user leaves an input
// Used by validator to automatically validate an attribute, once the user leaves the input field
[Ember.TextField, Ember.TextArea, Ember.Select, Ember.Checkbox].forEach(function(klass) {
	klass.reopen({
		focusIn: function() {
			this.set('_didFocusIn', true);
			this._super();
		},

		focusOut: function() {
			this.set('_didFocusOut', true);
		},

		_setupShouldValidate: function() {
			if (!this.get('_didFocusIn') || !this.get('_didFocusOut')) {
				return;
			}

			var controller = this.get('controller');
			var binding = this.valueBinding || this.checkedBinding;
			var property = binding && binding._from;

			this.set(property + 'shouldValidate', true);
		}.observes('_didFocusIn', '_didFocusOut')
	});
});