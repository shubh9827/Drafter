const async = require("../../../lib/node_modules/async");
const jwtDecode = require('../../../lib/node_modules/jwt-decode');
const mysqlData = require('../models/get_mysql_data');
const { 
	PlayerPropsService, 
	PlayerPropMembersService, 
	PlayerPropDraftsService, 
	PlayerPropLimitationsService,
	PlayerPropRulesService
} = require('../services');
const { Validation } = require('../helpers');
const config = require("../../../config/config");
const SuperDraftApiUrl = 'https://production.core.superdraft.io/api/provider/props';
const SuperDraftProviderKey = 'bc973e7beb49d06e713486c0774faa1e9f852b86';
const MaxDaysAgo = 15;
const PropUserMinLimit = 0.25;
const MlbPitchers = ['SP', 'RP'];
const MlbHitters = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
let SAFETY = {
	'active' : 1,
	'value' : 0,
	'label' : 'SAFETY'
};

const gameNames = {
	1 : 'NHL',
	2 : 'NFL',
	3 : 'MLB', 
	4 : 'NBA',
	5 : 'PGA',
	6 : 'MMA'
};
const gameIds = {
	3 : 1, //NHL
	1 : 2, //NFL
	2 : 3, //MLB
	4 : 4, //NBA
	5 : 5, //PGA
	10 : 6 //MMA
};

const gameSuperDraftIds = {
	1 : 3, //NHL
	2 : 1, //NFL
	3 : 2, //MLB
	4 : 4, //NBA
	5 : 5, //PGA,
	6 : 10 // MMA
};

const stackMultiplier = [
	{
		'label': '',
		'multiplier': 1,
		'player_count': 1
	},
	{
		'label': '3x',
		'multiplier': 3,
		'player_count': 2
	},
	{
		'label': '6x',
		'multiplier': 6,
		'player_count': 3
	},
	{
		'label': '10x',
		'multiplier': 10,
		'player_count': 4
	},
	{
		'label': '20x',
		'multiplier': 20,
		'player_count': 5
	},
	{
		'label': '35x',
		'multiplier': 35,
		'player_count': 6
	},
	{
		'label': '65x',
		'multiplier': 65,
		'player_count': 7
	},
	{
		'label': '100x',
		'multiplier': 100,
		'player_count': 8
	}
];

const stackMultiplierNew = {
	'default' : [
		{
			'label': '',
			'multiplier': '1',
			'player_count': 1,
			'previous': []
		},
		{
			'label': '3x',
			'multiplier': '3',
			'player_count': 2,
			'previous': []
		},
		{
			'label': '6x',
			'multiplier': '6',
			'player_count': 3,
			'previous': []
		},
		{
			'label': '10x',
			'multiplier': '10',
			'player_count': 4,
			'previous': []
		},
		{
			'label': '20x',
			'multiplier': '20',
			'player_count': 5,
			'previous': []
		},
		{
			'label': '35x',
			'multiplier': '35',
			'player_count': 6,
			'previous': []
		},
		{
			'label': '65x',
			'multiplier': '65',
			'player_count': 7,
			'previous': []
		},
		{
			'label': '100x',
			'multiplier': '100',
			'player_count': 8,
			'previous': [
				{
					'label': '2x',
					'multiplier': '2',
					'player_count': 7
				}
			]
		}
	],
	'safety' : [
		{
			'label': '',
			'multiplier': '1',
			'player_count': 1,
			'previous': []
		},
		{
			'label': '2x',
			'multiplier': '2',
			'player_count': 2,
			'previous': [
				{
					'label': '0.5x',
					'multiplier': '0.5',
					'player_count': 1
				}
			]
		},
		{
			'label': '2.25x',
			'multiplier': '2.25',
			'player_count': 3,
			'previous': [
				{
					'label': '1.25x',
					'multiplier': '1.25',
					'player_count': 2
				}
			]
		},
		{
			'label': '4x',
			'multiplier': '4',
			'player_count': 4,
			'previous': [
				{
					'label': '2x',
					'multiplier': '2',
					'player_count': 3
				}
			]
		},
		{
			'label': '5x',
			'multiplier': '5',
			'player_count': 5,
			'previous': [
				{
					'label': '1x',
					'multiplier': '1',
					'player_count': 3
				},
				{
					'label': '1.5x',
					'multiplier': '1.5',
					'player_count': 4
				}
			]
		},
		{
			'label': '10x',
			'multiplier': '10',
			'player_count': 6,
			'previous': [
				{
					'label': '1.5x',
					'multiplier': '1.5',
					'player_count': 4
				},
				{
					'label': '2.5x',
					'multiplier': '2.5',
					'player_count': 5
				}
			]
		},
		{
			'label': '25x',
			'multiplier': '25',
			'player_count': 7,
			'previous': [
				{
					'label': '2x',
					'multiplier': '2',
					'player_count': 5
				},
				{
					'label': '2.5x',
					'multiplier': '2.5',
					'player_count': 6
				}
			]
		},
		{
			'label': '50x',
			'multiplier': '50',
			'player_count': 8,
			'previous': [
				{
					'label': '2.5x',
					'multiplier': '2.5',
					'player_count': 6
				},
				{
					'label': '5x',
					'multiplier': '5',
					'player_count': 7
				}
			]
		}
	]
}
const PLAYER_IMG_URL = config.S3BASE_URL + "assets/uploads/players/";
const HIGH_STACK_JOIN = 100;

