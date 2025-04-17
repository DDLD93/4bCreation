const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");

const verifyTokenUser = (requiredUserTypes) => (req, res, next) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "") || req.query.token || req.body.token;
  if (!token) {
    return res
      .status(403)
      .json({ ok: false, message: "Bearer token not provided" });
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (requiredUserTypes && requiredUserTypes !== "*" && !requiredUserTypes.includes(decoded.role)) {
      return res.status(403).json({ ok: false, message: "Unauthorized user type" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, message: "Invalid token" });
  }
};
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers['authorization']?.replace("Bearer ", "") || req.query.token || req.body.token;
    if (!token) {
      return res.status(401).json({ message: 'Access denied. Token not provided.' });
    }
    const decoded = jwt.verify(token, jwtSecret); 
    req.user = decoded;
    console.log("req.user >>>", req.user, "token >>>", decoded)
    next();
  } catch (err) {
    console.log("error decoding token >>>",err.message)
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = { verifyTokenUser, verifyToken };