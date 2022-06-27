const oracledb = require('oracledb');


const fs = require('fs');
const config = require("../config/db.config");
const ThirdPartyAPIs = require ('../helper/util');
const async = require('async');
const { json } = require('express/lib/response');
const apis = new ThirdPartyAPIs();

exports.taxClearance = (req, res) => {
  callPostCertificateRequest(req,res);
};

async function callPostCertificateRequest(req,res){
 
  
    const p_ext_doc_no = req.query.extDocNumber;
    const p_lang_code = req.query.langCode;
  
    try{
      connection = await oracledb.getConnection({
        user: config.ORACLE_DB_USER,
        password: config.ORACLE_DB_PASSWORD,
        connectString: config.ORACLE_DB_CONNECTION_STRING
    });
    //console.log('Connected to oracle DB'+p_ext_doc_no );
        const sql = `BEGIN :ret := pck_asycuda_intf.get_certificate_dtl(${p_ext_doc_no},${p_lang_code});END;`;
          await connection.execute(sql,{ret: { dir: oracledb.BIND_OUT,type: oracledb.STRING, maxSize:999999}},
          async function (err, result) {
                 if (err) {
                     console.log('erro block in execute oracle query');
                     console.error(err.message);
                     res.status(500).send("Server is not reponding Please try again after sometime!");
                 } else {
                  // var  reqBody=JSON.parse(result.outBinds.ret);
                   res.status(200).send(JSON.parse(result.outBinds.ret))
                  /*  apis.userLogin()
                   .then(async (getAuthToken)=>{
                    let result =  await apis.taxClearance (reqBody, getAuthToken.access_token);
                    res.status(200).send({"Result":result.data})
                   })  
                   .catch(error => {
                    res.status(500).send({error});
                   })*/
                 }
             });
    }catch(e){
      console.log('Exception Occured at time of connection creation', e);
      res.status(500).send("Server is not reponding Please try again after sometime!");
    }finally {
      closeDBConnection(connection);
     }
}

exports.taxRegistration = (req, res) => {
  loadTaxPayerRegistrationData(req, res);
};

async function loadTaxPayerRegistrationData(req, res){

  try{
    const p_fiscal_no  = req.query.p_fiscal_no;
    const p_lang_code = req.query.langCode;
          try{
            connection = await oracledb.getConnection({
              user: config.ORACLE_DB_USER,
              password: config.ORACLE_DB_PASSWORD,
              connectString: config.ORACLE_DB_CONNECTION_STRING
            });
          console.log('Connected to oracle DB');
          oracledb.fetchAsString = [ oracledb.CLOB ]
          const sql =`SELECT pck_asycuda_intf.get_taxpayer_dtl(${p_fiscal_no },${p_lang_code}) from dual`;  

         await connection.execute(sql,
           function (err, result) {
                if (err) {
                    console.log('Error block in execute oracle query');
                    console.error(err);
                    res.status(500).send("Server is not reponding Please try again after sometime!");
                } else {
                  var resultArray =[];
                  console.log( "Array result ");
      
                  const lobData = result.rows[0][0];
                  
                  var profileArray = JSON.parse(lobData);
                  
                  console.log("Array Length"+profileArray.length);
                  //profile=profile[0];
                  if(profileArray.length > 0 ){
                    console.log("processing start");
                  apis.userLogin()
                   .then(async (getAuthToken)=>{
                      const queue = async.queue((task, completed) => {
                         sleep(2000);
                      
                          console.log("Currently Busy Processing Task  " + task.tin);
                         
                         apis.taxRegistration(task, getAuthToken.access_token).then(result=>{
                          console.log( " Record Process successfully");
                         // console.log(result);
                          var sucess_tin = {"tin": task.tin,"processedFl": "Y", "description": result.data };
                          resultArray.push(sucess_tin);
                        })
                        .catch(error => {
                          //console.log(error)
                          console.log( "Error occured while executing record for tax registration  "+task.tin);
                          var error_message =error.errors;
                          if(error_message == null){
                            error_message = error.message;
                          }else{
                          error_message = JSON.stringify(error_message);
                          error_message = error_message.replace("{","");
                          error_message = error_message.replace("}","");
                          }
                          //console.log(error_message);
                          var error_tin = { "tin": task.tin,"processedFl": "N","description": error.message+" "+error_message};
                          resultArray.push(error_tin);
                        })                                         
                        
                        setTimeout(()=>{
                            
                            const remaining = queue.length();
                            completed(null, {task, remaining});
                        }, 10000);

                        
                     
                    }, 2);

                    

                    profileArray.forEach((task)=>{
                        queue.push(task, (error, {task, remaining})=>{
                         if(error){
                          console.log(`An error occurred while processing task ${task}`);
                          var error_tin = { "taxPayerId": task.tin,"processedFl": "N","description": "" };
                          resultArray.push(error_tin);
                         }else {
                          console.log(`Finished processing  tasks `+task.tin);
                         }
                        })
                  });
                  
                  queue.drain(() => {
                    console.log('Successfully processed all items');
                    storeResponceInDatabase(resultArray,p_lang_code);
                    res.status(200).send({"result ":resultArray});
                   })

                   })  
                   .catch(error => {
                    res.status(500).send({"Error": error});
                   })                              
                    
                  }else{
                    res.status(200).send({"result": " No Record Found"});
                  }                 
                }
            });
          }catch(e){
            res.status(500).send("Server is not reponding Please try again after sometime!");
          }finally {
            closeDBConnection(connection);
           }
  }catch(err){
    res.status(400).send(err.message);
  }
 
};

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function storeResponceInDatabase(p_rec_content,p_lang_code){

  try{

    try{
      connection = await oracledb.getConnection({
        user: config.ORACLE_DB_USER,
        password: config.ORACLE_DB_PASSWORD,
        connectString: config.ORACLE_DB_CONNECTION_STRING
    });
    console.log('Connected to oracle DB in storeResponceInDatabase' );
    var jsonString = JSON.stringify(p_rec_content);
     

    console.log("start updating record "+p_rec_content.length);
      
      const sql = `declare ret boolean ; BEGIN ret := pck_asycuda_intf.post_tp_push_response(:arr,${p_lang_code});END;`;
          await connection.execute(sql,
           {arr:jsonString},
          { autoCommit: true },
          async function (err, result) {
                 if (err) {
                     console.log('erro block in execute oracle query at time of store record in asycuda database');
                     console.error(err);
                 } else {
                  console.log('successfully store record in asycuda database');
                 }
             });
    }catch(e){
      console.log('inner block', e);
    }finally {
      closeDBConnection(connection);
     }

  }catch(Exception){
     console.log("Error occure in storeResponceInDatabase");
  }

}

