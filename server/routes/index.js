// index
exports.index = function(req, res) {
    res.render('index', {
        title : 'My Agenda'
    });
};

// devnull
exports.devnull = function(req, res) {
    res.send(200);
};

// login
exports.login = function(req, res) {
    if(req.db.users[req.params.name] != undefined) {
        res.send(403, {});
    } else {
        req.session.name = req.params.name;
        req.session.save();
        req.db.users[req.params.name] = {};
        res.send(200, { 'name' : req.session.name });        
    }
};

// logout
exports.logout = function(req, res) {    
    if(req.session.name !== undefined) {
	    delete req.db.users[req.session.name];
	}
	
	delete req.session['name'];
	req.session.save();
	 
    res.send(200, {});
};

// info
exports.info = function(req, res) {
     if(req.session.name == undefined) {
        res.send(403, {});
    } else {
        res.send(200, { 'name' : req.session.name });        
    }
};