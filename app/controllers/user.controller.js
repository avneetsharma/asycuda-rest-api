const userModule = require('../models/users.model');
const callPostCertificateRequest = userModule.callPostCertificateRequest;
const loadTaxPayerRegistrationData = userModule.loadTaxPayerRegistrationData;
const postAsycudaData = userModule.postAsycudaData;
const asycudaDataProcess = userModule.asycudaDataProcess;
const loadPostCertificateData = userModule.loadPostCertificateData;
const ThirdPartyAPIs = require ('../helper/util');
const async = require('async');
const { json } = require('express/lib/response');
const apis = new ThirdPartyAPIs();


exports.taxClearance = (req, res) => {
  callPostCertificateRequest(req,res);
};

exports.taxRegistration = (req, res) => {
  loadTaxPayerRegistrationData(req, res);
}


exports.postAsycudaData = (req, res) => {
  const p_lang_code = req.query.langCode;
  postAsycudaData(req.body,p_lang_code,res)
};


exports.postDataAttempt = (req, res) => {
const p_lang_code = req.query.langCode;
asycudaDataProcess(req.body,p_lang_code,res)
};



exports.processCertData= (req, res) => {
  loadPostCertificateData(req, res);
};






