var request = require('request'),
	async = require("async"),
	moment = require('moment'),
	helper = require('../routes/helper');

exports.repoInfo = function(url, sucCb, errCb) {
	var issuesData = {};
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
				console.log('return err 1  - '+ typeof err);
				console.log('return err val 1  - '+ err);
				var link = response.headers.link;
				var soFarData = {};
				soFarData['openIssues'] = 0;
				soFarData['openedToday'] = 0;
				soFarData['openedWeek'] = 0;
				soFarData['openedWeekAgo'] = 0;
				soFarData['isNext'] = 1;
				if(link) {
					var re = /\<((?:(?!\>).)+)/img;
					// console.log("split", link.split(re));
					z = link.replace(/[>";<]/g,"").split(re);
					// console.log('z = '+ z);
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
						// console.log('soFarData 1 - '+ JSON.stringify(soFarData));
						console.log('nextUrl 1 - '+ nextUrl);
						soFarData['nextPageNum'] = i;
						var subData = helper.subRepoInfo(nextUrl, soFarData);
						if(soFarData['isNext'] != 1) {
							console.log('last page');
							return sucCb(soFarData);
						}
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

exports.subRepoInfo = function(subUrl, soFarData) {
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
						// Final return
						console.log('soFarData - '+ JSON.stringify(soFarData));
						if(soFarData['nextPageNum'] == soFarData['lastPageNum']){
							soFarData['isNext'] = 0;
						} else {
							soFarData['isNext'] = 1;
						}
						return soFarData;
					});
				} else {
					console.log('error - '+ error);
					return error;
				}
			});
		} else {
			console.log('error - '+ error);
			return error;
		}
	});
}

module.exports = exports;