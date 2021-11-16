//var token = "NTNlOTc5ZTAwOGMwNWRiZDM1MzZlN2I4OWJiODRlZGE=";
//var uri = "https://sparkling-frog.us-west-2.aws.cloud.dgraph.io/graphql";
//var file = "lambdas.js";

import { exec } from "child_process";

run("tsc lambdas.ts")

//run(`slash-graphql update-lambda -e ${uri} -f ${file}`)


function run(com) {
  exec(com, (error) => {
    if (error) {
      console.log(`exec error: ${error}`);
    }
  });
}
