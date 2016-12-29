/*global _*/
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/message/ControlMessageProcessor",
	"sap/ui/core/message/Message",
	"sap/ui/core/MessageType",
	"sap/m/MessageBox"
], function(
	jQuery, 
	JSONModel,
	ControlMessageProcessor,
	Message,
	MessageType,
	MessageBox
) {
	"use strict";

	var Statics = {
		_oSharedModel: new JSONModel({}),

		getModel: function() {
			return sap.ui.getCore()
				.getModel();
		},

		getResourceBundle: function() {
			return sap.ui.getCore()
				.getModel("i18n")
				.getResourceBundle();
		},

		getEventBus: function() {
			return sap.ui.getCore()
				.getEventBus();
		},

		getSharedModel: function() {
			if (!sap.ui.getCore()
				.getModel("sharedModel")) {
				sap.ui.getCore()
					.setModel(this._oSharedModel, "sharedModel");
				this._oSharedModel.setProperty("/EditMode", {
					IsEditing: false,
					IsNotEditing: true
				});
			}
			return this._oSharedModel;
		},

		setFunctionGroupingObjectContext: function(theContext) {
			// change scope of "this" in each function grouping object
			if ($.isPlainObject(theContext._Dynamics)) {
				var _Dynamics = theContext._Dynamics;
				theContext._Dynamics = new function() {};
				$.map(_Dynamics, function(oProperty, sKey) {
					if ($.isFunction(oProperty)) {
						theContext._Dynamics[sKey] = $.proxy(oProperty, theContext);
					} else {
						theContext._Dynamics[sKey] = oProperty;
					}
				});
			}
			if ($.isPlainObject(theContext._Helpers)) {
				var _Helpers = theContext._Helpers;
				theContext._Helpers = new function() {};
				$.map(_Helpers, function(oProperty, sKey) {
					if ($.isFunction(oProperty)) {
						theContext._Helpers[sKey] = $.proxy(oProperty, theContext);
					} else {
						theContext._Helpers[sKey] = oProperty;
					}
				});
			}
			if ($.isPlainObject(theContext._Formatters)) {
				var _Formatters = theContext._Formatters;
				theContext._Formatters = new function() {};
				$.map(_Formatters, function(oProperty, sKey) {
					if ($.isFunction(oProperty)) {
						theContext._Formatters[sKey] = $.proxy(oProperty, theContext);
					} else {
						theContext._Formatters[sKey] = oProperty;
					}
				});
			}
			if ($.isPlainObject(theContext._Promises)) {
				var _Promises = theContext._Promises;
				theContext._Promises = new function() {};
				$.map(_Promises, function(oProperty, sKey) {
					if ($.isFunction(oProperty)) {
						theContext._Promises[sKey] = $.proxy(oProperty, theContext);
					} else {
						theContext._Promises[sKey] = oProperty;
					}
				});
			}
		},

		onValidateFieldGroup: function(oEvent) {
			var aFieldGroupIds = oEvent.getParameters()
				.fieldGroupIds;
			aFieldGroupIds.forEach($.proxy(function(sFieldGroupId) {
				var oValidation = this.validateFieldGroup(sFieldGroupId);
				if (oValidation && oValidation.didValidateFieldGroup) {
					oEvent.bCancelBubble = true; //stop bubbling to the parent control
				}
			}, this));
		},

		validateFieldGroups: function(oFieldGroups) {
			var aValidations = _.map(_.keys(oFieldGroups), $.proxy(function(sFieldGroupId) {
				return this.validateFieldGroup(sFieldGroupId, oFieldGroups[sFieldGroupId]);
			}, this));
			return _.reduce(aValidations, function(bDidAllValidateOK, oValidation) {
				var bDidValidateOK = oValidation.hasFailures ? false : true;
				return (bDidAllValidateOK && bDidValidateOK);
			}, true);
		},
		
		validateFieldGroup: function(sFieldGroupId, aItems) {
			var oValidation = {}, aControls = [];
			var oBundle = sap.ui.getCore()
				.getModel("i18n")
				.getResourceBundle();

			if (_.isArray(aItems)) {
				aItems.forEach(function(oItem) {
					aControls = aControls.concat(oItem.getControlsByFieldGroupId(sFieldGroupId));
				});
			} else {
				aControls = sap.ui.getCore()
					.byFieldGroupId(sFieldGroupId);
			}
			aControls.forEach(function(oControl) {
				// for smartfield controls we can call checkClientError()
				if (_.isFunction(oControl.checkClientError) && oControl.checkClientError()) {
					oValidation.hasFailures = true;
				}
				if (_.isFunction(oControl.getValue)) {
					// else check control value is not empty
					if (!oControl.getValue()) {
						// use custom data with the required field text specified on the control,
						// else use generic "entry is required" text
						var sMessage = oControl.data("requiredText") || oBundle.getText("validate.required.entry");
						oControl.setValueStateText(sMessage);
						oControl.setValueState("Error");
						// // add new message for control via message processor
						// var oMessageProcessor = new ControlMessageProcessor();
						// var oMessageManager  = sap.ui.getCore().getMessageManager();
						// oMessageManager.registerMessageProcessor(oMessageProcessor);
						// oMessageManager.addMessages(
						//     new Message({
						//         message: sMessage,
						//         type: MessageType.Error,
						//         target: oControl.getId() + "/value",
						//         processor: oMessageProcessor
						//      })
						// );
						oValidation.hasFailures = true;
					} else {
						oControl.setValueState("None");
						oControl.setValueStateText(null);
					}
				}
				oValidation.didValidateFieldGroup = true;
			});
			return oValidation;
		}

	};

	return Statics;
});