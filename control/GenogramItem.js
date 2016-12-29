jQuery.sap.registerModulePath("mdi.crm.soa.GenogramItem", "control/GenogramItem");
sap.ui.define([
	"sap/ui/core/Element",
	"mdi/crm/soa/GenogramItem",
	"mdi/crm/soa/lib/thirdparty/custom-colored",
	"mdi/crm/soa/lib/thirdparty/raphael",
	"mdi/crm/soa/lib/thirdparty/Treant"
], function(Element){
	"use strict";
return	Element.extend("mdi.crm.soa.control.GenogramItem", {
		metadata: {
			properties: {
				"chart": {
					"container": {
						type: "String",
						defaultValue: "#custom-colored"
					},
					"nodeAlign": {
						type: "String",
						defaultValue: "BOTTOM"
					},
					"connectors": {
						"type": {
							type: "String",
							defaultValue: "step"
						}
					},
					"node": {
						"HTMLclass": {
							type: "String",
							defaultValue: "nodeExample1"
						}
					}
				},
				"nodeStructure": {
					"parent": {
						type: "String"
					},
					"childrenDropLevel": {
						type: "int"
					},
					"HTMLclass": {
						type: "String"
					},
					"text": {
						"name": {
							type: "String"
						},
						"busniessPartner": {
							type: "String"
						},
						"caseNo": {
							type: "String"
						},
						"Recent Benefits": {
							"SoaNo": {
								type: "String"
							},
							"SoaDesc": {
								type: "String"
							}
						}
					}
				},
				image: {
					type: "String"
				}
			}
		}
	});
});