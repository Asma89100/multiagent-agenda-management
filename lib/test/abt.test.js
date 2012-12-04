var _ = require("underscore");
var should = require("should");

var SharedAppointment = require("../abt").SharedAppointment;

describe('ABT', function() {
    before(function() {
    });
    
    describe('Scenario 1', function() {            
        it('should process this scenario correctly', function() {
		    
		    var mailbox = [];
		
		    var fun = function(v1, v2) {
		        return v1 === v2;
		    };
		    var a1 = new SharedAppointment("test-1", "test", [ 1, 2, 3 ], [ "test-2", "test-3", "test-4" ], {
		        "test-2" : [ fun ],
		        "test-3" : [ fun ],
		        "test-4" : [ fun ]
		    }, mailbox);
		    var a2 = new SharedAppointment("test-2", "test", [ 1, 3 ], [], {
		        "test-1" : [ fun ]
		    }, mailbox);
		    var a3 = new SharedAppointment("test-3", "test", [ 2, 3 ], [], {
		        "test-1" : [ fun ]
		    }, mailbox);
		    var a4 = new SharedAppointment("test-4", "test", [ 1, 2, 3 ], [], {
		        "test-1" : [ fun ]
		    }, mailbox);
		
		    var appointments = [ a1, a2, a3, a4 ];
		
		    while (mailbox.length > 0) {
		        var msg = mailbox.shift();
		
		        for ( var i = 0; i < appointments.length; i++) {
		            if (msg.to === appointments[i].owner) {
		                appointments[i].receive(msg);
		            }
		        }
		    }
			
			a1.current_value.should.equal(3);
			a2.current_value.should.equal(3);
			a3.current_value.should.equal(3);
			a4.current_value.should.equal(3);	    
        });
        it('should also process this scenario correctly', function() {
            
            var mailbox = [];
        
            var fun = function(v1, v2) {
                return v1 === v2;
            };
            var a1 = new SharedAppointment("test-1", "test", [ 5,6,7,8,9,10 ], [ "test-2", "test-3" ], {
                "test-2" : [ fun ],
                "test-3" : [ fun ]
            }, mailbox);
            var a2 = new SharedAppointment("test-2", "test", [ 6,7,8,9,10 ], [], {
                "test-1" : [ fun ]
            }, mailbox);
            var a3 = new SharedAppointment("test-3", "test", [ 0,1,2,3,8,9,10 ], [], {
                "test-1" : [ fun ]
            }, mailbox);
        
            var appointments = [ a1, a2, a3 ];
        
            while (mailbox.length > 0) {
                var msg = mailbox.shift();
        
                for ( var i = 0; i < appointments.length; i++) {
                    if (msg.to === appointments[i].owner) {
                        appointments[i].receive(msg);
                    }
                }
            }
            
            a1.current_value.should.equal(8);
            a2.current_value.should.equal(8);
            a3.current_value.should.equal(8);       
        });         
    });
});