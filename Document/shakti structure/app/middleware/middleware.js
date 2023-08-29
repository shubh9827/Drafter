const Client = require('../../../lib/node_modules/node-rest-client').Client;
const restClient = new Client();
const FPTS_URL = 'http://15.222.39.20:3636/';
const is_runtime = 1;
const gameIdArr = [1,2, 3, 4];
exports.getStanding = (params, callback) => {
	let {id, type, index, limit, duration_id, game_id, search} = params;
	let lgmIds = [];
	let lgmData = {};
	let type_num = 0;
	game_id = parseInt(game_id);
	try {
		if (gameIdArr.indexOf(game_id) > -1 && is_runtime == 1) { //duration_id == 8 
			if (type == 'tournament') {
				type_num = 1;
			}
			let msgdata = {
				data: { id: id, type: type_num, start: index, records: limit,search:search },
				headers: { "Content-Type": "application/json" }
			};
			restClient.post(FPTS_URL + 'getStandings', msgdata, function (data, response) {
				if (typeof data.result !== 'undefined' && data.result != null && data.result.length > 0) {
					let result = data.result.slice(0, limit);
					result.map(element => {
						lgmIds.push(parseInt(element.lgm_id));
						let payout = (Math.round((element.payout + Number.EPSILON) * 100) / 100);
						element.payout = payout.toFixed(2).endsWith('.99') ? Math.round(element.payout) : payout;
						lgmData[element.lgm_id] = element;
					});
				}
				callback(null, { lgmIds: lgmIds, lgmData: lgmData });
			}).on('error', function (err) {
				callback(null, { lgmIds: lgmIds, lgmData: lgmData });
			});
		} else {
			callback(null, { lgmIds: lgmIds, lgmData: lgmData });
		}
	} catch (err) {
		callback(null, { lgmIds: lgmIds, lgmData: lgmData });
	}
};

exports.getLgmDataP = async (lgmReq, req) => {
	// attempt to async promise wrap getLgmData middleware
	return new Promise((resolve, reject) => {
		this.getLgmData(lgmReq, req, (err, res) => {
			if (err) reject(err);
			resolve(res);
		});
	});
};

exports.liveUpdate = (lgms, tours, user_id) => {
	return new Promise((resolve, reject) => {
		let msgdata = {
			data: { lgms: JSON.stringify(lgms), is_player: 1 },
			headers: { "Content-Type": "application/json" }
		};
		if(is_runtime == 1) {
			restClient.post(FPTS_URL + 'getLgms', msgdata, function (data, response) {
				let uLgms = {};
				if (data.result != null && data.result.length) {
					data.result.forEach(l => {
						uLgms[l.lgm_id] = l;
					});
				}
				let msgdata2 = {
					data: { tour_ids: JSON.stringify(tours), user_id },
					headers: { "Content-Type": "application/json" }
				};
				restClient.post(FPTS_URL + 'getBests', msgdata2, function (data2, response2) {
					let uTours = {};
					if (data2.result != null) {
						// data2.result.forEach(t => {
						// 	uTours[t] = data2.result;
						// });
						// Object.keys(data2.result).forEach(t_id => {
						// 	uTours[t_id] = data2.result[t_id];
						// });
						uTours = data2.result;
					}
					resolve({ uLgms, uTours });
				});
			});
		} else {
			let uLgms = {};
			let uTours = {};
			resolve({ uLgms, uTours });
		}
	});
}

exports.getTourData = (tours, user_id) => {
	return new Promise((resolve, reject) => {
		const tour_ids = [];
		const time = Math.floor(Date.now() / 1000);
		tours.forEach(t => {
			if (t.egs < time && gameIdArr.indexOf(t.game_id) > -1 && is_runtime == 1) tour_ids.push(t._id);
		});
		let msgdata = {
			data: { tour_ids: JSON.stringify(tour_ids), user_id },
			headers: { "Content-Type": "application/json" }
		};
		if(is_runtime == 1) {
			restClient.post(FPTS_URL + 'getBests', msgdata, function (data, response2) {
				if (data.result != null) {
					tours.forEach(t => {
						if (data.result[t._id] != null) {
							let commTotal = (Math.round((data.result[t._id].cumulative + Number.EPSILON) * 100) / 100);
							let commAmount = 0
							if(data.result[t._id].cumulative > 0)
							commAmount = commTotal.toFixed(2).endsWith('.99') ? Math.round(data.result[t._id].cumulative) : commTotal;
							t.tour_rank = data.result[t._id].rank;
							t.best = data.result[t._id].rank;
							t.team_total = data.result[t._id].fpts;
							t.winning = Number(commAmount);
						}
					});
				}
				resolve({ tours });
			});
		} else {
			resolve({ tours });
		}
	});
}

