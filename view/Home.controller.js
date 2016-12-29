/*global _*/
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/ui/unified/DateRange",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"mdi/crm/soa/util/Constants",
	"mdi/crm/soa/util/Statics",
	"mdi/crm/soa/util/Promises",
	"mdi/crm/soa/util/Formatter"
], function(
	jQuery,
	Controller,
	UIComponent,
	Device,
	Filter,
	FilterOperator,
	JSONModel,
	DateRange,
	MessageBox,
	MessageToast,
	MDIConstants,
	MDIStatics,
	MDIPromises,
	MDIFormatter
) {
	"use strict";
	return Controller.extend("mdi.crm.soa.view.Home", {
		_oRoutingParams: {},

		onInit: function() {
			MDIStatics.setFunctionGroupingObjectContext(this);
			this._getRouter()
				.attachRoutePatternMatched(this.onRoutePatternMatched, this);
			this._getRouter()
				.attachRouteMatched(this.onRouteMatched, this);
			var oEventBus = MDIStatics.getEventBus();
			var oList = this.byId("list");
			oList.attachEventOnce("updateFinished", function() {
				this._Helpers.selectFirstItem();
				oEventBus.publish("Home", "InitialLoadFinished", {});
			}, this);
			oEventBus.subscribe("Detail", "TabChanged", this.onDetailTabChanged, this);
			oEventBus.subscribe("Detail", "Changed", this.onDetailChanged, this);
			oEventBus.subscribe("Detail", "NotFound", this.onNotFound, this);
			oEventBus.subscribe("Detail", "EditingDone", this.onDetailEditingDone, this);
		},

		onRoutePatternMatched: function(oEvent) {
			var oParameters = oEvent.getParameters();
			if (oParameters.name === MDIConstants.ROUTE_NAME_HOME) {
				if (!Device.system.phone) {
					// load the welcome page on non-phone devices (splitapp behaves like a
					// single nav controller on phones, so the master list has to be shown first)
					// note that this has to happen on the RoutePatternMatched event as this
					// only traps a route actually being matched.
					// intermediate RouteMatched events (such as "home" being loaded as a parent
					// route of "detail", are not trapped by this event)
					this._getRouter()
						.navTo(MDIConstants.ROUTE_NAME_WELCOME);
				}
			}
		},

		onRouteMatched: function(oEvent) {
			var oParameters = oEvent.getParameters();
			if (oParameters.name === MDIConstants.ROUTE_NAME_HOME) {
				this._oRoutingParams.DeliveryId = oParameters.arguments.DeliveryId;
				var oBinding = this._Helpers.getListItemsBinding();
				oBinding.attachEventOnce("dataReceived", function() {
					this._Helpers.selectFirstItem();
				}, this);
			}
		},

		/**
		 * ###################
		 * DYNAMIC REUSABLE UI
		 * ###################
		 */
		_Dynamics: {
			oCalendarPopover: null
		},

		/**
		 * ################
		 * HELPER FUNCTIONS
		 * ################
		 */
		_Helpers: {
			getListItemsBinding: function(filters) {
				var oBinding = this.byId("list")
					.getBinding("items");
				if (!oBinding) {
					// bind items aggregation
					var oTemplate = sap.ui.xmlfragment("mdi.crm.soa.view.fragment.HomeListItemTemplate", this);
					this.byId("list")
						.bindItems({
							path: "/SocAppSet",
							template: oTemplate,
							templateShareable: true,
							filters: filters
						});
					oBinding = this.byId("list")
						.getBinding("items");
				} else if (filters) {
					oBinding.filter(filters);
				}
				return oBinding;
			},

			selectFirstItem: function() {
				var oList = this.byId("list");
				var aItems = oList.getItems();
				if (aItems.length === 1) {
					oList.setSelectedItem(aItems[0], true);
					this._Helpers.showDetail(aItems[0]);
				} else if (aItems.length === 0) {
					this._getRouter()
						.navTo(MDIConstants.ROUTE_NAME_NOT_FOUND, {}, true); // no browser history entry
				}
			},

			showDetail: function(oItem) {
				MDIPromises.pPendingChangesChecked()
					.then($.proxy(function() {
						this.sEditingContextPath = oItem.getBindingContext()
							.getPath();
						// navigate to Detail
						this._getRouter()
							.navTo(MDIConstants.ROUTE_NAME_DETAIL, {
								SOAEntity: oItem.getBindingContext()
									.getPath()
									.substr(1),
								// no slashes permitted in route parameters
								Action: "edit",
								Tab: this.sTab || MDIConstants.DEFAULT_GENERAL_TAB
							});
					}, this))
					.catch($.proxy(function() {
						// user bailed due to pending changes: reinstate previous selection
						var sEditingContextPath = this.sEditingContextPath;
						this.byId("list")
							.getItems()
							.forEach(function(oListItem) {
								if (sEditingContextPath === oListItem.getBindingContext()
									.getPath()) {
									oListItem.setSelected(true);
								}
							});
					}, this));
			}
		},

		/**
		 * ##########
		 * FORMATTERS
		 * ##########
		 */
		_Formatters: {
			oMDIFormatter: new MDIFormatter(sap.ui.getCore()
				.getModel("i18n")
				.getResourceBundle()),
			formatStatus: function(sStatus) {
				if (!sStatus) {
					return null;
				} else {
					return this._Formatters.oMDIFormatter.Approvalstatus(sStatus);
				}
			},
			formatDate: function(oDate) {
				if (!oDate) {
					return null;
				} else {
					return this._Formatters.oMDIFormatter.formatDateAsNormal(oDate);
				}
			}
		},

		/**
		 * #######
		 * PROMISES
		 * #######
		 */
		_Promises: {},

		/**
		 * ##############
		 * EVENT HANDLERS
		 * ##############
		 */

		onDetailTabChanged: function(sChannel, sEvent, oData) {
			this.sTab = oData.sTabKey;
		},

		onDetailChanged: function(sChannel, sEvent, oData) {
			this.byId("list")
				.removeSelections();
		},

		onDetailEditingDone: function(sChannel, sEvent, oData) {
			this.byId("list")
				.removeSelections();
			this.sEditingContextPath = null;
		},

		onNotFound: function() {
			this.byId("list")
				.removeSelections();
		},

		onSearch: function(oEvent) {
			MDIPromises.pServiceMetadataLoaded()
				.then($.proxy(function() {
					// Add search filter
					var filters = [];
					var searchString = this.byId("idSearch").getValue();
					if (searchString && searchString.length > 0) {
//Below Pattern has been commented for Select Option based search						
/*					
						var oChildFilter = new Filter({
							filters: [
								new Filter("ObjectId", FilterOperator.Contains, searchString),
								new Filter("ProcessType", FilterOperator.Contains, searchString)
							],
							and: false
						});
						filters.push(oChildFilter);
*/					
//Start of Line of code Added by Mehul to get Filter as Select Options					
					filters.push(new sap.ui.model.Filter("ObjectId", FilterOperator.Contains, searchString));
					filters.push(new sap.ui.model.Filter("ProcessType", FilterOperator.Contains, searchString));
//End of Line of code Added by Mehul to get Filter as Select Options 				
					}
					// Update list binding
					var oBinding = this._Helpers.getListItemsBinding(filters);
					oBinding.attachEventOnce("dataReceived", function() {
						this._Helpers.selectFirstItem();
					}, this);
				}, this))
				.catch(function(oError) {
					// something bad happened!
					jQuery.sap.log.error("In Home.onSearch promise catch:");
					if (oError) {
						jQuery.sap.log.error(oError);
					}
				});
		},

		onSelect: function(oEvent) {
			// Get the list item either from the listItem parameter or from the event's
			// source itself (will depend on the device-dependent mode)
			this._Helpers.showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
		},

		onExit: function(oEvent) {
			var oEventBus = MDIStatics.getEventBus();
			oEventBus.unsubscribe("Detail", "TabChanged", this.onDetailTabChanged, this);
			oEventBus.unsubscribe("Detail", "Changed", this.onDetailChanged, this);
			oEventBus.unsubscribe("Detail", "NotFound", this.onNotFound, this);
			oEventBus.unsubscribe("Detail", "EditingDone", this.onDetailEditingDone, this);
		},

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