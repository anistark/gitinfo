var request = require('request'),
	async = require("async"),
	moment = require('moment'),
	helper = require('../routes/helper'),
	config = require('../routes/config');

exports.repoInfo = function(url, sucCb, errCb) {
	var issuesData = {};
	var client_id = config.client_id;
	var client_secret = config.client_secret;
	url = url+'?client_id='+client_id+'&client_secret='+client_secret;
	request({
		uri: url,
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

				if(remainingDays>0 && remainingDays<8){
					openedWeek+=1;
				}
				if(remainingDays>7){
					openedWeekAgo+=1;
				}

				callback();
			}, function(err) {
				var link = response.headers.link;
				var soFarData = {};
				soFarData['openIssues'] = 0;
				soFarData['openedToday'] = 0;
				soFarData['openedWeek'] = 0;
				soFarData['openedWeekAgo'] = 0;
				soFarData['isNext'] = 1;
				soFarData['success'] = 0;
				if(link) {
					var re = /\<((?:(?!\>).)+)/img;
					z = link.replace(/[>";<]/g,"").split(re);
					nextUrl = z[0].split(", ")[0].split(" ")[0];
					lastUrl = z[0].split(", ")[1].split(" ")[0];
					nextPageNum = z[0].split(", ")[0].split(" ")[0].split("page=")[1];
					lastPageNum = z[0].split(", ")[1].split(" ")[0].split("page=")[1];
					
					soFarData['openIssues']+=openIssues;
					soFarData['openedToday']+=openedToday;
					soFarData['openedWeek']+=openedWeek;
					soFarData['openedWeekAgo']+=openedWeekAgo;
					soFarData['lastPageNum'] = lastPageNum;
					for (var i = nextPageNum; i <= lastPageNum; i++) {
						 var nextUrl = z[0].split(", ")[0].split(" ")[0].split("page=")[0] + 'page=' + i;
						soFarData['nextPageNum'] = i;
						helper.subRepoInfo(nextUrl, soFarData, function(succCb){
							if(succCb['success'] == 1) {
								return sucCb(soFarData);
							}
						}, function(errrCb){
							return errCb(errrCb);
						}, function(nextCb){
							return;
						});
					};
				} else {
					// Nothing
				}
			});
		} else {
			console.log('error - '+ error);
			return errCb(error);
		}
	});
}

exports.subRepoInfo = function(subUrl, soFarData, succObj, errrObj, nextObj) {
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
					async.each(issues, function(issue, callback){
						// Open Issues
						if(issue.state == 'open'){
							soFarData['openIssues']+=1;
						}
						// Open Issues in Last 24 hours
						var issueCreated = new Date(issue.created_at);

						var issueCreated = moment(new Date(issue.created_at)).format("YYYY-MM-DD HH:mm:ss");

						var remainingHours = moment(curDate).diff(issueCreated, 'hours');
						if(remainingHours <= 24) {
							soFarData['openedToday']+=1;
						}
						var remainingDays = moment(curDate).diff(issueCreated, 'days');

						if(remainingDays>0 && remainingDays<8){
							soFarData['openedWeek']+=1;
						}
						if(remainingDays>7){
							soFarData['openedWeekAgo']+=1;
						}
						callback();
					},
					function(err) {
						console.log('return err 2 - '+ err);
						soFarData['isNext']+=1;
						// Final return
						if(soFarData['isNext'].toString() == soFarData['lastPageNum']){
							soFarData['success'] = 1;
							succObj(soFarData);
						} else {
							soFarData['success'] = 0;
							nextObj(soFarData);
						}
					});
				} else {
					console.log('error - '+ error);
					errrObj(error);
				}
			});
		} else {
			console.log('error - '+ error);
			return error;
		}
	});
}

module.exports = exports;