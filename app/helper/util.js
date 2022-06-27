const axios = require ('axios');

class ThirdPartyAPIs {
   async userLogin(){
    
        return new Promise((resolve, reject) =>{
               axios.post(process.env.USER_AUTH_API, {}, {
                auth: {
                  username: process.env.T_USER_NAME,
                  password: process.env.T_USER_PASSWORD
                }
              })
              .then((resp)=>{
                 
                  //console.log(JSON.parse(JSON.stringify(resp.data, null, 3)))
                  return resolve (JSON.parse(JSON.stringify(resp.data, null, 3)))
              })
              .catch(e => 
                
                {  
                    reject (e)})
        })
    }

   async taxClearance(body, token){
       return new Promise((resolve, reject)=>{
            const headers = { Authorization: `Bearer ${token}` ,  "Content-Type" : 'application/json' };
            axios.post(process.env.TAX_CLEARANCE, body, { headers })
            .then((resp)=> {
                return resolve (resp.data)
            })
            .catch((error)=> reject(error.response.data))
        })
    }

   async taxRegistration(body, token){
        
        return new Promise((resolve, reject)=>{
            const headers = { Authorization: `Bearer ${token}` ,  "Content-Type" : 'application/json' };
            axios.post(process.env.TAX_RESGISTRATION, body, { headers })
            .then((resp)=> {
                //console.log(resp);
                return resolve (resp.data)
            })
            .catch((e)=>  {
                reject(e.response.data)})
        })

    }

    async userLocalLogin(){
        
        return new Promise((resolve, reject) =>{
               axios.post(process.env.L_USER_AUTH_API,{
                        username: process.env.L_USER_NAME,
                        password: process.env.L_USER_PASSWORD
                },{}
              )
              .then((resp)=>{
                  
                  return resolve (JSON.parse(JSON.stringify(resp.data, null, 3)))
              })
              .catch(e => {
                reject (e)
                
              }
               )
        })
    }

    async scheduleJobForTaxRegistation(token){
        
        return new Promise((resolve, reject)=>{
            const headers = { "x-access-token": ` ${token}` ,  "Content-Type" : 'application/json' };
            axios.get(process.env.TAX_RESGISTRATION_LOCAL, { headers })
            .then((resp)=> {
                console.log(resp);
            })
            .catch((e)=>  {
                console.log("scheduleJobForTaxRegistation error");
            })
        })

    }

    async scheduleJobForPostCertificate(token){
        
        return new Promise((resolve, reject)=>{
            const headers = { "x-access-token": ` ${token}` ,  "Content-Type" : 'application/json' };
            axios.get(process.env.POST_CERT_LOCAL, { headers })
            .then((resp)=> {
                console.log(resp);
            })
            .catch((e)=>  {
                console.log("scheduleJobForPostCertificate error");
            })
        })

    }
}
module.exports = ThirdPartyAPIs;