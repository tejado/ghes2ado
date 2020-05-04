import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import ado from "azure-devops-node-api"
import { Octokit } from "@octokit/rest"

import { response, error, verify } from "./utils"
import { getFile } from "./ghes"


async function getFileContents(repo,tree,filePath) {
    var fileEntry = await tree.entryByPath(filePath);
    return (await repo.getBlob(fileEntry.oid())).toString();
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('Incoming HTTP request');

    const body = req.body || ""
    const rawBody = req.rawBody || ""
    const sig = req.headers['x-hub-signature'] || "no-sig"
    const event = req.headers['x-github-event'] || "no-event"
    const id = req.headers['x-github-delivery']  || "no-id"

    const secretKey = process.env['WEBHOOK_SECRET']
    const ghToken = process.env['GH_TOKEN']

    if (secretKey !== undefined && !verify(secretKey, sig, rawBody)) {
        return error(context, "X-Hub-Signature missmatch", 403)
    } else if(secretKey === undefined) { 
        context.log("Warning: No secretKey - omitting signature check")
    }

    if (event == "push") {
        console.log("PUSH")

        const jsonData = JSON.stringify(body);
        context.log(body)
        
        const file = await getFile(
            ghToken, 
            body['repository']['owner']['name'], 
            body['repository']['name'], 
            'pipeline.yaml',
            body['ref']
        )
        response(context, "awesome!", 200)

    } else if (event == "ping") {
        response(context, "pong", 200, true)
    } else {
        response(context, "No push event - aborting", 400)
    }
};

export default httpTrigger;
