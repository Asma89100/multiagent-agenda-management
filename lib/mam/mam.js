var _ = typeof _ === 'undefined' ? require("underscore") : _;
var stp = typeof stp === 'undefined' ? require("../stp") : stp;

(function(root) {
    var _mam = function() {
	    this.stp = new stp.STP([],[]);
	    this.appointment_list = [];
	    
	    this.stp.addNode(new stp.Node("n0"));
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
    
    //public
    _mam.prototype.getAppointmentList = function() {
        return this.appointment_list;
    };
    _mam.prototype.removeAppointment = function(a) {
        this.stp.removeNode(a.node);
        removeAppointmentFromList(this.appointment_list, a);
    };
    _mam.prototype.addAppointment = function(desc, day, start, end) {
        var a = {
            'desc' : desc,
            'day' : day,
            'start' : start,
            'end' : end
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
            this.stp.removeNode(newNode);
            removeAppointmentFromList(this.appointment_list, a);            
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