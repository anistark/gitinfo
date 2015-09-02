var express = require('express');
var router = express.Router();
var request = require('request');
var async = require("async");
var moment = require('moment');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/getIssueList', function(req, res, next) {
	var baseUrl = 'https://api.github.com/repos/';
	var issueUrl = '/issues';
	var url = baseUrl+ req.body.url+ issueUrl;
	console.log('url - '+ url);
	request({
		uri: url,
		method: 'GET',
		headers: {
			'User-Agent': 'request'
		}
	}, function (error, response, body) {
		if (!error) {
			console.log('response - '+ JSON.stringify(response.headers.link));
			var issues = JSON.parse(response.body);
			var openIssues = 0;
			var openedToday = 0;
			var openedWeek = 0;
			var openedWeekAgo = 0;
			var curDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
			async.each(issues, function(issue, callback){
				// Open Issues
				if(issue.state == 'open'){
					openIssues+=1;
				}
				// Open Issues in Last 24 hours
				var issueCreated = new Date(issue.created_at);

				var issueCreated = moment(new Date(issue.created_at)).format("YYYY-MM-DD HH:mm:ss");

				var remainingHours = moment(curDate).diff(issueCreated, 'hours');
				if(remainingHours <= 24) {
					openedToday+=1;
				}
				var remainingDays = moment(curDate).diff(issueCreated, 'days');

				if(remainingDays>=0 && remainingDays<=7){
					openedWeek+=1;
				}
				if(remainingDays>7){
					openedWeekAgo+=1;
				}

				// if(issue.createdAt)
				callback();
			},
			function(err) {
				console.log('return err - '+ err);
				var data = {};
				data['openIssues'] = openIssues;
				data['openedToday'] = openedToday;
				data['openedWeek'] = openedWeek;
				data['openedWeekAgo'] = openedWeekAgo;
				res.render('index', { title: 'Express', success: 1, body: data });
			});
		} else {
			console.log('error - '+ error);
			res.render('index', { title: 'Express', success: 0, error: error });
		}
	});
});

module.exports = router;
