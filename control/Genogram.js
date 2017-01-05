jQuery.sap.registerModulePath("mdi.crm.soa.Genogram", "control/Genogram");
jQuery.sap.registerModulePath("mdi.crm.soa.GenogramItem", "control/GenogramItem");
jQuery.sap.declare("mdi.crm.soa.Genogram");
jQuery.sap.declare("mdi.crm.soa.GenogramItem");
sap.ui.define([
	"sap/ui/core/Control",
	"mdi/crm/soa/Genogram",
	"mdi/crm/soa/GenogramItem",
	"mdi/crm/soa/lib/thirdparty/custom-colored",
	"mdi/crm/soa/lib/thirdparty/raphael",
	"mdi/crm/soa/lib/thirdparty/Treant"
], function(Control, Element, Treant, chart_config, Genogram, GenogramItem){
	"use strict";
		return Control.extend("mdi.crm.soa.control.Genogram", {
		metadata: {
			properties: {
				"title": {
					type: "string",
					group: "Misc",
					defaultValue: "ScatterPlot Title"
				}
			},
			aggregations: {
				"items": {
					type: "mdi.crm.soa.GenogramItem",
					multiple: true,
					singularName: "item"
				}
			},
			defaultAggregation: "items"
		},

		init: function() {
		
		},
		renderer: function(oRM, oControl) {
			oRM.write("<div id=\"custom-colored\"");
			oRM.writeControlData(oControl);
			oRM.addClass("chart");
			oRM.writeClasses();
			oRM.write(">");
			oRM.write("</div>");
		},
		onAfterRendering: function() {

			var cItems = this.getItems();
			var data = [];
			for (var i = 0; i < cItems.length; i++) {
				var oEntry = {};
				for (var j in cItems[i].mProperties) {
					oEntry[j] = cItems[i].mProperties[j];
				}
				data.push(oEntry);
			}
			//window.Treant(this.chart_config);
		}
	});
});