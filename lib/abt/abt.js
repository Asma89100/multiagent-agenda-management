var _ = typeof _ === 'undefined' ? require("underscore") : _;
    
(function(root) {
    var _abt = {};
    
    _abt.createMaster = function(owner, subject, values, invitee_list, mailbox) {
        var fun = function(v1, v2) {
            return v1 === v2;
        };
        
        var constraints = {};
        
        for(var k in invitee_list) {
            var agent = invitee_list[k];
            constraints[agent] = [fun];
        }
        
        return new _abt.SharedAppointment(owner, subject, values, invitee_list, constraints, mailbox);
    };
    
    _abt.createSlave = function(owner, subject, values, master, mailbox) {
        var fun = function(v1, v2) {
            return v1 === v2;
        };
        
        var constraints = {};        
        constraints[master] = [fun];
        
        return new _abt.SharedAppointment(owner, subject, values, [], constraints, mailbox);
    };
    
    _abt.SharedAppointment = function(owner, subject, values, agents, constraints, mailbox) {
	    this.owner = owner;
	    this.subject = subject;
	    this.agent_view = {};
	    this.agent_view_snapshot = {};
	    this.values = values;
	    this.current_value = values[0];
	    this.nogood_list = Array();
	    this.agents = agents;
	    this.constraints = constraints;
	    this.mailbox = mailbox;
	
	    for ( var i = 0; i < this.agents.length; i++)
	        this.mailbox.push({
	            "from" : this.owner,
	            "to" : this.agents[i],
	            "subject" : this.subject,
	            "type" : "ok?",
	            "data" : {
	                "x" : this.owner,
	                "d" : this.current_value
	            }
	        });
	};
	
	_abt.SharedAppointment.prototype.receive = function(msg) {
	    if (msg.type === "ok?") {
	        if(msg.data.x !== this.owner) {
	           this.agent_view[msg.data.x] = msg.data.d;
	        } else {
	           this.current_value = msg.data.d;
	        }
	        this.check_agent_view();
	
	        this.mailbox.push({
	            "from" : this.owner,
	            "to" : msg.from,
	            "subject" : this.subject,
	            "type" : "ok!",
	            "data" : {
	                "x" : this.owner,
	                "d" : this.current_value
	            }
	        });
	    } else if (msg.type === "nogood") {
	        this.nogood_list.push(msg.data);
	
	        for ( var agent in msg.data) {
	            if (this.agents.indexOf(agent) < 0 && agent !== this.owner) {
	                this.mailbox.push({
	                    "from" : this.owner,
	                    "to" : agent,
	                    "subject" : this.subject,
	                    "type" : "reql"
	                });
	                this.agent_view[agent] = msg.data[agent];
	            }
	        }
	
	        var old_value = this.current_value;
	        this.check_agent_view();
	
	        if (old_value === this.current_value) {
	            this.mailbox.push({
	                "from" : this.owner,
	                "to" : msg.from,
	                "subject" : this.subject,
	                "type" : "ok?",
	                "data" : {
	                    "x" : msg.from,
	                    "d" : this.current_value
	                }
	            });
	        }
	
	        this.mailbox.push({
	            "from" : this.owner,
	            "to" : msg.from,
	            "subject" : this.subject,
	            "type" : "ok!",
	            "data" : {
	                "x" : this.owner,
	                "d" : this.current_value
	            }
	        });
	    } else if (msg.type === "reql") {
	        this.agents.push(msg.from);
	        this.mailbox.push({
	            "from" : this.owner,
	            "to" : msg.from,
	            "subject" : this.subject,
	            "type" : "ok?",
	            "data" : {
	                "x" : this.owner,
	                "d" : this.current_value
	            }
	        });
	    } else if (msg.type === "ok!") {
	        this.agent_view_snapshot[msg.data.x] = msg.data.d;
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
	                    "from" : this.owner,
	                    "to" : this.agents[i],
	                    "subject" : this.subject,
	                    "type" : "ok?",
	                    "data" : {
	                        "x" : this.owner,
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
	            if (agent == this.owner)
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
	
	        if (this.nogood_list[i][this.owner] !== undefined) {
	            ret_aux = ret_aux || this.nogood_list[i][this.owner] !== value;
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
	        console.log("DIE!");
	        throw new Error("This is the end.");
	    } else {
	        var a = undefined;
	        for ( var agent in nogoods) {
	            if (!a || agent > a) {
	                a = agent;
	            }
	        }
	
	        this.mailbox.push({
	            "from" : this.owner,
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