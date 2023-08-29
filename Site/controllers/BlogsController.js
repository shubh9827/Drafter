const { BlogsService } = require('../services');
const multer = require('multer');
const { BlogSchema } = require('../helpers/blogsvalidations');
const jwt = require('jsonwebtoken');
const {
     models:{ BlogsModel } 
    } = require('../models')
const mongoose = require('mongoose');

exports.addBlogs = async (req, res) => {
    var file_name;
    let form_data_obj = {};
    var maxSize = 1 * 1000 * 1000;
    var storage = multer.diskStorage({
                                        destination : function (req, file, callback) {
                                        callback(null, './BlogImages');
                                        },
                                        filename : function (req, file, callback) {
                                        callback(null, file.originalname);
                                        file_name = file.originalname;
                                        },
                                        onFileUploadStart : function(file, req, res) {
                                          if(req.files.file.length > maxSize) {
                                            res
                                                .status(403)
                                                .json({msg:"fail to uplaod image size greater than the required Size"})
                                          }
                                        }
                                     });
    var upload = multer({
                          storage : storage
                        })
                        .single('image');

     upload(req, res, async function (err) {
      try {
          const valid_body = await BlogSchema.validateAsync(req.body)
          if(err) {
            throw new Error(err.message)
          }
          let token
          let authHeader = req.headers.authorization;
          if(authHeader && authHeader.startsWith('Bearer ')) {
               token = authHeader.slice(7);
               console.log("hi ai m inside the addBlogs function");
           }
          else {
              res 
                .status(403)
                .json({msg:"headers are empty token is not present"})
              }
          let _id = jwt.decode(token)._id;
          const obj = {
              title : req.body.title,
              imageName : req.file.filename,
              description : req.body.description,
              userId : _id, 
              tags : req.body.tags
           }
          await BlogsService.create(obj);
          res
          .status( 200 )
          .json({msg : "Blog Added Successfully!!"});
    } 
    catch(err) {
      if(err.isJoi === true) {
           res
            .status(401)
            .json({msg : err.message})
      }
      else {
        console.log(err);
      }
    }
  });
}

exports.Delete = async (req, res, next) => {
  try {
      let _id = req.params.id 
      console.log(req.params.id)
      BlogsService.updateOne(
                              {_id : _id},
                              {isDeleted : true}
                            );
      res 
        .status(200)
        .json({msg:"Deleted Successfully"})
  }
  catch(err) {
    if(err.isJoi === true) {
      res
        .status(401)
        .json({msg : err.message})
    }
    else {
      console.log(err);
    }
  }
}

exports.GroupByDates = async (req, res, next) => {
  try {
    console.log('******************************')
    let array = await BlogsModel.aggregate([
      {
        $match: { 
          createdAt : { 
            $exists: true 
          } 
        },
      },
      {
        $unwind: '$tags', 
      },
      {
        $sort: { tags: -1 }, 
      },
      {
        $group: {
          _id: { 
            $dateToString : {
              format : '%Y-%m-%d',
              date: '$createdAt' 
            }
           },
          blogs: {
              
              $push: '$$ROOT',
                },
        },

      },
      {
        $addFields: {
          'blogs.imageURL': {
            $map: {
              input: '$blogs',
              as: 'blog',
              in: {
                $concat: [
                  'http://localhost:8000/images/',
                  '$$blog.imageName',
                ],
              },
            },
          },
        },
      },
      {
        $sort: { _id: 1 }
      }
     
      
    ]);
    console.log(array);
    res.status(200).json({msg : array});
  }
  catch(err) {
    console.log(err);
  }
}