exports.getDummySet = (req, res) => {
	try {
		res.send({
			'props' : [
				{
				  "_id": "62a0ade2eb8d5b46be03f4a6",
				  "autoResolution": true,
				  "name": "Jason Panarin Total Assists",
				  "status": "open",
				  "type": "fantasy-prop",
				  "marketId": "sr:market:7001",
				  "marketProvider": "sportradar",
				  "startTimeUTC": "2022-06-10T00:00:00.000Z",
				  "sportId": "1",
				  "typeLabel": "Fantasy Player Prop",
				  "eventId": "893257061",
				  "eventSrId": "171b37ec-8bc7-4333-8073-cf13995ac4d0",
				  "player": {
					"probable": false,
					"info": [],
					"sportRadarId": "630e6b5d-0486-4bc3-a919-1f02687c1291",
					"statsId": "870153",
					"srId": "sr:player:104807",
					"playerId": 870153,
					"fName": "Artemi",
					"lName": "Panarin",
					"posAbbr": "LW",
					"teamId": 4966,
					"teamAbbr": "NYR",
					"teamColors": {
					  "secondary": "#0033A0",
					  "primary": "#C8102E"
					}
				  },
				  "question": {
					"img": "https://fanzcallassets.s3.amazonaws.com/playerImages/all/small/870153.png",
					"lblQuest": "Binjimen Victor Total Points?",
					"shortLabel": "A. Panarin Total Assists?",
					"type": "fantasy-player-ou-assists"
				  },
				  "choices": [
					{
					  "odds": 2,
					  "type": "under",
					  "actor": {
						"liveInfo": "",
						"actorType": "player",
						"actorId": "870153",
						"lblAct": "Under 0.5",
						"abrev": "U 0.5",
						"parameterType": "fantasy-player-ou",
						"parameter": "",
						"img": "",
						"result": "",
						"winningRequirement": [
						  {
							"propType": "player",
							"name": "Points",
							"scoringKey": "total.assists",
							"statProvider": "sportradar",
							"key": "assists",
							"templateId": "61b4ad9f6b137bad88745bd6",
							"value": 0.5
						  }
						],
						"actualStats": [
						  {
							"propType": "player",
							"name": "Assists",
							"scoringKey": "total.assists",
							"statProvider": "sportradar",
							"key": "assists",
							"templateId": "61b4ad9f6b137bad88745bd6",
							"value": 0
						  }
						],
						"id": "52f0b46bbbc8453ff65315bb"
					  },
					  "id": "d9a0c948fe4d56a57b8f11d5"
					},
					{
					  "odds": 2,
					  "type": "over",
					  "actor": {
						"liveInfo": "",
						"actorType": "player",
						"actorId": "870153",
						"lblAct": "Over 0.5",
						"abrev": "O 0.5",
						"parameterType": "fantasy-player-ou",
						"parameter": "",
						"img": "",
						"result": "",
						"winningRequirement": [
						  {
							"propType": "player",
							"name": "Assists",
							"scoringKey": "total.assists",
							"statProvider": "sportradar",
							"key": "assists",
							"templateId": "61b4ad9f6b137bad88745bd6",
							"value": 0.5
						  }
						],
						"actualStats": [
						  {
							"propType": "player",
							"name": "Assists",
							"scoringKey": "total.assists",
							"statProvider": "sportradar",
							"key": "assists",
							"templateId": "61b4ad9f6b137bad88745bd6",
							"value": 0
						  }
						],
						"id": "0260579a80debabd320b0be2"
					  },
					  "id": "f705eeb8dbf94fabab5c39aa"
					}
				  ],
				  "id": "9291",
				  "groupId": "807d6fa2eb3a29f148097855",
				  "createdAt": "2022-06-08T14:10:42.097Z",
				  "updatedAt": "2022-06-08T14:10:42.097Z",
				  "__v": 0
				},
				{
				  "_id": "62a0ade2eb8d5b46be03f4a7",
				  "autoResolution": true,
				  "name": "Victor Hedman Total Assists",
				  "status": "open",
				  "type": "fantasy-prop",
				  "marketId": "sr:market:7001",
				  "marketProvider": "sportradar",
				  "startTimeUTC": "2022-06-10T00:00:00.000Z",
				  "sportId": "1",
				  "typeLabel": "Fantasy Player Prop",
				  "eventId": "893257061",
				  "eventSrId": "4a930251-20bb-4127-86b8-b7921cc2ce09",
				  "player": {
					"probable": false,
					"info": [],
					"sportRadarId": "7bb70550-c28a-4e47-9a13-cc0c0fef8b38",
					"statsId": "504246",
					"srId": "sr:player:29951",
					"playerId": 504246,
					"fName": "Victor",
					"lName": "Hedman",
					"posAbbr": "D",
					"teamId": 4973,
					"teamAbbr": "TB",
					"teamColors": {
					  "secondary": "#00205B",
					  "primary": "#00205B"
					}
				  },
				  "question": {
					"img": "https://fanzcallassets.s3.amazonaws.com/playerImages/all/small/504246.png",
					"lblQuest": "Daniel Carlson Total Assists?",
					"shortLabel": "V. Hedman Total Assists?",
					"type": "fantasy-player-ou-assists"
				  },
				  "choices": [
					{
					  "odds": 2,
					  "type": "under",
					  "actor": {
						"liveInfo": "",
						"actorType": "player",
						"actorId": "504246",
						"lblAct": "Under 0.5",
						"abrev": "U 0.5",
						"parameterType": "fantasy-player-ou",
						"parameter": "",
						"img": "",
						"result": "",
						"winningRequirement": [
						  {
							"propType": "player",
							"name": "Assists",
							"scoringKey": "total.assists",
							"statProvider": "sportradar",
							"key": "assists",
							"templateId": "61b4ad9f6b137bad88745bd6",
							"value": 0.5
						  }
						],
						"actualStats": [
						  {
							"propType": "player",
							"name": "Assists",
							"scoringKey": "total.assists",
							"statProvider": "sportradar",
							"key": "assists",
							"templateId": "61b4ad9f6b137bad88745bd6",
							"value": 0
						  }
						],
						"id": "1fd28e6586f7dd623bbbc34c"
					  },
					  "id": "0721b9f278683d1b27324c3e"
					},
					{
					  "odds": 2,
					  "type": "over",
					  "actor": {
						"liveInfo": "",
						"actorType": "player",
						"actorId": "504246",
						"lblAct": "Over 0.5",
						"abrev": "O 0.5",
						"parameterType": "fantasy-player-ou",
						"parameter": "",
						"img": "",
						"result": "",
						"winningRequirement": [
						  {
							"propType": "player",
							"name": "Assists",
							"scoringKey": "total.assists",
							"statProvider": "sportradar",
							"key": "assists",
							"templateId": "61b4ad9f6b137bad88745bd6",
							"value": 0.5
						  }
						],
						"actualStats": [
						  {
							"propType": "player",
							"name": "Assists",
							"scoringKey": "total.assists",
							"statProvider": "sportradar",
							"key": "assists",
							"templateId": "61b4ad9f6b137bad88745bd6",
							"value": 0
						  }
						],
						"id": "69ed9bb0baf64a2666ba3de4"
					  },
					  "id": "9d7f0c0a99fb4227b17217eb"
					}
				  ],
				  "id": "190080",
				  "groupId": "ab66f8959680714a66b650aa",
				  "createdAt": "2022-06-08T14:10:42.121Z",
				  "updatedAt": "2022-06-08T14:10:42.121Z",
				  "__v": 0
				}
			] 
		});
	} catch(err) {
		res.status(500).send({
			status : false,
			message : err.message || "Some error occurred."
		});
	}
};

exports.getPropsStats = (req, res) => {
	try {
		const alerts  = {
			'same_players' : 'Only one prop allowed per player per ticket. Please choose another prop.'
		}
		
		let userTickets = [];
		const userId = parseInt(req.user.data['id']);
		async.waterfall([
			mysqlData.createConn.bind(null),
			getSafetyStatus.bind(null),
			mysqlData.getTournamentTickets.bind(null,userId,'pickem'),
			mysqlData.destroyConn.bind(null)
		], (err, response) => {
			if(err) throw err;
			userTickets = response['user_tickets'];
			PlayerPropRulesService.findAll({'status': 1}).then(rulesData => {
				const gameId = req.params.gameId ? parseInt(req.params.gameId) : 0; //0 == all
				if (!gameId) {
					res.send({
						'status': true,
						'entities': {
							'stats': [],
							'stack_multiplier': stackMultiplier,
							'stack_multiplier_new': stackMultiplierNew,
							'mlb_pitchers': MlbPitchers,
							'mlb_hitters': MlbHitters,
							'props_rules': rulesData || [],
							'alerts': alerts,
							'user_tickets': userTickets,
							'safety': SAFETY 
						}
					});
					return false;
				}
				
				const now = Math.floor(new Date() / 1000);
				let matchPattern = {
					'status': 1,
					'disabled': 0,
					'lock_time': { $gte: now }
				};
				if (gameId) {
					matchPattern['game_id'] = gameId;
				}
				PlayerPropsService.getDistinctRecord('bid_stats_name', matchPattern).then(resultData => {
					res.send({
						'status': true,
						'entities': {
							'stats': resultData || [],
							'stack_multiplier': stackMultiplier,
							'stack_multiplier_new': stackMultiplierNew,
							'mlb_pitchers': MlbPitchers,
							'mlb_hitters': MlbHitters,
							'props_rules': rulesData || [],
							'alerts': alerts,
							'user_tickets': userTickets,
							'safety': SAFETY
						}
					});
				}).catch(err => {
					let resMsg = Validation.getErrorMessage(err);
					res.status(200).send({
						status : false,
						message : resMsg || "Some error occurred."
					});
				});
			}).catch(err => {
				res.status(500).send({
					status : false,
					message : err.message || "Some error occurred."
				});
			});
		});
	} catch(err) {
		res.status(500).send({
			status : false,
			message : err.message || "Some error occurred."
		});
	}
};

exports.getPropsGames = (req, res) => {
	try {
		const query = req.query;
		const page = parseInt(query.page_no) || 1;
		const limit = parseInt(query.limit) || 50;
		const stats = query.stats || '';
		const gameId = (req.params.gameId) ? parseInt(req.params.gameId) : 0; //0 == all
		let message = 'success';
		
		const userId = parseInt(req.user.data['id']);
		
		let keyword = query.keyword || '';
		keyword = keyword.replace(/[^a-zA-Z0-9- ]/g, "");
		
		let now = Math.floor(new Date() / 1000);
		let matchPattern = {
			'status': 1,
			'disabled': 0,
			'lock_time': { $gte: now }
		};
		if (gameId) {
			matchPattern['game_id'] = gameId;
		}
		
		if (stats) {
			matchPattern['bid_stats_name'] = stats;
		}
		if (keyword && keyword != "") {
			matchPattern["$or"] = [
				{ 'player_name': { $regex: keyword, $options: "i" } }
			];
		}
		
		// Query Building
		let queryPattern = [];
		queryPattern.push({ $match: matchPattern });
		queryPattern.push({ $group: {
			'_id': "$event_name",
			'promo': {
				$first: '$promo'
			},
			'game_id': {
				$first: {
					$cond: { 
						if: {$eq: ['$promo', 1]}, 
						then: 0, 
						else: '$game_id'
					}
				}
			},
			'game_order': {
				$first: {
						$cond: { 
						if: {$eq: ['$game_id', 2]}, 
						then: 0, 
						else: '$game_id'
					}
				}
			},
			'lock_time': {
				$first: '$lock_time'
			},
			'no_of_players': {
				$sum: 1,
			},
			'players': {
				"$push": { prop_id: "$_id", game_id: "$game_id", lock_time: "$lock_time", player_id: "$player_id", player_stat_id: "$player_stat_id", player_sr_id: "$player_sr_id", player_name: "$player_name", player_image: "$player_image", player_position: "$player_position", question: "$question", options: "$options", event: "$event", bid_stats_name: "$bid_stats_name", bid_stats_value: "$bid_stats_value", event_name: "$event_name", player_team_colors : "$player_team_colors", season_id: "$season_id", promo: "$promo",
				player_position_order: {$cond: {if: {$eq: ['$game_id', 2]}, 
					then: {
						$cond: { 
							if: {$eq: ['$player_position', 'QB']}, 
							then: 1, 
							else: {
								$cond: { 
									if: {$eq: ['$player_position', 'RB']}, then: 2, 
									else: {
										$cond: { 
											if: {$eq: ['$player_position', 'WR']}, then: 3, 
											else: 4
										}
									}
								}
							}
						}
					}, 
					else: {
						$cond: {
							if: {$eq: ['$game_id', 5]}, 
							then: {
								$cond: { 
									if: {
										$regexMatch: {
											input: '$bid_stats_name',
											regex: /Strokes/
										}
									}, 
									then: 1, 
									else: {
										$cond: { 
											if: {
												$regexMatch: {
													input: '$bid_stats_name',
													regex: /Birdies/
												}
											}, 
											then: 2, 
											else: {
												$cond: { 
													if: {
														$regexMatch: {
															input: '$bid_stats_name',
															regex: /Bogeys/
														}
													}, 
													then: 3, 
													else: 4
												}
											}
										}
									}
								}
							}, 
							else: 1
						}
					}
				} },
				spot_base_sort: {
					$cond: { 
						if: {$eq: ['$game_id', 6]}, 
						then: { $multiply: ['$event.start_time', -1] },
						else: {
							$cond: { 
								if: {$eq: ['$game_id', 2]}, then: '$players.player_position_order', 
								else: '$event.own'
							}
						}
					}
				}
			}}
		}});
		
		queryPattern.push({ $unwind: '$players'});
		queryPattern.push({ $sort: {'players.lock_time': 1, 'players.spot_base_sort': 1, 'players.player_position_order': 1, 'players.player_position': 1, 'players.player_name': 1}});

		queryPattern.push({ $group: {
			'_id': "$_id",
			'no_of_players': {
				$first: '$no_of_players',
			},
			'lock_time': {
				$first: '$lock_time'
			},
			'promo': {
				$first: '$promo'
			},
			'game_id': {
				$first: '$game_id'
			},
			'game_order': {
				$first: '$game_order'
			},
			'players': {"$push": '$players'}
		}});
		
		let sortPattern = {promo: -1, game_order:1, lock_time:1, _id: 1};
		PlayerPropsService.getAggregatePaginatedData(queryPattern, sortPattern, page, limit).then(paginatedData => {
			let status = true;
			if (!paginatedData.docs.length && page == 1) {
				if (keyword) {
					message = `Props for "${keyword}" are not available at this time`;
				}
				else if (gameId) {
					message = `Props for "${gameNames[gameId]}" are not available at this time`;
				}
				else {
					message = `Props are not available at this time`;
				}
				status = false;
			}
			
			res.send({
				'status' : status,
				'page_no' : page,
				'player_img_base_url' : PLAYER_IMG_URL,
				'message' : message,
				'entities' : paginatedData.docs || []
			});
		}).catch(err => {
			let resMsg = Validation.getErrorMessage(err);
			res.status(200).send({
				status : false,
				message : resMsg || "Some error occurred."
			});
		});
	} catch(err) {
		res.status(500).send({
			status : false,
			message : err.message || "Some error occurred."
		});
	}
};