exports.getLgmData = (lgmReq, req, callback) => {
	let lgmIds = [];
	let is_player = 0;
	if(req.weekkey != null) {
		lgmReq = JSON.parse(JSON.stringify(lgmReq));
	}
	lgmReq.map(element => {
		if (gameIdArr.indexOf(element.game_id) > -1 && element.lg_status != null && element.lg_status == 1) { //element.duration_id==8
			lgmIds.push(parseInt(element.lgm_id));
		}
	});
	if (lgmIds.length > 0 && lgmIds.length < 250 && is_runtime == 1 && typeof req.historical === "undefined") {
		try {
			if (lgmIds.length == 1) {
				is_player = 1;
			}
			let msgdata = {
				data: { lgms: JSON.stringify(lgmIds), is_player: is_player },
				headers: { "Content-Type": "application/json" }
			};
			restClient.post(FPTS_URL + 'getLgms', msgdata, function (data, response) {
				if (typeof data.result !== 'undefined' && data.result != null && data.result.length > 0) {
					let result = data.result.slice(0, 250);
					let lgmArr = {};
					let playerArr = {};
					result.map(element => {
						lgmArr[element.lgm_id] = element;
						if (typeof lgmArr[element.lgm_id].players !== "undefined" && lgmArr[element.lgm_id].players.length > 0 && lgmIds.length == 1) {
							element.players.map(playerElem => {
								playerArr[playerElem.id] = playerElem;
							});
						}
					});
					let key = 0;
					lgmReq.map(element => {
						if (typeof lgmArr[element.lgm_id] !== "undefined") {
							if (typeof lgmArr[element.lgm_id].fpts !== "undefined") {
								lgmReq[key].team_total = lgmArr[element.lgm_id].fpts;
							}
							if (typeof lgmArr[element.lgm_id].team_rank !== "undefined") {
								lgmReq[key].team_rank = lgmArr[element.lgm_id].team_rank;
								lgmReq[key].ri = lgmArr[element.lgm_id].team_rank;
							}
							if (typeof lgmArr[element.lgm_id].tour_rank !== "undefined") {
								lgmReq[key].tour_rank = lgmArr[element.lgm_id].tour_rank;
								lgmReq[key].ri = lgmArr[element.lgm_id].tour_rank;
							}
							if (typeof lgmArr[element.lgm_id].pmr !== "undefined") {
								lgmReq[key].pmr = lgmArr[element.lgm_id].pmr;
							}
							if (typeof lgmArr[element.lgm_id].payout !== "undefined") {
								lgmReq[key].payout = lgmArr[element.lgm_id].payout;
							}
							if (req.this_week == null && element.duration_id == 8 && lgmArr[element.lgm_id].this_week != null) {
								if(req.weekkey == null) {
									lgmReq[key].pmr = lgmArr[element.lgm_id].this_week;
								}
								else {
									lgmReq[key].this_week = lgmArr[element.lgm_id].this_week;
								}
							}
							if (typeof lgmArr[element.lgm_id].players !== "undefined" && lgmArr[element.lgm_id].players.length > 0 && lgmIds.length == 1 && typeof lgmReq[key].players !== "undefined" && lgmReq[key].players.length > 0) {
								lgmReq[key].players.map((playerElem, index) => {
									if (typeof playerArr[playerElem.id] !== "undefined" && typeof lgmReq[key].players[index] !== "undefined" && playerArr[playerElem.id].events.length > 0 && playerArr[playerElem.id].events[0].fpts != null) {
										lgmReq[key].players[index].fpts = (typeof playerArr[playerElem.id].fpts !== "undefined") ? playerArr[playerElem.id].fpts : 0;
										lgmReq[key].players[index].use = (typeof playerArr[playerElem.id].use !== "undefined" && lgmReq[key].players[index].fpts > 0) ? playerArr[playerElem.id].use : false;
										/**Added the check to ignore the warning if event is undefined */
										if (typeof lgmReq[key].players[index].events == "undefined" || lgmReq[key].players[index].events == null || lgmReq[key].players[index].events.length == 0) {
											lgmReq[key].players[index].events = [{fpts: 0,scores: {}}];
										}

										lgmReq[key].players[index].events[0].fpts = (playerArr[playerElem.id].events.length > 0 && typeof playerArr[playerElem.id].events[0].fpts !== "undefined") ? playerArr[playerElem.id].events[0].fpts : 0;
										lgmReq[key].players[index].events[0].scores = (playerArr[playerElem.id].events.length > 0 && typeof playerArr[playerElem.id].events[0].scores !== "undefined") ? playerArr[playerElem.id].events[0].scores : {};
										lgmReq[key].players[index].result = (typeof playerArr[playerElem.id].result !== "undefined") ? playerArr[playerElem.id].result : [];
										lgmReq[key].players[index].result.forEach(r => {
											r.bold = r.bold.toString();
										});
										lgmReq[key].players[index].hot = (typeof playerArr[playerElem.id].hot !== "undefined") ? playerArr[playerElem.id].hot : 0;
										lgmReq[key].players[index].cold = (typeof playerArr[playerElem.id].cold !== "undefined") ? playerArr[playerElem.id].cold : 0;
									}
									else {
										if (lgmReq[key].players[index].result) {
											lgmReq[key].players[index].result.forEach(r => {
												r.bold = r.bold.toString();
											});
										}
									}
								});
								//lgmReq[key].players = lgmArr[element.lgm_id].players;
							}
						}
						key++;
					});
					req['lgmReq'] = lgmReq;
					callback(null, req);
				} else {
					req['lgmReq'] = lgmReq;
					callback(null, req);
				}
			}).on('error', function (err) {
				req['lgmReq'] = lgmReq;
				callback(null, req);
			});
		} catch (err) {
			req['lgmReq'] = lgmReq;
			callback(null, req);
		}
	} else {
		req['lgmReq'] = lgmReq;
		callback(null, req);
	}
};

