
const axios = require ('axios');

const ThirdPartyAPIs = require ('../helper/util');
const async = require('async');
const { json } = require('express/lib/response');
const apis = new ThirdPartyAPIs();
class JonSchedule {
    

    async start(){
        console.log("start job schedule")
           await apis.userLocalLogin()
                   .then(async (getAuthToken)=>{
                    console.log(getAuthToken.accessToken);
                      await apis.scheduleJobForTaxRegistation(getAuthToken.accessToken);
                      await apis.scheduleJobForPostCertificate(getAuthToken.accessToken);
                   })  
                   .catch(error => {
                    console.log(error);
                   })
         console.log("end job schedule");
    }
  };

  module.exports = JonSchedule;
  