exports.joinPropsGame = (req, res) => {
	try {
		const authorizations = (req.header('Authorizations')) ? req.header('Authorizations') : req.header('Authorization');
		const deviceType = (req.header('device_type')) ? req.header('device_type') : 'web';
		const userId = parseInt(req.user.data['id']);
		
		let requestData = req.body;
		requestData['user_id'] = userId;
		requestData['entry_fee'] = parseFloat(requestData['entry_fee']);
		requestData['type'] = 'join_league';
		requestData['device_type'] = deviceType;
		requestData['ticket_id'] = requestData['ticket_id'] || 0;
		requestData['safety'] = requestData['safety'] || 0;
		requestData['multiplier'] = (requestData['safety']) ? 'safety' : 'default';
		
		/*if (deviceType == 'android') {
			let selectionIds = Object.keys(requestData['selections']);
			selectionIds.forEach(selectionId => {
				let choice = requestData['selections'][selectionId];
				requestData['selections'][selectionId] = (choice == 'under') ? 'over' : 'under';
			});
		}*/
		
		async.waterfall([
			mysqlData.createConn.bind(null),
			mysqlData.checkUserEligibility.bind(null, requestData, authorizations),
			mysqlData.checkPropUserMember.bind(null, userId, requestData['entry_fee'],requestData['ticket_id']),
			mysqlData.checkPropUserTicket.bind(null, userId,requestData['ticket_id'], requestData['entry_fee']),
			checkPropsSelections.bind(null, requestData),
			checkPromoPropsSelections.bind(null, requestData),
			checkPropsSelectionsFromSuperDraft.bind(null),
			checkPropsRules.bind(null, requestData),
			getPropsLimitations.bind(null, requestData),
			checkPropsLimitations.bind(null, requestData),
			checkPropsSelectionsCombo.bind(null, requestData),
			createPropUserMember.bind(null, requestData),
			mysqlData.walletEntryPropMember.bind(null, authorizations),
			mysqlData.updateTicket.bind(null, userId,requestData['ticket_id']),
			mysqlData.userRolloverUpdate.bind(null, authorizations,requestData['ticket_id']),
			mysqlData.userCheckPropForReferral.bind(null, authorizations),
			mysqlData.destroyConn.bind(null)
		], (err, response) => {
			if(err) throw err;
			
			let type = (response['type']) ? response['type'] : 'join_league';
			if (!response['validUser']) {
				res.send({
					status: false,
					type: type,
					message: response['checkUserMessage']
				});
				return false;
			}
			else {
				//Notify in slack channel for higher stack props entry
				if(requestData['entry_fee'] >= HIGH_STACK_JOIN && response['highStackJoin'] != null && response['highStackJoin'].length > 0 && response['userData'] != null) {
					const myDraftersId = response['userData']['drafters_id'];
					const myEmail = response['userData']['email'];
					let slackContent = 'Drafters Id: '+myDraftersId+'  Email: '+myEmail+'  Wagered: $'+requestData['entry_fee']+'  with possible payout: $'+response['payout'].toFixed(0) +' \n '+ response['highStackJoin'].join('\n ');

					const curl = require('../../../lib/node_modules/curlrequest');
					const options = {
						url : config.EXPRESS_URL+`slackChat/slackUpdates`,
						method:'POST',
						data : {channel: 'superDraft1',message: slackContent}
					};
					curl.request(options, (err, response) => {});
				}
				res.send({ 
					status: true,
					type: type,
					dollar_balance: (parseFloat(response['dollar_balance']).toFixed(2)).toString(),
					message: 'Your entry has been submitted!'
				});
			}
		});
	} catch(err) {
		res.status(500).send({
			status : false,
			type : '',
			message : err.message || "Some error occurred."
		});
	}
};

exports.getMyteams = (req, res) => {
	try {
		const userId = parseInt(req.user.data['id']);
		const query = req.query;
		const page = parseInt(query.page_no) || 1;
		const limit = parseInt(query.limit) || 10;
		const mode = (req.params.mode) ? req.params.mode : 'live';
		const now = Math.floor(new Date() / 1000);
		
		let message = 'success';
		
		let keyword = query.keyword || '';
		keyword = keyword.replace(/[^a-zA-Z0-9- ]/g, "");
		
		let matchPattern = {
			'user_id': userId,
			'status': 1
		};
		
		if (mode == 'history') {
			matchPattern['proceed'] = 2;
		}
		else if(mode == 'upcoming') {
			matchPattern['proceed'] = 0;
			matchPattern['egs'] = { $gte: now };
		}
		else {
			matchPattern['proceed'] = { $lt: 2 };
			matchPattern['egs'] = { $lt: now };
		}
		
		if (keyword && keyword != "") {
			matchPattern["$or"] = [
				{ 'player_names': { $regex: keyword, $options: "i" } }
			];
		}
		
		let projectPattern = {
			user_id: 1,
			slug: 1,
			lg_name: 1,
			team_name: 1,
			team_image: 1,
			egs: 1,
			lgs: 1,
			entry_fee: {$toString: "$entry_fee"},
			payout_amount: {$toString: "$payout_amount"},
			winning_amount: {$toString: "$winning_amount"},
			refunded: 1,
			player_names: 1,
			proceed: 1,
			lg_code: 1,
			players: 1,
			game_status: 1,
			safety: 1,
			createdAt: 1
		};
		
		// Query Building
		let queryPattern = [];
		queryPattern.push({ $match: matchPattern });
		queryPattern.push({ $project: projectPattern });
		
		queryPattern.push({
			$lookup: {
				from: "playerpropdrafts",
				localField: "_id",
				foreignField: "player_prop_member_id",
				as: "players",
			}
		});
		
		queryPattern.push({
			$unwind: {
				path: "$players",
				preserveNullAndEmptyArrays: true
			}
		});
		
		queryPattern.push({
			$lookup: {
				from: "playerprops",
				let: { "id": "$players.player_prop_id" },
				pipeline: [
					{ $match: { $expr: { $and: [{ $eq: ['$_id', '$$id'] }] } } }, 
					{ 	
						$addFields: { 
							"current_stats": {$toString: "$current_stats"},
							"event.home_score": {$toString: "$event.home_score"},
							"event.away_score": {$toString: "$event.away_score"},
							"event.status": {$cond: { if: {$ne: ['$event.status', '']}, then: '$event.status', else: '$event.time'} },
							"event.time": {$cond: { if: {$ne: ['$event.event_status', '']}, then: '$event.event_status', else: '$event.time'} },
							"status": {$cond: {if: {$eq: [mode, 'upcoming']}, 
								then: 1, 
								else: {
									$cond: { 
										if: {$ne: ['$game_status', 'offline']}, 
										then: '$status', 
										else: {
											$cond: { if: {$ne: ['$result', '']}, then: 3, else: 1}
										}
									}
								}
							} },
						}
					}
				],
				as: "players.prop_info"
			}
		});
		
		queryPattern.push({
			$unwind: {
				path: "$players.prop_info"
			}
		});
		
		queryPattern.push({
			$group: {
				_id: "$_id",
				user_id: { $first: "$user_id" },
				slug: { $first: "$slug" },
				lg_name: { $first: "$lg_name" },
				team_name: { $first: "$team_name" },
				team_image: { $first: "$team_image" },
				egs: { $first: "$egs" },
				lgs: { $first: "$lgs" },
				entry_fee:  { $first: "$entry_fee" },
				payout_amount: { $first: "$payout_amount" },
				winning_amount: { $first: "$winning_amount" },
				refunded: { $first: "$refunded" },
				player_names: { $first: "$player_names" },
				proceed: { $first: "$proceed" },
				lg_code: { $first: "$lg_code" },
				players: { $push: "$players" },
				game_status: { $first: "$game_status" },
				safety: { $first: "$safety" },
				createdAt: { $first: "$createdAt" }
			}
		});
		
		let sortPattern = { createdAt: -1 };
		PlayerPropMembersService.getAggregatePaginatedData(queryPattern, sortPattern, page, limit).then(paginatedData => {
			let status = true;
			if (!paginatedData.docs.length && page == 1) {
				if (keyword) {
					message = `Props for "${keyword}" are not available at this time`;
				}
				else {
					message = `Go to the "Pick" section to get started!`;
				}
				status = false;
			}
			res.send({
				'status' : status,
				'page_no' : page,
				'mode' : mode,
				'player_img_base_url' : PLAYER_IMG_URL,
				'message' : message,
				'stack_multiplier': stackMultiplier,
				'stack_multiplier_new': stackMultiplierNew,
				'entities' : paginatedData.docs || []
			});
		}).catch(err => {
			let resMsg = Validation.getErrorMessage(err);
			res.status(200).send({
				status : false,
				message : resMsg || "Some error occurred."
			});
		});
	} catch(err) {
		res.status(500).send({
			status : false,
			message : err.message || "Some error occurred."
		});
	}
};