async function closeDBConnection(connection) {
  if (connection) {
    try {
      await connection.close();
      console.log('close Oracle DB connection success');
    } catch (err) {
      console.error(err.message);
    }
  }
}



exports.postAsycudaData = (req, res) => {
  const p_lang_code = req.query.langCode;
  postAsycudaData(req.body,p_lang_code,res)
};

async function postAsycudaData(p_rec_content,p_lang_code,res){

  

    try{
      connection = await oracledb.getConnection({
        user: config.ORACLE_DB_USER,
        password: config.ORACLE_DB_PASSWORD,
        connectString: config.ORACLE_DB_CONNECTION_STRING
    });
   
    
    var jsonString = JSON.stringify(p_rec_content);
    
    const sql = `BEGIN :cursor := pck_asycuda_intf.post_asycuda_data(:arr,${p_lang_code});END;`;
          await connection.execute(sql,{
            cursor: {type: oracledb.STRING,dir:oracledb.BIND_OUT,maxSize: 99999999},
            arr: { dir: oracledb.BIND_IN,val :jsonString}},
          async function (err, output) {
                 if (err) {
                    console.log(err);
                     res.status(500).send("Server is not reponding Please try again after sometime!");
                 } else {
                   
                  var data = JSON.stringify(output.outBinds.cursor);
                  data = data.replace(/\n/g, '');
                   res.status(201).send(JSON.parse(data));
                 }
             });
    }catch(e){
      console.log('Exception Occured at database connection time', e);
    }finally {
      closeDBConnection(connection);
     }
  
}

  
exports.postDataAttempt = (req, res) => {
  
const p_lang_code = req.query.langCode;
asycudaDataProcess(req.body,p_lang_code,res)
};

async function asycudaDataProcess(p_rec_content,p_lang_code,res){



  try{
    connection = await oracledb.getConnection({
      user: config.ORACLE_DB_USER,
      password: config.ORACLE_DB_PASSWORD,
      connectString: config.ORACLE_DB_CONNECTION_STRING
  });

  console.log('Connected to oracle DB in storeResponceInDatabase' );
  var jsonString = JSON.stringify(p_rec_content);
  console.log(jsonString);
 
  const sql = `BEGIN :ret := pck_asycuda_intf.post_data_attempt(:arr,${p_lang_code});END;`;
  await connection.execute(sql,{ret: { dir: oracledb.BIND_OUT,type: oracledb.STRING, maxSize:999999999},
    arr:jsonString},async function (err, output) {
               if (err) {
                  console.log(err);
                   res.status(500).send("Server is not reponding Please try again after sometime!");
               } else {
                if(null == output.outBinds.ret){
                  var result ={"status":201,"Description":"success"};
                 
                  res.status(201).send(result);
                }else{
                  console.log('Error found in post_data_attempt');
                  
                  res.status(400).send(output.outBinds.ret);
                 
                 
                }
               }
           });
  }catch(e){
    console.log('Exception occured at time of database creation ', e);
  }finally {
    closeDBConnection(connection);
   }

}



exports.processCertData= (req, res) => {
  loadPostCertificateData(req, res);
};

