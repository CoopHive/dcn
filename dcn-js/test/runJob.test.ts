import {describe, expect, test} from '@jest/globals';
import { fileURLToPath  } from 'url';


import { runJob } from '../src/job-runner'
import { readFileSync } from 'node:fs'
import { stringify } from 'yaml'
import * as path from 'node:path'

describe("job runner",  () => {
  test("runs job", async () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    console.log("dirname", __dirname)
    const composeFile = readFileSync(`${__dirname}/docker-compose.cowsay.yaml`, 'utf8')
    const stringified = stringify(composeFile)
    const stuff = await runJob(stringified)
    expect(stuff.exitCode).toBe(0)
    expect(stuff.out).toBe('Attaching to cowsay-1\n' +
                                'cowsay-1  |  _____________\n' +
                                'cowsay-1  | < hello world >\n' +
                                'cowsay-1  |  -------------\n' +
                                'cowsay-1  |         \\   ^__^\n' +
                                'cowsay-1  |          \\  (oo)\\_______\n' +
                                'cowsay-1  |             (__)\\       )\\/\\\n' +
                                'cowsay-1  |                 ||----w |\n' +
                                'cowsay-1  |                 ||     ||\n' +
                                '\r\x1B[Kcowsay-1 exited with code 0\n'
                               )
  })


})