exports.addLimitations = (req, res) => {
	/*res.status(200).send({status: true, 'message': 'blocked now'});
	return false;*/
	
	try {
		const gameId = req.params.gameId ? parseInt(req.params.gameId) : 1;
		let createPattern = {
			'game_id': gameId,
			'game_abbr': gameNames[gameId],
			'limitations': {
				'per_ticket': 500,
				'per_player': 600,
				'per_combination': 800,
				'total_daily': 1000,
				'max_payout': 10000
			}
		};

		PlayerPropLimitationsService.create(createPattern).then(createdRes => {
			res.status(200).send({status: true});
		}).catch(err => {
			let resMsg = Validation.getErrorMessage(err);
			res.status(200).send({
				status: false,
				message: resMsg || "Some error occurred."
			});
		});
	} catch(err) {
		res.status(500).send({
			status : false,
			message : err.message || "Some error occurred."
		});
	}
};

exports.addRules = (req, res) => {
	try {
		const gameId = req.params.gameId ? parseInt(req.params.gameId) : 1;
		let createPattern = {
			'game_id': gameId,
			'game_abbr': gameNames[gameId],
			'abbr': req.body.abbr,
			'description':req.body.description
		};

		PlayerPropRulesService.create(createPattern).then(createdRes => {
			res.status(200).send({status: true});
		}).catch(err => {
			let resMsg = Validation.getErrorMessage(err);
			res.status(200).send({
				status: false,
				message: resMsg || "Some error occurred."
			});
		});
	} catch(err) {
		res.status(500).send({
			status : false,
			message : err.message || "Some error occurred."
		});
	}
};

exports.updateBids = (req, res) => {
	try {
		const query = req.query;
		const page = parseInt(query.page_no) || 1;
		const limit = parseInt(query.limit) || 100;
		
		let findPattern = {
			'status': 1,
			'proceed': 2,
			'refunded': 1
		};
		
		PlayerPropMembersService.findAll(findPattern).then(teams => {
			async.forEachOfSeries(teams, (team, key, cb) => {
				let pickCount = team.selection_ids.length;
				let payout = team.payout_amount;
				let updatePatternDraft = {'payout_amount' : parseFloat((payout/pickCount)).toFixed(3)};
				let findPatternDraft = { player_prop_member_id: mongoose.Types.ObjectId(team._id) };
				PlayerPropDraftsService.updateMany(findPatternDraft, updatePatternDraft).then(updatedRes => {
					cb(null);
				}).catch(err => {
					let resMsg = Validation.getErrorMessage(err);
					res.status(200).send({
						status: false,
						team_counts : 0,
						message: resMsg || "Some error occurred."
					});
				});
			}, err => {
				if (err) {
					res.status(500).send({
						'status': 'failure',
						'page_no' : page,
						message: err.message || "Some error occurred while updating teams payout status."
					});
				} 
				else {
					res.send({
						'status' : true,
						'message' : 'success',
						'page_no' : page,
						'team_counts': teams.length
					});
				}
			});
		}).catch(err => {
			let resMsg = Validation.getErrorMessage(err);
			res.status(200).send({
				status : false,
				message : resMsg || "Some error occurred."
			});
		});
	} catch(err) {
		res.status(500).send({
			status : false,
			message : err.message || "Some error occurred."
		});
	}
};

exports.updateMembersAccountType = (req, res) => {
	try {
		let distinctMatchPattern = {
			'status' : 1
		};
		PlayerPropMembersService.getDistinctRecord('user_id', distinctMatchPattern).then(userIds => {
			async.waterfall([
				mysqlData.createConn.bind(null),
				mysqlData.getUserAccounts.bind(null, userIds),
				mysqlData.destroyConn.bind(null)
			], (err, results) => {
				if(err) throw err;
				const userAccounts = results.userAccounts;
				
				async.forEachOfSeries(userAccounts, (userAccount, key, callback) => {
					let userDetail  = {
						'display_name' : userAccount['display_name'],
						'email' : userAccount['email']
					}
					
					let updatePattern = {
						'user' : userDetail
					};
							
					let findPattern = {
						'user_id' : parseInt(userAccount['id'])
					};
					
					PlayerPropMembersService.updateMany(findPattern, updatePattern).then(updatedRes => {
						callback(null);
					}).catch(err => {
						let resMsg = Validation.getErrorMessage(err);
						res.status(200).send({
							status: false,
							team_counts : 0,
							message: resMsg || "Some error occurred."
						});
					});
				}, err => {
					if (err) {
						res.status(500).send({
							'status': 'failure',
							message: err.message || "Some error occurred while updating teams payout status."
						});
					} 
					else {
						res.send({
							'status' : true,
							'message' : 'success',
							'userIds': userIds
						});
					}
				});
			});
		}).catch(err => {
			let resMsg = Validation.getErrorMessage(err);
			res.status(200).send({
				status : false,
				message : resMsg || "Some error occurred."
			});
		});
	} catch(err) {
		res.status(500).send({
			status : false,
			message : err.message || "Some error occurred."
		});
	}
};

exports.updateProps = (req, res) => {
	try {
		const query = req.query;
		const page = parseInt(query.page_no) || 1;
		const limit = parseInt(query.limit) || 50;
		let matchPattern = {
			"event.event_status_id": {$lt: 3}
		};
		let queryPattern = [];
		queryPattern.push({ $match: matchPattern });
		const sortPattern = {lock_time:1, _id: 1};
		PlayerPropsService.getAggregatePaginatedData(queryPattern, sortPattern, page, limit).then(paginatedData => {
			if (paginatedData.docs.length) {
				const props = paginatedData.docs;
				async.forEachOfSeries(props, (prop, key, callback) => {
					let event = prop.event;
					let updatePattern = {
						event_name: event['away'] + ' @ ' + event['home'] + ' - ' + event['time'],
						'event.home': event['away'],
						'event.away': event['home']
					};
					
					let findPattern = {
						'_id' : mongoose.Types.ObjectId(prop._id)	
					};
					PlayerPropsService.updateOne(findPattern, updatePattern).then(updatedRes => {
						callback(null);
					}).catch(err => {
						let resMsg = Validation.getErrorMessage(err);
						res.status(200).send({
							status: false,
							message: resMsg || "Some error occurred."
						});
					});
				}, err => {
					if (err) {
						res.status(500).send({
							'status': 'failure',
							message: err.message || "Some error occurred while creating the props."
						});
					} else {
						res.send({ 'status': true, 'count': props.length });
					}
				});
			}
			else {
				res.send({ 'status': true, 'count' : 0 });
			}
		}).catch(err => {
			let resMsg = Validation.getErrorMessage(err);
			res.status(200).send({
				status : false,
				message : resMsg || "Some error occurred."
			});
		});
	} catch(err) {
		res.status(500).send({
			status : false,
			message : err.message || "Some error occurred."
		});
	}
};

