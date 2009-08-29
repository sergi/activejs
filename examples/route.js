var utils = require("jack/utils"),
    Request = require("jack/request").Request,
    Response = require("jack/response").Response,
    ActiveRoutes = require("activejs").ActiveRoutes;

var Application = {
    Pages : {
        index : function() {
            response.write("index");
        },
        contact : function() {
            response.write("concat")
        },
        page : function() {
            response.write("page")
        }
    },
    Blog : {
        index : function() {
            response.write("blog index")
        },
        post : function() {
            response.write("post")
        },
    },
    Baz : {
        bar : function() {
            response.write("bazbar");
        }
    }
}

var routes = new ActiveRoutes([  
  ['root','/',{object:'Pages',method:'index'}],  
  ['contact','/contact',{object:'Pages',method:'contact'}],  
  ['blog','/blog',{object:'Blog',method:'index'}],  
  ['post','/blog/post/:id',{object:'Blog',method:'post'}],  
  ['/pages/*',{object:'Pages',method:'page'}],  
  ['/:object/:method']  
], Application);


exports.app = function(env) {
    global.request = new Request(env);
    global.response = new Response();
    
    var pathInfo = utils.unescape(env["PATH_INFO"]);
    
    try {
        routes.dispatch(pathInfo);
    } catch (e) {
        global.response.status = 500;
        global.response.write(e.message);
    }
    
    return global.response.finish();
}
