const oracledb = require('oracledb');
const ThirdPartyAPIs = require ('../helper/util');
const apis = new ThirdPartyAPIs();
const async = require('async');

exports.callPostCertificateRequest = async function (req, res) {
    const p_ext_doc_no = req.query.extDocNumber;
    const p_lang_code = req.query.langCode;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const sql = `BEGIN :ret := pck_asycuda_intf.get_certificate_dtl(${p_ext_doc_no},${p_lang_code});END;`;
        const result = await connection.execute(sql, { ret: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 999999 } });
        res.status(200).send(JSON.parse(result.outBinds.ret));
    } catch (e) {
        console.log('Exception Occured at time of connection creation', e);
        res.status(500).send("Server is not reponding Please try again after sometime!");
    } finally {
        connection.close();
    }
}


exports.loadTaxPayerRegistrationData = async function (req, res) {
   
    const p_fiscal_no = req.query.p_fiscal_no;
    const p_lang_code = req.query.langCode;
    try {
        connection = await oracledb.getConnection();
        console.log('Connected to oracle DB');
        oracledb.fetchAsString = [oracledb.CLOB]
        const sql = `SELECT pck_asycuda_intf.get_taxpayer_dtl(${p_fiscal_no},${p_lang_code}) from dual`;
        let result = await connection.execute(sql);
        
        var resultArray = [];
        console.log("Array result ");
        const lobData = result.rows[0][0];
        var profileArray = JSON.parse(lobData);
        console.log("Array Length" + profileArray.length);
        //profile=profile[0];
        if (profileArray.length > 0) {
            console.log("processing start");
            let accessToken = await apis.userLogin();

            for (let i = 0; i < profileArray.length; i++) {
                try {
                    let data = await apis.taxRegistration(profileArray[i], accessToken.access_token);
                    console.log(" Record Process successfully");
                    // console.log(result);
                    var sucess_tin = { "tin": profileArray[i].tin, "processedFl": "Y", "description": result.data };
                    resultArray.push(sucess_tin);
                } catch (error) {
                    console.log("Error occured while executing record for tax registration  " + profileArray[i].tin);
                    var error_message = error.errors;
                    if (error_message == null) {
                        error_message = error.message;
                    } else {
                        error_message = JSON.stringify(error_message);
                        error_message = error_message.replace("{", "");
                        error_message = error_message.replace("}", "");
                    }
                    //console.log(error_message);
                    var error_tin = { "tin": profileArray[i].tin, "processedFl": "N", "description": error.message + " " + error_message };
                    resultArray.push(error_tin);
                }
            }

            console.log('Successfully processed all items' + resultArray.length);
            storeResponceInDatabase(resultArray, p_lang_code);
            res.status(200).send({ "result ": resultArray });
        } else {
            res.status(200).send({ "result": " No Record Found" });
        }

    } catch (e) {
        res.status(500).send("Server is not reponding Please try again after sometime!");
    } finally {
        connection.close();

    }
};

async function storeResponceInDatabase(p_rec_content, p_lang_code) {
    let connection;
    try {
        connection = await oracledb.getConnection();
        console.log('Connected to oracle DB in storeResponceInDatabase');
        var jsonString = JSON.stringify(p_rec_content);
        console.log("start updating record " + p_rec_content.length);
        const sql = `declare ret boolean ; BEGIN ret := pck_asycuda_intf.post_tp_push_response(:arr,${p_lang_code});END;`;
        let result = await connection.execute(sql, { arr: jsonString }, { autoCommit: true });
    } catch (e) {
        console.log('Exception occured while storing result in databse', e);
    } finally {
        connection.close();
    }
}

exports.postAsycudaData = async function (p_rec_content, p_lang_code, res) {
    let connection;
    try {
        connection = await oracledb.getConnection();
        var jsonString = JSON.stringify(p_rec_content);
        const sql = `BEGIN :cursor := pck_asycuda_intf.post_asycuda_data(:arr,${p_lang_code});END;`;
        let result = await connection.execute(sql, {
            cursor: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 99999999 },
            arr: { dir: oracledb.BIND_IN, val: jsonString }
        });

        if (result) {
            var data = JSON.stringify(output.outBinds.cursor);
            data = data.replace(/\n/g, '');
            res.status(201).send(JSON.parse(data));
        }
    } catch (e) {
        console.log('Exception Occured at database connection time', e);
        res.status(500).send("Server is not reponding Please try again after sometime!");
    } finally {
        connection.close();
    }

}