exports.updatePropDrafts = (req, res) => {
	try {
		const query = req.query;
		const page = parseInt(query.page_no) || 1;
		const limit = parseInt(query.limit) || 50;
		let matchPattern = {
			status : 1,
			account_type: 'real'
		};
		let queryPattern = [];
		queryPattern.push({ $match: matchPattern });
		const sortPattern = {_id: 1};
		PlayerPropMembersService.getAggregatePaginatedData(queryPattern, sortPattern, page, limit).then(paginatedData => {
			if (paginatedData.docs.length) {
				const teams = paginatedData.docs;
				async.forEachOfSeries(teams, (team, key, callback) => {
					let pickCount = team.selection_ids.length;
					let ticketEntryFee = team.entry_fee;
					let joinBonusAmount = team.join_bonus_amount;
					let joinCashAmount = ticketEntryFee - joinBonusAmount;
					let payout = team.payout_amount;
					
					let updatePattern = {
						join_cash_amount: (joinCashAmount) ? parseFloat((joinCashAmount/pickCount)).toFixed(3) : 0,
						join_bonus_amount: (joinBonusAmount) ? parseFloat((joinBonusAmount/pickCount)).toFixed(3) : 0,
						payout_amount: (payout) ? parseFloat((payout/pickCount)).toFixed(3) : 0
					};
					
					let findPattern = {
						'player_prop_member_id' : mongoose.Types.ObjectId(team._id)	
					};
					PlayerPropDraftsService.updateMany(findPattern, updatePattern).then(updatedRes => {
						callback(null);
					}).catch(err => {
						let resMsg = Validation.getErrorMessage(err);
						res.status(200).send({
							status: false,
							message: resMsg || "Some error occurred."
						});
					});
				}, err => {
					if (err) {
						res.status(500).send({
							'status': 'failure',
							message: err.message || "Some error occurred while creating the props."
						});
					} else {
						res.send({ 'status': true, 'count': teams.length });
					}
				});
			}
			else {
				res.send({ 'status': true, 'count' : 0 });
			}
		}).catch(err => {
			let resMsg = Validation.getErrorMessage(err);
			res.status(200).send({
				status : false,
				message : resMsg || "Some error occurred."
			});
		});
	} catch(err) {
		res.status(500).send({
			status : false,
			message : err.message || "Some error occurred."
		});
	}
};

exports.updatePropMembers = (req, res) => {
	try {
		const query = req.query;
		const page = parseInt(query.page_no) || 1;
		const limit = parseInt(query.limit) || 10;
		let message = 'success';
		
		let matchPattern = {
			'status' : 1,
			'account_type' : 'real'
		};
		
		let projectPattern = {
			user_id: 1,
			team_name: 1,
			account_type: 1,
			entry_fee: 1,
			payout_amount: 1,
			winning_amount: 1,
			refunded: 1,
			players: 1,
			createdAt: 1
		};
		
		let queryPattern = [];
		queryPattern.push({ $match: matchPattern });
		
		queryPattern.push({
			$lookup: {
				from: "playerpropdrafts",
				let: { "memberId": "$_id" },
				pipeline: [
					{ $match: { $expr: { $and: [{ $eq: ['$player_prop_member_id', '$$memberId'] }] } } },
					{ $project: { "_id": 1, "choice": 1, "player_prop_id": 1} }
				],
				as: "players"
			}
		});
		
		queryPattern.push({
			$unwind: {
				path: "$players",
				preserveNullAndEmptyArrays: true
			}
		});
		
		queryPattern.push({
			$lookup: {
				from: "playerprops",
				let: { "id": "$players.player_prop_id" },
				pipeline: [
					{ $match: { $expr: { $and: [{ $eq: ['$_id', '$$id'] }] } } },
					{ $project: { "_id": 1, "lock_time": 1} }
				],
				as: "players.prop_info"
			}
		});
		
		queryPattern.push({
			$unwind: {
				path: "$players.prop_info"
			}
		});
		
		queryPattern.push({
			$group: {
				_id: "$_id",
				user_id: { $first: "$user_id" },
				team_name: { $first: "$team_name" },
				account_type: { $first: "$account_type" },
				entry_fee:  { $first: "$entry_fee" },
				payout_amount: { $first: "$payout_amount" },
				winning_amount: {$first: "$winning_amount"},
				refunded: {$first: "$refunded"},
				players: { $push: "$players"},
				createdAt: { $first: "$createdAt" }
			}
		});
		
		queryPattern.push({ $project: projectPattern });
		var sortPattern = {_id: 1};
		
		PlayerPropMembersService.getAggregatePaginatedData(queryPattern, sortPattern, page, limit).then(paginatedData => {
			if (paginatedData.docs.length) {
				const teams = paginatedData.docs;
				async.forEachOfSeries(teams, (team, key, callback) => {
					let players = team.players;
					let lgs = 0;
					players.forEach((player, index) => {
						if (!lgs || lgs < player.prop_info.lock_time) {
							lgs = player.prop_info.lock_time;
						}
					});
					
					let updatePattern = {
						lgs : lgs
					};
					
					let findPattern = {
						'_id' : mongoose.Types.ObjectId(team._id)
					};
					
					PlayerPropMembersService.updateOne(findPattern, updatePattern).then(updatedRes => {
						callback(null);
					}).catch(err => {
						let resMsg = Validation.getErrorMessage(err);
						res.status(200).send({
							status: false,
							team_counts : 0,
							message: resMsg || "Some error occurred."
						});
					});
				}, err => {
					if (err) {
						res.status(500).send({
							'status': 'failure',
							message: err.message || "Some error occurred while creating the props."
						});
					} else {
						res.send({ 'status': true, 'count': teams.length });
					}
				});
			}
			else {
				res.send({ 'status': true, 'count' : 0 });
			}
		}).catch(err => {
			let resMsg = Validation.getErrorMessage(err);
			res.status(200).send({
				status : false,
				message : resMsg || "Some error occurred."
			});
		});
		
	
	} catch(err) {
		res.status(500).send({
			status : false,
			message : err.message || "Some error occurred."
		});
	}
};

