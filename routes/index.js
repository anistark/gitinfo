var express = require('express'),
	router = express.Router(),
	request = require('request'),
	async = require("async"),
	moment = require('moment'),
	helper = require('../routes/helper');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'GitInfo' });
});

router.post('/getIssueList', function(req, res, next) {
	var baseUrl = 'https://api.github.com/repos/';
	var issueUrl = '/issues';
	var newUrlString = req.body.url;
	var newUrl = newUrlString.split("/")[3]+"/"+newUrlString.split("/")[4];
	var url = baseUrl+ newUrl+ issueUrl;
	// Call helper function to extract data from Repo
	var issuesData = helper.repoInfo(url, function(success) {
		console.log('success - '+JSON.stringify(success));
		res.render('index', { title: 'GitInfo', success: 1, body: success });
	}, function(error) {
		console.log('error - '+JSON.stringify(error));
		res.render('index', { title: 'GitInfo', success: 0, error: error });
	});
});

module.exports = router;
