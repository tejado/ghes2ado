import { Context } from "@azure/functions"
import crypto from 'crypto'


const response = (context: Context, body: string, httpStatusCode: number = 200, log = false) => {
    if (log) {
        context.log(`${httpStatusCode} - ${body}`)
    }

    context.res = {
        status: httpStatusCode,
        body: body
    };
};

const error = (context: Context, errorMessage: string, httpStatusCode: number = 400) => {
    response(context, errorMessage, httpStatusCode, true)
};

const sign = (key: string, data: crypto.BinaryLike) => {
    return `sha1=${crypto.createHmac('sha1', key).update(data).digest('hex')}`
};

const verify = (key: string, signature: string, data: any) => {
    const sig = Buffer.from(signature)
    const signed = Buffer.from( sign(key, data) )

    if (sig.length !== signed.length) {
        return false
    }
    return crypto.timingSafeEqual(sig, signed)
};

export { response, error, verify };