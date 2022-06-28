const { authJwt } = require("../middlewares");
const controller = require("../controllers/user.controller");

module.exports = function(app) {
 

// This is internal schedular   
  app.get("/api/tax-registration",[authJwt.verifyToken],controller.taxRegistration);// This is for tax registation 
  app.get("/api/push-all-tax-certificates",[authJwt.verifyToken],controller.processCertData);



// This is for client 
  app.post("/api/postAsycudaData",[authJwt.verifyToken],controller.postAsycudaData);
  app.post("/api/postDataAttempt",[authJwt.verifyToken],controller.postDataAttempt);
  app.get("/api/taxCertificate",[authJwt.verifyToken],controller.taxClearance);
 



};
