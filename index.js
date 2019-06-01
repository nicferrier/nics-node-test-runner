#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {fork} = require("child_process");

/*

  what does a good test runner look like:

   * run it with no args and it runs all "tests" in the current package?
   * run it with an arg and it specifies a "test"
   * it tells you what tests it's run and shows you failures
   * tests should timeout (or async failures hang everything)
   * the timeout can be adjusted

  so the big problem is what does "test" mean?

  if it's a file or js code and we run it by starting a process then
  the test needs additional code, at least a main like boot for
  whatever test function there is.

  If it's a file of js code that we require then it's easier to count
  tests (through making a framework for tests) but it's harder to
  synchronize the test running so that it can be timed for timeout.
 */

const main = async function () {
    const dirLs = await fs.promises.readdir(process.cwd());
    const tests = dirLs.filter(entry => entry.startsWith("test")
                               && entry.endsWith(".js")
                               && path.join(__dirname, entry) !== __filename);

    for (let testFileName of tests) {
        try {
            const modulePath = path.join(process.cwd(), testFileName);

            console.log(`\n**** ${testFileName} starting ****\n`);

            const moduleResult = await new Promise((resolve, reject) => {
                const proc = fork(modulePath)
                proc.on("close", closeEvt => {
                    clearTimeout(firstTimeout);
                    resolve(closeEvt);
                });
                const firstTimeout = setTimeout(evt => {
                    console.log(`\n**** ${testFileName} taken more than 5 sec ****\n`);
                }, 5000);
                // We don't need to pipe because it's automatic with fork.
            });
        }
        catch (e) {
            console.log(`test failure in ${testFileName}: ${e}`);
        }
        finally {
            console.log(`\n**** ${testFileName} ending ****\n`);
        }
    }
};


if (require.main === module) {
    main().then();
}

// End
