var _ = require("underscore");
var should = require("should");

var mam = require("../mam");

describe('MAM', function() {
    before(function() {
    });
    
    describe('#removeAppointment(a)', function() {            
        it('should remove an appointment correctly', function() {
            var m = new mam();
            
            var a = m.addAppointment('a1', 0, 0, 1);
            m.removeAppointment(a);          
           
            m.getAppointmentList().should.have.lengthOf(0);
        });
        it('should remove an appointment and its references correctly', function() {
            var m = new mam();
            
            var a1 = m.addAppointment('a1', 0, 0, 1);
            var a2 = m.addAppointment('a2', 0, 1, 2);
            m.removeAppointment(a1);
           
            m.getAppointmentList().should.have.lengthOf(1);
            m.getAppointmentList()[0].desc.should.equal('a2');
            m.getAppointmentList()[0].should.not.have.property('next');
            m.getAppointmentList()[0].should.not.have.property('previous');
        });
        it('should remove an appointment and allow a new one to take its place', function() {
            var m = new mam();
            
            var a1 = m.addAppointment('a1', 0, 0, 1);
            var a2 = m.addAppointment('a2', 0, 1, 2);
            m.removeAppointment(a1);
            
            var a3 = m.addAppointment('a3', 0, 0, 1);
           
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
            var m = new mam();
            m.getAppointmentList().should.have.length(0);
            
            var a = m.addAppointment('a1', 0, 0, 1);          
            
            a.desc.should.eql('a1');
            a.day.should.eql(0);
            a.start.should.eql(0);
            a.end.should.eql(1);
            
            m.getAppointmentList().should.have.lengthOf(1);
            m.getAppointmentList()[0].should.equal(a);
        });
        it('should also add two appointments correctly', function() {
            var m = new mam();
            m.getAppointmentList().should.have.length(0);
            
            var a1 = m.addAppointment('a1', 0, 0, 1);
            var a2 = m.addAppointment('a2', 0, 1, 2);           
            
            m.getAppointmentList().should.have.length(2);
            
            m.getAppointmentList()[0].should.equal(a1).and.have.property('next').equal(a2);
            m.getAppointmentList()[0].should.not.have.property('previous');
            
            m.getAppointmentList()[1].should.equal(a2).and.have.property('previous').equal(a1);
            m.getAppointmentList()[1].should.not.have.property('next');
        });
        it('should not let two conflicting appointments be added', function() {
            var m = new mam();
            m.getAppointmentList().should.have.length(0);
            
            var a1 = m.addAppointment('a1', 0, 0, 1);
            
            (function(){                
                m.addAppointment('a2', 0, 0, 2);
            }).should.throwError();           
            
            m.getAppointmentList().should.have.length(1);
            
            m.getAppointmentList()[0].should.equal(a1).and.not.have.property('next');
            m.getAppointmentList()[0].should.not.have.property('previous');
        });
    });
});
