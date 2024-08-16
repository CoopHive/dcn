import { v2 as compose } from 'docker-compose'

import { fileURLToPath  } from 'url';

import { parse } from 'yaml'
import { writeFileSync, unlinkSync } from 'node:fs'
import * as path from 'node:path'

export const runJob  = async (composeFile: string): Promise<any> => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const file = writeFileSync(`${__dirname}/docker-compose-import.yaml`, parse(composeFile))
  const jobPromise = new Promise(async (resolve, reject)  => {
    compose.upAll({
      cwd: path.join(__dirname),
      config: `docker-compose-import.yaml`,
      commandOptions: ["--attach", "cowsay"],
      log: true,
    }).then(
    (stuff) => {
      console.log("stuff", stuff)
      unlinkSync(`${__dirname}/docker-compose-import.yaml`)
      resolve(stuff)
    },
    (err) => {
      unlinkSync(`${__dirname}/docker-compose-import.yaml`)
      reject(String(err.message))
    }
    )
  })

  return jobPromise as Promise<any>

}
