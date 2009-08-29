var file = require("file"),
    utils = require("jack/utils"),
    activejs = require("activejs"),
    Request = require("jack/request").Request,
    Response = require("jack/response").Response;

// FIXME: lots of globals. hmph.

for (var name in activejs)
    global[name] = activejs[name];

ActiveSupport.log = function() { print(Array.prototype.join.call(arguments, "")) };

var Application = global.Application = {};

require("./activecontroller/server");
require("./activecontroller/adapters/jack");

var appPath = file.dirname(system.args[0]),
    configPath = file.join(appPath, "config");

require(configPath);

ActiveRecord.connect();

var scope = global;

Application.routes = new ActiveRoutes(Application.Config.routes, scope, {
    classSuffix: 'Controller',
    dispatcher: function dispatcher(route) {
        var controller = new this.scope[route.params.object]();

        controller.params = global.request.params();
        ActiveSupport.extend(controller.params, route.params);
        //handles request method (GET,PUT,etc) not method name
        if (controller.params._method)
        {
            delete controller.params._method;
        }

        if (ActiveController.logging)
        {
            ActiveSupport.log('');
            //put space before each request
            ActiveSupport.log('ActiveController: ' + route.params.object + '#' + route.params.method + ' [' + ActiveController.Server.Request.getMethod().toUpperCase() + ' ' + ActiveController.Server.Request.getURI() + '] <params:' + uneval(controller.params) + '>');
        }
        controller[route.params.method]();
    }
});

function requireAll(directory) {
    file.list(directory).forEach(function(name) {
        if (/.js$/.test(name)) {
            var path = file.absolute(file.join(directory, name));
            //print("Loading " + path);
            require(path);
        }
    });
}

requireAll(file.join(appPath, "controllers"));
requireAll(file.join(appPath, "models"));

exports.app = function(env) {
    global.request = new Request(env);
    global.response = new Response();

    var pathInfo = utils.unescape(env["PATH_INFO"]);

    try {
        Application.routes.dispatch(pathInfo);
    } catch(e) {
        if (e.javaException)
            e.javaException.printStackTrace();
        if (e.rhinoException)
            e.rhinoException.printStackTrace();
            
        global.response.status = 500;
        global.response.write(e.message);
    }

    return global.response.finish();
}