function checkPropsSelections(requestData, req, callback) {
	if (req['validUser']) {
		const selections_ids = Object.keys(requestData['selections']);
		if (selections_ids.length > 1) {
			if (requestData['entry_fee'] < PropUserMinLimit) {
				const minLimit = parseFloat((PropUserMinLimit).toFixed(2));
				req['validUser'] = false;
				req['checkUserMessage'] = `The minimum entry fee is $${minLimit}.`;
				callback(null, req);
			}
			else {
				let now = Math.floor(new Date() / 1000);
				let matchPattern = {
					'status': 1,
					'disabled': 0,
					'lock_time': { $gte: now },
					'_id': { $in: selections_ids.map(id => mongoose.Types.ObjectId(id)) } 
				};
				PlayerPropsService.findAll(matchPattern).then(resultData => {
					if (resultData.length != selections_ids.length) {
						req['validUser'] = false;
						req['checkUserMessage'] = 'One or more selections are invalid. Please try again.';
					}
					else {
						let teams = [];
						let propsData = {};
						let playerNames = [];
						let propsGameEvents = {};
						let egs = 0;
						let lgs = 0;
						let playerSrIds = [];
						let superDraftIds = [];
						let selectedGameIds = [];
						let selectedPlayers = {};
						let promoProps = [];
						let promoAmountLimit = 0;
						let pgaChoices = [];
						let mmaEventIds = [];
						req['highStackJoin'] = [];
						
						resultData.forEach((doc, index) => {
							propsData[doc._id] = doc;

							//create content for high stakes prop entries
							if(requestData['entry_fee'] >= HIGH_STACK_JOIN) {
								let myChoice = requestData['selections'][doc._id];
								if(myChoice != null) {
									let propLine =  (index+1) + '. ' + doc.player_name + ' ' + doc.bid_stats_name + ' ' + myChoice[0].toUpperCase() + myChoice.slice(1) + ' ' + doc.bid_stats_value;
									req['highStackJoin'].push(propLine);
								}
							}
							
							if (!propsGameEvents.hasOwnProperty(doc.game_id)) {
								propsGameEvents[doc.game_id] = {};
							}
							
							if (!propsGameEvents[doc.game_id].hasOwnProperty(doc.event.event_id)) {
								propsGameEvents[doc.game_id][doc.event.event_id] = {};
							}
							
							if (!propsGameEvents[doc.game_id][doc.event.event_id].hasOwnProperty(doc.event.own)) {
								propsGameEvents[doc.game_id][doc.event.event_id][doc.event.own] = {};
							}
							
							let playerPosition = doc.player_position;
							if (doc.game_id == 3) {
								if (MlbHitters.includes(playerPosition)) {
									playerPosition = 'hitter';
								}
								else {
									playerPosition = 'pitcher';
								}
							}
							
							if (!propsGameEvents[doc.game_id][doc.event.event_id][doc.event.own].hasOwnProperty(playerPosition)) {
								propsGameEvents[doc.game_id][doc.event.event_id][doc.event.own][playerPosition] = [];
							}
							
							propsGameEvents[doc.game_id][doc.event.event_id][doc.event.own][playerPosition].push(doc.bid_stats_name);
							
							if (doc.game_id == 5) {
								doc.player_team = 'PGA';
								
								let userChoice = requestData['selections'][doc._id];
								if (doc.bid_stats_name.includes('Birdies')) {
									userChoice = (userChoice == 'over') ? 'under' : 'over';
								}
								
								pgaChoices.push(userChoice);
							}
							else if (doc.game_id == 6) {
								mmaEventIds.push(doc.event.event_id);
							}
							
							teams.push(doc.player_team);
							playerNames.push(doc.player_name);
							playerSrIds.push(doc.player_sr_id);
							superDraftIds.push(doc.super_draft_id);
							if (!selectedGameIds.includes(doc.game_id)) {
								selectedGameIds.push(doc.game_id);	
							}
							
							if (!egs || egs > doc.lock_time) {
								egs = doc.lock_time;
							}
							
							if (!lgs || lgs < doc.lock_time) {
								lgs = doc.lock_time;
							}
							
							selectedPlayers[doc._id] = doc.player_name;
							
							if (doc.promo) {
								promoProps.push((doc._id).toString());
								promoAmountLimit = doc.per_ticket_limit;
							}
						});
						teams = teams.filter((x, i, a) => a.indexOf(x) == i);
						
						let hasDuplicate = (new Set(playerSrIds)).size !== playerSrIds.length;
						if (hasDuplicate) {
							req['validUser'] = false;
							req['checkUserMessage'] = 'Only one prop per player allowed. Please choose another prop.';
						}
						else if (teams.length < 2 && teams[0] != 'PGA' && selectedGameIds.length == 1) {
							req['validUser'] = false;
							req['checkUserMessage'] = 'Entry must include players from more than 1 team.';
						}
						else if (promoProps.length > 1) {
							req['validUser'] = false;
							req['checkUserMessage'] = 'Only one promo prop allowed per ticket.';
						}
						else if (promoAmountLimit > 0 &&  promoAmountLimit < requestData['entry_fee']) {
							req['validUser'] = false;
							req['checkUserMessage'] = `The maximum entry amount for a ticket with a promo prop included is $${promoAmountLimit}. Please lower the entry amount and try again.`;
						}
						else {
							req['playerNames'] = playerNames.join(', ');
							req['propsData'] = propsData;
							req['propsGameEvents'] = propsGameEvents;
							req['pgaChoices'] = pgaChoices;
							req['mmaEventIds'] = mmaEventIds;
							req['egs'] = egs;
							req['lgs'] = lgs;
							req['superDraftIds'] = superDraftIds;
							req['selectedGameIds'] = selectedGameIds;
							req['selectedPlayers'] = selectedPlayers;
							req['promoProps'] = promoProps;
							req['validUser'] = true;
							req['checkUserMessage'] = '';
							
							let selectionIds = Object.keys(requestData['selections']);
							selectionIds.sort(function(a, b) { return (a > b ? 1 : (a === b ? 0 : -1)) });
							requestData['selection_ids'] = selectionIds;
							
							let selectionChoices = [];
							selectionIds.forEach(selectionId => {
								selectionChoices.push(requestData['selections'][selectionId]);
							});
							requestData['selection_choices'] = selectionChoices;
							
							let pickCount = Object.keys(requestData['selections']).length;
							let multiplier = 1;
							let payout = 0;
							if (pickCount) {
								let result = stackMultiplierNew[requestData['multiplier']].find(obj => obj['player_count'] === pickCount);
								if (result) {
									multiplier = result['multiplier'];
								}
							}
							payout = requestData['entry_fee'] * multiplier;
							req['payout'] = payout;
						}
					}
					callback(null, req);
				}).catch(err => {
					console.log('err', err);
					req['validUser'] = false;
					req['checkUserMessage'] = err;
					callback(null, req);
				});
			}
		}
		else {
			req['validUser'] = false;
			req['checkUserMessage'] = 'Pick two players from different teams to begin.';
			callback(null, req);
		}
	}
	else {
		callback(null, req);
	}
}

function checkPromoPropsSelections(requestData, req, callback) {
	if (req['validUser'] && req['promoProps'].length) {
		let findPattern = {
			'user_id': requestData['user_id'],
			'status': 1,
			'refunded': 0,
			'selection_ids': { "$in": req['promoProps'] }
		};
		PlayerPropMembersService.findOne(findPattern, {createdAt: 1}).then(resultData => {
			if (resultData) {
				req['validUser'] = false;
				req['checkUserMessage'] = 'Only 1 ticket allowed with the promo prop. Please remove the promo prop and try again.';
			}
			else {
				req['validUser'] = true;
				req['checkUserMessage'] = '';
			}
			callback(null, req);
		}).catch(err => {
			req['validUser'] = false;
			req['checkUserMessage'] = err;
			callback(null, req);
		});
	}
	else {
		callback(null, req);
	}
}

function checkPropsRules(requestData, req, callback) {
	if (req['validUser']) {
		let findPattern = {
			'game_id': { $in: req['selectedGameIds'] },
			'status': 1 
		};
		
		PlayerPropRulesService.findAll(findPattern).then(resultData => {
			let breakRule = '';
			resultData.forEach((doc, index) => {
				if (!breakRule) {
					if (doc.game_id == 5) {
						if (doc.abbr == 'OVER_UNDER') {
							if ((req['pgaChoices'].length > 1) && ((new Set(req['pgaChoices'])).size == 1)) {
								breakRule = doc.description;
							}
						}
					}
					else if (doc.game_id == 6) {
						if (doc.abbr == 'ONE_PROP_ONE_FIGHT') {
							if (req['mmaEventIds'].length) {
								let hasDuplicate = (new Set(req['mmaEventIds'])).size !== req['mmaEventIds'].length;
								if (hasDuplicate) {
									breakRule = doc.description;
								}
							}
						}
					}
					else {
						let propsGameEvents = req['propsGameEvents'][doc.game_id];
						Object.keys(propsGameEvents).forEach((event, index) => {
							let eventTeams = [];
							Object.keys(propsGameEvents[event]).forEach((team, index) => {
								let singleTeamPositions = Object.keys(propsGameEvents[event][team]);
								eventTeams.push(singleTeamPositions); 
								if (doc.game_id == 2) {
									if (doc.abbr == 'QB_plus_WR_OR_TE') {
										if ((singleTeamPositions.includes('QB') && singleTeamPositions.includes('WR')) || 
										(singleTeamPositions.includes('QB') && singleTeamPositions.includes('TE'))
										) {
											breakRule = doc.description;
										}
									}
									else if (doc.abbr == 'QB_passing_plus_WR_OR_TE_receiving') {
										let singleTeamBidStats = [];
										Object.keys(propsGameEvents[event][team]).forEach((pos, index2) => {
											if (['QB', 'WR', 'TE'].includes(pos)) {
												singleTeamBidStats = singleTeamBidStats.concat(propsGameEvents[event][team][pos]);
											}
										});
										
										let bidStats = [];
										if (singleTeamBidStats) {
											singleTeamBidStats.forEach((bidStatsName, index) => {
											if (bidStatsName.indexOf("+") > -1) {
												bidStatsName = bidStatsName.replace("Rush", "Rushing");
												bidStatsName = bidStatsName.replace("Rec", "Receiving");
												bidStatsName = bidStatsName.replace("Pass", "Passing");
											
												let bidStatsNameArr =  bidStatsName.split(" + ");
												bidStats.push(bidStatsNameArr[0] + ' Yards');
												bidStats.push(bidStatsNameArr[1]);
											}
											else {
												bidStats.push(bidStatsName); 
											}
											});
										}
										
										if ((bidStats.includes('Completions') && bidStats.includes('Receptions')) || 
										(bidStats.includes('Passing Yards') && bidStats.includes('Receiving Yards'))
										) {
											breakRule = doc.description;
										}
									}
								}
							});
							if (doc.game_id == 3) {
								if (eventTeams.length > 1) {
									let firstTeamPositions = eventTeams[0];
									let secondTeamPositions = eventTeams[1];
									if (doc.abbr == 'Hitter_vs_Pitcher') {
										if ((firstTeamPositions.includes('hitter') && secondTeamPositions.includes('pitcher')) || 
										(secondTeamPositions.includes('hitter') && firstTeamPositions.includes('pitcher'))
										) {
											breakRule = doc.description;
										}
									}
								}
							}
						});
					}
				}
			});
			
			if (breakRule) {
				req['validUser'] = false;
				req['checkUserMessage'] = `${breakRule} Please update your ticket and resubmit.`;
			}
			callback(null, req);
		}).catch(err => {
			req['validUser'] = false;
			req['checkUserMessage'] = err;
			callback(null, req);
		});
	}
	else {
		callback(null, req);
	}
}

