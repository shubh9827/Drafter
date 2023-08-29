const fastCsv = require('fast-csv');
const {
    models : { Student, Department, Exam, Subject, Marks }
} = require ('../models')
const converter = require('json-2-csv');
const { StudentService } = require('../Services');
const { date } = require('joi');
const Timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const FileName = `data_${Timestamp}.csv`;
exports.docToCsv = async (req, res) => {
    try {
        const isExport = req.query.isExport;
        let query = {};
        const startDate = req.body.startDate;
        const endDate  = req.body.endDate;
        const name = req.body.name;
        const branch = req.body.branch;
        let { page, limit } = req.query;
        console.log(startDate + endDate + name + branch);
        if((!startDate && !endDate) && !name && !branch) {
            query = {}
        }
        else {
            console.log('inside the query with data'+ req.body.startDate);
            query = {
                $or : [
                       { name : req.body.name },
                       { branch : req.body.branch },
                       { dob : {
                                 $gte : req.body.startDate,
                                 $lt : req.body.endDate
                               }
                        }
                     ]
             }
        }
        const data = await StudentService.dataPagination(query, limit, page)
         if(isExport) {
            let counts = data.length;
            console.log( "these are the counts for the doccs in Student" + counts);
            if(data) {
                const formattedData = data.map( item => {
                    return {
                        rollno: item.rollno,
                        name: item.name,
                        age: item.age,
                        branch: item.branch,
                        address: JSON.stringify(item.address),
                        courseFee: item.courseFee,
                        hobbies: item.hobbies.join(', '),
                        dob : item.dob
                    }
            });
            const csv = await converter.json2csv(formattedData);
            res.setHeader('Content-Disposition', `attachment; filename = ${FileName}`);
            res.setHeader('Content-Type', 'text/csv');
            res.send(csv);
        }
        else {
            res
             .status(404)
             .json({ msg : "No such Data found" });
         }
 	}
	else {
       
        const totaldocs = data.length;
        const totalPages = Math.ceil(totaldocs / limit);
        res.send({
               totalPages : totalPages,
               data : data
            })
	}
}
catch (err)
    {
        console.log(err);
        res.status(400).json({msg : err.message})
    }
}

exports.aggregateDepNStud = async(req, res) => {
    try {
        let { limit = 10, page = 1} = req.query;
        let skip = ((limit * ( page - 1)));
        console.log(skip +" this is the value for skip");
        let limitDocs = parseInt(limit)
        const isExport = req.query.isExport
        await Student.aggregate ([
            {
                $match : {
                    $or : [
                            { name : req.body.name },
                            { branch : req.body.branch },
                            { dob : {
                                     $gte : req.body.startDate,
                                     $lt : req.body.endDate
                                   }
                            }
                        ]
                }
            },
            {
                $lookup : {
                    from : "departments",
                    localField : "branch",
                    foreignField : "departmentName",
                    as :"department"
                }
            },
            {
                $unwind :"$department"
                
            },
            {
                "$project" : {
                    "department._id" :0   
                }
            },
            { 
                $sort : {dob : 1 },
                
            },
            {
                $skip : skip
            },
            {
               $limit : limitDocs
            }
        ]).then( resultSet => {
            if(isExport) {
                console.log(JSON.stringify(resultSet));
                const formattedData = resultSet.map( item => {
                    return {
                        rollno : item.rollno,
                        name : item.name,
                        age : item.age,
                        branch : item.branch,
                        address : JSON.stringify(item.address),
                        courseFee : item.courseFee,
                        hobbies :  Array.isArray(item.hobbies) ? item.hobbies.join(', ') : '', // here i am checking for the hobbies is an array or not so that if an empty array does not throw an error.  
                        department : JSON.stringify(item.department),
                        dob : item.dob
                    }
                });
                converter.json2csv(formattedData).then((csv) => {
                    res.setHeader('Content-Disposition', `attachment; filename = ${FileName}`);
                    res.setHeader('Content-Type', 'text/csv');
                    res.send(csv);
                });
            }
            else {
                const totaldocs =  resultSet.length;
                const totalPages = Math.ceil(totaldocs / limit);
                res.send({
                            totalPages : totalPages,
                            data : resultSet
                        })
            }
       }).catch(error => console.log( error ));
    }
    catch(err) {
        console.log( err )
        res.send( err.message );
    }
}

