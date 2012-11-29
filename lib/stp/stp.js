var _ = typeof _ === 'undefined' ? require("underscore") : _;
    
(function(root) {
    var _stp = {};
     
    _stp.INFINITY = 10000000;
    
    _stp.Node = function(name) {
        this.name = name;
    };
    
    _stp.Edge = function(n1, n2, w1, w2) {
        this.vi = n1;
        this.vj = n2;
    
        this.wji = w1;
        this.wij = w2;
    };
    
    _stp.STP = function(node_list, edge_list) {
        this.v = node_list;
        this.e = edge_list;
    };
    _stp.STP.prototype.addEdge = function(edge) {
        this.e.push(edge);
    };
    _stp.STP.prototype.removeEdge = function(edge) {
        this.e.splice(this.e.indexOf(edge), 1);
    };
    _stp.STP.prototype.addNode = function(node) {
        this.v.push(node);
    };
    _stp.STP.prototype.removeNode = function(node) {
        if(this.v.indexOf(node) >= 0) {
            var edge_list = this.getEdgesOfNode(node);
            for(var k in edge_list) {
                var edge = edge_list[k];
                this.removeEdge(edge);
            }
            this.v.splice(this.v.indexOf(node), 1);
        }
    };
    _stp.STP.prototype.getEdgesOfNode = function(node) {
        var edge_list = [];
        for(var k in this.e) {
            var edge = this.e[k];
            if(edge.vi === node || edge.vj === node) {
                edge_list.push(edge);
            }
        }
        return edge_list;
    };
    
    _stp.TP3C = (function() {
        // private members
        var Triangle = function(k, i, j) {
	        this.vk = k;
	        this.vi = i;
	        this.vj = j;
        };
        var intersection = function(n1_list, n2_list) {
            return _.intersection(n1_list, n2_list);
        };
        var selectNext = function(node_list) {
            return _.first(node_list);
        };
        var neighbors = function(node, edge_list) {
            var neighbors_list = [];
            for ( var k in edge_list) {
                var e = edge_list[k];
                if (node === e.vi) {
                    neighbors_list.push(e.vj);
                } else if (node === e.vj) {
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
    
            for ( var k in edge_list) {
                var e = edge_list[k];
                if (e.vi === vi && e.vj === vj || e.vj === vi && e.vi === vj) {
                    eij = e;
                } else if (e.vi === vi && e.vj === vk) {
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
                eij = new _stp.Edge(vi, vj, _stp.INFINITY, _stp.INFINITY);
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
                throw new Error("Inconsistent at (" + eij.vi.name + ", " + eij.vj.name + ")");
            }
    
            return new_edge_list;
        };
        var tightenTriangle = function(t, edge_list) {
            var tightened_list = [];
    
            var vk = t.vk;
            var vi = t.vi;
            var vj = t.vj;
    
            var eij = undefined;
            var Bik = 0, Bkj = 0;
            var Bki = 0, Bjk = 0;
    
            for ( var k in edge_list) {
                var e = edge_list[k];
                if (e.vi === vi && e.vj === vj || e.vj === vi && e.vi === vj) {
                    eij = e;
                } else if (e.vi === vi && e.vj === vk) {
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
    
            var a = eij.wij;
            var b = eij.wji;
    
            if (eij.vi === vi) {
                eij.wij = Math.min(eij.wij, Bik + Bkj);
                eij.wji = Math.min(eij.wji, Bjk + Bki);
            } else {
                eij.wji = Math.min(eij.wji, Bik + Bkj);
                eij.wij = Math.min(eij.wij, Bjk + Bki);
            }
    
            if (a !== eij.wij || b !== eij.wji)
                tightened.push(eij);
    
            return tightened_list;
        };
    
        // actual class with public members
        var TP3C = function() {
            this.solve = function(stp) {
                var t = this._1(stp, _.clone(stp.v));
                this._2(stp, t);
            },
            this._1 = function(stp, v) {
                var t_stack = [];
    
                var n_list_intersection = [];
                while ((n_list_intersection = intersection(v, stp.v)).length > 0) {
                    var vk = selectNext(n_list_intersection);
                    v = _.reject(v, function(x) {
                        return x === vk;
                    });
    
                    var neighbors_list = neighbors(vk, stp.e);
    
                    for ( var ki in neighbors_list) {
                        var vi = neighbors_list[ki];
                        for ( var kj in neighbors_list) {
                            var vj = neighbors_list[kj];
                            if (vi === vj)
                                continue;
    
                            stp.e = _.union(stp.e, joinNeighbors(vk, vi, vj, stp.e));
                            t_stack.push(new Triangle(vi, vj, vk));
                        }
                    }
                }
                return t_stack;
            };
            this._2 = function(stp, t_stack) {
                while (t_stack.length > 0) {
                    var t = t_stack.pop();
                    tightenTriangle(t, stp.e);
                }
            };
        };
        //return a singleton
        return new TP3C();
    })();
    
	//return _stp;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = _stp;
    } else {
        root['stp'] = _stp;
    }
})(this);