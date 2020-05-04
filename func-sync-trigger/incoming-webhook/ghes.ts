
import { Octokit } from "@octokit/rest"

const getFile = async (token, owner, repo, path, ref) => {
    const octokit = new Octokit({
        auth: token
      });

    let file = await octokit.repos.getContents({
        owner: owner,
        repo: repo,
        path: path,
        ref: ref
    });

    return file;
}

export { getFile };