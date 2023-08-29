const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const PlayerPropsSchema = mongoose.Schema({
	game_id: {
		type: Number,
		required: [true, "Game ID must be provided."],
		index: true
	},
	season_id: {
		type: Number,
		required: [true, "Season ID must be provided."],
		index: true
	},
	super_draft_id: {
		type: String,
		required: [true, "Super Draft ID must be provided."],
		index: true
	},
	player_sr_id: {
		type: String,
		required: [true, "Player SR ID must be provided."]
	},
	player_id: {
		type: String,
		required: [true, "Player ID must be provided."],
		index: true
	},
	player_stat_id: {
		type: String,
		required: [true, "Player Stat ID must be provided."],
		index: true
	},
	player_name: {
		type: String,
		required: [true, "Player Name must be provided."]
	},
	player_image: {
		type: String,
		required: [true, "Player Image must be provided."]
	},
	player_team: {
		type: String,
		/*required: [true, "Player Team Abbr must be provided."]*/
	},
	player_position: {
		type: String,
		/*required: [true, "Player Position must be provided."]*/
	},
	player_team_colors: {
		type: String,
		required: [true, "Player team color must be provided."]
	},
	event_name: {
		type: String,
		required: [true, "Event Name must be provided."]
	},
	event: {
		type: Object,
		required: [true, "Event Object must be provided."]
	},
	question: {
		type: String,
		required: [true, "Question must be provided."]
	},
	options: {
		type: Array,
		required: [true, "Options must be provided."]
	},
	bid_stats_name: {
		type: String,
		required: [true, "Bid Stats Name must be provided."]
	},
	bid_stats_value: {
		type: Number,
		required: [true, "Bid Stats Value must be provided."]
	},
	event_name: {
		type: String,
		required: [true, "Event Name must be provided."]
	},
	lock_time: {
		type: Number,
		required: [true, "Lock Time must be provided."],
		index: true
	},
	outcome: { type: Number, enum: [1, 0], default: 0 },
	result: { type: String, default: '' }, //over/under/push
	status: { type: Number, enum: [1, 2, 3], default: 1 }, //(1/2/3)[open,running,closed]
	current_stats: { type: Number, default: 0 },
	over_bid: { type: Number, default: 0 },
	under_bid: { type: Number, default: 0 },
	total_bid: { type: Number, default: 0 },
	total_tickets: { type: Number, default: 0, index: true },
	game_status: { type: String, default: '' },
	disabled: { type: Number, default: 0 },
	by_admin: { type: Number, default: 0 },
	promo: { type: Number, enum: [1, 0], default: 0, index: true },
	per_ticket_limit: { type: Number, default: 0 },
	description: {
		type: String
	}
},
{
  timestamps: true
});

PlayerPropsSchema.plugin(mongoosePaginate);
PlayerPropsSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('PlayerProps', PlayerPropsSchema);