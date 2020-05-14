"use strict";
exports.__esModule = true;
var crypto_1 = require("crypto");
var response = function (context, body, httpStatusCode, log) {
    if (httpStatusCode === void 0) { httpStatusCode = 200; }
    if (log === void 0) { log = false; }
    if (log) {
        context.log(httpStatusCode + " - " + body);
    }
    context.res = {
        status: httpStatusCode,
        body: body
    };
};
exports.response = response;
var error = function (context, errorMessage, httpStatusCode) {
    if (httpStatusCode === void 0) { httpStatusCode = 400; }
    response(context, errorMessage, httpStatusCode, true);
};
exports.error = error;
var sign = function (key, data) {
    return "sha1=" + crypto_1["default"].createHmac('sha1', key).update(data).digest('hex');
};
var verify = function (key, signature, data) {
    var sig = Buffer.from(signature);
    var signed = Buffer.from(sign(key, data));
    if (sig.length !== signed.length) {
        return false;
    }
    return crypto_1["default"].timingSafeEqual(sig, signed);
};
exports.verify = verify;
