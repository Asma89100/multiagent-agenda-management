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
	                var a = that.addAppointment(o.subject, o.current_value, o.current_value+1, 'shared');
	                callback("ADD", a);
	            } else if (o.state == "FAILED") {
	                //this.removeAppointment();
	                callback("DEL");
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
    var findSharedAppointment = function(list, desc) {
        return _.find(list, function(a){ return a.subject == desc; });
    };
    
    //public
    _mam.prototype.getAvailableHours = function(start, end) {
        var hour_list = [];
        var a = getPreviousAppointment(this.appointment_list, { 'start' : start }) || getFirstAppointment(this.appointment_list);
        var last = start;
        
        if(a !== undefined) {
	        for(var i = start; i < a.start && i < end; i++) {
	            hour_list.push(i);
	        }
	        last = a.start + a.duration;
        }
        
        while(a !== undefined && a.next !== undefined) {
           if(a.next.start - last > 0) {
               for(var i = 0; i < a.next.start - last; i++) {
                   if(last+i >= start && last+i < end)
                       hour_list.push(last+i);
               }   
           }
           a = a.next;
           last = a.start + a.duration;
        }
        
        for(var i = last; i < end; i++) {
            hour_list.push(i);
        }
        
        return hour_list;
    };
    _mam.prototype.handleMessage = function(msg) {
        if(msg.to == this.name) {
            var a = findSharedAppointment(this.shared_appointment_list, msg.subject);
            if(a === undefined) {
                a = abt.createSlave(this.name, msg.subject, this.getAvailableHours(0, 100), msg.from, this.mailbox, this.callback);
                this.shared_appointment_list.push(a);
            }
            
            a.receive(msg);
        }
    };
    _mam.prototype.getAppointmentList = function() {
        return this.appointment_list;
    };
    _mam.prototype.removeAppointment = function(a) {
        this.stp.removeNode(a.node);
        removeAppointmentFromList(this.appointment_list, a);
    };
    _mam.prototype.createSharedAppointment = function(desc, start, end, duration, invitee_list) {
        var range = [];
        
        for(var i = start; i<=end; i++) {
            range.push(i);
        }
        
        range = _.intersection(range, this.getAvailableHours(start, end));
       
        this.shared_appointment_list.push(abt.createMaster(this.name, desc, range, invitee_list, this.mailbox, this.callback));
    },
    _mam.prototype.addAppointment = function(desc, start, end, type) {
        var a = {
            'desc' : desc,
            'start' : start,
            'end' : end,
            'duration' : end-start,
            'type' : type || 'private'
        };
        
        var newNode = new stp.Node(a.desc);
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