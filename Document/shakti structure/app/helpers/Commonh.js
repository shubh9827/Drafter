"use strict";

var exportFuns = {};


exportFuns.fetchInjuryAbbr =  (desc) => {
	switch (desc) {
      case 'Out':
        return 'O';
      case 'Day-To-Day':
        return 'Q';
      case 'IR':
        return 'O';
      case 'IR-NR':
        return 'O';
      case 'IR-LT':
        return 'O';
      case 'QUESTIONABLE':
        return 'Q';
      case 'DOUBTFUL':
        return 'O';
      case 'OUT':
        return 'O';
      case 'INACTIVE':
        return 'O';
      case 'PUP-R':
        return 'O';
      case 'PUP-P':
        return 'O';
      case 'IR-R':
        return 'O';
      case 'IR':
        return 'O';
      case 'RESERVE-DNR':
        return 'O';
      case 'NFI-R':
        return 'O';
      case 'NFI-A':
        return 'O';
      case 'RESERVE-CEL':
        return 'O';
      case 'RESERVE-SUS':
        return 'O';
      case 'RESERVE-RET':
        return 'O';
      case 'RESERVE-EX':
        return 'O';
      case 'RESERVE-COVID-19':
        return 'O';
      case 'GTD':
        return 'D';
      case 'OUT':
        return 'O';
      case 'OFS':
        return 'O';
      case '60-Day IL':
        return 'IL';
      case '15-Day IL':
        return 'IL';
      case '10-Day IL':
        return 'IL';
      case 'Out':
        return 'IL';
      case '7-Day IL':
        return 'IL';
      case 'Suspension':
        return 'O';
      case 'Paternity':
        return 'O';
      case 'Bereavement':
        return 'O';
      case 'COVID-19':
        return 'O';
      default:
        return desc.charAt(0);
    }
  }
module.exports = exportFuns;