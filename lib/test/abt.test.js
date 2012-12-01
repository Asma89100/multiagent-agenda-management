var _ = require("underscore");
var should = require("should");

var Agent = require("../abt").Agent;

describe('ABT', function() {
    before(function() {
    });
    
    describe('Scenario 1', function() {            
        it('should process this scenario correctly', function() {
        
	        //var a1 = new Agent("a1", [1,2], ["a3"], {"a3" : [function(v1, v2){ return v1 !== v2; }]});
		    //var a2 = new Agent("a2", [2], ["a3"], {"a3" : [function(v1, v2){ return v1 !== v2; }]});
		    //var a3 = new Agent("a3", [1,2], [], {"a1" : [function(v1, v2){ return v1 !== v2; }], "a2" : [function(v1, v2){ return v1 !== v2; }]});
		    
		    var mailbox = [];
		
		    var fun = function(v1, v2) {
		        return v1 === v2;
		    };
		    var a1 = new Agent("a1", [ 1, 2, 3 ], [ "a2", "a3", "a4" ], {
		        "a2" : [ fun ],
		        "a2" : [ fun ],
		        "a3" : [ fun ]
		    }, mailbox);
		    var a2 = new Agent("a2", [ 1, 3 ], [], {
		        "a1" : [ fun ]
		    }, mailbox);
		    var a3 = new Agent("a3", [ 2, 3 ], [], {
		        "a1" : [ fun ]
		    }, mailbox);
		    var a4 = new Agent("a4", [ 1, 2, 3 ], [], {
		        "a1" : [ fun ]
		    }, mailbox);
		
		    var agents = [ a1, a2, a3, a4 ];
		
		    while (mailbox.length > 0) {
		        var msg = mailbox.shift();
		
		        //console.log("%j", msg);
		
		        for ( var i = 0; i < agents.length; i++) {
		            if (msg.to === agents[i].name) {
		                agents[i].receive(msg);
		            }
		        }
		    }
			
			a1.current_value.should.equal(3);
			a2.current_value.should.equal(3);
			a3.current_value.should.equal(3);
			a4.current_value.should.equal(3);	    
        });             
    });
});