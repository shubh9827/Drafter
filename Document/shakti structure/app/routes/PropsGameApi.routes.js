const auth = require('../middleware/auth');
module.exports = (app) => {
	const PropsGameApi = require('../controllers/PropsGameApi.Controller.js');
	app.get('/props-game/get-dummy-set', PropsGameApi.getDummySet);
	app.get('/props-game/get-props-stats', auth, PropsGameApi.getPropsStats);
	app.get('/props-game/get-props-stats/:gameId', auth, PropsGameApi.getPropsStats);
	app.get('/props-game/get-props-games', auth, PropsGameApi.getPropsGames);
	app.get('/props-game/get-props-games/:gameId', auth, PropsGameApi.getPropsGames);
	app.post('/props-game/join-props-game', auth, PropsGameApi.joinPropsGame);
	app.get('/props-game/get-my-teams/:mode', auth, PropsGameApi.getMyteams);
	app.get('/props-game/add-limitations/:gameId', PropsGameApi.addLimitations);
	app.post('/props-game/add-rules/:gameId', PropsGameApi.addRules);
	app.post('/props-game/update-bids', PropsGameApi.updateBids);
	app.post('/props-game/update-members-account-type', PropsGameApi.updateMembersAccountType);
	app.post('/props-game/update-props', PropsGameApi.updateProps);
	app.post('/props-game/update-prop-members', PropsGameApi.updatePropMembers);
	app.post('/props-game/update-prop-drafts', PropsGameApi.updatePropDrafts);
}