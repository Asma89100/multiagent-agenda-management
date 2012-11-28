var _ = require("underscore");
var should = require("should");

var stp = require("../stp")
  , Node = stp.Node
  , Edge = stp.Edge
  , STP = stp.STP
  , TP3C = stp.TP3C
  , INFINITY = stp.INFINITY;

describe('STP', function() {
    before(function() {
    });

    describe('TP3C', function() {
        describe('#solve()', function() {
            it('should process this stp instance correctly', function() {
                var n1 = new Node("n1", 0);
                
                var node_list = [n1];
                var edge_list = [];
    
                var stp = new STP(node_list, edge_list);
                
                // part 1
                var n2 = new Node("n2", 1);
                var e1 = new Edge(n1, n2, 0, 0);
                node_list.push(n2);
                edge_list.push(e1);
    
                TP3C.solve(stp);
                              
                e1.wij.should.be.equal(0);
                e1.wji.should.be.equal(0);
                
                // part 2
                var n3 = new Node("n3", 1);
                var e2 = new Edge(n1, n3, -2, 2);
                var e3 = new Edge(n2, n3, n3.duration*-1, Math.max(n3.duration, 2-0));
                node_list.push(n3);
                edge_list.push(e2);
                edge_list.push(e3);
    
                TP3C.solve(stp);
                
                e1.wij.should.be.equal(0);
                e1.wji.should.be.equal(0);
                
                e2.wij.should.be.equal(2);
                e2.wji.should.be.equal(-2);
                
                e3.wij.should.be.equal(2);
                e3.wji.should.be.equal(-2);
                
                // part 3
                var n4 = new Node("n4", 1);
                var e4 = new Edge(n1, n4, -1, 1);
                var e5 = new Edge(n2, n4, n4.duration*-1, Math.max(n4.duration, 1-0));
                var e6 = new Edge(n4, n3, n4.duration*-1, Math.max(n4.duration, 2-1));
                node_list.push(n4);
                edge_list.push(e4);
                edge_list.push(e5);
                edge_list.push(e6);
    
                TP3C.solve(stp);
                
                e1.wij.should.be.equal(0);
                e1.wji.should.be.equal(0);
                
                e2.wij.should.be.equal(2);
                e2.wji.should.be.equal(-2);
                
                e3.wij.should.be.equal(2);
                e3.wji.should.be.equal(-2);
                
                e4.wij.should.be.equal(1);
                e4.wji.should.be.equal(-1);
                
                e5.wij.should.be.equal(1);
                e5.wji.should.be.equal(-1);
                
                e6.wij.should.be.equal(1);
                e6.wji.should.be.equal(-1);
            });
            it('should process this stp instance correctly', function() {
                var n1 = new Node("n1");
                var n2 = new Node("n2");
                var n3 = new Node("n3");
                
                var e1 = new Edge(n1, n2, 0, 2);
                var e2 = new Edge(n1, n3, -5, 10);
                var e3 = new Edge(n2, n3, 0, 5);
                
                var node_list = [ n1, n2, n3 ];
                var edge_list = [ e1, e2, e3 ];
    
                var stp = new STP(node_list, edge_list);
    
                TP3C.solve(stp);
                
                e1.wij.should.be.equal(2);
                e1.wji.should.be.equal(0);
                
                e2.wij.should.be.equal(7);
                e2.wji.should.be.equal(-5);
                
                e3.wij.should.be.equal(5);
                e3.wji.should.be.equal(-3);            
            });
            it('should also process this stp instance correctly', function() {    
                var n1 = new Node("n1");
                var n2 = new Node("n2");
                var n3 = new Node("n3");
                var n4 = new Node("n4");
                var n5 = new Node("n5");
                var n6 = new Node("n6");
    
                var e1 = new Edge(n1, n2, -120, 135);
                var e2 = new Edge(n1, n3, 0, INFINITY);
                var e3 = new Edge(n1, n4, 0, INFINITY);
                var e4 = new Edge(n1, n5, 0, INFINITY);
                var e5 = new Edge(n1, n6, -360, 360);
                var e6 = new Edge(n2, n3, -45, 45);
                var e7 = new Edge(n2, n4, 0, INFINITY);
                var e8 = new Edge(n2, n5, 0, INFINITY);
                var e9 = new Edge(n2, n6, 0, INFINITY);
                var e10 = new Edge(n3, n4, -30, 40);
                var e11 = new Edge(n3, n5, 0, INFINITY);
                var e12 = new Edge(n3, n6, 0, INFINITY);
                var e13 = new Edge(n4, n5, -45, INFINITY);
                var e14 = new Edge(n4, n6, 0, INFINITY);
                var e15 = new Edge(n5, n6, -90, 120);
    
                var node_list = [ n1, n2, n3, n4, n5, n6 ];
                var edge_list = [ e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11,
                        e12, e13, e14, e15 ];
    
                var stp = new STP(node_list, edge_list);
    
                TP3C.solve(stp);
                
                e1.wij.should.be.equal(135);
                e1.wji.should.be.equal(-120);
                
                e2.wij.should.be.equal(180);
                e2.wji.should.be.equal(-165);
                
                e3.wij.should.be.equal(220);
                e3.wji.should.be.equal(-195);
                
                e4.wij.should.be.equal(270);
                e4.wji.should.be.equal(-240);
                
                e5.wij.should.be.equal(360);
                e5.wji.should.be.equal(-360);
                
                e6.wij.should.be.equal(45);
                e6.wji.should.be.equal(-45);
                
                e7.wij.should.be.equal(85);
                e7.wji.should.be.equal(-75);
                
                e8.wij.should.be.equal(150);
                e8.wji.should.be.equal(-120);
                
                e9.wij.should.be.equal(240);
                e9.wji.should.be.equal(-225);
                
                e10.wij.should.be.equal(40);
                e10.wji.should.be.equal(-30);
                
                e11.wij.should.be.equal(105);
                e11.wji.should.be.equal(-75);
                
                e12.wij.should.be.equal(195);
                e12.wji.should.be.equal(-180);
                
                e13.wij.should.be.equal(75);
                e13.wji.should.be.equal(-45);
                
                e14.wij.should.be.equal(165);
                e14.wji.should.be.equal(-140);
                
                e15.wij.should.be.equal(120);
                e15.wji.should.be.equal(-90);
            });
        });
    });
});
