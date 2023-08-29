const {
		userService, 
		DummyService
 	 } = require("../services");
const fs = require('fs');
const {
  UserRegisterSchema,
  UserPasswordsSchema,
} = require("../helpers/userValidations");
const bcrypt = require("bcrypt");
const SaltRound = 10;
const {
  models: { UserModel, Dummy },
} = require("../models");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const fastCsv = require('fast-csv');
const Timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const FileName = `data_${Timestamp}.csv`;

exports.register = async (req, res) => {
 try {
	
    const valid_body = await UserRegisterSchema.validateAsync(req.body);
    const user = await userService.findOne({
      $or: [
			{email : req.body.email},
			{phoneNo : req.body.phoneNo}
		],
    });
	console.log(user + "thisis the user" )
		if (user) {
		res
		  .status(401)
		  .json(
				{ msg: "you are already registered please! login" }
			);
		}
		else {
			console.log("not user");
			const salt = await bcrypt.genSalt(SaltRound);
			const hashedPassword = await bcrypt.hash(req.body.password, salt);
			const User = {
				userName : req.body.userName,
				gender : req.body.gender,
				email : req.body.email,
				password : hashedPassword,
				phoneNo : req.body.phoneNo,
			};
			userService.create(User);
			res.send({
				status : true,
				msg : "data feeded successfully!",
			});
		}
	}
   catch (error) {
	  if (error.isJoi === true) {
			 res
			  .status(403)
			  .json({ msg: "JOI" + error.message });
	     }
    } 
};

exports.login = async (req, res, next) => {
  try {
		const user = await userService.findOne({
		$or: [
				{email : req.body.email},
				{phoneNo : req.body.phoneNo}
			],
		});
		console.log(user);
   		if (user) {
			const valid = await bcrypt.compare(req.body.password, user.password);
			if (valid == true) {
				const token = jwt.sign(
				{ 
				   _id: user.id,
				   userName: user.userName
				},
				process.env.SECRET_KEY,
				{ expiresIn: "1d" }
				);
				res
				  .status(200)
				  .json({ token, msg: "token alloted successfully!" });
			}
			else {
				res
				  .status(401)
				  .json({ msg: "password did not match!" });
			}
    	} 
		else {
			res
			  .status(401)
		      .json({ msg: "no account found with this Email or Phone No" });
		}
  } 
  catch (error) {
    if (error.isJoi === true) {
     	res
		  .status(403)
		  .json({ 
			  status : false, 
			  msg : "JOI " + error
			 });
    }
	else {
        if (error.name === "ValidationError") {
		    const errors = {};
			for (const field in error.errors) {
				errors[field] = error.errors[field].message;
			}
        	res
			  .status(400)
			  .json({ errors });
      	} 
	    else {
         	res
			  .status(500)
			  .json({ message : "Internal Server Error" });
        }
    }
  }
};

exports.resetPassword = async (req, res) => {
  try {
		const valid_body = await UserPasswordsSchema.validateAsync(req.body);
		let token;
		const authHeader = req.headers.authorization;
		if (authHeader && authHeader.startsWith("Bearer ")) {
			token = authHeader.slice(7);
		}
		else {
			res
			  .status(403)
			  .json({ msg : "Authorization Headers are Empty" });
		}
		if (token) {
			const _id = jwt.decode(token)._id;
			const user = await userService.findOne({ _id: _id });
			const salt = await bcrypt.genSalt(SaltRound);
			const verification_password = await bcrypt.compare(
				req.body.password,
				user.password
			);
			if (verification_password) {
				const new_password = req.body.newPassword;
				const confirm_password = req.body.confirmPassword;
				if (new_password === confirm_password) {
					const new_hash_pass = await bcrypt.hash(new_password, salt);
					userService.updateOne({ _id : _id }, { password : new_hash_pass });
					res
					  .status(200)
					  .json({ msg : "password reset succeessfully!" });
				} 
				else {
					res
					  .status(401)
					  .json({ msg : "newPassword and confirmPassword did not match!!" });
					}
     		 } 
	 	    else {
				res
				  .status(401)
				  .json({
					  msg : "verification failed!. Please!, enter the correct current Password",
				  });
      		}
   		 } 
	    else {
			res
			  .status(401)
			  .json({ msg : "token verification failed" });
		}
  } 
  catch (err) {
	if (err.isJoi === true) {
	    res
           .status(403)
		   .json({ msg : "JOI " + err.message });
		} 
	else {
		res.send({
			status : false,
			msg : err.message,
	    });
	}
  }
};

