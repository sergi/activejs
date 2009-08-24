var activejs = require("activejs"),
    ActiveTest = require("./test").ActiveTest;

// HACKs
for (var i in activejs)
    global[i] = activejs[i];
console = { log : function(str) { print(str); }};

ActiveRecord.connect(ActiveRecord.Adapters.RhinoMySQL, {
    NAME : "activejs_test",
    USER : "activejs",
    PASS : ""
});
ActiveRecord.logging = true;

ActiveTest.run();
