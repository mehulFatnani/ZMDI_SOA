sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/UIComponent",
	"./util/Constants",
	"./lib/thirdparty/underscore",
	"./lib/thirdparty/q",
	"./lib/thirdparty/custom-colored",
	"./lib/thirdparty/raphael",
	"./lib/thirdparty/Treant"
	
],
function (
	jQuery,
	UIComponent, 
	MDIConstants,
	_,
	Q,
	Treant
) {
	"use strict";

	var Component = UIComponent.extend("mdi.crm.soa.Component", {

		metadata: {
			manifest: "json"
		},
	
		init: function() {

			sap.ui.core.UIComponent.prototype.init.apply(this, arguments);
	
			// ResourceModel was created from manifest.json model config
			// for convenience we also set it to the core
			var i18nModel = this.getModel("i18n");	
	        sap.ui.getCore().setModel(i18nModel, "i18n");
	
	
			// start a mock odata data server if requested
			var bIsMocked = jQuery.sap.getUriParameters().get("responderOn") === "true";
			if (bIsMocked) {
				var oServiceConfig = this.getMetadata().getManifestEntry("sap.app").dataSources[MDIConstants.APP_DATASOURCE];
				if (oServiceConfig && oServiceConfig.uri && oServiceConfig.settings && oServiceConfig.settings.localUri) {
					this._startMockServer(oServiceConfig);
				}
			}
	
			// ODataModel was created from manifest.json model config
			// for convenience we also set it to the core, (after attaching to metadata loaded events)
			var oModel = this.getModel();
			oModel.attachMetadataFailed(function() {
				this.getEventBus().publish("Component", "MetadataFailed");
			}, this);
			sap.ui.getCore().setModel(oModel);
	
			// set device model
			var oDeviceModel = new sap.ui.model.json.JSONModel({
				isTouch: sap.ui.Device.support.touch,
				isNoTouch: !sap.ui.Device.support.touch,
				isPhone: sap.ui.Device.system.phone,
				isNoPhone: !sap.ui.Device.system.phone,
				listMode: sap.ui.Device.system.phone ? "None" : "SingleSelectMaster",
				listItemType: sap.ui.Device.system.phone ? "Active" : "Inactive"
			});
			oDeviceModel.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
			this.setModel(oDeviceModel, "device");
			sap.ui.getCore().setModel(oDeviceModel, "device");
	
			this.getRouter().initialize();
		},
	
		_startMockServer: function(oServiceConfig) {
			jQuery.sap.require("sap.ui.core.util.MockServer");
			jQuery.sap.require("sap.m.MessageToast");
			var oMockServer = new sap.ui.core.util.MockServer({
				rootUri: oServiceConfig.uri
			});
	
			var iDelay = +(jQuery.sap.getUriParameters().get("responderDelay") || 0);
			sap.ui.core.util.MockServer.config({
				autoRespondAfter: iDelay
			});
	
			oMockServer.simulate(oServiceConfig.settings.localUri, { sMockdataBaseUrl : 'model/', bGenerateMissingMockData : true });
			oMockServer.start();
	
			sap.m.MessageToast.show("Running in demo mode with mock data.", {
				duration: 4000
			});
		},
	
		getEventBus: function() {
			return sap.ui.getCore().getEventBus();
		}
		
	});

	return Component;

});