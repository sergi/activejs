var ActiveController = require("activejs").ActiveController,
    file = require("file");

ActiveController.Server.Response = {
    setStatus: function setStatus(status_code, reason_phrase)
    {
        print("ActiveController setStatus="+status_code)
        global.response.status = status_code;
    },
    setContents: function setContents(contents)
    {
        print("ActiveController setContents="+contents)
        global.response.body = [];
        if (contents)
            global.response.write(contents);
    },
    setHeader: function addHeader(key, value)
    {
        print("ActiveController addHeader="+key+" value="+value)
        global.response.setHeader(key, value);
    },
    getHeader: function getHeader(key)
    {
        print("ActiveController getHeader="+key)
        return global.response.getHeader(key);
    },
    removeHeader: function removeHeader(key)
    {
        print("ActiveController removeHeader="+key)
        global.response.unsetHeader(key);
    },
    redirect: function redirect(url, status_code, reason_phrase)
    {
        print("ActiveController redirect="+url)
        global.response.redirect(url, status_code);
        throw global.response.finish();
    }
};

ActiveController.Server.Request = {
    getData: function getData()
    {
        var data = global.request.body.read().decodeToString("UTF-8");
        print("ActiveController getData="+data)
        return data;
    },
    getQuery: function getQuery()
    {
        print("ActiveController getQuery")
        return global.request.GET();
    },
    getMethod: function getMethod()
    {
        var method = global.request.requestMethod().toLowerCase();
        print("ActiveController getMethod="+method)
        return method;
    },
    getURI: function getURI()
    {
        var uri = global.request.uri();
        print("ActiveController getURI="+uri)
        return uri;
    },
    getExtension: function getExtension()
    {
        var ext = (global.request.uri().split('.').pop() || '').replace(/\?.*$/,'').replace(/\#.*$/,'');
        print("ActiveController getExtension="+ext)
        return ext
    }
};

ActiveController.Server.IO = {
    exists: function exists(path)
    {
        print("ActiveController exists="+path)
        return file.exists(path);
    },
    load: function load(path)
    {
        print("ActiveController load="+path)
        return require(path);
    },
    read: function read(path)
    {
        print("ActiveController read="+path)
        return file.read(path);
    },
    grep: function grep(path,pattern,recursive)
    {
        print("ActiveController grep="+path+" pattern="+pattern+" recursive="+recursive)
        throw "NYI";
    }
};

ActiveController.Server.Environment = {
    isProduction: function isProduction()
    {
        print("ActiveController isProduction")
        return false;
    },
    getApplicationRoot: function getApplicationRoot()
    {
        var root = file.join(file.dirname(system.args[0]), 'app');
        print("ActiveController getApplicationRoot="+root)
        return root;
    }
};