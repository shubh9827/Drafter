const auth = require('../middleware/auth');
const BlogsController = require('../Controllers/BlogsController');
module.exports = (app) => {
    app.post('/addBlogs', auth, BlogsController.addBlogs);
    app.get('/getList', auth, BlogsController.List);
    app.get('/blogDelete/:id', auth, BlogsController.Delete);
    app.get('/showBlog', BlogsController.show);
    app.post('/editBlog/:id', auth, BlogsController.editBlog);
    app.get ('/GroupByDates', BlogsController.GroupByDates);
    
}