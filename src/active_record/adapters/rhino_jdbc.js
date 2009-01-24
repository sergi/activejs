Adapters.RhinoJDBC = {
    log: function log()
    {
        if(!ActiveRecord.logging)
        {
            return;
        }
        if(arguments[0])
        {
            arguments[0] = 'ActiveRecord: ' + arguments[0];
        }
        return ActiveSupport.log.apply(ActiveSupport,arguments || []);
    },
    executeSQL: function executeSQL(sql)
    {
        this.log("Adapters.RhinoMySQL.executeSQL: " + sql + " [" + ActiveSupport.arrayFrom(arguments).slice(1).join(',') + "]");
        
        var stmt = this.conn.prepareStatement(sql),
            params = stmt.getParameterMetaData(),
            paramCount = Number(params.getParameterCount());
        
        if (arguments.length - 1 !== paramCount)
            throw new Error("incorrect parameter count");
            
        for (var index = 1; index < arguments.length; index++) {
            var param = arguments[index],
                type = typeof param;
            
        	switch (type)
    		{
    			case "number":
    				if (isFinite(param))
    				{
    				    stmt.setDouble(index, param);
    				}
    				else
    				{
    				    this.log("Number not finite! Bound as null");
    				    stmt.setNull(index, Packages.java.sql.Types.NULL);
    				}
    				break;
    				
    			case "boolean":
    				stmt.setDouble(index, (param ? 1 : 0));
    				break;
    				
    			case "string":
    				stmt.setString(index, param);
    				break;
    				
    			case "object": // can only be used for Blob (from integer array) or Date binding
    				if (param === null)
				        stmt.setNull(index, Packages.java.sql.Types.NULL);
    				else if (param.constructor === Date)
    				{
        				var offset = false ? param.getTimezoneOffset() * 60 * 1000 : 0; // TODO: enable or disable this?
            			stmt.setDate(index, new Packages.java.sql.Date(param.getTime() - offset)); // milliseconds since midnight 1/1/1970.
    				}
    				//else if (param.constructor === Array)
    				//	stmt.bindBlobParameter(index, param, param.length);
    				else
    				{
    				    this.log("Parameter " + index + " is not a Date or a (byte) Array - using NULL instead. SQL: " + sql);
    				    stmt.setNull(index, Packages.java.sql.Types.NULL);
    				}
    				break;
    				
    			case "undefined":    
				    stmt.setNull(index, Packages.java.sql.Types.NULL);
    				break;
    				
    			default:    
    				this.log("Parameter " + index + " is of an unsupported type (" + (typeof param) + " - using NULL instead. SQL: " + sql);
				    stmt.setNull(index, Packages.java.sql.Types.NULL);
    				break;
    		}
        }
        
        var hasResults = stmt.execute();
            
        return hasResults ? stmt.getResultSet() : null;
    },
    iterableFromResultSet: function iterableFromResultSet(result)
    {
        var response = {
            rows: []
        };
        
        var meta = result.getMetaData(),
            columnCount = meta.getColumnCount(),
            columns = [],
            types = [];
        for (var i = 0; i < columnCount; i++) {
            columns.push(meta.getColumnName(i+1));
            types.push(meta.getColumnType(i+1));
        }
        
        result.beforeFirst();
        while (result.next())
        {
            var row = {};
            for (var i = 0; i < columnCount; i++)
            {
                row[columns[i]] = Adapters.RhinoJDBC.convertJavaType(result.getObject(i+1), types[i]);
            }
            response.rows.push(row);
        }
        result.close();
        
        response.iterate = function(iterator)
        {
            if(typeof(iterator) === 'number')
            {
                if (this.rows[iterator])
                {
                    return ActiveSupport.clone(this.rows[iterator]);
                }
                else
                {
                    return false;
                }
            }
            else
            {
                for(var i = 0; i < this.rows.length; ++i)
                {
                    var row = ActiveSupport.clone(this.rows[i]);
                    iterator(row);
                }
            }
        };
        
        return response;
    },
    convertJavaType : function convertJavaType(object, type)
    {
        switch (type) {
            case Packages.java.sql.Types.CHAR:
            case Packages.java.sql.Types.VARCHAR:
            case Packages.java.sql.Types.LONGVARCHAR:
                return String(object);

            case Packages.java.sql.Types.BOOLEAN:    
            case Packages.java.sql.Types.BIT:
                return Boolean(object);

            case Packages.java.sql.Types.FLOAT:
            case Packages.java.sql.Types.REAL:
            case Packages.java.sql.Types.DOUBLE:
            case Packages.java.sql.Types.NUMERIC:
            case Packages.java.sql.Types.DECIMAL:
            case Packages.java.sql.Types.TINYINT:
            case Packages.java.sql.Types.SMALLINT:
            case Packages.java.sql.Types.INTEGER:
            case Packages.java.sql.Types.BIGINT:
                return Number(object);

            case Packages.java.sql.Types.NULL:
                return null;

            case Packages.java.sql.Types.DATE:
            case Packages.java.sql.Types.TIMESTAMP:
            case Packages.java.sql.Types.TIME:
                var offset = true ? object.getTimezoneOffset() * 60 * 1000 : 0; // TODO: enable or disable this?
                return new Date(object.getTime() - offset);

            // TODO: support these types? (at least BLOB and BINARY?)
            
            //case Packages.java.sql.Types.BINARY:
            //case Packages.java.sql.Types.VARBINARY:
            //case Packages.java.sql.Types.LONGVARBINARY:
            //case Packages.java.sql.Types.BLOB:
            //    
            //case Packages.java.sql.Types.CLOB:
            //case Packages.java.sql.Types.DATALINK:
            //case Packages.java.sql.Types.DISTINCT:
            //case Packages.java.sql.Types.JAVA_OBJECT:
            //case Packages.java.sql.Types.OTHER:
            //case Packages.java.sql.Types.REF:
            //case Packages.java.sql.Types.STRUCT:
            //case Packages.java.sql.Types.ARRAY:
        }

        this.log("Unsupported type " + type + " of object: " + object+ ". Returning null instead.");

        return null;
    }
};