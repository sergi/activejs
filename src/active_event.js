/* ***** BEGIN LICENSE BLOCK *****
 * 
 * Copyright (c) 2008 Aptana, Inc.
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * 
 * Original Author: Ryan Johnson <ryan@syntacticx.com>
 * Additional Contributors: The Aptana Jaxer team
 * 
 * ***** END LICENSE BLOCK ***** */

/**
 * @alias ActiveEvent
 * @example
 * <p>ActiveEvent allows you to create events, and attach event handlers to any class or object, not just DOM nodes.</p>
 * <h2>Setup</h2>
 * <p>Before you can use Object.Event you must call extend a given class or object with Object.Event's methods. If you extend a class, both the class itself will become observable, as well as all of it's instances.</p>
 * <pre class="highlighted"><code class="javascript">ObjectEvent.extend(MyClass); //class and all instances are observable
 * ObjectEvent.extend(my_object); //this object becomes observable</code></pre>
 * 
 * <h2>Creating Events</h2>
 * <p>You can create an event inside any method of your class or object by calling the notify() method with name of the event followed by any arguments to be passed to observers. You can also have an existing method fire an event with the same name as the method using makeObservable().</p>
 * <pre class="highlighted"><code class="javascript">var Message = function(){};
 * Message.prototype.send = function(text){
 *   //message sending code here...
 *   this.notify('sent',text);
 * };
 * ObjectEvent.extend(Message);
 * 
 * //make an existing method observable
 * var observable_hash = new Hash({});
 * ObjectEvent.extend(observable_hash);
 * observable_hash.makeObservable('set');
 * </code></pre>
 * 
 * <h2>Observing Events</h2>
 * <p>To observe an event call the observe() method with the name of the event you want to observe, and the observer function. The observer function will receive any additional arguments passed to notify(). If observing a class, the instance that triggered the event will always be the first argument passed to the observer. observeOnce() works just like observe() in every way, but is only called once.</p>
 * <pre class="highlighted"><code class="javascript">Message.observe('sent',function(message,text){
 *   //responds to all sent messages
 * });
 * 
 * var m = new Message();
 * m.observe('sent',function(text){
 *   //this will only be called when "m" is sent
 * });
 * 
 * observable_hash.observe('set',function(key,value){
 *   console.log('observable_hash.set: ' + key + '=' + value);
 * });
 * observable_hash.observeOnce(function(key,value){
 *   //this will only be called once
 * });
 * </code></pre>
 * 
 * <h2>Control Flow</h2>
 * <p>When notify() is called, if any of the registered observers for that event throw the special $break variable, no other observers will be called and notify() will return false. Otherwise notify() will return an array of the collected return values from any registered observer functions. Observers can be unregistered with the stopObserving() method. If no observer is passed, all observers of that object or class with the given event name will be unregistered. If no event name and no observer is passed, all observers of that object or class will be unregistered.</p>
 * <pre class="highlighted"><code class="javascript">Message.prototype.send = function(text){
 *   if(this.notify('send',text) === false)
 *     return false;
 *   //message sending code here...
 *   this.notify('sent',text);
 *   return true;
 * };
 * 
 * var m = new Message();
 * 
 * var observer = m.observe('send',function(message,text){
 *   if(text == 'test')
 *     throw $break;
 * });
 * 
 * m.send('my message'); //returned true
 * m.send('test'); //returned false
 * 
 * m.stopObserving('send',observer);
 * 
 * m.send('test'); //returned true</code></pre>
 * 
 * <h2>Object.options</h2>
 * <p>If an object has an options property that contains a callable function with the same name as an event triggered with <b>notify()</b>, it will be treated just like an instance observer. So the falling code is equivalent.</p>
 * <pre class="highlighted"><code class="javascript">var rating_one = new Control.Rating('rating_one',{  
 *   afterChange: function(new_value){}    
 * });  
 * 
 * var rating_two = new Control.Rating('rating_two');  
 * rating_two.observe('afterChange',function(new_value){});</code></pre>
 * 
 * <h2>MethodCallObserver</h2>
 * <p>The makeObservable() method permanently modifies the method that will become observable. If you need to temporarily observe a method call without permanently modifying it, use the observeMethod(). Pass the name of the method to observe and the observer function will receive all of the arguments passed to the method. An ObjectEvent.MethodCallObserver object is returned from the call to observeMethod(), which has a stop() method on it. Once stop() is called, the method is returned to it's original state. You can optionally pass another function to observeMethod(), if you do the MethodCallObserver will be automatically stopped when that function finishes executing.</p>
 * <pre class="highlighted"><code class="javascript">var h = new Hash({});
 * ObjectEvent.extend(h);
 * 
 * var observer = h.observeMethod('set',function(key,value){
 *   console.log(key + '=' + value);
 * });
 * h.set('a','one');
 * h.set('a','two');
 * observer.stop();
 * 
 * //console now contains:
 * //"a = one"
 * //"b = two"
 * 
 * //the following does the same as above
 * h.observeMethod('set',function(key,value){
 *   console.log(key + '=' + value);
 * },function(){
 *   h.set('a','one');
 *   h.set('b','two');
 * });</code></pre>
 */