exports.currentWinning = (user_id) => {
	if(is_runtime == 1) {
		return new Promise((resolve, reject) => {
			restClient.get(FPTS_URL + 'currentWinning/'+user_id, (data, response) => {
				if (data.result ==null) reject({status:"failure",message:"No respose found"});
				let winning = data.result || 0;
				resolve({status:"success", winning });
			});
		});
	} else {
		return 0;
	}
}

exports.ordinalSuffix = (i) => {
	var j = i % 10,
		k = i % 100;
	if (j == 1 && k != 11) {
		return i + "st";
	}
	if (j == 2 && k != 12) {
		return i + "nd";
	}
	if (j == 3 && k != 13) {
		return i + "rd";
	}
	return i + "th";
}

exports.roundNumbers = (nubmer) => {
	return Math.round((nubmer + Number.EPSILON) * 100) / 100;
}

exports.getPicture = (img, type, user_id) => {
	let imagepath = '';
	switch (type) {
		case 'users':
			let path = img.split('/');
			if (path.length >= 2 && path[path.length - 2] == "preset") {
				imagepath = config.S3BASE_URL + 'assets/default/images/' + path[path.length - 2] + '/' + path[path.length - 1];
			} else if (path[path.length - 1] == 'user.png') {
				imagepath = config.S3BASE_URL + 'assets/default/images/user.png';
			} else {
				imagepath = config.S3BASE_URL + 'assets/uploads/users/' + user_id + '/profile/image_50x50/' + path[path.length - 1];
			}
			break;
		case 'players':
			imagepath = config.S3BASE_URL + 'assets/uploads/players/' + img;
			break;
		case 'gameIcon':
			imagepath = config.S3BASE_URL + 'assets/default/images/' + img;
			break;
	}
	return imagepath;
}

exports.getGameIcon = (game_id) => {
	let icon = '';
	switch (game_id) {
		case 1:
			icon = 'nhl';
			break;
		case 2:
			icon = 'nfl';
			break;
		case 3:
			icon = 'mlb';
			break;
		case 4:
			icon = 'nba';
			break;
		case 5:
			icon = 'pga';
			break;
	}
	return icon;
}


exports.getErrorMessage = (errorObj) => {

    var errorMsg = "";
    if (errorObj && errorObj.name == "ValidationError") {
        for (let field in errorObj.errors) {
            errorMsg += errorObj.errors[field].message + " ";
        }
    }

    if (errorObj && errorObj.name == "CastError") {
        errorMsg += errorObj.reason ? errorObj.reason : "";
        errorMsg += errorObj.message ? errorObj.message : "";
    }

    if (errorObj && errorObj.name == "MongoError") {

		errorMsg += errorObj.errmsg;
    }

    if (errorMsg.trim() == "") {
        errorMsg += errorObj.toString();
    }

    return errorMsg;
}

exports.getPositionBGCommon = (position) => {
	var colors = {
		"QB": "#C03D5B-1",
		"RB": "#2E8E71-1",
		"WR": "#B2933D-1",
		"TE": "#2F7FE0-1",
		"DEF": "#662964-1",
		"K": "#247375-1",
		"FLEX": "#995D0E-1",
		"C": "#2F7FE0-1",
		"LW": "#135E36-1",
		"RW": "#A8A31E-1",
		"D": "#2E489E-1",
		"G": "#2E8E71-1",
		"1B": "#995D0E-1",
		"2B": "#135E36-1",
		"3B": "#247375-1",
		"SS": "#A8A31E-1",
		"LF": "#662964-1",
		"CF": "#2E489E-1",
		"RF": "#8F334F-1",
		"SP": "#70110D-1",
		"TG": "#70110D-1",
		"BN": "#787878-1",
		"IR": "#787878-1",
		"W": "#1C3020-1",
		"F": "#B2933D-1",
		"S": "#2E489E-1",
		"MI": "#8F334F-1",
		"OF": "#247375-1",
		"DH": "#1C3020-1",
		"UTIL": "#1C3020-1",
		"P": "#70110D-1",
		"HT": "#1C3020-1",
		"RP": "#70110D-1",
		"PG": "#70110D-1",
		"FG": "#247375-1",
		"SG": "#135E36-1",
		"SF": "#A8A31E-1",
		"PF": "#2E489E-1",
		"IF": "#662964-1",
		"WR-TE": "#A8A31E-1",
		"SFLEX": "#70110D-1",
		"text": "#FFFFFF-1",
		"slide": "#FFFFFF-1"
	};
	if (position != '' && typeof colors[position] != "undefined") {
		return colors[position];
	} else {
		return "#FFFFFF-1";
	}
}