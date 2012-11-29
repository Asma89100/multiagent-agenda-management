var _ = require("underscore");
var should = require("should");

var mam = require("../mam");

describe('MAM', function() {
    before(function() {
    });

    describe('#addAppointment()', function() {            
        it('should add an appointment correctly', function() {
            var m = new mam();
            m.getAppointmentList().should.have.length(0);
            
            var a = {desc:'a1', start:0, end:1};
            m.addAppointment(a);            
            
            m.getAppointmentList().should.have.lengthOf(1);
            m.getAppointmentList()[0].should.equal(a);
        });
        it('should also add two appointments correctly', function() {
            var m = new mam();
            m.getAppointmentList().should.have.length(0);
            
            var a1 = {desc:'a1', start:0, end:1};
            var a2 = {desc:'a2', start:1, end:2};
            m.addAppointment(a1);
            m.addAppointment(a2);           
            
            m.getAppointmentList().should.have.length(2);
            
            m.getAppointmentList()[0].should.equal(a1).and.have.property('next').equal(a2);
            m.getAppointmentList()[0].should.not.have.property('previous');
            
            m.getAppointmentList()[1].should.equal(a2).and.have.property('previous').equal(a1);
            m.getAppointmentList()[1].should.not.have.property('next');
        });
        it('should not let two conflicting appointments be added', function() {
            var m = new mam();
            m.getAppointmentList().should.have.length(0);
            
            var a1 = {desc:'a1', start:0, end:1};
            var a2 = {desc:'a2', start:0, end:2};
            m.addAppointment(a1);
            
            (function(){                
                m.addAppointment(a2);
            }).should.throwError();           
            
            m.getAppointmentList().should.have.length(1);
            
            m.getAppointmentList()[0].should.equal(a1).and.not.have.property('next');
            m.getAppointmentList()[0].should.not.have.property('previous');
        });
    });
});
