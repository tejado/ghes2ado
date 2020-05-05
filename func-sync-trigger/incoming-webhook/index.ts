import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import {
    GetResponseTypeFromEndpointMethod,
    GetResponseDataTypeFromEndpointMethod,
} from "@octokit/types";
import { Octokit } from "@octokit/rest"

import { response, error, verify } from "./utils"
import { pushFile2Ado } from "./ado"



const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('Incoming HTTP request');

    const body = req.body || ""
    const rawBody = req.rawBody || ""
    const sig = req.headers['x-hub-signature'] || "no-sig"
    const event = req.headers['x-github-event'] || "no-event"
    const id = req.headers['x-github-delivery']  || "no-id"

    const secretKey = process.env['WEBHOOK_SECRET']
    const ghToken = process.env['GH_TOKEN']

    const adoOrg = process.env['ADO_ORGURL']
    const adoProject = process.env['ADO_PROJECT']
    const adoRepository = process.env['ADO_REPO']
    const adoToken = process.env['ADO_TOKEN']

    let refName: string = 'refs/heads/master';


    if (secretKey !== undefined && !verify(secretKey, sig, rawBody)) {
        return error(context, "X-Hub-Signature missmatch", 403)
    } else if(secretKey === undefined) { 
        context.log("Warning: No secretKey - omitting signature check")
    }

    if (event == "push") {
        console.log("PUSH")

        const jsonData = JSON.stringify(body);
        context.log(body)
        
        const octokit = new Octokit({
            auth: ghToken
        });

        
        type ReposGetContentsResponseData = GetResponseDataTypeFromEndpointMethod<
        typeof octokit.repos.getContents
        >;
        type ReposGetContentsResponse = GetResponseTypeFromEndpointMethod<
        typeof octokit.repos.getContents
        >;
        
        let fileContent = ""
        let file = octokit.repos.getContents({
            owner: "tejado", 
            repo: "webhook-test-repo", 
            path: 'pipeline.yaml'
        }).then( 
            (res: ReposGetContentsResponse) => {
                const data: ReposGetContentsResponseData = res.data
                if (!Array.isArray(data)) {
                    const buff= Buffer.from(data.content, 'base64');
                    fileContent = buff.toString('utf-8');
                    console.log(fileContent);
        
                    pushFile2Ado(adoOrg, adoProject, adoRepository, data.content, "pipeline.yaml", refName, adoToken)
        
                } else {
                    // handling a response with multiple files here - not in scope for now
                }
            }, 
            (reason) => {
                console.log(`${reason['name']} - ${reason['status']}`)
            }
        )

        response(context, "awesome!", 200)

    } else if (event == "ping") {
        response(context, "pong", 200, true)
    } else {
        response(context, "No push event - aborting", 400)
    }
};

export default httpTrigger;
