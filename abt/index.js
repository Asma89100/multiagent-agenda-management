var Agent = function(name, values, agents, constraints) {
    this.name = name;
    this.agent_view = {};
    this.agent_view_snapshot = {};
    this.values = values;
    this.current_value = values[0];
    this.nogood_list = Array();
    this.agents = agents;
    this.constraints = constraints;

    for ( var i = 0; i < this.agents.length; i++)
        mailbox.push({
            "from" : this.name,
            "to" : this.agents[i],
            "type" : "ok?",
            "data" : {
                "x" : this.name,
                "d" : this.current_value
            }
        });
};

Agent.prototype.name = undefined;

Agent.prototype.receive = function(msg) {
    if (msg.type === "ok?") {
        this.agent_view[msg.data.x] = msg.data.d;
        this.check_agent_view();

        mailbox.push({
            "from" : this.name,
            "to" : msg.from,
            "type" : "ok!",
            "data" : {
                "x" : this.name,
                "d" : this.current_value
            }
        });
    } else if (msg.type === "nogood") {
        this.nogood_list.push(msg.data);

        for ( var agent in msg.data) {
            if (this.agents.indexOf(agent) < 0 && agent !== this.name) {
                mailbox.push({
                    "from" : this.name,
                    "to" : agent,
                    "type" : "reql"
                });
                this.agent_view[agent] = msg.data[agent];
            }
        }

        var old_value = this.current_value;
        this.check_agent_view();

        if (old_value === this.current_value) {
            mailbox.push({
                "from" : this.name,
                "to" : msg.from,
                "type" : "ok?",
                "data" : {
                    "x" : msg.from,
                    "d" : this.current_value
                }
            });
        }

        mailbox.push({
            "from" : this.name,
            "to" : msg.from,
            "type" : "ok!",
            "data" : {
                "x" : this.name,
                "d" : this.current_value
            }
        });
    } else if (msg.type === "reql") {
        this.agents.push(msg.from);
        mailbox.push({
            "from" : this.name,
            "to" : msg.from,
            "type" : "ok?",
            "data" : {
                "x" : this.name,
                "d" : this.current_value
            }
        });
    } else if (msg.type === "ok!") {
        this.agent_view_snapshot[msg.data.x] = msg.data.d;
    }
};

Agent.prototype.check_agent_view = function() {
    if (!this.check_consistency(this.current_value)) {
        var value = this.choose_new_value();
        if (value === undefined) {
            this.backtrack();
        } else {
            this.current_value = value;
            for ( var i = 0; i < this.agents.length; i++)
                mailbox.push({
                    "from" : this.name,
                    "to" : this.agents[i],
                    "type" : "ok?",
                    "data" : {
                        "x" : this.name,
                        "d" : this.current_value
                    }
                });
        }
    }
};

Agent.prototype.check_consistency = function(value) {
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
            if (agent == this.name)
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

        if (this.nogood_list[i][this.name] !== undefined) {
            ret_aux = ret_aux || this.nogood_list[i][this.name] !== value;
        }

        ret = ret && ret_aux;
    }

    return ret;
};

Agent.prototype.choose_new_value = function() {
    for ( var i = 0; i < this.values.length; i++) {
        if (this.check_consistency(this.values[i])) {
            return this.values[i];
        }
    }
};

Agent.prototype.backtrack = function() {
    var nogoods = {};

    var k  = undefined;
    for (k in this.agent_view) {
        nogoods[k] = this.agent_view[k];
    }

    if (k === undefined) {
        console.log("DIE!");
        System.exit();
    } else {
        var a = undefined;
        for ( var agent in nogoods) {
            if (!a || agent > a) {
                a = agent;
            }
        }

        mailbox.push({
            "from" : this.name,
            "to" : a,
            "type" : "nogood",
            "data" : nogoods
        });
        delete this.agent_view[a];
        this.check_agent_view();
    }
};

var mailbox = Array();

var main = function() {

    //var a1 = new Agent("a1", [1,2], ["a3"], {"a3" : [function(v1, v2){ return v1 !== v2; }]});
    //var a2 = new Agent("a2", [2], ["a3"], {"a3" : [function(v1, v2){ return v1 !== v2; }]});
    //var a3 = new Agent("a3", [1,2], [], {"a1" : [function(v1, v2){ return v1 !== v2; }], "a2" : [function(v1, v2){ return v1 !== v2; }]});

    var fun = function(v1, v2) {
        return v1 === v2;
    };
    var a1 = new Agent("a1", [ 1, 2, 3 ], [ "a2", "a3", "a4" ], {
        "a2" : [ fun ],
        "a2" : [ fun ],
        "a3" : [ fun ]
    });
    var a2 = new Agent("a2", [ 1, 3 ], [], {
        "a1" : [ fun ]
    });
    var a3 = new Agent("a3", [ 2, 3 ], [], {
        "a1" : [ fun ]
    });
    var a4 = new Agent("a4", [ 1, 2, 3 ], [], {
        "a1" : [ fun ]
    });

    var agents = [ a1, a2, a3, a4 ];

    while (mailbox.length > 0) {
        var msg = mailbox.shift();

        console.log("%j", msg);

        for ( var i = 0; i < agents.length; i++) {
            if (msg.to === agents[i].name) {
                agents[i].receive(msg);
            }
        }
    }

    for ( var k in agents) {
        console.log("%j", agents[k]);
    }
};

//main();
