var request = require('request'),
	async = require("async"),
	moment = require('moment'),
	helper = require('../routes/helper'),
	config = require('../routes/config');

exports.repoInfo = function(url, sucCb, errCb) {
	// Extract data from repo with given url
	var issuesData = {};
	// Client Id and secret is used for authentication with github to surpass the api limit
	var client_id = config.client_id;
	var client_secret = config.client_secret;
	url = url+'?client_id='+client_id+'&client_secret='+client_secret;
	// The client id and secret has been appended to the url.
	request({
		uri: url,
		method: 'GET',
		headers: {
			'User-Agent': 'request'
		}
	}, function (error, response, body) {
		if (!error) {
			// All issues from the first page will be listed over here.
			var issues = JSON.parse(response.body);
			var openIssues = 0;
			var openedToday = 0;
			var openedWeek = 0;
			var openedWeekAgo = 0;
			var soFarData = {};
			soFarData['openIssues'] = 0;
			soFarData['openedToday'] = 0;
			soFarData['openedWeek'] = 0;
			soFarData['openedWeekAgo'] = 0;
			soFarData['isNext'] = 1;
			soFarData['success'] = 0;
			var curDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
			// Async loop through each of the issues to sort which category they fall in
			async.each(issues, function(issue, callback){
				// All Open Issues
				if(issue.state == 'open'){
					openIssues+=1;
				}
				var issueCreated = new Date(issue.created_at);
				var issueCreated = moment(new Date(issue.created_at)).format("YYYY-MM-DD HH:mm:ss");
				var remainingHours = moment(curDate).diff(issueCreated, 'hours');
				// Open Issues in Last 24 hours
				if(remainingHours <= 24) {
					openedToday+=1;
				}
				var remainingDays = moment(curDate).diff(issueCreated, 'days');
				// Open issues that were opened more than 24 hours ago but less than 7 
				if(remainingDays>0 && remainingDays<8){
					openedWeek+=1;
				}
				// Open issues that were opened more than 7 days ago
				if(remainingDays>7){
					openedWeekAgo+=1;
				}
				callback();
			}, function(err) {
				var link = response.headers.link;
				// So far the data collected. Appending the result to it.
				soFarData['openIssues']+=openIssues;
				soFarData['openedToday']+=openedToday;
				soFarData['openedWeek']+=openedWeek;
				soFarData['openedWeekAgo']+=openedWeekAgo;
				if(link) {
					var re = /\<((?:(?!\>).)+)/img;
					z = link.replace(/[>";<]/g,"").split(re);
					nextUrl = z[0].split(", ")[0].split(" ")[0];
					lastUrl = z[0].split(", ")[1].split(" ")[0];
					nextPageNum = z[0].split(", ")[0].split(" ")[0].split("page=")[1];
					lastPageNum = z[0].split(", ")[1].split(" ")[0].split("page=")[1];
					soFarData['lastPageNum'] = lastPageNum;
					for (var i = nextPageNum; i <= lastPageNum; i++) {
						 var nextUrl = z[0].split(", ")[0].split(" ")[0].split("page=")[0] + 'page=' + i;
						soFarData['nextPageNum'] = i;
						helper.subRepoInfo(nextUrl, soFarData, function(succCb){
							if(succCb['success'] == 1) {
								// On success i.e the end of all pages.
								return sucCb(soFarData);
							}
						}, function(errrCb){
							// Some error has occured.
							return errCb(errrCb);
						}, function(nextCb){
							// Passing on the next page.
							return;
						});
					};
				} else {
					// Only 1 page of issues present
					return sucCb(soFarData);
				}
			});
		} else {
			console.log('error - '+ error);
			return errCb(error);
		}
	});
}

exports.subRepoInfo = function(subUrl, soFarData, succObj, errrObj, nextObj) {
	// Sub repo issue pages extraction to be done here.
	request({
		uri: subUrl,
		method: 'GET',
		headers: {
			'User-Agent': 'request'
		}
	}, function (error, response, body) {
		if (!error) {
			request({
				uri: subUrl,
				method: 'GET',
				headers: {
					'User-Agent': 'request'
				}
			}, function (error, response, body) {
				if (!error) {
					var issues = JSON.parse(response.body);
					var openIssues = 0;
					var openedToday = 0;
					var openedWeek = 0;
					var openedWeekAgo = 0;
					var curDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
					// Async loop through each of the issues to sort which category they fall in
					async.each(issues, function(issue, callback){
						// Open Issues
						if(issue.state == 'open'){
							soFarData['openIssues']+=1;
						}
						var issueCreated = new Date(issue.created_at);
						var issueCreated = moment(new Date(issue.created_at)).format("YYYY-MM-DD HH:mm:ss");
						var remainingHours = moment(curDate).diff(issueCreated, 'hours');
						// Open Issues in Last 24 hours
						if(remainingHours <= 24) {
							soFarData['openedToday']+=1;
						}
						var remainingDays = moment(curDate).diff(issueCreated, 'days');
						// Open issues that were opened more than 24 hours ago but less than 7
						if(remainingDays>0 && remainingDays<8){
							soFarData['openedWeek']+=1;
						}
						// Open issues that were opened more than 7 days ago
						if(remainingDays>7){
							soFarData['openedWeekAgo']+=1;
						}
						callback();
					},
					function(err) {
						console.log('return err 2 - '+ err);
						soFarData['isNext']+=1;
						if(soFarData['isNext'].toString() == soFarData['lastPageNum']){
							soFarData['success'] = 1;
							// Found data and last page reached.
							succObj(soFarData);
						} else {
							soFarData['success'] = 0;
							// Found data but more pages to go
							nextObj(soFarData);
						}
					});
				} else {
					console.log('error - '+ error);
					// Some error has occured.
					errrObj(error);
				}
			});
		} else {
			console.log('error - '+ error);
			// Some error has occured.
			return error;
		}
	});
}

module.exports = exports;