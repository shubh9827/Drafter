const auth = require('../middleware/auth');
const studentController = require('../controllers/StudentsController.js');
module.exports = (app) => {
    app.get('/docToCsv', studentController.docToCsv);
    app.get('/aggregateDepNStud', studentController.aggregateDepNStud);
    app.get('/depsTotalCollection', studentController.depsTotalCollection);
    app.get('/insertStudents', studentController.insertStudents);
    app.get('/rankStudents', studentController.rankStudents);
    app.get('/stResultByNameNSub', studentController.stResultByNameNSub);
}