function getPropsLimitations(requestData, req, callback) {
	if (req['validUser']) {
		let findPattern = {
			'game_id': { $in: req['selectedGameIds'] } 
		}
		PlayerPropLimitationsService.findAll(findPattern).then(resultData => {
			let perTicketLimit = perPlayerLimit = perCombinationLimit = perDayUserTotalLimit = maxPayoutLimit = 0 ;
			resultData.forEach((doc, index) => {
				let limitations = doc.limitations;
				if (!perTicketLimit || (limitations.per_ticket < perTicketLimit)) {
					perTicketLimit = limitations.per_ticket;
				}
				
				if (!perPlayerLimit || (limitations.per_player < perPlayerLimit)) {
					perPlayerLimit = limitations.per_player;
				}
				
				if (!perCombinationLimit || (limitations.per_combination < perCombinationLimit)) {
					perCombinationLimit = limitations.per_combination;
				}
				
				if (!perDayUserTotalLimit || (limitations.total_daily < perDayUserTotalLimit)) {
					perDayUserTotalLimit = limitations.total_daily;
				}
				
				if (!maxPayoutLimit || (limitations.max_payout < maxPayoutLimit)) {
					maxPayoutLimit = limitations.max_payout;
				}
			});
			
			if (req['userData']['prop_ticket_limit'] > 0) {
				perTicketLimit = req['userData']['prop_ticket_limit'];
			}
			
			if (req['userData']['prop_per_player_limit'] > 0) {
				perPlayerLimit = req['userData']['prop_per_player_limit'];
			}
			
			req['perTicketLimit'] = perTicketLimit;
			req['perPlayerLimit'] = perPlayerLimit;
			req['perCombinationLimit'] = perCombinationLimit;
			req['perDayUserTotalLimit'] = perDayUserTotalLimit;
			req['maxPayoutLimit'] = maxPayoutLimit;
			callback(null, req);
		}).catch(err => {
			req['validUser'] = false;
			req['checkUserMessage'] = err;
			callback(null, req);
		});
	}
	else {
		callback(null, req);
	}
}

function checkPropsLimitations(requestData, req, callback) {
	if (req['validUser']) {
		if (requestData['entry_fee'] > req['perTicketLimit']) {
			//Per Ticket Limitations
			const maxLimit = parseFloat((req['perTicketLimit']).toFixed(2));
			req['validUser'] = false;
			req['checkUserMessage'] = `The maximum entry fee is $${maxLimit}.`;
			callback(null, req);
		}
		else if (req['payout'] > req['maxPayoutLimit']) {
			//Per Payout Limitations
			const maxLimit = parseFloat((req['maxPayoutLimit']).toFixed(2));
			req['validUser'] = false;
			req['checkUserMessage'] = `The maximum payout is $${maxLimit}.`;
			callback(null, req);
		}
		else {
			//Per combination Limitations
			const now = Math.floor(new Date() / 1000);
			let matchPattern = {
				'status': 1,
				'egs': { $gte: now },
				'selection_ids': requestData['selection_ids'],
				'selection_choices': requestData['selection_choices']
			};
			
			let queryPattern = [];
			queryPattern.push({ $match: matchPattern });
			queryPattern.push({ $group: {
				_id: {
					year: {
						"$year": "$createdAt"
					},
					month: {
						"$month": "$createdAt"
					},
					day: {
						"$dayOfMonth": "$createdAt"
					}
				},
				total_entry_fee: {
					$sum: "$entry_fee"
				}
			}});
			queryPattern.push({ $group: {
				'_id': "$_id",
				'total_entry_fee': {
					$first: '$total_entry_fee',
				}
			}});
			
			PlayerPropMembersService.findTodayTotalEntryFee(queryPattern).then(resultData => {
				let totalEntryFee = (resultData.length > 0) ? resultData[0]['total_entry_fee'] : 0;
				totalEntryFee = totalEntryFee + requestData['entry_fee'];
				if (totalEntryFee > req['perCombinationLimit']) {
					req['validUser'] = false;
					req['checkUserMessage'] = 'This props combination global limit has been exceeded, please contact support.';
					callback(null, req);
				}
				else {
					//Per Player Limitations
					let matchPattern = {
						'user_id': requestData['user_id'],
						'status': 1,
						'egs': { $gte: now },
						'selection_ids': { $in: requestData['selection_ids']}
					};
					
					let queryPattern = [];
					queryPattern.push({ $match: matchPattern });
					queryPattern.push({ $project: {'_id': 0, 'selection_ids': 1, 'entry_fee': 1 } });
					queryPattern.push({ $unwind: "$selection_ids" });
					queryPattern.push({ $group: {
						_id: "$selection_ids",
						entry_fee: {
							$sum: "$entry_fee"
						}
					}});
					
					queryPattern.push({ $project: {
						'_id': 0,
						'selection_ids': "$_id", 
						'entry_fee': 1
					}});
					
					PlayerPropMembersService.findTodayTotalEntryFee(queryPattern).then(perPlayerResultData => {
						let exceededPlayer = [];
						if (perPlayerResultData) {
							perPlayerResultData.forEach(perPlayer => {
								let newEntryFee = perPlayer['entry_fee'] + requestData['entry_fee'];
								if (requestData['selection_ids'].includes(perPlayer['selection_ids']) && newEntryFee > req['perPlayerLimit']) {
									exceededPlayer.push(req['selectedPlayers'][perPlayer['selection_ids']]);
								}
							});
						}
						
						if (exceededPlayer.length > 0) {
							let exceededPlayerNames = exceededPlayer.join(', ');
							req['validUser'] = false;
							//req['checkUserMessage'] = `Daily limit has been exceeded for player(s) (${exceededPlayerNames}), please contact support.`;
							req['checkUserMessage'] = `You have a limit of $${req['perPlayerLimit']} per prop. Please reduce the entry amount and try again. Please contact support if you have any questions.`;
							callback(null, req);
						}
						else if (requestData['entry_fee'] > req['perPlayerLimit']) {
							req['validUser'] = false;
							//req['checkUserMessage'] = `Daily limit has been exceeded for player(s), please contact support.`;
							req['checkUserMessage'] = `You have a limit of $${req['perPlayerLimit']} per prop. Please reduce the entry amount and try again. Please contact support if you have any questions.`;
							callback(null, req);
						}
						else {
							//Per Day user total limit
							const startOfDay = new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString()
							const endOfDay = new Date(new Date().setUTCHours(23, 59, 59, 999)).toISOString()
							let matchPattern = {
								'status': 1,
								'user_id': requestData['user_id'],
								'createdAt': {
									$gte: new Date(startOfDay),
									$lt: new Date(endOfDay)
								}
							};
							
							let queryPattern = [];
							queryPattern.push({ $match: matchPattern });
							queryPattern.push({ $group: {
								_id: {
									year: {
										"$year": "$createdAt"
									},
									month: {
										"$month": "$createdAt"
									},
									day: {
										"$dayOfMonth": "$createdAt"
									}
								},
								total_entry_fee: {
									$sum: "$entry_fee"
								}
							}});
							queryPattern.push({ $group: {
								'_id': "$_id",
								'total_entry_fee': {
									$first: '$total_entry_fee',
								}
							}});
							
							PlayerPropMembersService.findTodayTotalEntryFee(queryPattern).then(resultData => {
								let totalEntryFee = (resultData.length > 0) ? resultData[0]['total_entry_fee'] : 0;
								totalEntryFee = totalEntryFee + requestData['entry_fee'];
								if (totalEntryFee > req['perDayUserTotalLimit']) {
									req['validUser'] = false;
									req['checkUserMessage'] = 'Your daily props limit has been exceeded, please contact support.';
								}
								else {
									req['validUser'] = true;
									req['checkUserMessage'] = '';
								}
								callback(null, req);
							}).catch(err => {
								req['validUser'] = false;
								req['checkUserMessage'] = err;
								callback(null, req);
							});
						}
					}).catch(err => {
						req['validUser'] = false;
						req['checkUserMessage'] = err;
						callback(null, req);
					});
				}
			}).catch(err => {
				req['validUser'] = false;
				req['checkUserMessage'] = err;
				callback(null, req);
			});
		}
	}
	else {
		callback(null, req);
	}
}

function checkPropsSelectionsCombo(requestData, req, callback) {
	if (req['validUser']) {
		const propUserMaxLimit = parseFloat((req['perTicketLimit']).toFixed(2));
		const now = Math.floor(new Date() / 1000);
		let matchPattern = {
			'user_id': requestData['user_id'],
			'status': 1,
			'egs': { $gte: now },
			'selection_ids': requestData['selection_ids'],
			'selection_choices': requestData['selection_choices']
		};
		
		let queryPattern = [];
		queryPattern.push({ $match: matchPattern });
		queryPattern.push({ $group: {
			_id: {
				year: {
					"$year": "$createdAt"
				},
				month: {
					"$month": "$createdAt"
				},
				day: {
					"$dayOfMonth": "$createdAt"
				}
			},
			total_entry_fee: {
				$sum: "$entry_fee"
			}
		}});
		queryPattern.push({ $group: {
			'_id': "$_id",
			'total_entry_fee': {
				$first: '$total_entry_fee',
			}
		}});
		
		PlayerPropMembersService.findTodayTotalEntryFee(queryPattern).then(resultData => {
			let totalEntryFee = (resultData.length > 0) ? resultData[0]['total_entry_fee'] : 0;
			totalEntryFee = totalEntryFee + requestData['entry_fee'];
			if (totalEntryFee > propUserMaxLimit) {
				req['validUser'] = false;
				req['checkUserMessage'] = 'The props limit has been exceeded, please contact support.';
			}
			else {
				req['validUser'] = true;
				req['checkUserMessage'] = '';
			}
			callback(null, req);
		}).catch(err => {
			req['validUser'] = false;
			req['checkUserMessage'] = err;
			callback(null, req);
		});
	}
	else {
		callback(null, req);
	}
}

