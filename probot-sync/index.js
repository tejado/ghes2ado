/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */

const ado = require("./ado");

// name of the file which should be synced from source (GHES) to target (Azure DevOps)
const syncFile = 'pipeline.yaml'

// getting environment variables
const adoOrg = process.env['ADO_ORGURL']
const adoProject = process.env['ADO_PROJECT']
const adoRepository = process.env['ADO_REPO']
const adoToken = process.env['ADO_TOKEN']

module.exports = app => {
  app.on('push', async context => {
    
    const srcRef = context.payload.ref;
    const [srcOwner, srcRepository] = context.payload.repository.full_name.split("/");

    context.github.repos.getContents({
      owner: srcOwner, 
      repo: srcRepository, 
      path: "pipeline.yaml",
      ref: srcRef
    }).then(res => {
      // decode file and output to console
      //const buff = Buffer.from(res.data.content, 'base64');
      //let fileContent = buff.toString('utf-8');
      //context.log(fileContent);

      // ToDo: need to map this to target (careful: what if the source branch does not exist at target?)
      const refName = 'refs/heads/master';
      
      ado.pushFile2Ado(adoOrg, adoProject, adoRepository, res.data.content, syncFile, refName, "File Sync by ghes2ado", adoToken)
    },
    (reason) => {
      console.log(`${reason['name']} - ${reason['status']}`)
    });

  })
}
