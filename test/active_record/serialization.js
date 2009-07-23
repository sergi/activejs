/* ***** BEGIN LICENSE BLOCK *****
 * 
 * Copyright (c) 2009 Aptana, Inc.
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
 * ***** END LICENSE BLOCK ***** */

ActiveTest.Tests.ActiveRecord.serialization = function(proceed)
{
    with(ActiveTest)
    {
        if(ActiveRecord.asynchronous)
        {

        }
        else
        {
            var a = Comment.create({
                title: 'a',
                test: {
                    a: '1',
                    b: 2,
                    c: {
                        aa: '11',
                        bb: [1,2,3],
                        cc: '33'
                    }
                }
            });
            var sample = Comment.find(a.id).test;
            assert(sample.a == a.test.a && sample.b == a.test.b && a.test.c.bb[1] == sample.c.bb[1],'Object serialization.');
            var b = Comment.create({
                title: 'b',
                test_2: [1,2,['a','b','c']]
            });
            var sample = Comment.find(b.id).test_2;
            assert(sample[0] == b.test_2[0] && sample[2][1] == b.test_2[2][1],'Array serialization.');
            a.destroy();
            b.destroy();
            
            var ted = User.create({name: 'ted'});
            var one = ted.createComment({title: 'title one',body: 'comment one'});
            var two = ted.createComment({title: 'title two',body: 'comment two'});
            //JSON
            
            //item
            assert(ActiveSupport.JSON.parse(ted.toJSON()).name === ted.name && ActiveSupport.JSON.parse(ted.toJSON()).id === ted.id,'JSON parse/serialize item');
            
            //array
            var result = Comment.find({all: true});
            assert(ActiveSupport.JSON.parse(result.toJSON())[0].body === result[0].body,'JSON parse/serialize array');
            
            //nested
            var json = ted.toJSON({
              comments: ted.getCommentList().toArray()
            });
            var parsed = ActiveSupport.JSON.parse(json);
            assert(ted.getCommentList()[0].body === parsed.comments[0].body,'JSON parse/serialize object with nested array');
            
            if(proceed)
                proceed();
        }
    }
};