var _ = require("underscore");

var Node = function(name) {
    this.name = name;
};

var Edge = function(n1, n2, w1, w2) {
   this.vi = n1;
   this.vj = n2;

   this.wji = w1;
   this.wij = w2;
};

var STP = function(node_list, edge_list) {
    this.v = node_list;
    this.e = edge_list;
};

var Triangle = function(k, i, j) {
    this.vk = k;
    this.vi = i;
    this.vj = j;
};

var TP3C = (function() {
    //private members
    var intersection = function(n1_list, n2_list) {
        return _.intersection(n1_list, n2_list);
    };
    var selectNext = function(node_list) {
        return _.first(node_list);
    };
    var neighbors = function(node, edge_list) {
        var neighbors_list = [];
        for (var k in edge_list) {
            var e = edge_list[k];
            if (node === e.vi) {
                neighbors_list.push(e.vj);
            }
            else if (node === e.vj) {
                neighbors_list.push(e.vi);
            }
        }
        return neighbors_list;
    };
    var joinNeighbors = function(vk, vi, vj, edge_list) {
        var new_edge_list = [];
        var eij = undefined;
        var Bik = 0, Bkj = 0;
        var Bki = 0, Bjk = 0;

        for (var k in edge_list) {
            var e = edge_list[k];
            if (e.vi === vi && e.vj === vj || e.vj === vi && e.vi === vj) {
                eij = e;
            } else if (e.vi === vi && e.vj  === vk) {
                Bik = e.wij;
                Bki = e.wji;
            } else if (e.vi === vk && e.vj === vi) {
                Bki = e.wij;
                Bik = e.wji;
            } else if (e.vi === vj && e.vj === vk) {
                Bjk = e.wij;
                Bkj = e.wji;
            } else if (e.vi === vk && e.vj === vj) {
                Bkj = e.wij;
                Bjk = e.wji;
            }
        }

        if (eij === undefined) {
            eij = new Edge(vi, vj, 9007199254740992, 9007199254740992);
            new_edge_list.push(eij);
        }

        if (eij.vi === vi) {
            eij.wij = Math.min(eij.wij, Bik + Bkj);
            eij.wji = Math.min(eij.wji, Bjk + Bki);
        } else {
            eij.wji = Math.min(eij.wji, Bik + Bkj);
            eij.wij = Math.min(eij.wij, Bjk + Bki);
        }

        if (eij.wij + eij.wji < 0) {
            console.log("Inconsistent at " + eij);
            System.exit();
        }

        return new_edge_list;
    };
    
    //actual class with public members
    var TP3C = function() {
        this._1 = function(stp, v) {
		    var t_stack = [];
		
		    var n_list_intersection = [];
		    while((n_list_intersection = intersection(v, stp.v)).length > 0) {
                var vk = selectNext(n_list_intersection);
                stp.v = _.reject(stp.v, function(x) { return x === vk; });
                
                var neighbors_list = neighbors(vk, stp.e);
                
                for (var ki in neighbors_list) {
                    var vi = neighbors_list[ki];
	                for (var kj in neighbors_list) {
                        var vj = neighbors_list[kj];
                        if (vi === vj)
	                        continue;
	
	                    stp.e = _.union(stp.e,joinNeighbors(vk, vi, vj, stp.e));
	                    t_stack.push(new Triangle(vi, vj, vk));
	                }
	            }
		    }
		    return t_stack;
		};	    
    };
    
    return TP3C;
})();

var INFINITY = 10000000;

var n1 = new Node("n1");
var n2 = new Node("n2");
var n3 = new Node("n3");

var e1 = new Edge(n1, n2, 0, INFINITY);
var e2 = new Edge(n2, n3, -30, 45);
//var e3 = new Edge("n1", "n3", 0, INFINITY);

var node_list = [n1,n2,n3];
var edge_list = [e1,e2];

var stp = new STP(node_list, edge_list);

var TP3C = new TP3C();

TP3C._1(stp, _.clone(stp.v));