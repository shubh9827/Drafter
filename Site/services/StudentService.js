"use strict";
const exportFuns = {};
const  { models : { Student } }= require('../models')

exportFuns.find  = async (obj, sortOrder) => {
    console.log('hi iam here inside the studenService' + JSON.stringify(obj) + sortOrder);
      return  await Student.find(obj).sort({sortOrder : 1});
}

exportFuns.dataPagination = async (obj, limit, pageNo) => {
  let studentCond = [];
  studentCond.push(`.sort({dob : 1})`)
    if(limit && pageNo){
      studentCond.push(`limit(${limit})`)
             const skip = (pageNo - 1) * limit 
             studentCond.push(`skip(${skip})`);                
    }
    studentCond = studentCond.join(".")
    console.log(studentCond)
   
    console.log(studentCond)
    return await  eval('Student.find(obj)'+ studentCond);           
  }

exportFuns.countDocs = async () => await Student.countDocuments();

module.exports = exportFuns;