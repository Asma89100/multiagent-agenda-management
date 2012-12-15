var _ = require("underscore");
var should = require("should");

var SharedAppointment = require("../abt").SharedAppointment;

describe('ABT', function() {
    before(function() {
    });
    
    describe('Scenario 1', function() {            
        it('should process this scenario correctly', function(done) {
		    
		    var mailbox = [];
		
		    var fun = function(v1, v2) {
		        return v1 === v2;
		    };
		    
		    var a = { "test-1" : false, "test-2" : false, "test-3" : false, "test-4" : false};
		    
		    var notifyDone = function(n) {
                a[n] = true;
                for(var k in a) {
                    if(a[k]==false)
                        return;
                }
                done();
		    };
		    
		    var callback = function(a) {
		      a.state.should.equal("OK");
		      a.current_value.should.equal(3);
		      notifyDone(a.me);
		    };
		    
		    var a1 = new SharedAppointment("test-1", true, "test", [ 1, 2, 3 ], [ "test-2", "test-3", "test-4" ], {
		        "test-2" : [ fun ],
		        "test-3" : [ fun ],
		        "test-4" : [ fun ]
		    }, mailbox, callback);
		    var a2 = new SharedAppointment("test-2", false, "test", [ 1, 3 ], [], {
		        "test-1" : [ fun ]
		    }, mailbox, callback);
		    var a3 = new SharedAppointment("test-3", false, "test", [ 2, 3 ], [], {
		        "test-1" : [ fun ]
		    }, mailbox, callback);
		    var a4 = new SharedAppointment("test-4", false,"test", [ 1, 2, 3 ], [], {
		        "test-1" : [ fun ]
		    }, mailbox, callback);
		
		    var appointments = [ a1, a2, a3, a4 ];
		
		    while (mailbox.length > 0) {
		        var msg = mailbox.shift();
		
		        for ( var i = 0; i < appointments.length; i++) {
		            if (msg.to === appointments[i].me) {
		                appointments[i].receive(msg);
		            }
		        }
		    }	    
        });
        it('should also process this scenario correctly', function(done) {
            
            var mailbox = [];
        
            var fun = function(v1, v2) {
                return v1 === v2;
            };
            
            var a = { "test-1" : false, "test-2" : false, "test-3" : false};
            
            var notifyDone = function(n) {
                a[n] = true;
                for(var k in a) {
                    if(a[k]==false)
                        return;
                }
                done();
            };
            
            var callback = function(a) {
              a.state.should.equal("OK");
              a.current_value.should.equal(8);
              notifyDone(a.me);
            };         
            
            var a1 = new SharedAppointment("test-1", true, "test", [ 5,6,7,8,9,10 ], [ "test-2", "test-3" ], {
                "test-2" : [ fun ],
                "test-3" : [ fun ]
            }, mailbox, callback);
            var a2 = new SharedAppointment("test-2", false, "test", [ 6,7,8,9,10 ], [], {
                "test-1" : [ fun ]
            }, mailbox, callback);
            var a3 = new SharedAppointment("test-3", false, "test", [ 0,1,2,3,8,9,10 ], [], {
                "test-1" : [ fun ]
            }, mailbox, callback);
        
            var appointments = [ a1, a2, a3 ];
        
            while (mailbox.length > 0) {
                var msg = mailbox.shift();
        
                for ( var i = 0; i < appointments.length; i++) {
                    if (msg.to === appointments[i].me) {
                        appointments[i].receive(msg);
                    }
                }
            }       
        });         
    });
});