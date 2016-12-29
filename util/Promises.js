/*global _*/
sap.ui.define([
	"jquery.sap.global",
	"sap/m/MessageBox"
], function(
	jQuery,
	MessageBox
) {
	"use strict";

	var Promises = {

		pServiceMetadataLoaded: function() {
			// check if service metadata loaded in model, else refresh metadata first
			// return new Promise(function(fnResolve, fnReject) {
			return Q.Promise(function(fnResolve, fnReject) {
				var oModel = sap.ui.getCore()
					.getModel();
				var oMetaData = oModel.getServiceMetadata();
				if (oMetaData) {
					fnResolve();
				} else {
					return oModel.refreshMetadata();
				}
			});
		},

		pEntityContextRead: function(sEntityPath) {
			// check if data available in model, else fetch data first
			// return new Promise(function(fnResolve, fnReject) {
			return Q.Promise(function(fnResolve, fnReject) {
				var oModel = sap.ui.getCore()
					.getModel();
				oModel.metadataLoaded()
					.then(function() {
						var oEntityContext = oModel.getContext(sEntityPath);
						if (oEntityContext) {
							fnResolve(oEntityContext);
						} else {
							oModel.read(sEntityPath, {
								success: function() {
									oEntityContext = oModel.getContext(sEntityPath);
									if (oEntityContext) {
										fnResolve(oEntityContext);
									} else {
										var oBundle = sap.ui.getCore()
											.getModel("i18n")
											.getResourceBundle();
										fnReject({
											message: oBundle.getText("app.words.entity_not_found_for_path", [sEntityPath])
										});
									}
								},
								error: function(oError) {
									fnReject(oError);
								}
							});
						}
					})
					.catch(function(oError) {
						fnReject(oError);
					});
			});
		},

		pPendingChangesChecked: function() {
			var oModel = sap.ui.getCore()
				.getModel();
			// prepare promise for model changes checked
			return Q.Promise(function(fnResolve, fnReject) {
				if (oModel.hasPendingChanges()) {
					var oBundle = sap.ui.getCore()
						.getModel("i18n")
						.getResourceBundle();
					MessageBox.show(oBundle.getText("app.words.continue_without_saving"), {
						icon: MessageBox.Icon.WARNING,
						title: oBundle.getText("app.label.unsaved_changes"),
						actions: [
							MessageBox.Action.CANCEL,
							MessageBox.Action.OK
						],
						onClose: function(oAction) {
							if (oAction === MessageBox.Action.OK) {
								oModel.resetChanges();
								fnResolve();
							} else {
								fnReject();
							}
						}
					});
				} else {
					fnResolve();
				}
			});
		},

		pModelFunctionCalled: function(sFunctionName, sMethod, oUrlParameters) {
			var oModel = sap.ui.getCore()
				.getModel();
			// prepare promise for service function call
			return Q.Promise(function(fnResolve, fnReject) {
				// call the function
				oModel.callFunction(sFunctionName, {
					method: sMethod,
					urlParameters:oUrlParameters,
					success: function(oData) {
						fnResolve(oData);
					},
					error: function(oError) {
						fnReject(oError);
					}
				});
			});
		},

		pModelChangesSubmitted: function() {
			var oModel = sap.ui.getCore()
				.getModel();
			// prepare promise for model changes submission
			return Q.Promise(function(fnResolve, fnReject) {
				// submit model changes
				oModel.submitChanges({
					success: function(oData) {
						fnResolve(oData);
					},
					error: function(oError) {
						fnReject(oError);
					}
				});
			});
		}

	};

	return Promises;
});