/**
 * Adapter for Rhino configured with MySQL.
 * @alias ActiveRecord.Adapters.RhinoMySQL
 * @property {ActiveRecord.Adapter}
 */ 

Adapters.RhinoMySQL = function RhinoMySQL(conn){
    this.conn = conn;
    
    ActiveSupport.extend(this,Adapters.InstanceMethods);
    ActiveSupport.extend(this,Adapters.MySQL);
    ActiveSupport.extend(this,Adapters.RhinoJDBC);
    
    ActiveSupport.extend(this,{
        getLastInsertedRowId: function getLastInsertedRowId()
        {
            var stmt = this.conn.createStatement(),
                rs = stmt.executeQuery("SELECT LAST_INSERT_ID()"),
                autoIncKeyFromFunc;
                
            if (rs.next())
                autoIncKeyFromFunc = Number(rs.getInt(1));
            else
                throw new Error("Unable to get last insert ID");
                
            rs.close();
            
            return autoIncKeyFromFunc;
        },
        transaction: function transaction(proceed)
        {
            // TODO: this should be common to all MySQL adapters?
            try
            {
                this.executeSQL('BEGIN');
                proceed();
                this.executeSQL('COMMIT');
            }
            catch(e)
            {
                this.executeSQL('ROLLBACK');
                throw e;
            }
        },
        quoteIdentifier: function quoteIdentifier(name)
        {
          return "`" + name + "`";
        }
    });
};

Adapters.RhinoMySQL.connect = function connect(options)
{
    if(!options)
    {
        options = {};
    }
    for(var key in options)
    {
        options[key.toUpperCase()] = options[key];
    }
    var options = ActiveSupport.extend({
        HOST: 'localhost',
        PORT: 3306,
        USER: 'root',
        PASS: '',
        NAME: 'test'
    }, options);
    
    java.lang.Class.forName("com.mysql.jdbc.Driver").newInstance();
    var conn = java.sql.DriverManager.getConnection("jdbc:mysql://"+options.HOST+":"+options.PORT+"/"+options.NAME+"?user="+options.USER+"&password="+options.PASS);
    
    return new Adapters.RhinoMySQL(conn);
};
