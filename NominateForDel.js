/*
* @author RLuts
* for ukwiki only
* @ver 1.1
*/

//<nowiki>
if (typeof(window.NominateToDel) == 'undefined') {
	window.NominateToDel = {
		
		install: function () {
			if($.inArray('Статті-кандидати на вилучення', mw.config.get('wgCategories')) >= 0) {
				return;
			}
			//Текст
			this.talkPrefix = "Вікіпедія:Статті-кандидати на вилучення";
			this.preloadPage = "Вікіпедія:Статті-кандидати на вилучення/Заготовка";
			this.userTalkPrefix = 'User_talk:';
			this.nomText = 'Номінувати на вилучення';
			this.emptyReason = "Введіть причину номінації";
			this.summary = 'Статтю {article} номіновано на вилучення ([[Вікіпедія:Додатки/NominateForDel|NominateForDel.js]])';
			this.addTemplateSummary = 'Статтю номіновано на вилучення ([[Вікіпедія:Додатки/NominateForDel|NominateForDel.js]])';
			this.userTalkSummary = 'Статтю {article} номіновано на вилучення ([[Вікіпедія:Додатки/NominateForDel|NominateForDel.js]])';
			
			if(debug) {
				this.talkPrefix = "User:RLuts/scripttest";
				this.userTalkPrefix = 'User:RLuts/scripttest/User_talk:';
			}
			
			mw.util.addPortletLink('p-cactions', 'javascript:window.NominateToDel.showDialog();', this.nomText);
		},
		
		showDialog: function () {
			var ntd = this;
			if( $( '#ntd-dialog' ).length == 0 ) {
				 $( "#mw-content-text" ).append('<div id="ntd-dialog" style="display:none;" title="' + this.nomText + '"><p style="font-size:.8em; color:red">Цей інструмент дозволяє створити нове обговорення на сторінці <a style="color:red; text-decoration:underline" href="https://uk.wikipedia.org/wiki/Вікіпедія:ВИЛ">ВП:ВИЛ</a></p>Причина:<textarea id="ntd-reasonbox" rows="8" cols="100"></textarea><div id="ntd-preview"></div></div>');
			}
			mw.loader.using( 'jquery.ui.dialog', function() {
				$( '#ntd-dialog' ).dialog({
					width: 400,
					buttons: {
						'Зберегти' : function() {
							ntd.check();
						},
						'Попередній перегляд': function() {
							ntd.preview();
						}
					}
				});
			});
			$('#ntd-reasonbox').focus();
		},
		
		preview: function () {
			var reason = $( '#ntd-reasonbox' ).val();
			var param = {
				action: 'parse',
				format: 'json',
				prop: 'text',
				text: reason
			}
			$.get(mw.util.wikiScript('api'), param).done(function(data) {
				console.log(data.parse.text['*']);
				$('#ntd-preview').html(data.parse.text['*']);
			});
		},
		
		check: function () {
			var reason = $( '#ntd-reasonbox' ).val();
			if( this.isEmpty( reason ) ) {
				$('#ntd-dialog').append( '<p style="font-size:80%; color:red">' + this.emptyReason + '</p>' );
				return 0;
			} else {
				this.reason = $( '#ntd-reasonbox' ).val();
				this.wait('Створюється нове обговорення на сторінці ВП:ВИЛ');
				this.getDate();
			}
		},
		
		getDate: function () {
			var ntd = this;
			var curtime;
			var param = {
				action: 'query',
				format: 'json',
				meta: 'siteinfo',
				siprop: 'general'
			}
			$.get(mw.util.wikiScript('api'), param).done(function(data) {
				curtime = data.query.general.time;
				var reg = /([0-9]{4})-([0-9]{2})-([0-9]{2})/;
				var arr = reg.exec(curtime);
				var year = arr[1];
				var mon, dayf;
				switch(arr[2]) {
					case "01": mon = ' січня '; break;
					case "02": mon = ' лютого '; break;
					case "03": mon = ' березня '; break;
					case "04": mon = ' квітня '; break;
					case "05": mon = ' травня '; break;
					case "06": mon = ' червня '; break;
					case "07": mon = ' липня '; break;
					case "08": mon = ' серпня '; break;
					case "09": mon = ' вересня '; break;
					case "10": mon = ' жовтня '; break;
					case "11": mon = ' листопада '; break;
					case "12": mon = ' грудня '; break;
				}
				var day = arr[3];
				if(dayf = /0([1-9])/.exec(day)) day=dayf[1];
				ntd.date = day + mon + year;
				ntd.getTalkPage(ntd.talkPrefix + "/" + day + mon + year);
			});
		},
		
		getTalkPage: function (page) {
			var ntd = this;
			var talkcont;
			var param = {
				action: 'query',
				format: 'json',
				rvprop: 'ids',
				rvlimit: '1',
				prop: 'revisions',
				titles: page
			}
			$.get(mw.util.wikiScript('api'), param).done(function(data) {
				param.rvprop = 'content';
				param.indexpageids = '';
				if(data.query.pages[-1]) {
					param.titles = ntd.preloadPage;
					$.get(mw.util.wikiScript('api'), param).done(function(data) {
						talkcont = data.query.pages[data.query.pageids[0]].revisions[0]['*'].split('-->')[0] + '-->\n\n== [[' + mw.config.get('wgPageName').replace(/_/g,' ') + ']] ==\n* \'\'\'Поставив:\'\'\' --~~~~\n* {{За}}:\n# ' + $.trim(ntd.reason) + ' --~~~~\n* {{Проти}}:\n* {{Утримаюсь}}:\n'
						ntd.addTalk(page, talkcont);
					});
				} else {
					param.titles = page;
					$.get(mw.util.wikiScript('api'), param).done(function(data) {
						talkcont = data.query.pages[data.query.pageids[0]].revisions[0]['*'] + '\n\n== [[' + mw.config.get('wgPageName').replace(/_/g,' ') + ']] ==\n* \'\'\'Поставив:\'\'\' --~~~~\n* {{За}}:\n# ' + $.trim(ntd.reason) + ' --~~~~\n* {{Проти}}:\n* {{Утримаюсь}}:\n'
						ntd.addTalk(page, talkcont);
					});
				}
			});
		},
		
		addTalk: function (pgtalk, talkcont) {
			var ntd = this;
			var t = '';
			if(mw.config.get( 'wgNamespaceNumber' ) == 6) t = ':';
			this.writeInPage( pgtalk, talkcont, this.summary.replace('{article}', '[[' + t + mw.config.get('wgPageName') + ']]').replace(/_/g,' '), null, null, function() {
					ntd.addTemplate();
			});
		},
		
		addTemplate: function () {
			var ntd = this;
			this.wait('Додається шаблон {{delete}} на сторінку ' + mw.config.get( 'wgPageName' ).replace(/_/g,' '));
			this.writeInPage( mw.config.get( 'wgPageName' ), '{{subst:afd}}\n', this.addTemplateSummary, 'prependtext', null, function () {
				ntd.getCreator();
			});
		},
		
		getCreator: function () {
			var ntd = this;
			this.wait('Додається повідомлення на сторінку обговорення автора статті');
			var param = {
				action: 'query',
				prop: 'revisions',
				format: 'json',
				rvlimit: '1',
				rvdir: 'newer',
				rvprop: 'user',
				indexpageids: '',
				titles: mw.config.get ( 'wgPageName' )
			}
			$.get(mw.util.wikiScript('api'), param).done(function(data) {
				if(data.query.pages[data.query.pageids[0]].revisions[0].anon === undefined && data.query.pages[data.query.pageids[0]].revisions[0].user) {
					ntd.isOnTop(data.query.pages[data.query.pageids[0]].revisions[0].user);
				} else {
					ntd.success();
				}
			});
		},
		
		isOnTop: function (user) {
			var ntd = this;
			var param = {
				action: 'query',
				prop: 'templates',
				format: 'json',
				tllimit: '1',
				tltemplates: 'Template:Нові_зверху',
				indexpageids: '',
				titles: this.userTalkPrefix + user
			}
			$.get(mw.util.wikiScript('api'), param).done(function(data) {
				if(data.query.pages[data.query.pageids[0]].templates) {
					ntd.notifyUser(user, true)
				} else {
					ntd.notifyUser(user, false)
				}	
			});
		},
		
		notifyUser: function (user, top) {
			var ntd = this;
			var content;
			if(top) {
				var param = {
					action: 'query',
					prop: 'revisions',
					format: 'json',
					rvprop: 'content',
					rvlimit: '1',
					rvsection: '0',
					titles: this.userTalkPrefix + user,
					indexpageids: ''
				}
				$.get(mw.util.wikiScript('api'), param).done(function(data) {
					content = data.query.pages[data.query.pageids[0]].revisions[0]['*'] + '\n\n{{subst:папв|' + mw.config.get( 'wgPageName' ).replace(/_/g,' ') + '|' + ntd.date + '}} --~~~~';
					ntd.writeInPage ( ntd.userTalkPrefix + user, content, ntd.userTalkSummary.replace('{article}', '[[' + mw.config.get('wgPageName').replace(/_/g,' ') + ']]'), null, 0, function() {
						ntd.success();
					});
				});
			} else {
				content = '\n\n{{subst:папв|' + mw.config.get( 'wgPageName' ).replace(/_/g,' ') + '|' + ntd.date + '}} --~~~~';
				ntd.writeInPage ( ntd.userTalkPrefix + user, content, ntd.userTalkSummary.replace('{article}', '[[' + mw.config.get('wgPageName') + ']]').replace(/_/g,' '), 'appendtext', null, function() {
						ntd.success();
				});
			}
		},
		
		success: function() {
			this.wait('Перезавантаження сторінки');
			setTimeout(function(){
				$( '#ntd-dialog' ).dialog('close');
					location.reload(); },1000
				);			
		},
		
		wait: function(mes) {
			$('#ntd-dialog').dialog("close");
			$('#ntd-dialog').prop('title', 'Зачекайте, будь ласка...');
			$('#ntd-dialog').html('<p style="font-size: 120%; font-weight:bold;">' + mes + '</p>');
			$('#ntd-dialog').dialog({
				modal: true,
				buttons: false
			});
		},
		
		isEmpty: function( str ) {
			return (!/\S/.test(str));
		},
		
		writeInPage: function ( title, content, summary, option, section, success ) {
			var param = {
				action: 'edit',
				title: title, 
				summary: summary, 
				watchlist: 'watch',
				token: mw.user.tokens.get('editToken'),
				format: 'json'
			}
			param[option || 'text'] = content;
			if (section || section === 0) 
				param.section = section;
			$.post(mw.util.wikiScript('api'), param, function() {
				if (typeof(success) === 'function')
					success();
			});
		}
	}
}
//</nowiki>
$(document).ready(function () {
	if(mw.config.get( 'wgNamespaceNumber' ) == 0 || debug || mw.config.get( 'wgNamespaceNumber' ) == 6 || mw.config.get( 'wgNamespaceNumber' ) == 10) {
		NominateToDel.install();
	}
});
