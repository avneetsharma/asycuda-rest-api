
const axios = require ('axios');

const ThirdPartyAPIs = require ('../helper/util');
const async = require('async');
const { json } = require('express/lib/response');
const apis = new ThirdPartyAPIs();
class JonSchedule {
    

    async startTaxRegistration(){
        console.log("startTaxRegistration job schedule")
        try{
            let authentication = await apis.userLocalLogin();
            apis.scheduleJobForTaxRegistation(authentication.accessToken);
        }catch(error){
            console.log("Error Occured in cron job")
            console.log(error);
            return true; 
        }
         console.log(" end startTaxRegistration  job schedule");
    }

    async startPostCertificate(){
        console.log("startPostCertificate job schedule")
        try{
            let authentication = await apis.userLocalLogin();
            apis.scheduleJobForPostCertificate(authentication.accessToken);
        }catch(error){
            console.log("Error Occured in cron job")
            console.log(error); 
            return true;
        }
      console.log(" end startPostCertificate  job schedule");
    }

  };

  module.exports = JonSchedule;
  