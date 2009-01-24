console = { log : function(str) { print(str); }};

load("../latest/active.js");
load("test.js");

ActiveRecord.connect(ActiveRecord.Adapters.RhinoMySQL, { NAME : "activejs_test", USER : "activejs", PASS : "" });
ActiveRecord.logging = arguments[0] === "-v";
ActiveTest.run();