function checkPropsSelectionsFromSuperDraft(req, callback) {
	if (req['validUser']) {
		const now = Math.floor(new Date() / 1000);
		let daysAgo = 1;
		let previousDate = new Date((new Date()).valueOf() - (1000 * 60 * 60 * 24));
		
		PlayerPropsService.findOne({status: 1}, {createdAt: 1}).then(resultData => {
			if (resultData) {
				const date1 = new Date(resultData.createdAt);
				const date2 = new Date();
				const diffTime = Math.abs(date2 - date1);
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
				
				previousDate = date1;
				daysAgo = (diffDays > 0) ? parseInt(diffDays) : 1;
				
				daysAgo++; //Increase one day more
			}
			daysAgo = (daysAgo < MaxDaysAgo) ? daysAgo : MaxDaysAgo;
			
			let query = `?daysAgo=${daysAgo}&status=open`;
			
			const curl = require('../../../lib/node_modules/curlrequest');
			const options = {
				url : `${SuperDraftApiUrl}${query}`,
				headers : {
					'superdraft-provider-key' : SuperDraftProviderKey
				}
			};
			
			curl.request(options, (err, response) => {
				if (!err && checkJSON(response)) {
					response = JSON.parse(response);
					let props = response;
					if (props.length) {
						let verifiedSuperDraftIds = [];
						async.forEachOfSeries(props, (record, key, cb) => {
							if (record['type'] != 'fantasy-prop' || !gameIds.hasOwnProperty(record['sportId'])) {
								cb(null);
							}
							else {
								if (req['superDraftIds'].includes(record.id)) {
									let status = (record['status'] == 'open') ? 1 : ['offline', 'cancelled'].includes(record['status']) ? 3 : 2;
									const lockTime = parseInt(Date.parse(record['startTimeUTC']) / 1000);
									if (status == 1 && lockTime < now) {
										status = 2;
									}
									
									if (status == 1) {
										verifiedSuperDraftIds.push(record.id);
									}
								}
								cb(null);
							}
						}, err => {
							if (err) {
								req['validUser'] = false;
								req['checkUserMessage'] = err.message || "Some error occurred while verifying selections ."
							} 
							else if(verifiedSuperDraftIds.length != req['superDraftIds'].length) {
								req['validUser'] = false;
								req['checkUserMessage'] = 'One or more selections are invalid. Please try again.';
							}
							callback(null, req);
						});
					}
					else {
						req['validUser'] = false;
						req['checkUserMessage'] = 'One or more selections are invalid. Please try again.';
						callback(null, req);
					}
				}
				else {
					req['validUser'] = false;
					req['checkUserMessage'] = 'Pick\'em is currently unavailable. Please check back in a few minutes!';
					callback(null, req);
				}
			});
		}).catch(err => {
			let resMsg = Validation.getErrorMessage(err);
			res.status(200).send({
				status : false,
				message : resMsg || "Some error occurred."
			});
		});
	}
	else {
		callback(null, req);
	}
}

function createPropUserMember(requestData, req, callback) {
	if (req['validUser']) {
		let userData = req['userData'];
		requestData['lg_code'] = (Math.random().toString(36).slice(2, 7));
		requestData['slug'] = requestData['lg_code'] + '-' + userData['username'];
		requestData['team_name'] = userData['drafters_id'];
		requestData['team_image'] = userData['picture'];
		requestData['account_type'] = userData['ac_type'];
		
		requestData['user'] = {
			'display_name' : userData['display_name'],
			'email' : userData['email']
		};
		
		let pickCount = Object.keys(requestData['selections']).length;
		let multiplier = 1;
		let payout = 0;
		if (pickCount) {
			let result = stackMultiplierNew[requestData['multiplier']].find(obj => obj['player_count'] === pickCount);
			if (result) {
				multiplier = result['multiplier'];
			}
		}
		payout = requestData['entry_fee'] * multiplier;
		requestData['winning_amount'] = parseFloat((payout).toFixed(2));
		requestData['player_names'] = req['playerNames'];
		requestData['lg_name'] = `${pickCount} Picks to win $${requestData['winning_amount']} ($${requestData['entry_fee']} x ${multiplier})`;
		requestData['egs'] = req['egs'];
		requestData['lgs'] = req['lgs'];
		
		let redeemableBalance = userData['redeemable_balance'];
		if(requestData['ticket_id']!=0){
			requestData['join_bonus_amount'] = requestData['entry_fee'];
		} else if (redeemableBalance >= requestData['entry_fee']) {
			requestData['join_bonus_amount'] = 0;
		} 
		else {
			requestData['join_bonus_amount'] = requestData['entry_fee'] - redeemableBalance;
		}
		
		let createPattern = requestData;
		let joinBonusAmount = 0;
		let joinCashAmount = 0;
		if(requestData['ticket_id']==0){
			if (requestData['account_type'] == 'real') {
				joinBonusAmount = requestData['join_bonus_amount'];
				joinCashAmount = requestData['entry_fee'] - joinBonusAmount;
				joinBonusAmount = (joinBonusAmount) ? parseFloat((joinBonusAmount/pickCount)).toFixed(3) : 0;
				joinCashAmount = (joinCashAmount) ? parseFloat((joinCashAmount/pickCount)).toFixed(3) : 0;
			} 
		} else if (requestData['account_type'] == 'real'){
				joinBonusAmount = requestData['entry_fee'];
				joinBonusAmount = (joinBonusAmount) ? parseFloat((joinBonusAmount/pickCount)).toFixed(3) : 0;
				joinCashAmount = 0;		
		}
		PlayerPropMembersService.create(createPattern).then(async createRes => {
			req['finger_print'] = createRes._id;
			async.forEachOfSeries(requestData['selections'], (choice, propId, cb) => {
				let draftsCreatePattern = {
					player_prop_member_id : createRes._id,
					player_prop_id: req['propsData'][propId]['_id'],
					player_id: req['propsData'][propId]['player_id'],
					bid_stats_name: req['propsData'][propId]['bid_stats_name'],
					choice: choice,
					join_bonus_amount: joinBonusAmount,
					join_cash_amount: joinCashAmount,
					payout_amount: 0
				};
				PlayerPropDraftsService.create(draftsCreatePattern).then(async createRes2 => {
					let updateBidPattern = {};
					if (draftsCreatePattern['choice'] == 'over') {
						updateBidPattern = {
							$inc: {
								over_bid: createPattern['entry_fee'],
								total_bid: createPattern['entry_fee'],
								total_tickets: 1
							}
						};
					}
					else {
						updateBidPattern = {
							$inc: {
								under_bid: createPattern['entry_fee'],
								total_bid: createPattern['entry_fee'],
								total_tickets: 1
							}
						};
					}
					
					let findBidPattern = {
						'_id': mongoose.Types.ObjectId(draftsCreatePattern['player_prop_id'])
					};
					
					PlayerPropsService.updateOne(findBidPattern, updateBidPattern).then(updatedRes => {
						cb(null);
					}).catch(err => {
						req['validUser'] = false;
						req['checkUserMessage'] = Validation.getErrorMessage(err);
						cb(err);
					});
				}).catch(err2 => {
					req['validUser'] = false;
					req['checkUserMessage'] = Validation.getErrorMessage(err2);
					callback(null, req);
				});
			}, err => {
				if (err) {
					req['validUser'] = false;
					req['checkUserMessage'] = err.message || "Some error occurred while creating the props drafts."
					callback(null, req);
				} else {
					req['createPattern'] = createPattern;
					callback(null, req);
				}
			});
		}).catch(err => {
			req['validUser'] = false;
			req['checkUserMessage'] = Validation.getErrorMessage(err);
			callback(null, req);
		});
	}
	else {
		callback(null, req);
	}
}

function updatePropUserMember(findPattern, updatePattern, req, callback) {
	PlayerPropMembersService.updateOne(findPattern, updatePattern).then(updatedRes => {
		callback(null);
	}).catch(err => {
		let resMsg = Validation.getErrorMessage(err);
		let error = resMsg || "Some error occurred.";
		console.log('error', error);
		callback(error);
	});
}

function getSafetyStatus(req, callback) {
	try {
		Redisclient.get('prop_safety_status', function (err, safetyStatus) {
			if(err) throw err;
			if (safetyStatus == null) {
				mysqlData.getSafetyStatus(req, function (err, req) {
					if(err) throw err;
					Redisclient.set('prop_safety_status', req['prop_safety']);
					SAFETY['active'] = (req['prop_safety'] == 'Y') ? 1 : 0;
					callback(null, req);
				});
			}
			else {
				SAFETY['active'] = (safetyStatus == 'Y') ? 1 : 0;
				callback(null, req); 
			}
		});
	} catch (err) {
		let error = err.message || "Some error occurred.";
		callback(error, req);
	}
}

function checkJSON(strJson) {
	try {
		const parsed = JSON.parse(strJson);
		if (parsed && typeof parsed === "object") {
			return true;
		}
	} catch(err) { return false; }
	return false;
}