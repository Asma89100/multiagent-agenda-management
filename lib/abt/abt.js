var _ = typeof _ === 'undefined' ? require("underscore") : _;
    
(function(root) {
    var _abt = {};
    
    _abt.createMaster = function(me, subject, values, duration, invitee_list, mailbox, callback) {
        var fun = function(v1, v2) {
            return v1 === v2;
        };
        
        var constraints = {};
        
        for(var k in invitee_list) {
            var agent = invitee_list[k];
            constraints[agent] = [fun];
        }
        
        return new _abt.SharedAppointment(me, true, subject, values, duration, invitee_list, constraints, mailbox, callback);
    };
    
    _abt.createSlave = function(me, subject, values, duration, master, mailbox, callback) {
        var fun = function(v1, v2) {
            return v1 === v2;
        };
        
        var constraints = {};        
        constraints[master] = [fun];
        
        return new _abt.SharedAppointment(me, false, subject, values, duration, [], constraints, mailbox, callback);
    };
    
    _abt.SharedAppointment = function(me, is_host, subject, values, duration, agents, constraints, mailbox, callback) {
	    this.me = me;
	    this.is_host = is_host;
	    this.subject = subject;
	    this.agent_view = {};
	    this.agent_view_snapshot = {};
	    this.values = values;
	    this.duration = duration;
	    this.current_value = values[0];
	    this.nogood_list = Array();
	    this.agents = agents;
	    this.constraints = constraints;
	    this.mailbox = mailbox;
	    this.callback = callback;
	    
	    this.invitees = _.union(this.agents, [this.me]);
	    this.host = this.me;
	    
	    this.state = "PENDING";
	
	    for ( var i = 0; i < this.agents.length; i++)
	        this.mailbox.push({
	            "from" : this.me,
	            "to" : this.agents[i],
	            "subject" : this.subject,
	            "type" : "new",
	            "invitees" : this.invitees,
	            "duration" : this.duration,
	            "data" : {
	                "x" : this.me,
	                "d" : this.current_value
	            }
	        });
	};
	
	_abt.SharedAppointment.prototype.cancel = function() {
        for ( var i = 0; i < this.invitees.length; i++) {
            if(this.invitees[i] != this.me) {
	            this.mailbox.push({
			        "from" : this.me,
			        "to" : this.invitees[i],
			        "subject" : this.subject,
			        "type" : "cancel"
                });
            }
        }
        
        this.state = "CANCELED";
        this.callback(this);
	};
	
	_abt.SharedAppointment.prototype.receive = function(msg) {    
	    if (msg.type === "new") {
            this.agent_view[msg.data.x] = msg.data.d;
            this.invitees = msg.invitees;
            this.host = msg.from;
            
            this.check_agent_view();
        } else if (msg.type === "ok?") {
	        if(msg.data.x !== this.me) {
	           this.agent_view[msg.data.x] = msg.data.d;
	        } else {
	           this.current_value = msg.data.d;
	        }
	        this.check_agent_view();
	    } else if (msg.type === "nogood") {
	        this.nogood_list.push(msg.data);
	
	        for ( var agent in msg.data) {
	            if (this.agents.indexOf(agent) < 0 && agent !== this.me) {
	                this.mailbox.push({
	                    "from" : this.me,
	                    "to" : agent,
	                    "subject" : this.subject,
	                    "type" : "reql"
	                });
	                this.agent_view[agent] = msg.data[agent];
	            }
	        }
	
	        var old_value = this.current_value;
	        this.check_agent_view();
	
	        if (old_value === this.current_value && this.state == "PENDING") {
	            this.mailbox.push({
	                "from" : this.me,
	                "to" : msg.from,
	                "subject" : this.subject,
	                "type" : "ok?",
	                "data" : {
	                    "x" : msg.from,
	                    "d" : this.current_value
	                }
	            });
	        }
	    } else if (msg.type === "reql") {
	        this.agents.push(msg.from);
	        this.mailbox.push({
	            "from" : this.me,
	            "to" : msg.from,
	            "subject" : this.subject,
	            "type" : "ok?",
	            "data" : {
	                "x" : this.me,
	                "d" : this.current_value
	            }
	        });
	    } else if (msg.type === "ok" && !this.is_host) {
            this.state = "OK";
            this.callback(this);
        } else if (msg.type === "nok") {
            this.state = "FAILED";
            
            var data = msg.data;
            data.push(this.me);
            
            for ( var i = 0; i < this.agents.length; i++)
               if(data.indexOf(this.agents[i]) < 0) {
	               this.mailbox.push({
	                   "from" : this.me,
	                   "to" : this.agents[i],
	                   "subject" : this.subject,
	                   "type" : "nok",
	                   "data" : data
	            });
	       }
	       this.callback(this);
        } else if (msg.type === "cancel") {
            this.state = "CANCELED";
            this.callback(this);
        } else if (msg.type === "ss" && this.is_host && this.state == "PENDING") {
	        this.agent_view_snapshot[msg.data.x] = msg.data.d;
	        
	        var done = true;
	        
	        for ( var i = 0; i < this.agents.length; i++) {
	           done = done && (this.agent_view_snapshot[this.agents[i]] == this.current_value);
	        }
	        
	        if(done) {
                this.state = "OK";
		        for ( var i = 0; i < this.agents.length; i++)
	                 this.mailbox.push({
	                       "from" : this.me,
	                       "to" : this.agents[i],
	                       "subject" : this.subject,
	                       "type" : "ok"
	                });
	            this.callback(this);
	        }
	    }
	    
	    //TODO: review that, maybe use piggyback?
	    if(this.state == "PENDING" && (msg.type == "new" || msg.type == "ok?" || msg.type == "nogood") && !this.is_host) {
	       this.mailbox.push({
                "from" : this.me,
                "to" : msg.from,
                "subject" : this.subject,
                "type" : "ss",
                "data" : {
                    "x" : this.me,
                    "d" : this.current_value
                }
            });
	    }
	};
	
	_abt.SharedAppointment.prototype.check_agent_view = function() {
	    if (!this.check_consistency(this.current_value)) {
	        var value = this.choose_new_value();
	        if (value === undefined) {
	            this.backtrack();
	        } else {
	            this.current_value = value;
	            for ( var i = 0; i < this.agents.length; i++)
	                this.mailbox.push({
	                    "from" : this.me,
	                    "to" : this.agents[i],
	                    "subject" : this.subject,
	                    "type" : "ok?",
	                    "data" : {
	                        "x" : this.me,
	                        "d" : this.current_value
	                    }
	                });
	        }
	    }
	};
	
	_abt.SharedAppointment.prototype.check_consistency = function(value) {
	    var ret = true;
	    for ( var agent in this.agent_view) {
	        var agent_constraints = this.constraints[agent];
	        if (agent_constraints !== undefined) {
	            for ( var c = 0; c < agent_constraints.length; c++) {
	                ret = ret
	                        && agent_constraints[c](value, this.agent_view[agent]);
	            }
	        }
	    }
	
	    for ( var i = 0; i < this.nogood_list.length; i++) {
	        var ret_aux = false;
	
	        for ( var agent in this.nogood_list[i]) {
	            if (agent == this.me)
	                continue;
	
	            if (this.agent_view[agent] === undefined) {
	                ret_aux = true;
	            }
	        }
	
	        for ( var agent in this.agent_view) {
	            if (this.nogood_list[i][agent] !== undefined) {
	                ret_aux = ret_aux
	                        || this.nogood_list[i][agent] !== this.agent_view[agent];
	            }
	        }
	
	        if (this.nogood_list[i][this.me] !== undefined) {
	            ret_aux = ret_aux || this.nogood_list[i][this.me] !== value;
	        }
	
	        ret = ret && ret_aux;
	    }
	
	    return ret;
	};
	
	_abt.SharedAppointment.prototype.choose_new_value = function() {
	    for ( var i = 0; i < this.values.length; i++) {
	        if (this.check_consistency(this.values[i])) {
	            return this.values[i];
	        }
	    }
	};
	
	_abt.SharedAppointment.prototype.backtrack = function() {
	    var nogoods = {};
	
	    var k  = undefined;
	    for (k in this.agent_view) {
	        nogoods[k] = this.agent_view[k];
	    }
	
	    if (k === undefined) {
	       this.state = "FAILED";
	       for ( var i = 0; i < this.agents.length; i++)
	           this.mailbox.push({
	               "from" : this.me,
	               "to" : this.agents[i],
	               "subject" : this.subject,
	               "type" : "nok",
	               "data" : [this.me]
            });
            this.callback(this);
	    } else {
	        var a = undefined;
	        for ( var agent in nogoods) {
	            if (!a || agent > a) {
	                a = agent;
	            }
	        }
	
	        this.mailbox.push({
	            "from" : this.me,
	            "to" : a,
	            "subject" : this.subject,
	            "type" : "nogood",
	            "data" : nogoods
	        });
	        delete this.agent_view[a];
	        this.check_agent_view();
	    }
	};

    //return _abt
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = _abt;
    } else {
        root['abt'] = _abt;
    }
})(this);