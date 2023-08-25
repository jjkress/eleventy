const test = require("ava");
const EleventyWatchTargets = require("../src/EleventyWatchTargets");
const JavaScriptDependencies = require("../src/Util/JavaScriptDependencies");

test("Basic", (t) => {
  let targets = new EleventyWatchTargets();
  t.deepEqual(targets.getTargets(), []);

  targets.add(".eleventy.js");
  t.deepEqual(targets.getTargets(), ["./.eleventy.js"]);
});

test("Removes duplicates", (t) => {
  let targets = new EleventyWatchTargets();

  targets.add(".eleventy.js");
  targets.add("./.eleventy.js");
  t.deepEqual(targets.getTargets(), ["./.eleventy.js"]);
});

test("Add array", (t) => {
  let targets = new EleventyWatchTargets();

  targets.add([".eleventy.js", "b.js"]);
  targets.add(["b.js", "c.js"]);
  t.deepEqual(targets.getTargets(), ["./.eleventy.js", "./b.js", "./c.js"]);
});

test("Add and make glob", (t) => {
  let targets = new EleventyWatchTargets();

  // Note the `test` directory must exist here for this to pass.
  targets.addAndMakeGlob(["test", "test/b.js"]);
  t.deepEqual(targets.getTargets(), ["./test/**", "./test/b.js"]);
});

test("JavaScript get dependencies", async (t) => {
  t.deepEqual(await JavaScriptDependencies.getDependencies(["./test/stubs/config-deps.js"]), [
    "./test/stubs/config-deps-upstream.js",
  ]);
});

test("JavaScript addDependencies", async (t) => {
  let targets = new EleventyWatchTargets();
  await targets.addDependencies("./test/stubs/config-deps.js");
  t.deepEqual(targets.getTargets(), ["./test/stubs/config-deps-upstream.js"]);

  t.true(targets.uses("./test/stubs/config-deps.js", "./test/stubs/config-deps-upstream.js"));
  t.false(targets.uses("./test/stubs/config-deps.js", "./test/stubs/config-deps.js"));
});

test("JavaScript addDependencies (one file has two dependencies)", async (t) => {
  let targets = new EleventyWatchTargets();
  await targets.addDependencies("./test/stubs/dependencies/two-deps.11ty.js");
  t.deepEqual(targets.getTargets(), [
    "./test/stubs/dependencies/dep1.js",
    "./test/stubs/dependencies/dep2.js",
  ]);

  t.true(
    targets.uses("./test/stubs/dependencies/two-deps.11ty.js", "./test/stubs/dependencies/dep1.js")
  );
  t.true(
    targets.uses("./test/stubs/dependencies/two-deps.11ty.js", "./test/stubs/dependencies/dep2.js")
  );
  t.false(
    targets.uses("./test/stubs/dependencies/two-deps.11ty.js", "./test/stubs/dependencies/dep3.js")
  );
});

test("JavaScript addDependencies (skip JS deps)", async (t) => {
  let targets = new EleventyWatchTargets();
  targets.watchJavaScriptDependencies = false;
  await targets.addDependencies("./test/stubs/dependencies/two-deps.11ty.js");
  t.deepEqual(targets.getTargets(), []);

  t.false(
    targets.uses("./test/stubs/dependencies/two-deps.11ty.js", "./test/stubs/dependencies/dep1.js")
  );
  t.false(
    targets.uses("./test/stubs/dependencies/two-deps.11ty.js", "./test/stubs/dependencies/dep2.js")
  );
  t.false(
    targets.uses("./test/stubs/dependencies/two-deps.11ty.js", "./test/stubs/dependencies/dep3.js")
  );
});

test("JavaScript addDependencies with a filter", async (t) => {
  let targets = new EleventyWatchTargets();
  await targets.addDependencies("./test/stubs/config-deps.js", function (path) {
    return path.indexOf("./test/stubs/") === -1;
  });
  t.deepEqual(targets.getTargets(), []);
  t.false(
    targets.uses(
      "./test/stubs/dependencies/config-deps.js",
      "./test/stubs/dependencies/config-deps-upstream.js"
    )
  );
});

test("add, addDependencies falsy values are filtered", async (t) => {
  let targets = new EleventyWatchTargets();
  targets.add("");
  await targets.addDependencies("");
  t.deepEqual(targets.getTargets(), []);
});

test("add, addDependencies file does not exist", async (t) => {
  let targets = new EleventyWatchTargets();
  targets.add("./.eleventy-notfound.js"); // does not exist
  await targets.addDependencies("./.eleventy-notfound.js"); // does not exist
  t.deepEqual(targets.getTargets(), ["./.eleventy-notfound.js"]);
});

test("getNewTargetsSinceLastReset", (t) => {
  let targets = new EleventyWatchTargets();
  targets.add("./.eleventy-notfound.js"); // does not exist
  t.deepEqual(targets.getNewTargetsSinceLastReset(), ["./.eleventy-notfound.js"]);
  t.deepEqual(targets.getNewTargetsSinceLastReset(), ["./.eleventy-notfound.js"]);

  targets.reset();
  targets.add("./.eleventy-notfound2.js");
  t.deepEqual(targets.getNewTargetsSinceLastReset(), ["./.eleventy-notfound2.js"]);

  targets.reset();
  t.deepEqual(targets.getNewTargetsSinceLastReset(), []);
});