exports.profileShow = async (req, res) => {
  try {
    const auth_header = req.headers.authorization;
    if (auth_header && auth_header.startsWith("Bearer ")) {
		const token = auth_header.slice(7);
		const _id = jwt.decode(token)._id;
		const user = await userService.findOneAndSelect(
			{ _id : _id },
			"userName email gender phoneNo -_id"
			);
		res.send({ 
			       user,
			       msg : " This is the profile of the User"
				});
		}
	else {
		 res.send({ msg : "headers are empty" });
		}
   } 
  catch (err) {
    res.send({
      status : false,
      msg : "error occured!",
    });
  }
};
exports.forgetPassword = async (req, res) => {
  try {
		const user = await userService.findOne({
			$or: [
				  { email : req.body.email },
				  { phoneNo : req.body.phoneNo }
				],
		});
		if (user) {
			let key = generateString(15);
			let date = new Date();
			const forget_pass_key = {
				key : key,
				resetTime : date,
			};
      		userService.updateOne(
				{ $or : [
							{email : req.body.email},
							{phoneNo : req.body.phoneNo}
					   ]
				}, forget_pass_key);
      		res
			  .status(200)
			  .json({
				  key : forget_pass_key,
				  msg : "the forget password key has been set",
        	  });
   		 }
		else {
			res
			  .status(401)
			  .json({ msg : "no such account found with this Email or Phone No." });
			}
 	 } 
  catch (err) {
    res.send({
      status : false,
      msg : "error occured!",
    });
  }
};
exports.getDummyPage = async (req, res) => {
	res.render('Dummy/formDummyData');
   }

