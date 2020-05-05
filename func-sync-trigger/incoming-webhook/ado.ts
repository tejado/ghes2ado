import * as azdev from "azure-devops-node-api";
import * as gitclient from "azure-devops-node-api/GitApi"
import { GitRepository, GitPush,GitCommitRef,GitCommit, GitChange, ItemContent, GitItem, GitRefUpdate } from 'azure-devops-node-api/interfaces/GitInterfaces';

async function pushFile2Ado(
    orgUrl: string, 
    project: string, 
    repostoryName: string, 
    file: string, 
    targetFilePath: string, 
    refName: string,
    token: string
){  
    let repostories:GitRepository[];
    let authHandler = azdev.getPersonalAccessTokenHandler(token); 
    let connection = new azdev.WebApi(orgUrl, authHandler);

    let git: gitclient.IGitApi = await connection.getGitApi();
    repostories = await git.getRepositories(project);
    let gitrepo = repostories.find(element => element.name === repostoryName);
    let repostoryId = gitrepo.id;
    
    let gitChanges: GitChange[] = [{
        changeType: 2,
        newContent: {content: file,contentType: 1 }, //0-> RawText = 0, Base64Encoded = 1,
        item: {
            path: targetFilePath
        }
    }];

    if (typeof(repostoryId) ==="string") {
        let ref = (await git.getRefs(repostoryId, project)).find(element => element.name === refName)

        let refUpdates:GitRefUpdate[] = [<GitRefUpdate> {
            name: ref.name,
            oldObjectId: ref.objectId //get ref->object id
        }];

        let gitCommitRef:GitCommitRef[] = [
            {
                changes: gitChanges,
                comment: 'Add a file'
            }
        ];

        let gitPush:GitPush = <GitPush>{
            commits: gitCommitRef,
            refUpdates: refUpdates,
            repository: gitrepo
        };

        console.log(repostoryId)
        await git.createPush(gitPush, repostoryId, project);
    }
}

export { pushFile2Ado };