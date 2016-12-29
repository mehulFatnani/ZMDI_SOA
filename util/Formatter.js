sap.ui.define([
	"sap/ui/core/format/NumberFormat",
	"sap/ui/core/format/DateFormat"
], function(
	NumberFormat,
	DateFormat
) {
	"use strict";

	var Formatter = function(oResourceBundle) {
		if (oResourceBundle) {
			this.oResourceBundle = oResourceBundle;
		}
	};

	Formatter.prototype.init = function(oResourceBundle) {
		if (oResourceBundle) {
			this.oResourceBundle = oResourceBundle;
		}
	};

	Formatter.prototype.getTimeFormat = function() {
		if (!this.oTimeFormat) {
			this.oTimeFormat = DateFormat.getTimeInstance({
				pattern: "PTHH'H'mm'M'ss'S'"
			});
		}
		return this.oTimeFormat;
	};

	Formatter.prototype.getTimeFormatHHmm = function() {
		if (!this.oTimeFormatHHmm) {
			this.oTimeFormatHHmm = DateFormat.getTimeInstance({
				pattern: "HH:mm"
			});
		}
		return this.oTimeFormatHHmm;
	};

	Formatter.prototype.getDateFormatDats = function() {
		if (!this.oDateFormatDats) {
			this.oDateFormatDats = DateFormat.getDateInstance({
				pattern: "yyyyMMdd"
			});
		}
		return this.oDateFormatDats;
	};
	Formatter.prototype.getDateFormatNormal = function() {
		if (!this.oDateFormatNormal) {
			this.oDateFormatNormal = DateFormat.getDateInstance({
				pattern: "dd/MM/yyyy"
			});
		}
		// var options = { hour12: true };
		// this.oDateFormatNormal.toLocaleString('en-GB', options);
		return this.oDateFormatNormal;
	};

	Formatter.prototype.getDateFormatDatsWithDashes = function() {
		if (!this.oDateFormatDatsWithDashes) {
			this.oDateFormatDatsWithDashes = DateFormat.getDateInstance({
				pattern: "yyyy-MM-dd"
			});
		}
		return this.oDateFormatDatsWithDashes;
	};

	Formatter.prototype.getDateFormatDayOfWeek = function() {
		if (!this.oDateFormatDayOfWeek) {
			this.oDateFormatDayOfWeek = DateFormat.getDateInstance({
				pattern: "EEEE"
			});
		}
		return this.oDateFormatDayOfWeek;
	};

	Formatter.prototype.parseDatsAsDate = function(sDats) {
		// parse string in SAP Dats format (yyyyMMdd) to native Date object
		return this.getDateFormatDats()
			.parse(sDats);
	};

	Formatter.prototype.formatDateAsDats = function(oDate) {
		return this.getDateFormatDats()
			.format(oDate);
	};
	Formatter.prototype.formatDateAsNormal = function(oDate) {
		return this.getDateFormatNormal()
			.format(oDate);
	};

	Formatter.prototype.formatDateAsDatsWithDashes = function(oDate) {
		return this.getDateFormatDatsWithDashes()
			.format(oDate);
	};

	Formatter.prototype.formatDateAsDayOfWeek = function(oDate) {
		return this.getDateFormatDayOfWeek()
			.format(oDate);
	};

	Formatter.prototype.formatTimeAsHHmm = function(oDateOrEdmTime) {
		var oDate;
		if (!oDateOrEdmTime) {
			return null;
		} else {
			oDate = oDateOrEdmTime;
		}
		// cater for Edm.Time input, which may either take the form of an object with
		// ms and __edmType properties, or a string with pattern: "PTHH'H'mm'M'ss'S'"
		var dDate = this.getTimeFormat()
			.parse(oDate, true);

		return this.getTimeFormatHHmm()
			.format(dDate);
	};

	Formatter.prototype.formatTimeAsEdmTimeObject = function(oDate) {
		return {
			ms: (oDate instanceof Date) ? oDate.getTime() : 0,
			__edmType: "Edm.Time"
		};
	};
	Formatter.prototype.isMainPartner = function(sPartnerType) {
		return sPartnerType === "Y" ? true : false;
	};
	Formatter.prototype.Approvalstatus = function(sStatus) {
		if (sStatus === "Approved") {
			return "Success";
		} else {
			return "Error";
		}
	};
	

	return Formatter;
});