exports.depsTotalCollection = async( req, res ) => {
    try {
        let isExport = req.query.isExport;
        await Department.aggregate ([
                {
                    $match : { departmentName : { $exists : true }}
                }, 
                {
                    $lookup : {
                        from : "students",
                        localField : "departmentName",
                        foreignField : "branch",
                        as : "totalCollection", 
                        "pipeline" : [{
                            $group: {
                                _id: null,
                                noOfSt: { $sum: 1 },
                                totalFee : {$sum : "$courseFee" }
                            },
                        }]
                    }
                },
                {
                    $unwind : "$totalCollection"
                },
                {
                    $sort : {"departmentName" : 1}
                    
                },
                {
                    $skip : skip
                },
                {
                    $
                }
            ]).then((resultSet) => {
                if(isExport) {
                    const formattedData = resultSet.map( item => {
                        return {
                            departmentName : item.departmentName,
                            hod : item.hod,
                            totalCollection : JSON.stringify(item.totalCollection),
                        }
                    });
                    converter.json2csv(formattedData).then((csv) => {
                        res.setHeader('Content-Disposition', `attachment; filename = ${FileName}`);
                        res.setHeader('Content-Type', 'text/csv');
                        res.send(csv);
                    });
                }
                else {
                    const {
                        page = 1,
                        limit = 10 
                    } = req.query;
                    let startIndex = ((page - 1) * limit);
                    let endIndex = ((page - 1) * limit + Number(limit))
                    let paginated_data = resultSet.slice(startIndex, endIndex);
                    const totaldocs =  resultSet.length;
                    const totalPages = Math.ceil(totaldocs / limit);
                    res.send({
                                totalPages : totalPages,
                                data : paginated_data
                            })
                }
        }).catch(error => console.log(error));
    }
    catch(err) {
        console.log(err)
        res.send({
            status : false,
            err : err.message
         })
    }
}

exports.insertStudents = async(req, res) => {
    try {
        const studentIds = await Student.find({branch : "cse"}).distinct('_id');
        const subjectIds = await Subject.find({departmentName : "cse"}).distinct('_id');
        const examIds = await Exam.distinct('_id');
        console.log(studentIds);
        console.log(subjectIds);
        console.log(examIds);
    
        studentIds.forEach(studentId => {
            examIds.forEach(examId => {
                subjectIds.forEach( subjectId => {
                    const marksDocument = {
                        studentId: studentId,
                        examId: examId,
                        subjectId: subjectId,
                        marks: getRandomMarks()
                    };
                    const obj = new Marks(marksDocument)
                    console.log(obj);
                    obj.save();
                });
            });
        });
        res.send({status : true, msg : "data inserted successfully"});
}
catch(err) {
        console.log(err);
        res.send(err.message)
}
};

exports.rankStudents = async(req, res) => {
    Marks.aggregate([
        {
            $group: {
                _id: '$studentId',
                totalMarks: { $sum: '$marks' },
             
            }
        },
        {
            $lookup: {
                from: 'students', 
                localField: '_id',
                foreignField: '_id',
                as: 'student'
            }
        },
        {
            $unwind: '$student'
        },
        {
            $project: {
                _id: 0,
                studentId: '$_id',
                studentName: '$student.name', 
                percentage: { $multiply: [{ $divide: ['$totalMarks', { $multiply: [18, 100] }] }, 100] },
            }
        },
        {
            $sort : { percentage : -1 }
        },
        {
            $setWindowFields: {
                sortBy: { percentage: -1 },
                output: { rank: { $rank: {} } }
            }
        }
    ]).then((result)=>{
       console.log(result);
       res.send(result);
    })
}

exports.stResultByNameNSub = async (req, res) => {
    try {
        console.log("hhdgaufvakdfhvuakfgvdKGFVZDKG");
      Marks.aggregate([
            {
                $lookup: {
                    from: 'subjects', // Replace with your actual subjects collection name
                    localField: 'subjectId',
                    foreignField: '_id',
                    as: 'subject'
                }
            },
           
            {
                $lookup: {
                    from: 'students', // Replace with your actual subjects collection name
                    localField: 'studentId',
                    foreignField: '_id',
                    as: 'student'
                }
            },
            {
                $unwind: '$student'
            },
            {
                $unwind: '$subject'
            },
            {
                $group: {
                    _id: { studentId: '$studentId', subjectId : '$subjectId' },
                    subjects : {
                        $push: {
                            subjectId: '$subject.subjectId',
                            subjectName: '$subject.subjectName',
                            Marks: '$marks'
                        }
                    }
                }
            },
            {$addFields : {name:"$student.studentName"}}
           
           
        ]).then((result) => {
            console.log(result);
            res.send(result);
        });
    }
    catch(err){
        console.log(err);
        res.send(err.message);
    }
} 

function getRandomMarks() {
    return Math.floor(Math.random() * 101); 
}