const auth = require('../middleware/auth');
module.exports = (app) => {
	const UserApi = require('../controllers/UserController.js');
    app.post('/dateFilter', UserApi.filterDates);
	app.post('/signup', UserApi.register);
    app.post('/login', UserApi.login);
    app.post('/resetPassword',auth, UserApi.resetPassword);
    app.get('/profile', auth, UserApi.profileShow);
    app.post('/forget', UserApi.forgetPassword);
    app.post('/changePassword', UserApi.changePassword);
    app.post('/insertData',  UserApi.dummyData);
    app.post('/search', UserApi.Search);
    app.get('/getDummyPage', UserApi.getDummyPage);
    app.post('/filterByBoth', UserApi.filterByBoth);
    app.post('/filterAggre', UserApi.filterAggre);
}