async function loadPostCertificateData(req, res){

  try{
    
    const p_lang_code = req.query.langCode;
          try{
            connection = await oracledb.getConnection({
              user: config.ORACLE_DB_USER,
              password: config.ORACLE_DB_PASSWORD,
              connectString: config.ORACLE_DB_CONNECTION_STRING
            });
          console.log('Connected to oracle DB');
          oracledb.fetchAsString = [ oracledb.CLOB ];
          
           
          const sql =`SELECT pck_asycuda_intf.get_certificate_queue(${p_lang_code}) from dual`;  
         
         await connection.execute(sql,
           function (err, result) {
                if (err) {
                    console.log('Error block in execute oracle query');
                    console.error(err);
                    res.status(500).send("Server is not reponding Please try again after sometime!");
                } else {
                  var resultArray =[];
                  
                  
                  console.log( "Array result ");
                  //console.log(result);
                  const lobData = result.rows[0][0];
                  
                  var certificateNumArray = JSON.parse(lobData);
                 
                  
                  console.log("Array Length "+certificateNumArray.length);
              
                  if(certificateNumArray.length > 0 ){
                  
                  apis.userLogin()
                   .then(async (getAuthToken)=>{
  
                      const queue = async.queue((task, completed) => {
                         
                          var cert="'"+task.certificateNo+"'";
                         
                          const sql = `BEGIN :ret := pck_asycuda_intf.get_certificate_dtl(${cert},${p_lang_code});END;`;
                           connection.execute(sql,{ret: { dir: oracledb.BIND_OUT,type: oracledb.STRING, maxSize:999999}},
                            function (err, result) {
                              if (err) {
                                console.log( err);
                                
                              }else{
                                 
                                var  reqBody=JSON.parse(result.outBinds.ret);
                                apis.taxClearance(reqBody, getAuthToken.access_token).then(result=>{
                                  console.log( "Successfully processed record taxClearance ");
                                  var sucess_tin = {"certificateNo":task.certificateNo,"processedFl": "Y", "description": "Success" };
                                  resultArray.push(sucess_tin);
                                })
                                .catch(error => {
                                  var error_message =error.errors;
                                  if(error_message == null){
                                    error_message = error.message;
                                  }else{
                                  error_message = JSON.stringify(error_message);
                                  error_message = error_message.replace("{","");
                                  error_message = error_message.replace("}","");
                                  error_message = error.message+error_message;
                                 }

                                  console.log( "Error Occured while executing record "+task.certificateNo);
                                  var error_tin = { "certificateNo": task.certificateNo,"processedFl": "N","description": error_message  };
                                  resultArray.push(error_tin);
                                  
                                })
                              }
                            }
                            )
                                                                  
                        
                        setTimeout(()=>{
                          
                          const remaining = queue.length();
                          completed(null, {task, remaining});
                      }, 10000);

                        
                     
                    }, 2);

                    

                    certificateNumArray.forEach((task)=>{
                      
                       delayRes(100000);
                        queue.push(task, (error, {task, remaining})=>{
                         if(error){
                          console.log(`An error occurred while processing task ${task}`);
                          var error_tin = { "certificateNo": task.certificateNo,"processedFl": "N","description": "" };
                          resultArray.push(error_tin);
                         }else {
                          console.log(`Finished processing  tasks `+task.certificateNo);
                         }
                        })
                  });
                  
                  queue.drain(() => {
                    console.log('Successfully processed all items '+resultArray.length);
                   storeResponceInDatabaseForPostCert(resultArray,p_lang_code);
                    res.status(200).send({"result ":resultArray});
                   })

                   })  
                   .catch(error => {
                    res.status(500).send({"Error": error});
                   })                              
                    
                  }else{
                    res.status(200).send({"result": " No Record Found"});
                  }                 
                }
            });
          }catch(e){
            res.status(500).send("Server is not reponding Please try again after sometime!");
          }finally {
            //closeDBConnection(connection);
           }
  }catch(err){
    res.status(400).send(err.message);
  }
 
};
async function delayRes(sec){
 await delay(sec);
}
const delay = ms => new Promise(res => setTimeout(res, ms));

async function storeResponceInDatabaseForPostCert(p_rec_content,p_lang_code){

  try{

    try{
      connection = await oracledb.getConnection({
        user: config.ORACLE_DB_USER,
        password: config.ORACLE_DB_PASSWORD,
        connectString: config.ORACLE_DB_CONNECTION_STRING
    });
    console.log('Connected to oracle DB in storeResponceInDatabase' );
    var jsonString = JSON.stringify(p_rec_content);
     

    console.log("start updating record");
  //console.log("asfasdf"+jsonString);
      const sql = `declare ret boolean ; BEGIN ret := pck_asycuda_intf.post_certif_push_response(:arr,${p_lang_code});END;`;
          await connection.execute(sql,
           {arr:jsonString},
          { autoCommit: true },
          async function (err, result) {
                 if (err) {
                     console.log('Error block in execute oracle query post_certif_push_response');
                     console.error(err);
                 } else {
                  console.log('Successfully store record post_certif_push_response');
                 }
             });
    }catch(e){
      console.log('inner block', e);
    }finally {
      //closeDBConnection(connection);
     }

  }catch(Exception){
     console.log("Error occure in storeResponceInDatabase");
  }

}