exports.List = async (req, res, next) => {
  try {
    let reqData = req.query;
    let columnNo = parseInt(reqData.order[0].column);
    let sortOrder = reqData.order[0].dir === "desc" ? -1 : 1;
    let query = {
                  title : { $ne : null },
                  isDeleted : false
                };
    if (reqData.search.value) {
          const searchValue = new RegExp(
          reqData.search.value
              .split(" ")
              .filter((val) => val)
              .map((value) => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"))
              .join("|"),
            "i"
          );
          query.$or = [
                        { title : searchValue },
                        { tags : searchValue }
                      ];
    } 
    let sortCond = { created : sortOrder };
    let response = {};
    switch (columnNo) {
          case 1 :
            sortCond = {
              title : sortOrder,
            };
            break;
          case 2 :
            sortCond = {
              tags : sortOrder,
            };
            break;
          default :
            sortCond = { 
              createdAt : sortOrder
            };
            break;
    }
    const count = await BlogsModel.countDocuments(query);
    response.draw = 0;
    if (reqData.draw) {
          response.draw = parseInt(reqData.draw) + 1;
    }
    response.recordsTotal = count;
    response.recordsFiltered = count;
    let skip = parseInt(reqData.start);
    let limit = parseInt(reqData.length);
    let blogs = await BlogsModel.find(query)
                                .sort(sortCond)
                                .skip(skip)
                                .limit(limit)
                                .lean();
    console.log(blogs);
    if (blogs) {
          blogs = blogs.map((blog) => {
              let actions = "";
              actions = `${actions}<a href="/blogEdit/${blog._id}" title="edit"> | <i class="fas fa-edit"></i> | </a>`;
              actions = `${actions}<a class="ItemDelete" confirm_message="Are you sure you want to delete ${blog.Name} account" href="/blogDelete/${blog._id}" title="Delete"> <i class="fas fa-trash"></i> | </a>`;
              actions = `${actions}<a href="/patient/view/${blog._id}" title="view"><i class="icofont-user"></i></a>`; 
              return {
                0: (skip += 1),
                1: blog.title,
                2: blog.tags,
                3: blog.description,
              };
          });
     }
    response.data = blogs;
    return res.send(response);
  }
  catch(err) {
    if(err.isJoi === true){
      res
        .status(401)
        .json({msg:err.message})
    }
    else {
      console.log(err);
    }
  }
}
  
exports.show = async (req, res) => {
     try {
          const user_blog = await BlogsService.findOneAndSelect({
                                                                  $or : [
                                                                           { tags : req.body.tags },
                                                                           { title : req.body.title }
                                                                        ]
                                                                }, "title description tags imageName -_id");
          console.log(user_blog);
          if (user_blog) {
            res.status(201).json({
              BLOG : user_blog,
              img : `http://localhost:8000/images/${user_blog.imageName}`,
              msg : "this is the blog",
            });
          }
          else {
            res
              .status(404)
              .json({
                  msg : "Blog not found!"
               });
          }
     }
      catch(err) {
          if(err.isJoi === true){
            res
              .status(401)
              .json({msg:err.message})
          }
          else {
            console.log(err);
          }
      }
} 

  exports.editBlog = async (req, res) => {
    var maxSize = 1 * 1000 * 1000;
    var storage = multer.diskStorage({
        destination : function (req, file, callback) {
          callback(null, './BlogImages');
        },
        filename : function (req, file, callback) {
          callback(null, file.originalname);
          file_name = file.originalname;
        },
        onFileUploadStart : function(file, req, res) {
          if(req.files.file.length > maxSize) {
            res
              .status(403)
              .json({msg : "fail to uplaod image size greater than the required Size"})
          }
        }
    });
    var upload = multer({
                          storage : storage
                        })
                        .single('image');

    upload(req, res, async function (err) {
     try {
      if (err) {
         console.log(err.message);
      }
      else {
         const valid_body = await BlogSchema.validateAsync(req.body) 
         const user_blog = await BlogsService.findOne({
                                                        _id : req.params.id
                                                      });
         console.log(user_blog+ "this user_blog ^^^^"+ req.params.id+" and that was the req .params i");
         if (!user_blog) {
              res
                .status(404)
                .json({
                        msg:"no blogs uploded yet with this title or tags"
                      }) 
          }
         else {
              console.log(req.body.title + req.params.id);
              const updated_blog = await BlogsService.updateOne({
                                                                    _id : req.params.id
                                                                },
                                                                {
                                                                    title : req.body.title,
                                                                    description : req.body.description,
                                                                    tags : req.body.tags,
                                                                    imageName : req.file.filename
                                                                });
              console.log(updated_blog)
              res.status(201).json({
                                      msg : "Blog updated successfully",
                                      updatedBlog : updated_blog
                                  });
          }
       }
     }
     catch(err) {  
      if(err.isJoi === true){
         res
          .status(401)
          .json({msg:err.message})
      }
      else {
        console.log(err);
      }
     } 
    })
  }

