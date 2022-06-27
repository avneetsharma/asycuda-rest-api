const { authJwt } = require("../middlewares");
const controller = require("../controllers/user.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

// This is internal schedular   
  app.get("/api/tax-registration", [authJwt.verifyToken],controller.taxRegistration);// This is for tax registation 
  app.get("/api/push-all-tax-cetificates",[authJwt.verifyToken],controller.processCertData);



// This is for client 
  app.post("/api/postAsycudaData",[authJwt.verifyToken],controller.postAsycudaData);
  app.post("/api/postDataAttempt",[authJwt.verifyToken],controller.postDataAttempt);
  app.get("/api/taxCertificate",[authJwt.verifyToken],controller.taxClearance);
 



};
