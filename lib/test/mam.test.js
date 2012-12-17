var _ = require("underscore");
var should = require("should");

var mam = require("../mam");

describe('MAM', function() {
    before(function() {
    });
    
    describe('#removeAppointment(a)', function() {            
        it('should remove an appointment correctly', function() {
            var m = new mam("test", []);
            
            var a = m.addAppointment('a1', 0, 1);
            m.removeAppointment(a);          
           
            m.getAppointmentList().should.have.lengthOf(0);
        });
        it('should remove an appointment and its references correctly', function() {
            var m = new mam("test", []);
            
            var a1 = m.addAppointment('a1', 0, 1);
            var a2 = m.addAppointment('a2', 1, 2);
            m.removeAppointment(a1);
           
            m.getAppointmentList().should.have.lengthOf(1);
            m.getAppointmentList()[0].subject.should.equal('a2');
            m.getAppointmentList()[0].should.not.have.property('next');
            m.getAppointmentList()[0].should.not.have.property('previous');
        });
        it('should remove an appointment and allow a new one to take its place', function() {
            var m = new mam("test", []);
            
            var a1 = m.addAppointment('a1', 0, 1);
            var a2 = m.addAppointment('a2', 1, 2);
            m.removeAppointment(a1);
            
            var a3 = m.addAppointment('a3', 0, 1);
           
            m.getAppointmentList().should.have.lengthOf(2);
            
            m.getAppointmentList()[0].subject.should.equal('a2');
            m.getAppointmentList()[1].subject.should.equal('a3');
            
            m.getAppointmentList()[0].should.not.have.property('next');
            m.getAppointmentList()[1].should.not.have.property('previous');
            
            m.getAppointmentList()[0].previous.subject.should.equal('a3');
            m.getAppointmentList()[1].next.subject.should.equal('a2');            
        });
        it('should remove a shared appointment', function(done) {
            var mailbox = [];
            
            var a1 = undefined;
            
            var m = { "test-1" : false, "test-2" : false};
            
            var notifyDone = function(n) {
                m[n] = true;
                for(var k in m) {
                    if(m[k]==false)
                        return;
                }
                done();
            };
            
            var m1_callback = function(action, a) {
                if(action == "CANCELED") {
                    m1.appointment_list.should.have.lengthOf(0);
                    m1.shared_appointment_list.should.have.lengthOf(0);
                    notifyDone("test-1");
                }
            };
            
            var m2_callback = function(action, a) {
                if(action == "OK") {
                    a1 = a;
                } else if(action == "CANCELED") {
                    m2.appointment_list.should.have.lengthOf(1);
                    m2.shared_appointment_list.should.have.lengthOf(0);
                    notifyDone("test-2");
                }
            };

            var m1 = new mam("test-1", mailbox, m1_callback);
            var m2 = new mam("test-2", mailbox, m2_callback);
            
            m2.addAppointment('test', 2, 6);
            
            m1.createSharedAppointment("a1", [4,5,6,7,8,9], 1, ["test-2"]);
            
            var agents = [m1, m2];
            
            while (mailbox.length > 0) {
                var msg = mailbox.shift();
        
                for ( var i = 0; i < agents.length; i++) {
                    if (msg.to === agents[i].name) {
                        agents[i].handleMessage(msg);
                    }
                }
            }
            
            setTimeout(function() {
                m2.removeAppointment(a1);          
                
                while (mailbox.length > 0) {
	                var msg = mailbox.shift();
	        
	                for ( var i = 0; i < agents.length; i++) {
	                    if (msg.to === agents[i].name) {
	                        agents[i].handleMessage(msg);
	                    }
	                }
	            }         
            }, 1);
        });
        it('should also remove this shared appointment', function(done) {
            var mailbox = [];
            
            var a1 = undefined;
            
            var m = { "test-1" : false, "test-2" : false, "test-3" : false, "test-4" : false};
            
            var notifyDone = function(n) {
                m[n] = true;
                for(var k in m) {
                    if(m[k]==false)
                        return;
                }
                done();
            };
            
            var m1_callback = function(action, a) {
                if(action == "OK") {
                    a1 = a;
                } else if(action == "CANCELED") {
                    m1.appointment_list.should.have.lengthOf(0);
                    m1.shared_appointment_list.should.have.lengthOf(0);
                    notifyDone("test-1");
                }
            };
            
            var m2_callback = function(action, a) {
                if(action == "CANCELED") {
                    m2.appointment_list.should.have.lengthOf(1);
                    m2.shared_appointment_list.should.have.lengthOf(0);
                    notifyDone("test-2");
                }
            };
            
            var m3_callback = function(action, a) {
                if(action == "CANCELED") {
                    m3.appointment_list.should.have.lengthOf(0);
                    m3.shared_appointment_list.should.have.lengthOf(0);
                    notifyDone("test-3");
                }
            };
            
            var m4_callback = function(action, a) {
                if(action == "CANCELED") {
                    m4.appointment_list.should.have.lengthOf(0);
                    m4.shared_appointment_list.should.have.lengthOf(0);
                    notifyDone("test-4");
                }
            };

            var m1 = new mam("test-1", mailbox, m1_callback);
            var m2 = new mam("test-2", mailbox, m2_callback);
            var m3 = new mam("test-3", mailbox, m3_callback);
            var m4 = new mam("test-4", mailbox, m4_callback);
            
            m2.addAppointment('test', 2, 6);
            
            m1.createSharedAppointment("a1", [4,5,6,7,8,9], 1, ["test-2", "test-3", "test-4"]);
            
            var agents = [m1, m2, m3, m4];
            
            while (mailbox.length > 0) {
                var msg = mailbox.shift();
        
                for ( var i = 0; i < agents.length; i++) {
                    if (msg.to === agents[i].name) {
                        agents[i].handleMessage(msg);
                    }
                }
            }
            
            setTimeout(function() {
                m1.removeAppointment(a1);
                
                while (mailbox.length > 0) {
                    var msg = mailbox.shift();
            
                    for ( var i = 0; i < agents.length; i++) {
                        if (msg.to === agents[i].name) {
                            agents[i].handleMessage(msg);
                        }
                    }
                }         
            }, 1);
        });
    });

    describe('#addAppointment()', function() {            
        it('should add an appointment correctly', function() {
            var m = new mam("test", []);
            m.getAppointmentList().should.have.length(0);
            
            var a = m.addAppointment('a1', 0, 1);          
            
            a.subject.should.eql('a1');
            a.start.should.eql(0);
            a.end.should.eql(1);
            
            m.getAppointmentList().should.have.lengthOf(1);
            m.getAppointmentList()[0].should.equal(a);
        });
        it('should also add two appointments correctly', function() {
            var m = new mam("test", []);
            m.getAppointmentList().should.have.length(0);
            
            var a1 = m.addAppointment('a1', 0, 1);
            var a2 = m.addAppointment('a2', 1, 2);           
            
            m.getAppointmentList().should.have.length(2);
            
            m.getAppointmentList()[0].should.equal(a1).and.have.property('next').equal(a2);
            m.getAppointmentList()[0].should.not.have.property('previous');
            
            m.getAppointmentList()[1].should.equal(a2).and.have.property('previous').equal(a1);
            m.getAppointmentList()[1].should.not.have.property('next');
        });
        it('should not let two conflicting appointments be added', function() {
            var m = new mam("test", []);
            m.getAppointmentList().should.have.length(0);
            
            var a1 = m.addAppointment('a1', 0, 1);
            
            (function(){                
                m.addAppointment('a2', 0, 2);
            }).should.throwError();           
            
            m.getAppointmentList().should.have.length(1);
            
            m.getAppointmentList()[0].should.equal(a1).and.not.have.property('next');
            m.getAppointmentList()[0].should.not.have.property('previous');
        });
    });
    
    describe('#createSharedAppointment()', function() {            
        it('should create an shared appointment correctly', function(done) {
            var mailbox = [];
            
            var m = { "test-1" : false, "test-2" : false};
            
            var notifyDone = function(n) {
                m[n] = true;
                for(var k in m) {
                    if(m[k]==false)
                        return;
                }
                done();
            };
            
            var m1_callback = function(action, a) {
              action.should.equal("OK");
              a.start.should.equal(6);
              notifyDone("test-1");
            };
            
            var m2_callback = function(action, a) {
              action.should.equal("OK");
              a.start.should.equal(6);
              notifyDone("test-2");
            };

            var m1 = new mam("test-1", mailbox, m1_callback);
            var m2 = new mam("test-2", mailbox, m2_callback);
            
            m2.addAppointment('test', 2, 6);
            
            m1.createSharedAppointment("a1", [4,5,6,7,8,9], 1, ["test-2"]);
            
            var agents = [m1, m2];
            
            while (mailbox.length > 0) {
                var msg = mailbox.shift();
        
                for ( var i = 0; i < agents.length; i++) {
                    if (msg.to === agents[i].name) {
                        agents[i].handleMessage(msg);
                    }
                }
            }            
        });
        it('should also create this shared appointment correctly', function(done) {
            var mailbox = [];
            
            var m = { "test-1" : false, "test-2" : false, "test-3" : false};
            
            var notifyDone = function(n) {
                m[n] = true;
                for(var k in m) {
                    if(m[k]==false)
                        return;
                }
                done();
            };
            
            var m1_callback = function(action, a) {
              action.should.equal("OK");
              a.start.should.equal(8);
              notifyDone("test-1");
            };
            
            var m2_callback = function(action, a) {
              action.should.equal("OK");
              a.start.should.equal(8);
              notifyDone("test-2");
            };
            
            var m3_callback = function(action, a) {
              action.should.equal("OK");
              a.start.should.equal(8);
              notifyDone("test-3");
            };
            
            var m1 = new mam("test-1", mailbox, m1_callback);
            var m2 = new mam("test-2", mailbox, m2_callback);
            var m3 = new mam("test-3", mailbox, m3_callback);
            
            m2.addAppointment('a2', 0, 6);
            m3.addAppointment('a3', 4, 8);
            
            m1.createSharedAppointment("a1", [4,5,6,7,8,9], 1, ["test-2", "test-3"]);
            
            var agents = [m1, m2, m3];
            
            while (mailbox.length > 0) {
                var msg = mailbox.shift();
        
                for ( var i = 0; i < agents.length; i++) {
                    if (msg.to === agents[i].name) {
                        agents[i].handleMessage(msg);
                    }
                }
            }
        });
        it('should not create an shared appointment when someone can\'t make it', function(done) {
            var mailbox = [];
            
            var m = { "test-1" : false, "test-2" : false};
            
            var notifyDone = function(n) {
                m[n] = true;
                for(var k in m) {
                    if(m[k]==false)
                        return;
                }
                done();
            };
            
            var m1_callback = function(action, a) {
              action.should.equal("FAILED");
              notifyDone("test-1");
            };
            
            var m2_callback = function(action, a) {
              action.should.equal("FAILED");
              notifyDone("test-2");
            };
            
            var m1 = new mam("test-1", mailbox, m1_callback);
            var m2 = new mam("test-2", mailbox, m2_callback);
            
            m2.addAppointment('test', 2, 6);
            
            m1.createSharedAppointment("a1", [4], 1, ["test-2"]);
            
            var agents = [m1, m2];
            
            while (mailbox.length > 0) {
                var msg = mailbox.shift();
        
                for ( var i = 0; i < agents.length; i++) {
                    if (msg.to === agents[i].name) {
                        agents[i].handleMessage(msg);
                    }
                }
            }
        });
        it('should not also create this shared appointment', function(done) {
            var mailbox = [];
            
            var m = { "test-1" : false, "test-2" : false, "test-3" : false};
            
            var notifyDone = function(n) {
                m[n] = true;
                for(var k in m) {
                    if(m[k]==false)
                        return;
                }
                done();
            };
            
            var m1_callback = function(action, a) {
              action.should.equal("FAILED");
              notifyDone("test-1");
            };
            
            var m2_callback = function(action, a) {
              action.should.equal("FAILED");
              notifyDone("test-2");
            };
            
            var m3_callback = function(action, a) {
              action.should.equal("FAILED");
              notifyDone("test-3");
            };
            
            var m1 = new mam("test-1", mailbox, m1_callback);
            var m2 = new mam("test-2", mailbox, m2_callback);
            var m3 = new mam("test-3", mailbox, m3_callback);
            
            m2.addAppointment('test', 2, 6);
            m3.addAppointment('test', 5, 11);
            
            m1.createSharedAppointment("a1", [4,5,6,7,8,9], 1, ["test-2", "test-3"]);
            
            var agents = [m1, m2, m3];
            
            while (mailbox.length > 0) {
                var msg = mailbox.shift();
        
                for ( var i = 0; i < agents.length; i++) {
                    if (msg.to === agents[i].name) {
                        agents[i].handleMessage(msg);
                    }
                }
            }
        });
        it('should also create an shared appointment correctly with duration greater than 1', function(done) {
            var mailbox = [];
            
            var m = { "test-1" : false, "test-2" : false};
            
            var notifyDone = function(n) {
                m[n] = true;
                for(var k in m) {
                    if(m[k]==false)
                        return;
                }
                done();
            };
            
            var m1_callback = function(action, a) {
              action.should.equal("OK");
              a.start.should.equal(6);
              notifyDone("test-1");
            };
            
            var m2_callback = function(action, a) {
              action.should.equal("OK");
              a.start.should.equal(6);
              notifyDone("test-2");
            };

            var m1 = new mam("test-1", mailbox, m1_callback);
            var m2 = new mam("test-2", mailbox, m2_callback);
            
            m2.addAppointment('test', 2, 6);
            m2.addAppointment('test', 9, 10);
            
            m1.createSharedAppointment("a1", [4,5,6,7], 3, ["test-2"]);
            
            var agents = [m1, m2];
            
            while (mailbox.length > 0) {
                var msg = mailbox.shift();
        
                for ( var i = 0; i < agents.length; i++) {
                    if (msg.to === agents[i].name) {
                        agents[i].handleMessage(msg);
                    }
                }
            }            
        });
    });
    
    describe('#getAvailableHours()', function() {            
        it('should return the available hours correctly', function() {            
            var m1 = new mam("test-1", []);
            m1.addAppointment('test2', 12, 13);
            m1.getAvailableHours(24,35).should.eql([24,25,26,27,28,29,30,31,32,33,34]);
        });        
        it('should also return the available hours correctly', function() {            
            var m1 = new mam("test-1", []);
            
            m1.addAppointment('test', 2, 4);
            m1.getAvailableHours(0,10).should.eql([0,1,4,5,6,7,8,9]);
            
            m1.addAppointment('test2', 9, 10);
            m1.getAvailableHours(0,10).should.eql([0,1,4,5,6,7,8]);
            
            m1.addAppointment('test3', 0, 1);
            m1.getAvailableHours(0,10).should.eql([1,4,5,6,7,8]);
            
            m1.addAppointment('test4', 4, 9);
            m1.getAvailableHours(0,10).should.eql([1]);
            
            m1.addAppointment('test5', 1, 2);
            m1.getAvailableHours(0,10).should.eql([]);
        });
        it('should also return the available hours correctly when passing duration', function() {            
            var m1 = new mam("test-1", []);
            m1.addAppointment('test2', 0, 1);
            m1.getAvailableHours(0,10,1).should.eql([1,2,3,4,5,6,7,8,9]);
        });
        it('should also return the available hours correctly when passing duration greater than 1', function() {            
            var m1 = new mam("test-1", []);
            m1.addAppointment('test2', 0, 1);
            m1.getAvailableHours(0,10,2).should.eql([1,2,3,4,5,6,7,8]);
        });
        it('should also return the available hours correctly when passing duration greater than 1 (b)', function() {            
            var m1 = new mam("test-1", []);
            m1.addAppointment('test2', 0, 1);
            m1.addAppointment('test2', 2, 3);
            m1.addAppointment('test2', 6, 7);
            m1.getAvailableHours(0,10,2).should.eql([3,4,7,8]);
        });
        it('should also return the available hours correctly when passing duration greater than 2', function() {            
            var m1 = new mam("test-1", []);
            m1.addAppointment('test2', 0, 1);
            m1.getAvailableHours(0,10,3).should.eql([1,2,3,4,5,6,7]);
        });
    });
});
