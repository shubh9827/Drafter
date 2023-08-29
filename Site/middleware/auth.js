const jwt = require("jsonwebtoken");
const fs = require('fs');
const LOGS_PATH = './box-score/public/';

const verifyToken = (req, res, next) => {
    let token = req.header('authorization') || req.header('Authorization') || req.header('Authorizations') || "";
    const device_type = req.header('device_type') || "NA";
  
    if (!token) {
      const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
      const content = "Device: "+device_type+" No token found fullUrl: "+fullUrl;
      tracklogs('auth_error.txt',content);
      return res.status(403).send({"status":false, "message": "A token is required for authentication"});
    }
    try {
      const tokenArr = token.split(" ");
      token = (tokenArr.length > 1) ? tokenArr[1] : token;
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      req.user = decoded;
    } catch (err) {
      const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
      console.log("Device: ",device_type, " Invalid token fullUrl: ", fullUrl, "Token: ",token);
      return res.status(401).send({"status":false,"message": "Invalid Token"});
    }
    return next();
  };
  const tracklogs = (filename,content) => {
    content = content+"\n";
    fs.appendFile(LOGS_PATH+filename, content, (err) => {});
    return true;
  }
  module.exports = verifyToken;