exports.dummyData = async(req, res) => {
	console.log("dummydata");
	let result = "";
	let name;
	let newEmail;
	let addresses = ['Bengaluru', 'Mumbai', 'Delhi'];
	let newArr = [];
	const String = "1234567890";
	let randomDate;
	let ran_add;
		for(let i = 0; i < 100000; i++) {
			for(let i = 0; i < 3; i++) {
				result += String.charAt(Math.floor(Math.random() * String.length));
				name = req.body.Name + result;
				newArr = req.body.Email.split("@");
				newArr.splice(1, 0, result + "@");
				newEmail = newArr.join('');
				let var_for_add = Math.floor(Math.random() * addresses.length);
				console.log(var_for_add + " var_for_add");
			    ran_add = addresses[var_for_add];
				console.log(ran_add);
 				const startDate = new Date(2023, 0, 1).getTime(); 
				const endDate = new Date(2023, 11, 31).getTime(); 
				const randomTimestamp = startDate + Math.random() * (endDate - startDate);
			    randomDate = new Date(randomTimestamp);
			}
			result = "";
			const obj = {
				Name : name,
				PhoneNo : req.body.PhoneNo,
				Gender : req.body.Gender,
				Email : newEmail,
				PinCode : req.body.PinCode,
				randomDate : randomDate,
				Address : ran_add
			}
			const dummies = await DummyService.create(obj);
			console.log(dummies);
		 }
	res.status(201).json({msg:"this is a message for successfully entering the data inside the mkongodb"});
}
exports.Search = async (req, res) => {
	if(req.body.Search) {
		console.log(req.body.Search);
		const searchValue = new RegExp(
      	req.body.Search
          .split(" ")
          .filter((val) => val)
          .map((value) => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"))
          .join("|"),
        "i"
      );
        console.log(searchValue);
	    let query = {
         $or: [
			    {Address : searchValue},
				{Name : searchValue},
			    {Email : searchValue}
			  ]
		}
		const data = await DummyService.find(query);
		console.log(data);
		const csvData = data.map((item) => [
											item.Name,
											item.Email,
											item.PhoneNo,
											item.PinCode,
											item.Gender,
											item.Address,
											item.randomDate
										   ]); 								
		fastCsv.writeToPath(`Site/files_csv/${FileName}`, csvData, { headers: true })
		.on('finish', () => {
		  console.log('CSV file successfully written.');
		});			
		res.send(csvData);
 	}
	else {
      res.status(404).json({msg : "No such Data found"});
	}
}

exports.filterByBoth = async(req, res) => {
	let query = {};
	if(req.body.Search) {
		console.log(req.body.Search);
		const searchValue = new RegExp(
      	req.body.Search
          .split(" ")
          .filter((val) => val)
          .map((value) => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"))
          .join("|"),
        "i"
      );
	 console.log(searchValue+'**********************************************************')
		if (req.body.StartDate && !req.body.EndDate) {
				console.log("inside StartDate");
				query = {
					randomDate : {$gte : new Date(req.body.StartDate)},
					$or: [
							{Address: searchValue},
							{Name : searchValue},
							{Email : searchValue}
					]
				}
		}
		else if(req.body.EndDate && !req.body.StartDate) {
				console.log("inside EndDate")
				query = {
					randomDate : {$lt : new Date(req.body.EndDate)},
					$or: [
							{Address : searchValue},
							{Name : searchValue},
							{Email : searchValue}
						]
				}
		}
		else {
				console.log("inside both")
				query = {
					randomDate : {
									$gte : new Date(req.body.StartDate),
									$lt : new Date(req.body.EndDate)
								},
					$or: [	
						    {Address : searchValue},
							{Name : searchValue},
							{Email : searchValue}
						 ]
				}
		}
		const data = await DummyService.find(query);
		console.log(data);
		
		console.log(req.body.Search + req.body.StartDate + req.body.EndDate);
		const csvData = data.map((item) => [
			item.Name,
			item.Email,
			item.PhoneNo,
			item.PinCode,
			item.Gender,
			item.Address,
			item.randomDate,
		]); 

		fastCsv.writeToPath(`Site/files_csv/${FileName}`, csvData, {headers:true})
		.on('finish', () => {
		console.log('CSV file successfully written.');
		});			
		res.send(csvData);
	}
}

exports.filterAggre = async(req, res) => {
	let query = {};
	let data;
	if(req.body.Search) {
		console.log(req.body.Search);
		const searchValue = new RegExp(
      	req.body.Search
          .split(" ")
          .filter((val) => val)
          .map((value) => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"))
          .join("|"),
        "i"
      );
	 console.log(searchValue+'**********************************************************')
		if (req.body.StartDate && !req.body.EndDate) {
				console.log("inside StartDate");
				data = Dummy.aggregate([{
					$match : {
						randomDate : {$gte : req.body.StartDate},
						$or : [
							   {Name : searchValue},
						       {Address : searchValue},
							   {Email : searchValue}]
					}
				}
				])
		}
		else if(req.body.EndDate && !req.body.StartDate) {
				console.log("inside EndDate")
				data = Dummy.aggregate([{
					$match : {
						randomDate : {
										$lt : req.body.EndDate
									 },
						$or : [
							   {Name : searchValue},
						       {Address : searchValue},
							   {Email : searchValue}
							  ]
					}
				}])
		}
		else {
				console.log("inside both"+req.body.StartDate + req.body.EndDate);
				 data = await Dummy.aggregate([{
					$match : {
						$and :[
						  {
							randomDate : {
								$gte : new Date(req.body.StartDate),
								$lt : new Date(req.body.EndDate)
							}
						  },
						  {
							$or : [
									{Name : searchValue},
									{Address : searchValue},
									{Email : searchValue}
								]
						  }
					     ]
				   }
			    }])
			}
				 console.log(data);
				  const csvData =  data.map((item) => [
														item.Name,
														item.Email,
														item.PhoneNo,
														item.PinCode,
														item.Gender,
														item.Address,
														item.randomDate,
													]); 
		
					fastCsv.writeToPath(`Site/files_csv/${FileName}`, csvData, {headers:true})
					.on('finish', () => {
					console.log('CSV file successfully written.');
					});			
					res.send(csvData);
				}
			}
			
exports.filterDates = async(req, res) => {
  try {
		
		let query = {};
		if (req.body.StartDate && !req.body.EndDate) {
			console.log("inside StartDate")
				query = {
					randomDate : {$gte : req.body.StartDate}
				}
		}
		else if(req.body.EndDate && !req.body.StartDate) {
			console.log("inside EndDate")
				query = {
					randomDate : {$lt : req.body.EndDate}
				}
		}
		else {
			console.log("inside both");
				query = {
					randomDate : {$gte : req.body.StartDate, $lt : req.body.EndDate}
				}
		}
		const data = await DummyService.find(query);
		console.log(data);
		console.log(searchValue)
		console.log(req.body + req.body.StartDate + req.body.EndDate);
		const csvData = data.map((item) => [
											item.Name,
											item.Email,
											item.PhoneNo,
											item.PinCode,
											item.Gender,
											item.Address,
											item.randomDate
										]); 

		fastCsv.writeToPath(`Site/files_csv/${FileName}`, csvData, {headers:true})
		.on('finish', () => {
		console.log('CSV file successfully written.');
	    });			
		res.send(csvData);
    }
  catch(err) {

  }
}

exports.changePassword = async (req, res) => {
  try {
		const valid_body = await UserPasswordsSchema.validateAsync(req.body);
		const sent_key = req.body.key;
		const user = await userService.findOne({ key : sent_key });
		let timer_date = user.resetTime;
		timer_date = timer_date.getTime() + 300000;
		let alloted_time = new Date(timer_date);
		let current_time = new Date();
		if (user) {
			if (current_time < alloted_time) {
				let new_password = req.body.newPassword;
				let confirm_password = req.body.confirmPassword;
				if (new_password === confirm_password) {
					const salt_rounds = 10;
					const salt = await bcrypt.genSalt(salt_rounds);
					const hashed_password = await bcrypt.hash(new_password, salt);
					userService.updateOne(
						{ key : sent_key },
						{ password : hashed_password }
					);
					res
					  .status(200)
					  .json({ msg : "password changed successfully" });
					}
				else {
					res
					  .status(401)
					  .json({ msg : "password does not match" });
				}
		    }
			else {
					const user = await userService.updateOne(
						{ key : "pgMvwEiERNIv26v" },
						{ key : null, resetTime : null }
					);
					res
					  .status(401)
					  .json({ msg : "token expired" });
			}
        }
		else {
			res
			  .status(401)
			  .json({ msg : "invalid Request Key" });
		}
  } 
  catch (err) {
    if (err.isJoi === true) {
      res
	    .status(401)
	    .json({ msg : err.message });
    } 
	else {
      res.send ({
        status : false,
        msg : "error occured!",
      });
    }
  }
};

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function generateString(length) {
  	let result = " ";
	const characters_length = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters_length));
	}
	return result;
	}
