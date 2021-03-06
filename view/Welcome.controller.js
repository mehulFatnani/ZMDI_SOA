sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"mdi/crm/soa/util/Constants",
	"mdi/crm/soa/util/Statics"
], function(
	jQuery, 
	Controller, 
	UIComponent, 
	MDIConstants,
	MDIStatics
) {
	"use strict";

	return Controller.extend("mdi.crm.soa.view.Welcome", {
		_oRoutingParams: {},
		
		onInit: function() {
			MDIStatics.setFunctionGroupingObjectContext(this);
			// this._getRouter()
			// 	.attachRouteMatched(this.onRouteMatched, this);
		},
		
		onRouteMatched: function(oEvent) {
			var oParameters = oEvent.getParameters();
			/*
			// extract routing parameters
			this._oRoutingParams = {};
			if (oParameters.arguments.SomeParam) {
				this._oRoutingParams.SomeParam = oParameters.arguments.SomeParam;
			}
			*/
			// var oBundle = MDIStatics.getResourceBundle();
			// switch (oParameters.name) {
			// 	case MDIConstants.ROUTE_NAME_HOME:
			// 		this.byId("welcomeMessagePage")
			// 			.setText(oBundle.getText("welcome.words.select_an_feedback"));
			// 		this.byId("welcomeMessagePage")
			// 			.setIcon("sap-icon://business-card");
			// 		break;
			// 	default:
			// }
		},

		/**
		 * ###################
		 * DYNAMIC REUSABLE UI
		 * ###################
		 */
		_Dynamics: {},

		/**
		 * ################
		 * HELPER FUNCTIONS
		 * ################
		 */
		_Helpers: {
			navHistoryBack: function() {
				// this._getRouter()
				// 	.navTo(MDIConstants.ROUTE_NAME_HOME, {} , true);
				this._getRouter().getTargets().display(MDIConstants.ROUTE_NAME_HOME);
			}
		},

		/**
		 * ##########
		 * FORMATTERS
		 * ##########
		 */
		_Formatters: {},

		/**
		 * ##############
		 * EVENT HANDLERS
		 * ##############
		 */
		onNavBack: function(oEvent) {
			this._Helpers.navHistoryBack();
		},

		onExit: function(oEvent) {},

		/**
		 * ###################
		 * CONVENIENCE GETTERS
		 * ###################
		 */
		_getContextPath: function() {
			var oContext = this.getView()
				.getBindingContext();
			if (oContext) {
				return oContext.getPath();
			} else {
				return null;
			}
		},

		_getRouter: function() {
			return UIComponent.getRouterFor(this);
		}
		
	});

});