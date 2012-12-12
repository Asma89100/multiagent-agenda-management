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
            m.getAppointmentList()[0].desc.should.equal('a2');
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
            
            m.getAppointmentList()[0].desc.should.equal('a2');
            m.getAppointmentList()[1].desc.should.equal('a3');
            
            m.getAppointmentList()[0].should.not.have.property('next');
            m.getAppointmentList()[1].should.not.have.property('previous');
            
            m.getAppointmentList()[0].previous.desc.should.equal('a3');
            m.getAppointmentList()[1].next.desc.should.equal('a2');            
        });
    });

    describe('#addAppointment()', function() {            
        it('should add an appointment correctly', function() {
            var m = new mam("test", []);
            m.getAppointmentList().should.have.length(0);
            
            var a = m.addAppointment('a1', 0, 1);          
            
            a.desc.should.eql('a1');
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
            
            var m1_callback = function(a) {
                setTimeout(function(){
                    m1.shared_appointment_list[0].state.should.equal("OK");
                    m2.shared_appointment_list[0].state.should.equal("OK");
    
                    m1.shared_appointment_list[0].current_value.should.equal(6);
                    m2.shared_appointment_list[0].current_value.should.equal(6);
                    done();
                }, 0);
            };
            
            var m1 = new mam("test-1", mailbox, m1_callback);
            var m2 = new mam("test-2", mailbox, function() {});
            
            m2.addAppointment('test', 2, 6);
            
            m1.createSharedAppointment("a1", 4, 10, 1, ["test-2"]);
            
            var agents = [m1, m2];
            
            while (mailbox.length > 0) {
                var msg = mailbox.shift();
                
                //console.log(msg);
        
                for ( var i = 0; i < agents.length; i++) {
                    if (msg.to === agents[i].name) {
                        agents[i].handleMessage(msg);
                    }
                }
            }
            
        });
        it('should also create this shared appointment correctly', function(done) {
            var mailbox = [];
            
            var m1_callback = function(a) {
                setTimeout(function(){
                    m1.shared_appointment_list[0].state.should.equal("OK");
                    m2.shared_appointment_list[0].state.should.equal("OK");
                    m3.shared_appointment_list[0].state.should.equal("OK");
    
                    m1.shared_appointment_list[0].current_value.should.equal(8);
                    m2.shared_appointment_list[0].current_value.should.equal(8);
                    m3.shared_appointment_list[0].current_value.should.equal(8);
                    done();
                }, 0);
            };
            
            var m1 = new mam("test-1", mailbox, m1_callback);
            var m2 = new mam("test-2", mailbox, function() {});
            var m3 = new mam("test-3", mailbox, function() {});
            
            m2.addAppointment('a2', 0, 6);
            m3.addAppointment('a3', 4, 8);
            
            m1.createSharedAppointment("a1", 4, 10, 1, ["test-2", "test-3"]);
            
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
            
            var m1_callback = function(a) {
                setTimeout(function(){
                    m1.shared_appointment_list[0].state.should.equal("FAILED");
                    m2.shared_appointment_list[0].state.should.equal("FAILED");
                    done();
                }, 0);
            };
            
            var m1 = new mam("test-1", mailbox, m1_callback);
            var m2 = new mam("test-2", mailbox, function() {});
            
            m2.addAppointment('test', 2, 6);
            
            m1.createSharedAppointment("a1", 4, 5, 1, ["test-2"]);
            
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
            
            var m1_callback = function(a) {
                setTimeout(function(){
                    m1.shared_appointment_list[0].state.should.equal("FAILED");
		            m2.shared_appointment_list[0].state.should.equal("FAILED");
		            m3.shared_appointment_list[0].state.should.equal("FAILED");
                    done();
                }, 0);
            };
            
            var m1 = new mam("test-1", mailbox, m1_callback);
            var m2 = new mam("test-2", mailbox, function() {});
            var m3 = new mam("test-3", mailbox, function() {});
            
            m2.addAppointment('test', 2, 6);
            m3.addAppointment('test', 5, 11);
            
            m1.createSharedAppointment("a1", 4, 10, 1, ["test-2", "test-3"]);
            
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
    });
    
    describe('#getAvailableHours()', function() {            
        it('should return the available hours correctly', function() {            
            var m1 = new mam("test-1", []);
            m1.addAppointment('test2', 0, 1);
            m1.getAvailableHours(0,10).should.eql([1,2,3,4,5,6,7,8,9]);
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
    });
});
