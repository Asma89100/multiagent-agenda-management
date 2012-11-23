// index
exports.index = function(req, res) {
    res.render('index', {
        title : 'Agenda manager'
    });
};

// login
exports.login = function(req, res) {
    if(req.db.users[req.params.name] != undefined) {
        res.send(403, {});
    } else {
        req.session.name = req.params.name;
        req.db.users[req.params.name] = {};
        res.send(200, {});        
    }
};

// logout
exports.logout = function(req, res) {
    req.db.users[req.session.name].socket.disconnect();
    delete req.db.users[req.session.name];
    req.session.destroy();    
    res.send(200, {});
};