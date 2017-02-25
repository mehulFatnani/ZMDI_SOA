/*global _*/
jQuery.sap.registerModulePath("mdi.crm.soa.Genogram", "control/Genogram");
jQuery.sap.registerModulePath("mdi.crm.soa.GenogramItem", "control/GenogramItem");
jQuery.sap.declare("mdi.crm.soa.Genogram");
jQuery.sap.declare("mdi.crm.soa.GenogramItem");
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/ValueState",
	"sap/ui/Device",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Context",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/type/Time",
	"sap/ui/commons/Dialog",
	"sap/m/ActionSheet",
	"sap/m/PlacementType",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/m/TextArea",
	"sap/m/ColumnListItem",
	"sap/ushell/ui/footerbar/AddBookmarkButton",
	"mdi/crm/soa/util/Constants",
	"mdi/crm/soa/util/Statics",
	"mdi/crm/soa/util/Promises",
	"mdi/crm/soa/util/Formatter",
	"mdi/crm/soa/control/Genogram",
	"mdi/crm/soa/control/GenogramItem"
], function(
	jQuery,
	Controller,
	UIComponent,
	ValueState,
	Device,
	Filter,
	FilterOperator,
	Context,
	JSONModel,
	Time,
	CommonsDialog,
	ActionSheet,
	PlacementType,
	MessageToast,
	MessageBox,
	TextArea,
	ColumnListItem,
	AddBookmarkButton,
	MDIConstants,
	MDIStatics,
	MDIPromises,
	MDIFormatter,
	Genogram,
	GenogramItem
) {
	"use strict";
	var oBundle = sap.ui.getCore()
		.getModel("i18n")
		.getResourceBundle();
	return Controller.extend("mdi.crm.soa.view.Detail", {
		_oRoutingParams: {},
		onInit: function() {
			MDIStatics.setFunctionGroupingObjectContext(this);
			this.getView()
				.setBusy(true);
			var oEventBus = MDIStatics.getEventBus();
			oEventBus.subscribe("Component", "MetadataFailed", this.onMetadataFailed, this);
			oEventBus.subscribe("Home", "InitialLoadFinished", this.onMasterLoaded, this);
			this._getRouter()
				.attachRouteMatched(this.onRouteMatched, this);
			this._Helpers.initSharedModel();
			//hide decision basis
			var oIconTabBar = this.byId("iconTabBar");
			//oIconTabBar.setSelectedKey("dba").setVisible(false);
		},
		onRouteMatched: function(oEvent) {
			var oParameters = oEvent.getParameters();
			if (oParameters.name === MDIConstants.ROUTE_NAME_DETAIL) {
				this._oRoutingParams = {};
				if (oParameters.arguments.SOAEntity) {
					this._oRoutingParams.SOAEntity = oParameters.arguments.SOAEntity;
					this._oRoutingParams.Action = oParameters.arguments.Action;
					this._oRoutingParams.Tab = oParameters.arguments.Tab;
				} else {
					this._Helpers.showEmptyView();
					this._Helpers.fireNotFound();
					return;
				}
				this._Helpers.bindView("/" + this._oRoutingParams.SOAEntity);
				// specify the tab being focused
				this._Helpers.setActiveTab("comments");
			}
		},
		/**
		 * ###################
		 * DYNAMIC REUSABLE UI
		 * ###################
		 */
		_Dynamics: {
			oCustomerDetailPopover: null,
			oCaseDetailPopover: null,
			oApproveDialog: null,
			oRejectDialog: null,
			oForwardDialog: null,
			oForwardConfirmDialog: null
		},
		/**
		 * ################
		 * HELPER FUNCTIONS
		 * ################
		 */
		_Helpers: {
			initSharedModel: function() {},
			bindView: function(sEntityPath) {
				this._Helpers.cleanup();
				var oView = this.getView();
				MDIPromises.pEntityContextRead(sEntityPath)
					.then($.proxy(function(oEntityContext) {
						this._Helpers.fireContextLoaded(oEntityContext);
						oView.setBindingContext(oEntityContext);
						// oView.setModel(oEntityContext.getModel());
						this._Helpers.setupByRoutingAction(this._oRoutingParams.Action);
						oView.setBusy(false);
					}, this))
					.catch($.proxy(function(oError) {
						// something bad happened!
						jQuery.sap.log.error("In Overview.bindView promise catch:");
						if (oError) {
							jQuery.sap.log.error(oError);
						}
						oView.setBusy(false);
						this._Helpers.showEmptyView();
						this._Helpers.fireNotFound();
					}, this));
			},
			setupByRoutingAction: function(sAction) {
				if (sAction === "add") {
					this._Helpers.setEditMode(true);
				} else {
					this._Helpers.setEditMode(false);
				}
			},
			setActiveTab: function(sTabKey) {
				if (!sTabKey) {
					return;
				}
				// var sRouteName = MDIConstants.ROUTE_PREFIX_TAB + sTabKey;
				// // lazy-load tab through navigation
				// this._getRouter()
				//  .navTo(sRouteName, {
				//    FeedbackEntity: this._oRoutingParams.FeedbackEntity
				//  });
				// tell other views what tab we're on
				MDIStatics.getEventBus()
					.publish("Detail", "TabChanged", {
						sTabKey: sTabKey
					});
				// sync up UI if this was a programmatic tab change
				var oIconTabBar = this.byId("iconTabBar");
				if (oIconTabBar.getSelectedKey() !== sTabKey) {
					oIconTabBar.setSelectedKey(sTabKey);
				}
				oIconTabBar.setExpanded(true);
			},
			fireEditingDone: function() {
				MDIStatics.getEventBus()
					.publish("Detail", "EditingDone", {});
			},
			navHistoryBack: function() {
				this._Helpers.fireEditingDone();
				this._getRouter()
					.getTargets()
					.display(MDIConstants.ROUTE_NAME_HOME);
			},
			cleanup: function() {},
			fireContextLoaded: function(oEntityContext) {
				MDIStatics.getEventBus()
					.publish("Overview", "ContextLoaded", {
						oEntityContext: oEntityContext
					});
			},
			fireChanged: function(sEntityPath) {
				MDIStatics.getEventBus()
					.publish("Overview", "Changed", {
						sEntityPath: sEntityPath
					});
			},
			fireNotFound: function() {
				MDIStatics.getEventBus()
					.publish("Overview", "NotFound");
			},
			showEmptyView: function() {
				this._getRouter()
					.navTo(MDIConstants.ROUTE_NAME_NOT_FOUND, {}, true); // don't create a history entry
			},
			setEditMode: function(isEditing) {
				isEditing = isEditing ? true : false;
				MDIStatics.getSharedModel()
					.setProperty("/EditMode/IsEditing", isEditing);
				MDIStatics.getSharedModel()
					.setProperty("/EditMode/IsNotEditing", !isEditing);
			},
			findSplitApp: function(oControl) {
				var sAncestorControlName = "splitApp";
				if (oControl instanceof sap.ui.core.mvc.View && oControl.byId(sAncestorControlName)) {
					return oControl.byId(sAncestorControlName);
				}
				return oControl.getParent() ? this._Helpers.findSplitApp(oControl.getParent(), sAncestorControlName) : null;
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
			formatPartner: function(sPartnerType) {
				if (!sPartnerType) {
					return null;
				} else {
					return this._Formatters.oMDIFormatter.isMainPartner(sPartnerType);
				}
			},
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
			},
			formatTime: function(oDate) {
				if (!oDate) {
					return null;
				} else {
					return this._Formatters.oMDIFormatter.formatTimeAsEdmTimeObject(oDate);
				}
			},
			formatRating: function(sRating) {
				return parseFloat(sRating);
			}
		},
		/**
		 * #######
		 * PROMISES
		 * #######
		 */
		_Promises: {
			// use the Q lib in favour of native Promises due to browser coverage 
			// (Q will use native Promises if available)
		},
		/**
		 * ##############
		 * EVENT HANDLERS
		 * ##############
		 */
		onMasterLoaded: function(sChannel, sEvent) {
			this.getView()
				.setBusy(false);
		},
		onMetadataFailed: function() {
			this.getView()
				.setBusy(false);
			this._Helpers.showEmptyView();
		},
		onNavBack: function() {
			MDIPromises.pPendingChangesChecked()
				.then($.proxy(function() {
					this._Helpers.cleanup();
					this._Helpers.navHistoryBack();
				}, this))
				.catch(function(oError) {
					// something bad happened!
					jQuery.sap.log.error("In Overview.onNavBack promise catch:");
					if (oError) {
						jQuery.sap.log.error(oError);
					}
				});
		},
		generateText: function(Label, value) {

			if (value.toString() === "") {
				return "";
			}
			return Label + ":" + value;
		},
		generateInnerHTML: function(iRel, iBPName, iBPNo, iCaseNo, iGender, iHasPic, iIsAdult, iLevel, iBenefits) {
			var defaultPic;
			if (iHasPic === "X") {
				defaultPic = "http://blcgbs68.accenture.tsap:8100" + this.getView().getModel().sServiceUrl + '/SocAppImgAttachmentSet(\'00' +
					iBPNo + '\')/$value';
			} else {
				switch (iGender) {
					case "1":
						defaultPic = "../headshots/maleIcon.png";
						break;
					case "2":
						defaultPic = "../headshots/femaleIcon.jpg";
						break;
				}

			}
			var output = "<div class=\"GenogramPic\"><img src=\"" + defaultPic + "\" style=\"width:40%\"></div>";
			if (iLevel !== 0) {
				output = output + "<div class=\"GenogramContent\"><p class=\"node-name\">Relation.</p>" + "<p class=\"node-title\">" + iRel +
					"</p>";
			}
			output = output + "<p class=\"node-name\">" + iBPName + "</p>" +
				"<p class=\"node-name\">BP No.</p>" + "<p class=\"node-title\">" + iBPNo + "</p>";
			if (iCaseNo !== "") {
				output = output + "<p class=\"node-name\">Case No.</p>" + "<p class=\"node-title\">" + iCaseNo + "</p>";
			}
			if (iBenefits !== undefined && iBenefits.results.length !== 0) {
				output = output + "<p class=\"node-name\">Recent Benfits:</p>";
				var oItem = iBenefits.results;
				for (var m = 0; m < oItem.length && oItem[m].MainPartner === iBPNo; m++) {
					output = output + "<a target=\"_blank\" href=\"" + oItem[m].SoaUrl + "\">" + oItem[m].SoaNo + "-" + oItem[m].SoaDesc + "</a>";
				}
			}
			output = output + "</div>";
			return output;
		},

		onIconTabBarSelect: function(oEvent) {
			var sKey = oEvent.getParameter("key");
			var sModelPath = this.getView()
				.getModel()
				.sServiceUrl;
			var sUrl = "";
			if (sKey === "attachment") {
				var aItems = this.byId("fileupload")
					.getItems();
				_.each(aItems, $.proxy(function(oItem) {
					sUrl = sModelPath + oItem.getBindingContext()
						.getPath() + "/$value";
					oItem.setUrl(sUrl);
				}, this));
			}
			if (sKey === "genogram") {
				this.getView()
					.setBusy(true);
				this._Dynamics.oGenogramTab = sap.ui.xmlfragment(this.getView()
					.getId(), "mdi.crm.soa.view.fragment.GenogramTab", this);
				this.getView()
					.addDependent(this._Dynamics.oGenogramTab);

				var oSource = oEvent.getSource();
				var sMainPartner = oSource.getBindingContext()
					.getObject()
					.MainPartner;
				var sMainPartnerName = oSource.getBindingContext()
					.getObject().MainPartnerName;
				var sCaseId = oSource.getBindingContext()
					.getObject().CaseId;
				var sGender = oSource.getBindingContext().getObject().PartnerSex;
				var sHasPic = oSource.getBindingContext().getObject().PartnerPic;
				var sIsAdult = oSource.getBindingContext().getObject().PartnerAge;
				var sPath = "/SocAppGenogramSet";
				var aFilterIds = ["MainPartner"];
				var aFilterValues = [sMainPartner];
				var aFilters = this._createSearchFilterObject(aFilterIds, aFilterValues);

				var mParameters = {
					filters: aFilters,
					urlParameters: {
						"$expand": "SocAppSoaSet"
					},
					success: function(oData) {

						this.chart_config = [];
						if (oData) {
							var oItems = oData.results;
							var config = {
								container: "#custom-colored",
								nodeAlign: "BOTTOM",
								animateOnInit: true,
								connectors: {
									type: 'step'
								},
								node: {
									HTMLclass: 'nodeExample1',
									collapsable: true
								},
								animation: {
									nodeAnimation: "easeOutBounce",
									nodeSpeed: 700,
									connectorsAnimation: "bounce",
									connectorsSpeed: 700
								}
							};
							var ceo = {
								text: {
									name: sMainPartner,
									title: sMainPartnerName,
									desc: this.generateText("Case Id", sCaseId),
									contact: {
										val: "1000811",
										href: "http://twitter.com",
										target: "_self"
									}
								},
								image: "../headshots/2.jpg",
								innerHTML: this.generateInnerHTML("", sMainPartnerName, sMainPartner, sCaseId, sGender, sHasPic, sIsAdult, 0)
							};
							var cto;
							var cdo = ceo;
							//this.chart_config = [window.config, ceo];
							this.chart_config = [config, ceo];
							var distinct = [sMainPartner];
							var relDistinct = [oItems[0].RelPartner];
							for (var j = 0; j < oItems.length; j++) {
								if (distinct.includes(oItems[j].MainPartner) === false) {
									distinct.push(oItems[j].MainPartner);
								}
								if (relDistinct.includes(oItems[j].RelPartner) === false) {
									relDistinct.push(oItems[j].RelPartner);
								}
							}
							var disLength = relDistinct.length,
								k = 0,
								m = 0,
								cio;
							do {
								for (var i = 0; i < oItems.length; i++) {
									if (oItems[i].MainPartner === sMainPartner) {
										cto = {
											parent: ceo,
											text: {
												name: oItems[i].RelPartner,
												title: oItems[i].RelPartnerName,
												desc: this.generateText("Case Id", oItems[i].Caseno)
											},
											image: "../headshots/1.jpg",
											innerHTML: this.generateInnerHTML(oItems[i].Reldesc,
												oItems[i].RelPartnerName,
												oItems[i].RelPartner,
												oItems[i].Caseno,
												oItems[i].RelGender,
												oItems[i].RelPic,
												oItems[i].RelAdult,
												oItems[i].Nodelevel,
												oItems[i].SocAppSoaSet)
										};
										this.chart_config.push(cto);
									}
									for (var l = 1; l < this.chart_config.length; l++) {
										if (relDistinct[k] === this.chart_config[l].text.name) {
											cio = this.chart_config[l];
											break;
										}
									}
								}
								sMainPartner = relDistinct[k];
								for (var l = 1; l < this.chart_config.length; l++) {
									if (relDistinct[k] === this.chart_config[l].text.name) {
										cio = this.chart_config[l];
										break;
									}
								}
								//}
								sMainPartner = relDistinct[k];
								k++;
								ceo = cio;
							} while (k < disLength);
							window.Treant(this.chart_config);
						}
						this.getView()
							.setBusy(false);
					}.bind(this),
					error: function(oError) {
						if (oError) {
							jQuery.sap.log.error(oError);
						}
					}.bind(this)
				};
				this.getView()
					.getModel()
					.read(sPath, mParameters);
				this.onGenogramLoad();
			}
		},
		onValidateFieldGroup: function(oEvent) {
			return MDIStatics.onValidateFieldGroup(oEvent);
		},
		onActionButtonPressed: function(oEvent) {
			this._Dynamics.dynamicActionSheet()
				.openBy(oEvent.getSource());
		},
		onExit: function(oEvent) {
			var oEventBus = MDIStatics.getEventBus();
			oEventBus.unsubscribe("Home", "InitialLoadFinished", this.onMasterLoaded, this);
			oEventBus.unsubscribe("Component", "MetadataFailed", this.onMetadataFailed, this);
			this._oRoutingParams = null;
		},
		onAfterRendering: function() {},
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
		},
		_isEditing: function() {
			return !!MDIStatics.getSharedModel()
				.getProperty("/EditMode/IsEditing");
		},
		OnTitlePress: function(oEvent) {
			var oSource = oEvent.getParameter("domRef");
			var CustomerModel = new sap.ui.model.json.JSONModel();
			var sMainPartner = oEvent.getSource()
				.getBindingContext()
				.getObject()
				.MainPartner;
			// var sMainPartner="0010000540";
			var sPath = "/SocAppAddressSet" + "('" + sMainPartner + "')";
			// create/open the claim period selection calendar popover
			if (!this._Dynamics.oCustomerDetailPopover) {
				this._Dynamics.oCustomerDetailPopover = sap.ui.xmlfragment(this.getView()
					.getId(), "mdi.crm.soa.view.fragment.CustomerDetailsPopover", this);
				this.getView()
					.addDependent(this._Dynamics.oCustomerDetailPopover);
			}
			var that = this;
			this.getView()
				.getModel()
				.read(sPath, {
					success: function(oData) {
						if (oData) {
							CustomerModel.setData(oData);
							that._Dynamics.oCustomerDetailPopover.setModel(CustomerModel);
						}
					},
					error: function(oError) {
						if (oError) {
							jQuery.sap.log.error(oError);
						}
					}
				});
			this._Dynamics.oCustomerDetailPopover.openBy(oSource);
		},
		onCasePress: function(oEvent) {
			var oSource = oEvent.getSource();
			var sApplicationGuid = oSource.getBindingContext()
				.getObject()
				.SocAppGuid;
			// var sApplicationGuid="00505683-73A9-1ED5-A3C9-780E74E66AAB";
			var sPath = "/SocAppCaseSet" + "(guid'" + sApplicationGuid + "')";
			var CaseModel = new sap.ui.model.json.JSONModel();
			// create/open the claim period selection calendar popover
			if (!this._Dynamics.oCaseDetailPopover) {
				this._Dynamics.oCaseDetailPopover = sap.ui.xmlfragment(this.getView()
					.getId(), "mdi.crm.soa.view.fragment.CaseDetailsPopover", this);
				this.getView()
					.addDependent(this._Dynamics.oCaseDetailPopover);
			}
			var that = this;
			this.getView()
				.getModel()
				.read(sPath, {
					success: function(oData) {
						if (oData) {
							CaseModel.setData(oData);
							that.byId("sForm")
								.setModel(CaseModel);
						}
					},
					error: function(oError) {
						if (oError) {
							jQuery.sap.log.error(oError);
						}
					}
				});
			this._Dynamics.oCaseDetailPopover.openBy(oSource);
		},
		onApprovePressed: function(oEvent) {
			var oSource = oEvent.getSource();
			this.UserName = oSource.getBindingContext()
				.getObject()
				.MainPartnerName;
			this.appGuid = oSource.getBindingContext() // Declaration of Var to this object for appGuid by Mehul
				.getObject()
				.SocAppGuid;
			var oApproveProperties = {};
			oApproveProperties.UserName = this.UserName;
			this._oApproveModel = new JSONModel(oApproveProperties);
			var oApproveForm = sap.ui.xmlfragment(this.getView()
				.getId(), "mdi.crm.soa.view.fragment.ApproveDialog", this);
			if (!this._Dynamics.oApproveDialog) {
				this._Dynamics.oApproveDialog = new sap.m.Dialog({
					type: 'Message',
					buttons: [new sap.m.Button({
							text: 'OK',
							press: $.proxy(function() {
								var aFlexBoxItems = this._Dynamics.oApproveDialog.getContent()[0].getItems();
								var sApproveComment = "";
								_.each(aFlexBoxItems, $.proxy(function(oFlexBoxItem) {
									if (oFlexBoxItem instanceof TextArea) {
										sApproveComment = oFlexBoxItem.getValue();
									}
								}, this));
								MDIPromises.pModelFunctionCalled("/SocialApplicationApprove", "POST", {
										CODE: "1",
										GUID: this.appGuid, //Mapping changed from appGuid to this.appGuid by Mehul
										NOTE: sApproveComment
									})
									.then($.proxy(function(oData) {
										this._Dynamics.oApproveDialog.close();
										this._getRouter()
											.navTo(MDIConstants.ROUTE_NAME_WELCOME); // Added  By Mehul
										MessageToast.show(oData.SocialApplicationApprove.Message, {
											my: 'center center',
											at: 'center  center'
										});
									}, this))
									.catch(function(oError) {
										// something bad happened!
										this._Dynamics.oApproveDialog.close();
										MessageToast.show("Error in Approval", {
											my: 'center center',
											at: 'center  center'
										});
										jQuery.sap.log.error("In Detail.Approve promise catch:");
										if (oError) {
											jQuery.sap.log.error(oError);
										}
									});
							}, this)
						}),
						new sap.m.Button({
							text: 'Cancel',
							press: $.proxy(function() {
								this._Dynamics.oApproveDialog.close();
							}, this)
						})
					],
					afterClose: $.proxy(function() {
						this._Dynamics.oApproveDialog.removeAllContent();
						// this._Dynamics.oApproveDialog.destroy();
					}, this)
				});
			}
			this._Dynamics.oApproveDialog.setModel(this._oApproveModel);
			this._Dynamics.oApproveDialog.setTitle(oBundle.getText("approve.dialog.title"));
			this._Dynamics.oApproveDialog.removeAllContent();
			this._Dynamics.oApproveDialog.addContent(oApproveForm);
			// this._Dynamics.oApproveDialog.attachClosed($.proxy(function() {
			//  this._Dynamics.oApproveDialog.removeAllContent();
			// }, this));
			if (!this._Dynamics.oApproveDialog.isOpen()) {
				this._Dynamics.oApproveDialog.open();
			}
		},
		onRejectPressed: function(oEvent) {
			var oSource = oEvent.getSource();
			var UserName = oSource.getBindingContext()
				.getObject()
				.MainPartnerName;
			var appGuid = oSource.getBindingContext()
				.getObject()
				.SocAppGuid;
			var oRejectProperties = {};
			oRejectProperties.UserName = UserName;
			oRejectProperties.Note = "";
			this._oRejectModel = new JSONModel(oRejectProperties);
			var oRejectForm = sap.ui.xmlfragment(this.getView()
				.getId(), "mdi.crm.soa.view.fragment.RejectDialog", this);
			if (!this._Dynamics.oRejectDialog) {
				// this._Dynamics.oApproveDialog = new CommonsDialog({
				//  width: "30%",
				//  modal: true
				// });
				this._Dynamics.oRejectDialog = new sap.m.Dialog({
					type: 'Message',
					buttons: [new sap.m.Button({
							text: 'OK',
							press: $.proxy(function(oEvent) {
								var aFlexBoxItems = this._Dynamics.oRejectDialog.getContent()[0].getItems();
								var sRejectNote = "";
								var bRejectNoteFilledUp = false;
								_.each(aFlexBoxItems, $.proxy(function(oFlexBoxItem) {
									if (oFlexBoxItem instanceof TextArea) {
										if (oFlexBoxItem.getValue() === "") {
											oFlexBoxItem.setValueState(ValueState.Error);
											oFlexBoxItem.setShowValueStateMessage(true);
										} else {
											bRejectNoteFilledUp = true;
											sRejectNote = oFlexBoxItem.getValue();
											// this._Dynamics.oRejectDialog.close();
										}
									}
								}, this));
								if (bRejectNoteFilledUp) {
									MDIPromises.pModelFunctionCalled("/SocialApplicationApprove", "POST", {
											CODE: "2",
											GUID: appGuid,
											NOTE: sRejectNote
										})
										.then($.proxy(function(oData) {
											this._Dynamics.oRejectDialog.close();
											this._getRouter()
												.navTo(MDIConstants.ROUTE_NAME_WELCOME); // Added  By Mehul
											MessageToast.show(oData.SocialApplicationApprove.Message, {
												my: 'center center',
												at: 'center  center'
											});
										}, this))
										.catch(function(oError) {
											// something bad happened!
											this._Dynamics.oRejectDialog.close();
											MessageToast.show("Error in Rejection", {
												my: 'center center',
												at: 'center  center'
											});
											jQuery.sap.log.error("In Detail.Reject promise catch:");
											if (oError) {
												jQuery.sap.log.error(oError);
											}
										});
								}
							}, this)
						}),
						new sap.m.Button({
							text: 'Cancel',
							press: $.proxy(function() {
								this._Dynamics.oRejectDialog.close();
							}, this)
						})
					],
					afterClose: $.proxy(function() {
						this._Dynamics.oRejectDialog.removeAllContent();
						// this._Dynamics.oRejectDialog.destroy();
					}, this)
				});
			}
			this._Dynamics.oRejectDialog.setModel(this._oRejectModel);
			this._Dynamics.oRejectDialog.setTitle(oBundle.getText("reject.dialog.title"));
			this._Dynamics.oRejectDialog.removeAllContent();
			this._Dynamics.oRejectDialog.addContent(oRejectForm);
			if (!this._Dynamics.oRejectDialog.isOpen()) {
				this._Dynamics.oRejectDialog.open();
			}
		},
		onForwardPressed: function(oEvent) {
			var oEmployeeModel = new JSONModel();
			this.sDataModelPath = "/sap/opu/odata/sap/ZSOA_APPROVE_SRV";
			this._oDataModel = new sap.ui.model.odata.ODataModel(this.sDataModelPath);
			if (!this._Dynamics.oForwardDialog) {
				this._Dynamics.oForwardDialog = sap.ui.xmlfragment(this.getView()
					.getId(), "mdi.crm.soa.view.fragment.ForwardDialog", this);
				this.getView()
					.addDependent(this._Dynamics.oForwardDialog);
			}
			var that = this;
			this._oDataModel.read("/SocAppEmployeesSet", {
				success: function(oData) {
					if (oData) {
						var aSocAppEmployeesResults = oData.results;
						oEmployeeModel.setData(aSocAppEmployeesResults);
						that._Dynamics.oForwardDialog.setModel(oEmployeeModel);
					}
				},
				error: function(oError) {
					if (oError) {
						jQuery.sap.log.error(oError);
					}
				}
			});
			this._Dynamics.oForwardDialog.open();
		},
		onEmployeeSelect: function(oEvent) {
			var sEmployeeName = oEvent.getParameter("selectedItem")
				.getBindingContext()
				.getObject()
				.EmployeeName;
			var sEmployeeId = oEvent.getParameter("selectedItem")
				.getBindingContext()
				.getObject()
				.EmployeeId;
			var appGuid = oEvent.getSource()
				.getBindingContext()
				.getObject()
				.SocAppGuid;
			var oForwardProperties = {};
			oForwardProperties.UserName = sEmployeeName;
			this._oForwardModel = new JSONModel(oForwardProperties);
			var oForwardForm = sap.ui.xmlfragment(this.getView()
				.getId(), "mdi.crm.soa.view.fragment.ForwardConfirmDialog", this);
			if (!this._Dynamics.oForwardConfirmDialog) {
				this._Dynamics.oForwardConfirmDialog = new sap.m.Dialog({
					type: 'Message',
					buttons: [new sap.m.Button({
							text: 'OK',
							press: $.proxy(function() {
								var aFlexBoxItems = this._Dynamics.oForwardConfirmDialog.getContent()[0].getItems();
								var sForwardComment = "";
								_.each(aFlexBoxItems, $.proxy(function(oFlexBoxItem) {
									if (oFlexBoxItem instanceof TextArea) {
										sForwardComment = oFlexBoxItem.getValue();
									}
								}, this));
								MDIPromises.pModelFunctionCalled("/SocialApplicationForward", "POST", {
										EmployeeId: sEmployeeId,
										ForwardingText: sForwardComment,
										SocAppGuid: appGuid
									})
									.then($.proxy(function(oData) {
										this._Dynamics.oForwardConfirmDialog.close();
										MessageToast.show(oData.SocialApplicationForward.Message, {
											my: 'center center',
											at: 'center  center'
										});
									}, this))
									.catch(function(oError) {
										// something bad happened!
										this._Dynamics.oForwardConfirmDialog.close();
										MessageToast.show("Error in Forward", {
											my: 'center center',
											at: 'center  center'
										});
										jQuery.sap.log.error("In Detail.Forward promise catch:");
										if (oError) {
											jQuery.sap.log.error(oError);
										}
									});
							}, this)
						}),
						new sap.m.Button({
							text: 'Cancel',
							press: $.proxy(function() {
								this._Dynamics.oForwardConfirmDialog.close();
							}, this)
						})
					],
					afterClose: $.proxy(function() {
						this._Dynamics.oForwardConfirmDialog.removeAllContent();
						// this._Dynamics.oApproveDialog.destroy();
					}, this)
				});
			}
			this._Dynamics.oForwardConfirmDialog.setModel(this._oForwardModel);
			this._Dynamics.oForwardConfirmDialog.setTitle(oBundle.getText("Forward"));
			this._Dynamics.oForwardConfirmDialog.removeAllContent();
			this._Dynamics.oForwardConfirmDialog.addContent(oForwardForm);
			if (!this._Dynamics.oForwardConfirmDialog.isOpen()) {
				this._Dynamics.oForwardConfirmDialog.open();
			}
		},
		onPressLaunchCase: function(oEvent) {
			var sUrlForCase = this.byId("sForm")
				.getModel()
				.getData()
				.Url;
			window.open(sUrlForCase, '_blank');
		},
		onGenogramLoad: function() {

			var oGenogramItem = new GenogramItem({
				parent: "{/MainPartner}",
				childrenDropLevel: "{/Nodelevel}",
				name: "{/RelPartnerName}",
				busniessPartner: "{/RelPartner}",
				caseNo: "{/Caseno}",
				SoaNo: "{/SoaNo}",
				SoaDesc: "{/SoaDesc}"
			});
			var genogram = new Genogram({
				items: {
					path: "/SoaAppGenogramSet",
					template: oGenogramItem
				}

			});
		},
		_createSearchFilterObject: function(aFilterIds, aFilterValues) {

			var aFilters = [],

				iCount;

			for (iCount = 0; iCount < aFilterIds.length; iCount = iCount + 1) {

				aFilters.push(new Filter(aFilterIds[iCount], FilterOperator.EQ, aFilterValues[iCount], ""));

			}

			return aFilters;

		},
		onAddRelationship: function(oEvent) {
			var oSource = oEvent.getSource();
			var sMainPartner = oSource.getBindingContext()
				.getObject()
				.MainPartner;
			var oView = this.getView();
			var oDialog = oView.byId("addRelationDialog");
			// create dialog lazily
			if (!oDialog) {
				// create dialog via fragment factory
				var oDialog = sap.ui.xmlfragment(oView.getId(), "mdi.crm.soa.view.fragment.AddBpRelationship", this.getView().getController());
				oView.addDependent(oDialog);
				var oMainPartner = this.getView().byId("MainPartner1");
				oMainPartner.setValue(sMainPartner);
			}
			oDialog.open();
		},
		onCatgValHelp: function() {
			var _oInput = this.getView().byId("CatgInput");
			var oHelpTable = new sap.ui.table.Table({
				selectionMode: sap.ui.table.SelectionMode.Single,
				visibleRowCount: 7,
				width: "300pt"
			});

			oHelpTable.addColumn(
				new sap.ui.table.Column({
					label: new sap.ui.commons.Label({
						text: "Relationship Category"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Reltyp"),
					sortProperty: "Reltyp",
					filterProperty: "Reltyp"
				})
			);

			oHelpTable.addColumn(
				new sap.ui.table.Column({
					label: new sap.ui.commons.Label({
						text: "Description"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Bez50"),
					sortProperty: "Bez50",
					filterProperty: "Bez50"
				})
			);
			oHelpTable.setModel(this.getView().getModel());
			oHelpTable.bindRows("/SocAppBPRoleCatgSet");
			var that = this;
			var dialog = new sap.m.Dialog({
				title: 'Relationship Category',
				content: oHelpTable,
				beginButton: new sap.m.Button({
					text: 'OK',
					press: function() {
						var oContext = oHelpTable.getContextByIndex(oHelpTable.getSelectedIndex());
						if (oContext) {
							var oSel = oContext.getModel().getProperty(oContext.getPath());
							var oInput = that.getView().byId("CatgInput");
							var oLabel = that.getView().byId("RelDesc");
							oLabel.setText(": "+oSel["Bez50"]);
							oInput.setValue(oSel["Reltyp"]);
						}
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: 'Close',
					press: function() {
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});

			//to get access to the global model
			this.getView().addDependent(dialog);
			dialog.open();
		},
		onBPValHelp: function() {
			var _oInput = this.getView().byId("BpInput");
			var oHelpTable = new sap.ui.table.Table({
				selectionMode: sap.ui.table.SelectionMode.Single,
				visibleRowCount: 7,
				width: "300pt"
			});

			oHelpTable.addColumn(
				new sap.ui.table.Column({
					label: new sap.ui.commons.Label({
						text: "Related Business Partner"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "Partner"),
					sortProperty: "Partner",
					filterProperty: "Partner"
				})
			);

			oHelpTable.addColumn(
				new sap.ui.table.Column({
					label: new sap.ui.commons.Label({
						text: "First Name"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "McName1"),
					sortProperty: "McName1",
					filterProperty: "McName1"
				})
			);
			oHelpTable.addColumn(
				new sap.ui.table.Column({
					label: new sap.ui.commons.Label({
						text: "Last Name"
					}),
					template: new sap.ui.commons.TextView().bindProperty("text", "McName2"),
					sortProperty: "McName2",
					filterProperty: "McName2"
				})
			);
			oHelpTable.setModel(this.getView().getModel());
			oHelpTable.bindRows("/SocAppBPListSet");
			var that = this;
			var dialog = new sap.m.Dialog({
				title: 'Business Partner',
				content: oHelpTable,
				beginButton: new sap.m.Button({
					text: 'OK',
					press: function() {
						var oContext = oHelpTable.getContextByIndex(oHelpTable.getSelectedIndex());
						if (oContext) {
							var oSel = oContext.getModel().getProperty(oContext.getPath());
							var oInput = that.getView().byId("BpInput");
							oInput.setValue(oSel["Partner"]);
						}
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: 'Close',
					press: function() {
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});

			//to get access to the global model
			this.getView().addDependent(dialog);
			dialog.open();
		},
		onSubmitRelationship: function(oEvent) {
			var sServiceUrl = "/SocAppBpRelSet";
			var oParameters = {
				"PartnerMain": this.getView().byId("MainPartner1").getValue(),
				"PartnerSec": this.getView().byId("BpInput").getValue(),
				"RelTypCatg": this.getView().byId("CatgInput").getValue()
			};
			var that = this;
			this.getView().getModel().create(sServiceUrl, oParameters, {
				success: function() {
					sap.m.MessageToast.show("Relationship Added Successfully!");
					that.getView().byId("addRelationDialog").close();
					//that.onIconTabBarSelect(oEvent);

				},
				error: function() {
					sap.m.MessageToast.show("Error Adding Relationship...");
				}
			});

		},
		onCloseDialog: function() {
			var oDialog = this.getView().byId("addRelationDialog");
			oDialog.close();
		}
	});

});