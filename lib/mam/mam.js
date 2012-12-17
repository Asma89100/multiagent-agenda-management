var _ = typeof _ === 'undefined' ? require("underscore") : _;
var stp = typeof stp === 'undefined' ? require("../stp") : stp;
var abt = typeof abt === 'undefined' ? require("../abt") : abt;

(function(root) {
    var _mam = function(name, mailbox, callback) {
        this.name = name;
        this.mailbox = mailbox;
        
        this.callback = (function(callback, that) {
            return function(o) {
	            if(o.state == "OK") {	                
	                var a = that.addAppointment(o.subject, o.current_value, o.current_value+o.duration, o.host, o.invitees);
	                callback(o.state, a);
	            } else if (o.state == "FAILED") {
	                that.shared_appointment_list.splice(that.shared_appointment_list.indexOf(findAppointment(that.shared_appointment_list, o.subject)), 1);
	                callback(o.state, o.subject);
	            } else if (o.state == "CANCELED") {
                    var a = findAppointment(that.appointment_list, o.subject);
                    that.shared_appointment_list.splice(that.shared_appointment_list.indexOf(findAppointment(that.shared_appointment_list, o.subject)), 1);
                    that.removeAppointment(a);
                    callback(o.state, a);
                }
            };
        })(callback, this);
        
	    this.stp = new stp.STP([],[]);
	    this.appointment_list = [];
	    
	    this.stp.addNode(new stp.Node("n0"));
	    
	    this.shared_appointment_list = [];
    };
    
    //private members
    var getNodeZero = function(stp) {
        return _.first(stp.v);
    };
    var getPreviousAppointment = function(list, a) {
        return _.max(_.filter(list, function(o) { return o.start < a.start; }), function(o) { return o.start; });
    };
    var getNextAppointment = function(list, a) {
        return _.min(_.filter(list, function(o) { return o.start > a.start; }), function(o) { return o.start; });
    };
    var getFirstAppointment = function(list) {
        return _.min(list, function(o) { return o.start; });
    };
    var removeAppointmentFromList = function(list, a) {
        if(a.previous !== undefined)
            a.previous.next = a.next;
        
        if(a.next !== undefined)
            a.next.previous = a.previous;
        
        if(list.indexOf(a) >= 0)
            list.splice(list.indexOf(a),1);
    };
    var findAppointment = function(list, subject) {
        return _.find(list, function(a){ return a.subject == subject; });
    };
    
    //public
    _mam.prototype.getAvailableHours = function(start, end, duration) {
        var hour_list = [];
        var a = getFirstAppointment(this.appointment_list);
        var last = start;
        
        while(a != undefined) {
            if(a.end <= last) {
                a = a.next;
                continue;
            }
            
            for(var i = last; i < a.start && i < end; i++) {
                hour_list.push(i);
            }
            
            last = a.end;
            
            if(last >= end) {
                break;
            }
        }
        
        for(var i = last; i < end; i++) {
            hour_list.push(i);
        }
        
        if(duration != undefined) {
            var new_list = [];
            for(var x = 0; x < hour_list.length; x++) {
                var d = duration;
                for(var y = x+1, z=x; y < hour_list.length+1; y++, z++) {
                    d--;
                    if(d==0) {
                        new_list.push(hour_list[x]);
                        break;
                    }
                    
                    if(y >= hour_list.length || hour_list[y]-hour_list[z]>1)
                        break;
                }
            }
            hour_list = new_list;
        }        
        
        return hour_list;
    };
    _mam.prototype.handleMessage = function(msg) {
        if(msg.to == this.name) {
            var a = findAppointment(this.shared_appointment_list, msg.subject);
            if(a === undefined) {
                a = abt.createSlave(this.name, msg.subject, this.getAvailableHours(0, 100, msg.duration), msg.duration, msg.from, this.mailbox, this.callback);
                this.shared_appointment_list.push(a);
            }
            
            a.receive(msg);
        }
    };
    _mam.prototype.getAppointmentList = function() {
        return this.appointment_list;
    };
    _mam.prototype.removeAppointment = function(a) {
        if(a.invitees != undefined) {
            var s = findAppointment(this.shared_appointment_list, a.subject);
            if(s !== undefined) {
	            s.cancel();
	            return;
            }
        }
    
        this.stp.removeNode(a.node);
        removeAppointmentFromList(this.appointment_list, a);
    };
    _mam.prototype.createSharedAppointment = function(subject, start_values, duration, invitee_list) {
        var range = _.intersection(start_values, this.getAvailableHours(start_values[0], start_values[start_values.length-1]+duration, duration));       
        this.shared_appointment_list.push(abt.createMaster(this.name, subject, range, duration, invitee_list, this.mailbox, this.callback));
    },
    _mam.prototype.addAppointment = function(subject, start, end, host, invitees) {        
        var a = {
            'subject' : subject,
            'start' : start,
            'end' : end,
            'duration' : end-start,
            'host' : host,
            'invitees' : invitees
        };
        
        var newNode = new stp.Node(a.subject);
        var newEdge = new stp.Edge(getNodeZero(this.stp), newNode, -1*a.start, a.start);
        
        a.node = newNode;
        
        try {
            var previous = getPreviousAppointment(this.appointment_list, a);
            
            if(previous === undefined) {
                var first = getFirstAppointment(this.appointment_list);
                if(first !== undefined) {
                    this.stp.addEdge(new stp.Edge(newNode, first.node, -1*(a.end-a.start), Math.max((a.end-a.start), Math.abs(a.start-first.start))));
                    a.next = first;
                    first.previous = a;
                }
            }
            else {
                var next = getNextAppointment(this.appointment_list, previous);
                if(next !== undefined) {
                    this.stp.addEdge(new stp.Edge(newNode, next.node, -1*(a.end-a.start), Math.max((a.end-a.start), Math.abs(a.start-next.start))));
                    a.next = next;
                    next.previous = a;
                }
                
                if(next !== previous) {
	                this.stp.addEdge(new stp.Edge(previous.node, newNode, -1*(previous.end-previous.start), Math.max((previous.end-previous.start), Math.abs(previous.start-a.start))));
	                a.previous = previous;
	                previous.next = a;     
                }       
            }                
            
            this.stp.addNode(newNode);
            this.stp.addEdge(newEdge);
            
            stp.TP3C.solve(this.stp);
            
            this.appointment_list.push(a);
            
        } catch(e) {
            this.removeAppointment(a);            
            throw e;
        }
        
        return a;
    };
    
    //return _mam;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = _mam;
    } else {
        root['mam'] = _mam;
    }
})(this);