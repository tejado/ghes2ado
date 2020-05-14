const azdev = require("azure-devops-node-api");

/*
 * thanks to Leo Liu: https://stackoverflow.com/a/59483655
 */

async function pushFile2Ado(orgUrl, project, repostoryName, file, targetFilePath, refName, commitMessage, token){  
    let repostories;
    let authHandler = azdev.getPersonalAccessTokenHandler(token); 
    let connection = new azdev.WebApi(orgUrl, authHandler);

    let git = await connection.getGitApi();
    repostories = await git.getRepositories(project);
    let gitrepo = repostories.find(element => element.name === repostoryName);
    let repostoryId = gitrepo.id;
    
    let gitChanges = [{
        changeType: 2,
        newContent: { content: file,contentType: 1 }, //0-> RawText = 0, Base64Encoded = 1,
        item: {
            path: targetFilePath
        }
    }];

    if (typeof(repostoryId) ==="string") {
        let ref = (await git.getRefs(repostoryId, project)).find(element => element.name === refName)

        let refUpdates = [{
            name: ref.name,
            oldObjectId: ref.objectId //get ref->object id
        }];

        let gitCommitRef = [
            {
                changes: gitChanges,
                comment: commitMessage
            }
        ];

        let gitPush= {
            commits: gitCommitRef,
            refUpdates: refUpdates,
            repository: gitrepo
        };

        console.log(repostoryId)
        await git.createPush(gitPush, repostoryId, project);
    }
}

exports.pushFile2Ado = pushFile2Ado;