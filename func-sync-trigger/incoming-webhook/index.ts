import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import {
    GetResponseTypeFromEndpointMethod,
    GetResponseDataTypeFromEndpointMethod,
} from "@octokit/types";
import { Octokit } from "@octokit/rest"
import { OctokitOptions } from "@octokit/core/dist-types/types"
import { createAppAuth } from "@octokit/auth-app"

import { response, error, verify } from "./utils"
import { pushFile2Ado } from "./ado"

// name of the file which should be synced from source (GHES) to target (Azure DevOps)
const syncFile = 'pipeline.yaml'

// getting environment variables
const secretKey = process.env['WEBHOOK_SECRET']

const ghToken = process.env['GH_TOKEN']
const ghAppId = process.env['GH_APP_ID']
const ghAppPrivateKey = process.env['GH_APP_PRIVATE_KEY']
const ghBaseUrl = process.env['GH_BASE_URL']

const adoOrg = process.env['ADO_ORGURL']
const adoProject = process.env['ADO_PROJECT']
const adoRepository = process.env['ADO_REPO']
const adoToken = process.env['ADO_TOKEN']

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('Incoming HTTP request');

    const body = req.body || ""
    const rawBody = req.rawBody || ""
    const sig = req.headers['x-hub-signature'] || "no-sig"
    const event = req.headers['x-github-event'] || "no-event"
    const id = req.headers['x-github-delivery']  || "no-id"

    if (secretKey !== undefined && !verify(secretKey, sig, rawBody)) {
        return error(context, "X-Hub-Signature missmatch", 403)
    } else if(secretKey === undefined) { 
        context.log("Warning: No secretKey - omitting signature check")
    }

    if (event == "push") {
        console.log("PUSH")
        
        const srcRef = body.ref;
        const [srcOwner, srcRepository] = body.repository.full_name.split("/");
        context.log(`Info: Push event details: ${srcOwner}, ${srcRepository}, ${srcRef}`)
        
        let ghOptions: OctokitOptions = {auth: {}};
        // Set Github authentication
        if (ghAppId && ghAppPrivateKey) {
            context.log(`Info: Github Authentiation by App ${ghAppId}`)
            
            ghOptions.authStrategy = createAppAuth
            ghOptions.auth.id = ghAppId
            ghOptions.auth.privateKey = ghAppPrivateKey

        } else if (ghToken) {
            context.log(`Info: Github Authentiation by token`)
            ghOptions.auth = ghToken

        } else {
            context.log("Info: No Github authentication set!")
        }

        // Set Github Base URL, e.g. for GitHub Enterprise Server (GHES)
        if (ghBaseUrl) {
            context.log(`Info: Setting github base url ${ghBaseUrl}`)
            ghOptions.baseUrl = ghBaseUrl
        }

        const github = new Octokit(ghOptions);

        // type definitions for octokit server response
        type ReposGetContentsResponseData = GetResponseDataTypeFromEndpointMethod<
        typeof github.repos.getContents
        >;
        type ReposGetContentsResponse = GetResponseTypeFromEndpointMethod<
        typeof github.repos.getContents
        >;

        github.repos.getContents({
            owner: srcOwner, 
            repo: srcRepository, 
            path: syncFile,
            ref: srcRef
        }).then( 
            (res: ReposGetContentsResponse) => {
                const data: ReposGetContentsResponseData = res.data
                console.log(`Info: Got ${syncFile} from GitHub...`)
                if (!Array.isArray(data)) {

                    // decode file and output to console
                    //const buff = Buffer.from(data.content, 'base64');
                    //let fileContent = buff.toString('utf-8');
                    //context.log(fileContent);
        
                    // ToDo: need to map this to target (careful: what if the source branch does not exist at target?)
                    const refName = 'refs/heads/master';

                    console.log(`Info: ...start sync to Azure DevOps...`)
                    pushFile2Ado(adoOrg, adoProject, adoRepository, data.content, syncFile, refName, "File Sync by ghes2ado", adoToken)
        
                } else {
                    return error(context, "Not implemented", 500)
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