exports.asycudaDataProcess = async function (p_rec_content, p_lang_code, res) {
    let connection;
    try {
        connection = await oracledb.getConnection();
        console.log('Connected to oracle DB in storeResponceInDatabase');
        var jsonString = JSON.stringify(p_rec_content);
        const sql = `BEGIN :ret := pck_asycuda_intf.post_data_attempt(:arr,${p_lang_code});END;`;
       let output =  await connection.execute(sql, {
            ret: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 999999999 },
            arr: jsonString
        });
        
        if(output){
            if (null == output.outBinds.ret) {
                var result = { "status": 201, "Description": "success" };
                res.status(201).send(result);
            } else {
                console.log('Error found in post_data_attempt for Validation ');
                console.log(output.outBinds.ret);
                res.status(400).send(output.outBinds.ret);
            }
         }

    } catch (e) {
        console.log('Exception occured at time of database creation ', e);
        res.status(500).send("Server is not reponding Please try again after sometime!");
    } finally {
        connection.close();
    }

}



exports.loadPostCertificateData = async function (req, res) {

    const p_lang_code = req.query.langCode;
    let connection;
    try {
        connection = await oracledb.getConnection();
        console.log('Connected to oracle DB');
        oracledb.fetchAsString = [oracledb.CLOB];
        const sql = `SELECT pck_asycuda_intf.get_certificate_queue(${p_lang_code}) from dual`;
        let result = await connection.execute(sql);
        var resultArray = [];


        console.log("Array result ");
        //console.log(result);
        const lobData = result.rows[0][0];
        var certificateNumArray = JSON.parse(lobData);
        console.log("Array Length " + certificateNumArray.length);

        if (certificateNumArray.length > 0) {
            let accessToken = await apis.userLogin();
            for (let i = 0; i < certificateNumArray.length; i++) {
                //console.log(certificateNumArray[i]);
                var cert = "'" + certificateNumArray[i].certificateNo + "'";
                const sql = `BEGIN :ret := pck_asycuda_intf.get_certificate_dtl(${cert},${p_lang_code});END;`;
                let certificateJson = await connection.execute(sql, { ret: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 999999 } });
                var reqBody = JSON.parse(certificateJson.outBinds.ret);
                try {
                    let data = await apis.taxClearance(reqBody, accessToken.access_token);
                    console.log("Successfully processed record taxClearance ");
                    var sucess_tin = { "certificateNo": certificateNumArray[i].certificateNo, "processedFl": "Y", "description": "Success" };
                    resultArray.push(sucess_tin);
                } catch (error) {

                    var error_message = error.errors;
                    if (error_message == null) {
                        error_message = error.message;
                    } else {
                        error_message = JSON.stringify(error_message);
                        error_message = error_message.replace("{", "");
                        error_message = error_message.replace("}", "");
                        error_message = error.message + error_message;
                    }
                    console.log("Error Occured while executing record " + certificateNumArray[i].certificateNo);
                    var error_tin = { "certificateNo": certificateNumArray[i].certificateNo, "processedFl": "N", "description": error_message };
                    resultArray.push(error_tin);
                }
            }
            console.log("Result size after execute" + resultArray.length);
            storeResponceInDatabaseForPostCert(resultArray, p_lang_code);
            res.status(200).send({ "result ": resultArray });
        } else {
            res.status(200).send({ "result": " No Record Found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Server is not reponding Please try again after sometime!");
    }
};

async function storeResponceInDatabaseForPostCert(p_rec_content, p_lang_code) {

    try {
        connection = await oracledb.getConnection();
        //console.log('Connected to oracle DB in storeResponceInDatabase');
        var jsonString = JSON.stringify(p_rec_content);
        const sql = `declare ret boolean ; BEGIN ret := pck_asycuda_intf.post_certif_push_response(:arr,${p_lang_code});END;`;
        let result = await connection.execute(sql, { arr: jsonString }, { autoCommit: true });
        console.log('SuccessFully store result inside storeResponceInDatabaseForPostCert');
    } catch (e) {
        console.log('Exception occure while storing record for PostCertificate', e);
    } finally {
        connection.close();
    }


}


async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}


async function delayRes(sec) {
    await delay(sec);
}
const delay = ms => new Promise(res => setTimeout(res, ms));