ActiveEvent = null;

/**
 * @classDescription {ActiveEvent.ObservableObject} After calling
 *  ActiveEvent.extend(object), the given object will inherit the
 *  methods in this class. If the given object has a prototype
 *  (is a class constructor), the object's prototype will inherit
 *  these methods as well.
 */

(function(){
    
var global_context = ActiveSupport.getGlobalContext();

/**
 * Mimics the Prototype.js framework's $break variable if it is not available.
 * @property {Object}
 * @alias $break
 */
if(typeof(global_context.$break) == 'undefined')
{
    global_context.$break = {};
}

ActiveEvent = {};

/**
 * After extending a given object, it will inherit the methods described in
 *  ActiveEvent.ObservableObject.
 * @param {Object} object
 */
ActiveEvent.extend = function extend(object){
    
    /**
     * Wraps the given method_name with a function that will call the method,
     *  then trigger an event with the same name as the method. This can
     *  safely be applied to virtually any method, including built in
     *  Objects (Array.pop, etc), but cannot be undone.
     * @alias ActiveEvent.ObservableObject.makeObservable
     * @param {String} method_name
     */
    object.makeObservable = function makeObservable(method_name)
    {
        if(this[method_name])
        {
            this._objectEventSetup(method_name);
            this[method_name] = ActiveSupport.wrap(this[method_name],function wrapped_observer(proceed){
                var args = ActiveSupport.arrayFrom(arguments).slice(1);
                var response = proceed.apply(this,args);
                args.unshift(method_name);
                this.notify.apply(this,args);
                return response;
            });
        }
        if(this.prototype)
        {
            this.prototype.makeObservable(method_name);
        }
    };
    
    /**
     * Similiar to makeObservable(), but after the callback is called, the
     *  method will be returned to it's original state and will no longer
     *  be observable.
     * @alias ActiveEvent.ObservableObject.observeMethod
     * @param {String} method_name
     * @param {Function} observe
     * @param {Function} [callback]
     */
    object.observeMethod = function observeMethod(method_name,observer,scope)
    {
        return new ActiveEvent.MethodCallObserver([[this,method_name]],observer,scope);
    };
    
    object._objectEventSetup = function _objectEventSetup(event_name)
    {
        this._observers = this._observers || {};
        this._observers[event_name] = this._observers[event_name] || [];
    };
    
    /**
     * @alias ActiveEvent.ObservableObject.observe
     * @param {String} event_name
     * @param {Function} observer
     * @return {Function} observer
     */
    object.observe = function observe(event_name,observer)
    {
        if(typeof(event_name) == 'string' && typeof(observer) != 'undefined')
        {
            this._objectEventSetup(event_name);
            if(!(ActiveSupport.indexOf(this._observers[event_name],observer) > -1))
            {
                this._observers[event_name].push(observer);
            }
        }
        else
        {
            for(var e in event_name)
            {
                this.observe(e,event_name[e]);
            }
        }
        return observer;
    };
    
    /**
     * Removes a given observer. If no observer is passed, removes all
     *   observers of that event. If no event is passed, removes all
     *   observers of the object.
     * @alias ActiveEvent.ObservableObject.stopObserving
     * @param {String} [event_name]
     * @param {Function} [observer]
     */
    object.stopObserving = function stopObserving(event_name,observer)
    {
        this._objectEventSetup(event_name);
        if(event_name && observer)
        {
            this._observers[event_name] = ActiveSupport.without(this._observers[event_name],observer);
        }
        else if(event_name)
        {
            this._observers[event_name] = [];
        }
        else
        {
            this._observers = {};
        }
    };
    
    /**
     * Works exactly like observe(), but will stopObserving() after the next
     *   time the event is fired.
     * @alias ActiveEvent.ObservableObject.observeOnce
     * @param {String} event_name
     * @param {Function} observer
     * @return {Function} The observer that was passed in will be wrapped,
     *  this generated / wrapped observer is returned.
     */
    object.observeOnce = function observeOnce(event_name,outer_observer)
    {
        var inner_observer = ActiveSupport.bind(function bound_inner_observer(){
            outer_observer.apply(this,arguments);
            this.stopObserving(event_name,inner_observer);
        },this);
        this._objectEventSetup(event_name);
        this._observers[event_name].push(inner_observer);
        return inner_observer;
    };
    
    /**
     * Triggers event_name with the passed arguments.
     * @alias ActiveEvent.ObservableObject.notify
     * @param {String} event_name
     * @param {mixed} [args]
     * @return {mixed} Array of return values, or false if $break was thrown
     *  by an observer.
     */
    object.notify = function notify(event_name){
        this._objectEventSetup(event_name);
        var collected_return_values = [];
        var args = ActiveSupport.arrayFrom(arguments).slice(1);
        try{
            for(var i = 0; i < this._observers[event_name].length; ++i)
                collected_return_values.push(this._observers[event_name][i].apply(this._observers[event_name][i],args) || null);
        }catch(e){
            if(e == $break)
            {
                return false;
            }
            else
            {
                throw e;
            }
        }
        return collected_return_values;
    };
    if(object.prototype)
    {
        object.prototype.makeObservable = object.makeObservable;
        object.prototype.observeMethod = object.observeMethod;
        object.prototype._objectEventSetup = object._objectEventSetup;
        object.prototype.observe = object.observe;
        object.prototype.stopObserving = object.stopObserving;
        object.prototype.observeOnce = object.observeOnce;
        
        object.prototype.notify = function notify(event_name)
        {
            if(object.notify)
            {
                var args = ActiveSupport.arrayFrom(arguments).slice(1);
                args.unshift(this);
                args.unshift(event_name);
                object.notify.apply(object,args);
            }
            this._objectEventSetup(event_name);
            var args = ActiveSupport.arrayFrom(arguments).slice(1);
            var collected_return_values = [];
            try
            {
                if(this.options && this.options[event_name] && typeof(this.options[event_name]) == 'function')
                {
                    collected_return_values.push(this.options[event_name].apply(this,args) || null);
                }
                for(var i = 0; i < this._observers[event_name].length; ++i)
                {
                    collected_return_values.push(this._observers[event_name][i].apply(this._observers[event_name][i],args) || null);
                }
            }
            catch(e)
            {
                if(e == $break)
                {
                    return false;
                }
                else
                {
                    throw e;
                }
            }
            return collected_return_values;
        };
    }
};

ActiveEvent.MethodCallObserver = function MethodCallObserver(methods,observer,scope)
{
    this.stop = function stop(){
        for(var i = 0; i < this.methods.length; ++i)
        {
            this.methods[i][0][this.methods[i][1]] = this.originals[i];
        }
    };
    this.methods = methods;
    this.originals = [];
    for(var i = 0; i < this.methods.length; ++i)
    {
        this.originals.push(this.methods[i][0][this.methods[i][1]]);
        this.methods[i][0][this.methods[i][1]] = ActiveSupport.wrap(this.methods[i][0][this.methods[i][1]],function(proceed){
            var args = ActiveSupport.arrayFrom(arguments).slice(1);
            observer.apply(this,args);
            return proceed.apply(this,args);
        });
    }
    if(scope)
    {
        scope();
        this.stop();
    }
};

})();