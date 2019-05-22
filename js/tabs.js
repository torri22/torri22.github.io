var lang = chrome.i18n.getMessage('@@ui_locale'),
	search_system = '',
	all_tabs;

function getItem(item, callback){
	chrome.storage.local.get(item, callback);
}
function setItem (item, value, callback){
	if(item == 'links'){
		chrome.storage.local.set({links: value}, callback);
	} else if(item == 'opt'){
		chrome.storage.local.set({opt: value}, callback);
	} else if(item == 'categories'){
		chrome.storage.local.set({categories: value}, callback);
	}
}



function fixColor() {
	setTimeout(function () {
		console.log('%cStart fix', 'background-color: yellow;');
		var _fix = [];

		$('.not_have_color').each(function (i) {
			_fix[i] = {
				tabId: $(this).parent().find('span.remove_tab').data('id'),
				bgColor: this.style.backgroundColor
			};
		});

		console.log(_fix);

		setTimeout(function () {
			getItem('links', function(obj){
				var links = obj.links;
				$(links).each(function (i) {
					$(_fix).each(function () {
						if(this.tabId == links[i].id) {
							links[i].bgColor = this.bgColor;
						}
					})
				});
				setItem('links', links);
			});
		}, 50);
	}, 200);
}




function loadSettings() {
	getItem('opt', function(obj){
		var opt = obj.opt;

		$('#fast_search_btn').html('<img src="/img/search-machine/'+opt.search+'.png">');
		$('#search_form').data('site', opt.search);
		$('.tabs').addClass(opt.col_in_row);
		$('#col_in_row').val(opt.col_in_row);
		$('#tabs_page, #header_panel').show();

		if(opt.bg_img_status === false && opt.bg_color) {
			$('body').css('background-color', opt.bg_color);
		} else {
			if(opt.bg_mini && opt.bg_phase) {
				$('body').css('background-image', 'url('+opt.bg_mini+')');
			}
		}

		if(opt.search_status === false) {$('#search').remove();}
		if(opt.group_status === false) {
			$('#categories').remove();
			$('#group').parents('.col-sm-4').hide();
			$('#title_page').parents('.col-sm-8').removeClass('col-sm-8').addClass('col-sm-12');
		} else {
			$('#categories').addClass(opt.group_style);
		}
		$('#header_panel').addClass('header_pos_'+opt.group_pos);

		setTimeout(function() {
			if(opt.bg_img_status == true) {
				$('body').css('background-image', 'url('+opt.bg+')');
			}
		}, 1);
	});


	tabs.init();
}




function getFavicon(url, callback, v) {
	var img = document.createElement("img");
	// img.src = 'http://favicon.yandex.net/favicon/'+url;
	if(v==2) {
		img.src = url;
	} else {
		img.src = 'http://www.google.com/s2/favicons?domain='+url;
	}

	img.onload = function() {
		if(img.width<=5) {
			var imgNew = document.createElement("img");
			imgNew.src = '../img/system_favicon.png';
			imgNew.onload = function() {
				canvas = document.createElement("canvas");
				canvas.width = imgNew.width;
				canvas.height = imgNew.height;
				var ctx = canvas.getContext("2d");
				ctx.drawImage(imgNew, 0, 0);
				callback(canvas.toDataURL("image/png"));
			}
		} else {
			canvas = document.createElement("canvas");
			canvas.width = img.width;
			canvas.height = img.height;
			var ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0);
			callback(canvas.toDataURL("image/png"));
		}
	}
}



function addTab(url, title) {
	delete localStorage.imagesArray;
	var newTab = {};
	if(url.indexOf('http') == -1) {url = 'http://' + url;}
	if(title!=undefined) {newTab.title = title;}
	newTab.url = url;
	hostName = _.getDomain(url);
	var _fileName = hostName.replace(/\./g, '_')+'_'+_.rand(1, 99999);

	var _group = parseInt($('#group').val());
	newTab.category = _group;


	if(ffb.returnOpt()) {
		var _d = ffb.returnOpt();
		newTab = $.extend(newTab, _d);
		if(!title && (_d.style=='minimalizm' || _d.style=='capture')) {newTab.title = punycode.ToUnicode(hostName);}
		delete newTab.file;
		delete newTab.hostName;


		if(_d.style=='minimalizm') {
			getFavicon(_d.favicon, function(data) {
				newTab.favicon = data;
				addTabInDB(newTab);
			}, 2);
		} else if(_d.style=='big_logo') {
			if(_d.file) {
				save_local_file(_d.file, _fileName, function (localUrl) {
					newTab.logo = localUrl;
					addTabInDB(newTab);
				});
			} else {
				save_file(_d.logo, _fileName, function (localUrl) {
					newTab.logo = localUrl;
					addTabInDB(newTab);
				});
			}
		} else if(_d.style=='capture') {
			save_file_base64(_d.bgImage, _fileName, function (localUrl) {
				newTab.bgImage = localUrl;
				getFavicon(_d.favicon, function(data) {
					newTab.favicon = data;
					addTabInDB(newTab);
				}, 2);
			});
		}
	} else {
		loadStyleTab(hostName, _fileName, function (err, r, localUrl) {
			if(err==false) {
				newTab.logo = localUrl;
				newTab.style = 'big_logo';
				newTab.color = r.color;
				newTab.bg = r.bg;
				addTabInDB(newTab);
			} else {
				if(!title) {newTab.title = punycode.ToUnicode(hostName);}
				getFavicon(hostName, function(data) {
					newTab.style = 'minimalizm';
					newTab.favicon = data;
					var img = new Image();
					img.src = data;
					img.onload = function () {
						var color = magic(this, null, true);
						newTab.bgColor = color[2];
						addTabInDB(newTab);
					}
				});
			}
		});
	}
}



function editTab(editTabId) {
	var url = $('#page_url').val(),
		title = $('#title_page').val(),
		group = parseInt($('#group').val()),
		hostName = _.getDomain(url);
	var _fileName = hostName.replace(/\./g, '_')+'_'+_.rand(1, 99999);
	// var data = ffb.returnOpt();
	// console.log(data);

	getItem('links', function (obj) {
		var links = obj.links;
		$(links).each(function (i) {
			if(this.id == editTabId) {

				loadPageTitle(hostName, url, function(_err, _link){
					if(_err === false) {
						links[i].refLink = _link;
					}

					if(ffb.returnOpt()) {
						if(this.logo) {remove_file(this.logo);}
						else if(this.bgImage) {remove_file(this.bgImage);}

						var editTabOpt = ffb.returnOpt();
						editTabOpt.url = url;
						editTabOpt.id = editTabId;

						if(title!=undefined) {editTabOpt.title = title;}
						if(!title && (editTabOpt.style=='minimalizm' || editTabOpt.style=='capture')) {editTabOpt.title = punycode.ToUnicode(hostName);}


						if(editTabOpt.style=='minimalizm') {
							getFavicon(editTabOpt.favicon, function(data) {
								editTabOpt.favicon = data;

								links[i] = editTabOpt;
								links[i].category = group;
								setItem('links', links);

								if(getParameterByName('add_url')) {
									location = '/pages/newtab.html';
								} else {
									location.reload();
								}
							}, 2);
						}else if(editTabOpt.style=='big_logo') {
							if(editTabOpt.file) {
								save_local_file(editTabOpt.file, _fileName, function (localUrl) {
									editTabOpt.logo = localUrl;

									links[i] = editTabOpt;
									links[i].category = group;
									setItem('links', links);
								
									if(getParameterByName('add_url')) {
										location = '/pages/newtab.html';
									} else {
										location.reload();
									}
								});
							} else {
								save_file(editTabOpt.logo, _fileName, function (localUrl) {
									editTabOpt.logo = localUrl;

									links[i] = editTabOpt;
									links[i].category = group;
									setItem('links', links);
								
									if(getParameterByName('add_url')) {
										location = '/pages/newtab.html';
									} else {
										location.reload();
									}
								});
							}
						}  else if(editTabOpt.style=='capture') {
							save_file_base64(editTabOpt.bgImage, _fileName, function (localUrl) {
								editTabOpt.bgImage = localUrl;
								getFavicon(editTabOpt.favicon, function(data) {
									editTabOpt.favicon = data;

									links[i] = editTabOpt;
									links[i].category = group;
									setItem('links', links);
								
									if(getParameterByName('add_url')) {
										location = '/pages/newtab.html';
									} else {
										location.reload();
									}
								}, 2);
							});
						}


					} else {
						links[i].url = url;
						links[i].category = group;
						if(title!=undefined) {links[i].title = title;}
						if(!title && (links[i].style=='minimalizm' || links[i].style=='capture')) {links[i].title = punycode.ToUnicode(hostName);}
						setItem('links', links);
								
						if(getParameterByName('add_url')) {
							location = '/pages/newtab.html';
						} else {
							location.reload();
						}
					}
				});
			}
		});
	});
}



$(document).ready(function(){
	ui.i18n();
	loadSettings();
	goSearch();
	fast_search();


	oldFindText = '';
	$('#search input').keydown(function(data) {
		switch(data.keyCode) {
			case 40:
				return false;
				break;

			case 38:
				return false;
				break;
		}
	});

	$('#search input').keyup(function(data) {
		// console.log(data.keyCode);
		switch(data.keyCode) {
			case 40:
				if($('.ui-autocomplete li').is('.active')) {
					$('.ui-autocomplete li').each(function(i) {
						if($(this).is('.active')) {
							console.log(this);
							$(this).removeAttr('class')
									.next('li').addClass('active');
							return false;
						}
					});
				} else {
					$('.ui-autocomplete li:first-child').addClass('active');
				}

				$(this).val(function() {
					if($('.ui-autocomplete li.active').text()!='') {
						return $('.ui-autocomplete li.active').text();
					} else {
						return oldFindText;
					}
				});
				break;

			case 38:
				if($('.ui-autocomplete li').is('.active')) {
					$('.ui-autocomplete li').each(function(i) {
						if($(this).is('.active')) {
							console.log(this);
							$(this).removeAttr('class')
									.prev('li').addClass('active');
							return false;
						}
					});
				} else {
					$('.ui-autocomplete li:last-child').addClass('active');
				}

				$(this).val(function() {
					if($('.ui-autocomplete li.active').text()!='') {
						return $('.ui-autocomplete li.active').text();
					} else {
						return oldFindText;
					}
				});
				break;

			default:
				if($(this).val().length>=1 && oldFindText!=$(this).val()) {
					oldFindText = $(this).val();
					suggest($(this).val());
				}
				break;
		}
	});





	$('#search input').focus(function() {
		if($(this).val().length>=1) {
			$('.search_block').addClass('search_block_help');
		}
	});
	$('#search input').focusout(function() {
		setTimeout(function() {
			oldFindText = '';
			$('.search_block').removeClass('search_block_help');
			$('.ui-autocomplete').html('');
		}, 200);
	});

	$('.ui-autocomplete').on('click', 'li', function() {
		$('#search input').val($(this).text());
		$('#search form').submit();
	})



	$('#add_new_tab').click(function() {
		var forma = $('#form_to_add_tab');
		if($('#page_url', forma).val()!='') {
			addTab($('#page_url', forma).val(), $('#title_page', forma).val());
		} else {
			$('#page_url', forma).css('border-color', '#f00');
		}
	});


	$('#not_add_new_tab').click(function() {
		$('#form_to_add_tab input').val('');
	});

	$('#options_reset').click(function() {
		saveOptions('reset');
	});
	$('#options_save').click(function() {
		saveOptions('save');
	});



	$('.tabs').on('click', '.tab-block:not(.tab-create-dial) a', function () {
		$('.tab-icon').remove();
		$('.tab-block a').not(this).parents('.tab-block').animate({
			opacity: 0.07
		}, 600);
	});



	$('.tabs').on('click', '.remove_tab', function() {
		tabId = $(this).parent().data('id');
		tabs.remove(tabId);
	});




	$('.tabs').on('click', '.edit_tab', function() {
		var tabId = $(this).parent().data('id');
		tabs.openEditor(tabId);

		/*$(all_tabs).each(function(i) {
			if(this.id == tabId) {
				ffb.loadEditor(this);
				$('#edit_tab').data('tabid', this.id);
			}
		});*/
	});

	$('#edit_tab').click(function () {
		editTab($(this).data('tabid'));
	});




	$('#form_to_add_tab').on('submit', function() {
		var _formType = $('#form_type').val();
		if(_formType=='add') {addTab($('#page_url', this).val(), $('#title_page', this).val());}
		else if(_formType=='edit') {editTab($('#edit_tab').data('tabid'));}
		return false;
	});

	/*setTimeout(function () {
		var notification_v = localStorage.getItem('notification');
		if(notification_v==null) {
			$('.btn-opt').append('<div class="label_new wibration">new</div>');
		}
	}, 200);*/
	promo();
	ffb.install();
	contextMenu.install();
	cat.init();


	if(localStorage['show_help'] == "1_1") {
		$('.right_btn').prepend('<a href="#" id="newsfun" class="btn btn-ghost btn-opt" style="margin-right: 5px; font-size: 12px;">'+chrome.i18n.getMessage('loc_20')+'</a>');
	}
	$('#newsfun').click(function () {
		$('#help_popup .modal-title').html(chrome.i18n.getMessage('loc_20'));
		showHelp();
		delete localStorage['show_help'];
		return false;
	});
	if(location.search === '?help') {
		showHelp('reload');
	} else if(location.search.indexOf('?add_url') != -1) {
		var title_new_url = getParameterByName('title');
		var add_new_url = getParameterByName('add_url');

		$('#add_tab').modal('show');
		$('#page_url').val(add_new_url);
		$('#title_page').val(title_new_url);
	}
});

function getParameterByName(name, url) {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}


function showHelp(par) {
	$('#help_popup').modal('show');
	$('#help_next').click(function () {
		$('#help_next').hide();
		$('#help_prev, #help_end').show();
		$('.help_panel_1').slideUp();
		$('.help_panel_2').slideDown();
	});
	$('#help_prev').click(function () {
		$('#help_next').show();
		$('#help_prev, #help_end').hide();
		$('.help_panel_1').slideDown();
		$('.help_panel_2').slideUp();
	});

	if(par == 'reload') {
		$('#help_end').click(function () {
			chrome.tabs.create({active: true});
			window.close();
		});
		$('#help_popup').on('hidden.bs.modal', function (e) {
			chrome.tabs.create({active: true});
			window.close();
		});
	} else {
		$('#help_end').click(function () {
			$('#help_popup').modal('hide');
		});

	}
}



var cat = {
	dom: '',
	elem: '',
	init: function () {
		this.dom = $('.categories_tabs');
		this.render();

		$('#add_group form').submit(function () {
			if($('#group_form_type').val()=='add') {
				$('#add_group_btn').click();
			} else {
				$('#save_group_btn').click();
			}
			return false;
		});

		$('#add_group_btn').click(function () {
			var name = $('#group_name').val(),
				icon = $('#group_icons i.fa.active').data('icon') || 'folder';

			if(!name || name=='') {
				$('#group_name').css('border-color', '#d33');
				setTimeout(function () {
					$('#group_name').removeAttr('style');
				}, 2000);
				return false;
			}

			cat.addGroup(name, icon, function () {
				location.reload();
			});
		});


		$('#save_group_btn').click(function () {
			var name = $('#group_name').val(),
				icon = $('#group_icons i.fa.active').data('icon') || 'folder',
				groupId = $(this).data('id');

			if(groupId===null) {return false;}

			if(!name || name=='') {
				$('#group_name').css('border-color', '#d33');
				setTimeout(function () {
					$('#group_name').removeAttr('style');
				}, 2000);
				return false;
			}

			cat.editGroup(groupId, name, icon, function () {
				location.reload();
			});
		});


		$('#group_icons i.fa').click(function () {
			$('#group_icons i.fa.active').removeClass('active');
			$(this).addClass('active');
		});

		$('#add_group').on('hidden.bs.modal', function (e) {
			cat.resetPopup();
		});

	},
	render: function () {
		getItem('categories', function(obj){
			var categories = obj.categories;
			cat.elem = categories;

			$.each(categories, function (i, val) {
				if(val.id==1) {var _s = ' selected'; var _a = ' active'}
				else{var _s = ''; var _a = ''}
				cat.dom.append('<span class="category_btn'+_a+'" data-id="'+val.id+'"><i class="fa fa-'+val.icon+'"></i><span>'+val.name+'</span></span>');
				$('#group').append('<option value="'+val.id+'"'+_s+'>'+val.name+'</option>');
			});

			
			_.bindKeys();
		});

		cat.dom.on('click', '.category_btn', function () {
			if($(this).is('.active')) return false;

			$('.category_btn.active').removeClass('active');
			$(this).addClass('active');


			var _id = $(this).data('id');
			$('.tabs').css('position', 'relative');
			$('.tabs').animate({left: -800, opacity:0}, 200, function () {
				$('.col').not('.creating_new_dial').hide();
				$('.cat_'+_id).parent().show();
				$('.tabs').animate({left: 0, opacity:1}, 200, function () {
					$('.tabs').removeAttr('style');
				});
			});
		});


		var icons = ["folder","shopping-cart","gear","globe","home","bookmark-o","bookmark","newspaper-o","building-o","camera","info-circle","download","envelope","exchange","external-link","fire","graduation-cap","heart","image","code","rocket","smile-o","cloud","institution","laptop","share-alt","shield","space-shuttle","sun-o","tag","trophy","barcode","book","calendar","coffee","database","envelope-o","fax","folder-open","gamepad","music","star","tags","film","dollar","paperclip","floppy-o","font","medkit","ambulance","angellist","bus","cc-visa","google-wallet","lastfm-square","paint-brush","shekel","toggle-off","twitch","area-chart","bicycle","calculator","cc-mastercard","copyright","line-chart","paypal","wifi","at","binoculars","cc","eyedropper","ioxhost","pie-chart","slideshare","trash","birthday-cake","futbol-o","lastfm","plug","tty","adjust","arrows","bolt","certificate","circle-o","close","cogs","comments-o","crop","cutlery","dot-circle-o","ellipsis-v","eraser","exclamation-triangle","fighter-jet","file-excel-o","file-photo-o","filter","toggle-on","flag-checkered","lemon-o","magnet","male","moon-o","paw","phone","print","question-circle","recycle","suitcase","tree","umbrella","unsorted","anchor","automobile","bell","bomb","briefcase","bullhorn","comment","crosshairs","level-down","location-arrow","map-marker","mobile","pencil","plane","puzzle-piece","quote-left","signal","terminal","upload","volume-down","archive","ban","bug","child","cube","gift","group","inbox","key","leaf","level-up","life-saver","lock","paper-plane","retweet","sitemap","spinner","thumb-tack","truck","volume-off","asterisk","bars","clock-o","desktop","female","flask","gavel","glass","lightbulb-o","magic","microphone","money","power-off","random","road","sliders","tablet","tasks","tint","volume-up","wrench","file","file-text","file-text-o","list","outdent","scissors","th-large","unlink","chain","copy","superscript","play","pause","stop","eject","h-square"];
		$.each(icons, function () {
			$('#group_icons').append('<span class="_icon"><i data-icon="'+this+'" class="fa fa-'+this+'"></i></span>');
		});
		$('#group_icons ._icon .fa-folder').addClass('active');
	},
	resetPopup: function () {
		$('#group_name').val('');
		$('#group_icons i.fa.active').removeClass('active');
		$('#group_icons ._icon .fa-folder').addClass('active');

		$('#save_group_btn').hide().data('id', null);
		$('#add_group_btn').show();
		$('#group_form_type').val('add')
		$('#add_group .modal-title').html(chrome.i18n.getMessage('loc_22'));
	},
	addGroup: function (name, icon, callback) {
		getItem('categories', function(obj){
			var groups = obj.categories,
				newGroup = {'name': name, 'icon': icon},
				lastId = 1;

			$.each(groups, function (i, val) {
				if(val.id>lastId) {
					lastId = val.id;
				}
			});

			newGroup['id'] = ++lastId;

			groups.push(newGroup);
			setItem('categories', groups, function () {
				if(callback && typeof callback === 'function') callback();
			});
		});
	},
	editGroup: function (groupId, name, icon, callback) {
		getItem('categories', function(obj){
			var groups = obj.categories;

			$.each(groups, function (i, val) {
				if(val.id==groupId) {
					groups[i].name = name;
					groups[i].icon = icon;
				}
			});

			setItem('categories', groups, function () {
				if(callback && typeof callback === 'function') callback();
			});
		});
	},
	removeGroup: function (tabId) {
		var content = '';

		if(tabs.html[tabId]) {
			var dial_count = tabs.html[tabId].length,
				groups = '';

			$.each(cat.elem, function () {
				if(this.id != tabId) {
					if(this.id==1) {groups+='<option value="'+this.id+'" selected>'+this.name+'</option>';}
					else {groups+='<option value="'+this.id+'">'+this.name+'</option>';}
				}
			});

			content += '<div class="alert alert-danger">' + chrome.i18n.getMessage('loc_47') + dial_count+ chrome.i18n.getMessage('loc_47_2') + '</div>';
			content += '<p>';
			content += '<label><input type="radio" name="tab_remove" value="act_1"> '+chrome.i18n.getMessage('loc_48')+'</label><br />';
			content += '<label><input type="radio" name="tab_remove" value="act_2" checked> '+chrome.i18n.getMessage('loc_49')+'</label> <select id="new_group_for_dials" style="display: inline-block;">'+groups+'</select>';
			content += '</p>';
		} else {
			content += '<div class="alert alert-danger text-center"><b>'+chrome.i18n.getMessage('loc_50')+'</b></div>';
		}

		content += '<hr><p class="text-right">';
		content += '	<button type="button" class="btn btn-default" data-dismiss="modal">'+chrome.i18n.getMessage('loc_51')+'</button> <button id="remove_group" class="btn btn-danger" data-dismiss="modal">'+chrome.i18n.getMessage('loc_52')+'</button>';
		content += '</p>';
		_.alert(chrome.i18n.getMessage('loc_46'), content);


		$('#remove_group').click(function () {
			if($('#new_group_for_dials').is('select')) {
				var new_group_for_dials = $('#new_group_for_dials').val(),
					_action = $('input[name="tab_remove"]:checked').val();

				if(_action=='act_2') {
					cat.moveDials(tabId, new_group_for_dials, function () {
						cat.remove(tabId, function () {
							location.reload();
						});
					});
				} else if(_action=='act_1') {
					cat.clearGroup(tabId);
				}
			} else {
				cat.remove(tabId, function () {
					location.reload();
				});
			}
		})
	},


	remove: function (groupId, callback) {
		getItem('categories', function(obj){
			var groups = obj.categories;

			$.each(groups, function (i) {
				if(this.id==groupId) {groups.splice(i, 1);}
			});

			setItem('categories', groups, function () {
				if(callback && typeof callback === 'function') callback();
			});
		});
	},


	moveDials: function (oldId, newId, callback) {
		getItem('links', function (obj) {
			var links = obj.links;

			$.each(links, function (i) {
				if(this.category == oldId) {
					this.category = newId;
				}
			});

			setItem('links', links, function () {
				if(callback && typeof callback === 'function') callback();
			});
		});
	},


	clearGroup: function (groupId) {
		getItem('links', function (obj) {
			var links = obj.links;

			var new_links = $.grep(links, function (val) {
				if(val.category != groupId) {
					return val;
				} else {
					if(this.logo) {remove_file(this.logo);}
					if(this.bgImage) {remove_file(this.bgImage);}
				}
			});


			setTimeout(function () {
				setItem('links', new_links, function () {
					cat.remove(groupId, function () {
						location.reload();
					});
				});
			}, 200);
		});
	},


	contextMenu: function (action, tabId) {
		if(action == 'remove') {
			if (tabId==1) return false;
			cat.removeGroup(tabId);
		} else if(action == 'move') {
			var groups = '';
			$.each(cat.elem, function () {
				if(this.id != tabId) {
					if(this.id==1) {groups+='<option value="'+this.id+'" selected>'+this.name+'</option>';}
					else {groups+='<option value="'+this.id+'">'+this.name+'</option>';}
				}
			});

			var content = '<p>'+chrome.i18n.getMessage('loc_54')+' <select id="new_group_for_dials" style="display: inline-block;">'+groups+'</select></p>';
			content += '<hr><p class="text-right">';
			content += '	<button type="button" class="btn btn-default" data-dismiss="modal">'+chrome.i18n.getMessage('loc_55')+'</button> <button id="move_dials" class="btn btn-success" data-dismiss="modal">'+chrome.i18n.getMessage('loc_56')+'</button>';
			content += '</p>';
			_.alert(chrome.i18n.getMessage('loc_53'), content);

			$('#move_dials').click(function () {
				var _n = $('#new_group_for_dials').val();
				if(_n >= 1) {
					cat.moveDials(tabId, _n, function () {
						location.reload();
					});
				}
			});
		} else if(action == 'edit') {
			$('#add_group .modal-title').html(chrome.i18n.getMessage('loc_23'));
			$('#add_group').modal('show');
			var _target = $.grep(cat.elem, function (val) {
				if(val.id == tabId) return val;
			});

			$('#group_name').val(_target[0].name);
			$('#group_icons i.fa.active').removeClass('active');
			$('#group_icons i.fa-'+_target[0].icon).addClass('active');
			$('#group_form_type').val('edit');

			$('#save_group_btn').show().data('id', tabId);
			$('#add_group_btn').hide();
		}
	}
};


var contextMenu = {
	install: function () {
		$('.categories_tabs').on('contextmenu', '.category_btn', function(e){
			contextMenu.hide();
			e.preventDefault();
			var tabId = $(this).data('id');
			if(tabId == 1) {$('#group-context-menu a[data-action="remove"]').parent().hide();}
			else {$('#group-context-menu a[data-action="remove"]').parent().show();}


			var left = e.pageX,
				top = e.pageY,
				menuWidth = $('#group-context-menu').width(),
				menuHeight = $('#group-context-menu').height(),
				windowWidth = $(window).width(),
				windowHeight = $(window).height(),
				scrollTop = $(window).scrollTop(),
				tabUrl = $(this).find('a').attr('href');

			var ss = windowWidth - menuWidth - left;
			var ss2 = windowHeight + scrollTop - menuHeight - top;
			if(ss<=20) {left = left - menuWidth;}

			if(ss2<=20) {top = top - menuHeight - 10;}
			else {top = top + 10;}

			$('#group-context-menu').data('id', tabId).show().css('left', left+'px').show().css('top', top+'px');
		});



		$('#group-context-menu a').click(function () {
			var action = $(this).data('action'),
				tabId = $(this).parents('.custom-context-menu').data('id');
			cat.contextMenu(action, tabId);
		});




		$('.tabs').on('contextmenu', '.tab-block:not(.tab-create-dial)', function(e){
			contextMenu.hide();
			e.preventDefault();
			var left = e.pageX,
				top = e.pageY,
				menuWidth = $('#dial-context-menu').width(),
				menuHeight = $('#dial-context-menu').height(),
				windowWidth = $(window).width(),
				windowHeight = $(window).height(),
				scrollTop = $(window).scrollTop(),
				tabId = $(this).data('id'),
				tabUrl = $(this).find('a').attr('href');

			var ss = windowWidth - menuWidth - left;
			var ss2 = windowHeight + scrollTop - menuHeight - top;
			if(ss<=20) {left = left - menuWidth;}
			if(ss2<=20) {top = top - menuHeight;}

			$('#dial-context-menu').data('id', tabId).data('url', tabUrl).show().css('left', left+'px').show().css('top', top+'px');
			return false;
		});
		$('#dial-context-menu a').click(function () {
			var action = $(this).data('action'),
				tabId = $(this).parents('#dial-context-menu').data('id'),
				tabUrl = $(this).parents('#dial-context-menu').data('url');

			if(action=='remove') {
				tabs.remove(tabId);
			} else if(action=='edit') {
				tabs.openEditor(tabId);
			}else if(action=='secret') {
				chrome.windows.create({url: _.getLink(tabId), incognito: true});
			} else if(action=='external') {
				chrome.tabs.create({url: _.getLink(tabId), active: false});
			}
			
			contextMenu.hide();
			return false;
		})
		$(window).resize(function () {
			contextMenu.hide();
		}).click(function (e) {
			if($(e.target).parents('.sub-context-menu').is('li')==true) {return false;}
			$('.sub-context-menu.hover').removeClass('hover');
			contextMenu.hide();
		});
	},

	hide: function () {
		$('.custom-context-menu').hide();
	}
};





var tabs = {
	html: {},
	init: function () {
		getItem('links', tabs.render);
	},
	render: function (obj) {
		all_tabs = obj.links;
		checkNewBase(obj.links);
		tabs.createHtml(all_tabs);


		$('.tab-block').not('.cat_1').parent().hide();
		$('.tab_logo').on('error', function () {
			// imgLoaderHack.reloadFile(this);
		});


		$('.tabs').append('<div class="col creating_new_dial"><div class="tab-block tab-create-dial"><a href="#" data-toggle="modal" data-target="#add_tab"><i class="fa fa-tw fa-plus"></i></a></div></div>');

		$('.tabs').on('click', '> .col:not(.creating_new_dial) a', function(){
			var tabId = $(this).parents('.tab-block').data('id')
			window.location = _.getLink(tabId);
		})

		$(".not_have_color .favicon").each(function(i) {
			magic( this, kClusters );
			if(i==$(".not_have_color .favicon").length-1) {fixColor();}
		});

		$(".tabs").sortable({
			items: "> .col:not(.creating_new_dial)",
			tolerance: "pointer",
			placeholder: 'col tab-placeholder',
			delay: 100,
			start: function () {
				contextMenu.hide()
			},
			update: function() {
				setTimeout(function() {
					idsTabs = [];
					$(".tab-block").each(function(i) {
						idsTabs[i] = $(this).data('id');
					});

					getItem('links', function(obj){
						oldSort = obj.links;
						newSort = [];

						$(idsTabs).each(function(i, val) {
							$(oldSort).each(function() {
								if(val == this.id) {
									newSort[newSort.length] = this;
								}
							});
						})

						setItem('links', newSort);
						checkNewBase(newSort);
					});
				}, 50);
			}
		});

		$('.tab-create-dial').click(function () { 
			console.log('sadasd');
			var activeGroup = $('.category_btn.active').data('id');
			if(activeGroup >= 1) {
				$('#group').val(activeGroup);
			}
		});
	},
	findById: function (id) {
		return $(".tab-block[data-id='" + id + "']");
	},
	remove: function (tabId, step) {
		if(!step) {
			var content = '<p class="text-center"><button type="button" class="btn btn-default" data-dismiss="modal">'+chrome.i18n.getMessage('loc_58')+'</button> <button id="remove_tab_step2" class="btn btn-danger" data-dismiss="modal">'+chrome.i18n.getMessage('loc_59')+'</button></p>'
			_.alert(chrome.i18n.getMessage('loc_57'), content);
			$('#remove_tab_step2').click(function () {
				tabs.remove(tabId, true);
			});
		} else {
			$(tabs.findById(tabId)).parents('.col').remove();
			$('#custom_alert').modal('hide');

			setTimeout(function() {
				getItem('links', function(obj){
					allLinks = obj.links;

					$(obj.links).each(function(i) {
						if(this.id == tabId) {
							if(this.logo) {remove_file(this.logo);}
							else if(this.bgImage) {remove_file(this.bgImage);}
							allLinks.splice(i, 1);
						}
					});

					setItem('links', allLinks);
					checkNewBase(allLinks);
				});
			}, 50);
		}
	},
	openEditor: function (tabId) {
		$(all_tabs).each(function(i) {
			if(this.id == tabId) {
				ffb.loadEditor(this);
				$('#edit_tab').data('tabid', this.id);
			}
		});
	},
	createHtml: function (links) {
		$.each(links, function() {
			var _group = this.category;
			if(!tabs.html[_group]) {tabs.html[_group] = [];}
			tabs.html[_group].push(this);
		});

		console.log(tabs.html);


		$.each(tabs.html, function(i) {
			$.each(this, function(i) {
				if(this.style=='capture') {
					$('.tabs').append('<div class="col"><div class="tab-block tab-with-bg-img cat_'+this.category+'" data-id="'+this.id+'"><span class="tab-icon edit_tab"><i class="fa fa-tw fa-pencil"></i></span><span class="tab-icon remove_tab"><i class="fa fa-trash-o fa-tw"></i></span><a href="'+this.url+'" style="background-image: url('+this.bgImage+');"><span class="favicon_prev"><img class="favicon" src="'+this.favicon+'" /> '+this.title+'</span></a></div></div>');
				} else if(this.style=='minimalizm' || !this.style) {
					if(this.bgColor) {
						$('.tabs').append('<div class="col"><div class="tab-block tab_big_minimalizm cat_'+this.category+'" data-id="'+this.id+'"><span class="tab-icon edit_tab"><i class="fa fa-tw fa-pencil"></i></span><span class="tab-icon remove_tab"><i class="fa fa-trash-o fa-tw"></i></span><a style="background-color: '+this.bgColor+'" href="'+this.url+'"><span class="favicon_prev"><img class="favicon" src="'+this.favicon+'" /> '+this.title+'</span></a></div></div>');
					} else {
						$('.tabs').append('<div class="col"><div class="tab-block tab_big_minimalizm cat_'+this.category+'" data-id="'+this.id+'"><span class="tab-icon edit_tab"><i class="fa fa-tw fa-pencil"></i></span><span class="tab-icon remove_tab"><i class="fa fa-trash-o fa-tw"></i></span><a class="not_have_color" href="'+this.url+'"><span class="favicon_prev"><img class="favicon" src="'+this.favicon+'" /> '+this.title+'</span></a></div></div>');
					}
				} else if(this.style=='big_logo') {
					$('.tabs').append('<div class="col"><div class="tab-block tab_big_logo cat_'+this.category+'" data-id="'+this.id+'"><span class="tab-icon edit_tab"><i class="fa fa-tw fa-pencil"></i></span><span class="tab-icon remove_tab"><i class="fa fa-trash-o fa-tw"></i></span><a href="'+this.url+'" style="background-color: '+this.bg+';"><img class="tab_logo" src="'+this.logo+'" /><span class="tab_title" style="color: '+this.color+';">'+this.title+'</span></a></div></div>');
				}
			});
		});
	}
};





checker = '';
function checkNewBase(allLinksInBase) {
	if(checker) {clearInterval(checker);}
	checker = setInterval(function() {
		getItem( 'links', function( obj ){
			if(obj.links.length != allLinksInBase.length) {
				location.reload();
			} else {
				$(obj.links).each(function(i) {
					if(this.id != allLinksInBase[i].id) {
						location.reload();
					}
				});
			}
		});
	}, 2000);
}







function fast_search() {
	$('.fast_search').on('click', function() {
		var c = $(this).attr('href');
		var s = $('#search_input').val();
		window.location = c+s;
		return false;
	});
}



function goSearch() {
	$('#search_form').on('submit', function () {
		var d_dite = $('#search_form').data('site');
		var text = $('#search_input').val();

		if(d_dite=='google') {var link = 'https://www.google.com/search?q=';}
		else if(d_dite=='yandex') {var link = 'https://yandex.ru/search/?text=';}
		else if(d_dite=='bing') {var link = 'http://www.bing.com/search?q=';}
		else if(d_dite=='duckduckgo') {var link = 'https://duckduckgo.com/?q=';}
		else if(d_dite=='mail_ru') {var link = 'http://go.mail.ru/search?q=';}

		window.location = link+text;
		return false;
	});
}





function suggest(text) {
	var s;
	if(lang=='en' || search_system=='google') {
		s = 'google';
		UrlValue = 'https://www.google.com/complete/search?client=hp&gs_rn=64&gs_ri=hp&cp=3&gs_id=10&q='+text+'&xhr=t';
	} else {
		s = 'yandex';
		// UrlValue = 'http://suggest.yandex.ru/suggest-ya.cgi?v=3&pos=4&yu=432423154734784591&part='+text;
		UrlValue = 'http://suggest.yandex.ru/suggest-ya.cgi?v=3&pos=4&part='+text;
	}
	

	var x = new XMLHttpRequest();
	x.open("GET", UrlValue, true);
	x.onload = function (){
		var answer = x.responseText;
		if(s=='google') {
			answer = JSON.parse(answer);
			answer = answer[1];
		} else if(s=='yandex') {
			answer = JSON.parse(answer.match(/\[(.+?)\]/)[0]);
		}
		
		console.log(answer);

		$('.ui-autocomplete').html('');

		if(s=='google') {
			$.each(answer, function() {
				$('.ui-autocomplete').append('<li>'+this[0]+'</li>');
			});
		} else if(s=='yandex') {
			$.each(answer, function() {
				$('.ui-autocomplete').append('<li>'+this+'</li>');
			});
		}

		$('.search_block').addClass('search_block_help');
	}
	x.send(null);
}






var ui = {
	i18n: function () {
		$('#search_input').attr('placeholder', chrome.i18n.getMessage('search_input'));
		$('[data-i18n]').each(function () {
			$(this).html(_.lang_data($(this).data('i18n')));
		});
	}
};





function promo() {
	// if(lang!='ru') {return false};
	var newtab_count = localStorage.getItem('opening_newtab_count'),
		remind_date = localStorage.getItem('remind_date'),
		promo_hide = localStorage.getItem('promo_hide'),
		nowTime = new Date().getTime();


	if(newtab_count==null) {
		localStorage.setItem('opening_newtab_count', 1);
		return false
	}

	var setValue = parseInt(newtab_count) + 1;
	localStorage.setItem('opening_newtab_count', setValue);

	if(setValue>50 && (remind_date==null || nowTime>remind_date) && (promo_hide==null || promo_hide==false)) {
		var promo = '<div id="feed_block">';
			promo += '	<div class="feed_block_content">';
			promo += '		<h2>'+_.lang_data('rate_1')+'</h2>';
			promo += '		<div class="feed_block_stars"><i class="fa fa-star"></i> <i class="fa fa-star"></i> <i class="fa fa-star"></i> <i class="fa fa-star"></i> <i class="fa fa-star"></i></div>';
			promo += '		<div class="feed_block_btns">';
			promo += '			<div style="margin-bottom: 10px;">';
			promo += '				<a id="remind_tomorrow" href="#" class="btn btn-text">'+_.lang_data('rate_2')+'</a> ';
			promo += '				<a id="open_reviews" href="https://goo.gl/4QRomJ" target="_blank" class="btn btn-lg btn-success">'+_.lang_data('rate_3')+'</a>';
			promo += '			</div>';
			promo += '			<a id="newer_show_again" href="#" class="btn btn-text">'+_.lang_data('rate_4')+'</a>';
			promo += '		</div>';
			promo += '		<div>'+_.lang_data('rate_5')+'</div>';
			promo += '	</div>';
			promo += '</div>';
		$('body').append(promo);


		setTimeout(function () {
			$('#feed_block').show().animate({
				bottom: 30
			}, 300);

			$('#remind_tomorrow').on('click', function () {
				var remind_date = parseInt(nowTime) + (1000 * 60 * 60 * 22);
				localStorage.setItem('remind_date', remind_date);
				$('#feed_block').animate({bottom: -500}, 300).hide(100);
			});

			$('#newer_show_again').on('click', function () {
				$('#feed_block').animate({bottom: -500}, 300).hide(100);
				localStorage.setItem('promo_hide', true);
			});

			$('#open_reviews').on('click', function () {
				$('#feed_block').animate({bottom: -500}, 300).hide(100);
				localStorage.setItem('promo_hide', true);
			});
		}, 1000);
	}
}






function loadStyleTab(link, fileName, callback) {
	$.ajax({
		url: 'http://speed-dial.net/api/tab_style/',
		data: {
			site: link,
			full_link: encodeURIComponent($('#page_url').val())
		},
		method: 'GET',
		success: function(r) {
			if(r.error) {
				callback('not_find');
			} else {
				save_file(r.logo, fileName, function (localUrl) {
					callback(false, r, localUrl);
				});
			}
		}
	});
}


function loadPageTitle(link, fileName, callback) {
	$('#add_new_tab, #edit_tab').prop('disabled', true);
	$('#add_new_tab, #edit_tab').prepend('<i class="fa fa-spinner fa-pulse fa-fw"></i> ');

	$.ajax({
		url: 'http://speed-dial.net/api/page_title/index_page_title.php',
		data: {
			site: link,
			full_link: encodeURIComponent($('#page_url').val())
		},
		method: 'GET',
		success: function(r) {
			$('#add_new_tab, #edit_tab').prop('disabled', false);
			if(r.error) {
				callback(true);
			} else {
				callback(false, r.info);
			}
		},
		error: function() {
			$('#add_new_tab, #edit_tab').prop('disabled', false);
			callback(true);
		}
	});
}

function addTabInDB(newTab) {
	getItem('links', function(obj){
		oldTabs = obj.links;

		if(oldTabs.length == 0) {
			newTab.id = 1 + oldTabs.length;
		} else {
			maxOldId = 0;
			$(oldTabs).each(function() {
				if(maxOldId < this.id) {
					maxOldId = this.id;
				}
			});
			newTab.id = 1 + maxOldId;
		}

		oldTabs[oldTabs.length] = newTab;

		setItem('links', oldTabs, function(data) {
			setTimeout(function() {
				if(getParameterByName('add_url')) {
					location = '/pages/newtab.html';
				} else {
					location.reload();
				}
			}, 100);
		});
	});
}




var directory = {};
window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
window.requestFileSystem(
	window.PERSISTENT, 200*1024*1024, // 200MB
	function(filesystem) {
		directory.fs = filesystem;
	},
	errorHandler
);

function save_file(fileurl, name, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', fileurl, true);
	xhr.responseType = 'blob';
	xhr.send();
	xhr.onload = function(e) {
		if (this.status == 200) {
			var format = this.response.type;
			format = format.split('/')[1];
			var blob = new Blob([this.response], {type: 'blobtype'});
			directory.fs.root.getFile(name+'.'+format, {create: true}, function(fileEntry) {
				fileEntry.createWriter(function(writer) {
				writer.onwrite = function(e) {};
				writer.onerror = function(e) { console.log("error"); console.log(e); };
					var blob = new Blob([xhr.response], {type: 'blobtype'});
					writer.write(blob);
					var url = fileEntry.toURL();
					callback(url);
				}, errorHandler);
			}, errorHandler);
		} else {
			if ( typeof(callback) == 'function' ) callback(false);
		}
	};
}
function save_local_file(fileurl, name, callback) {
	var that = fileurl;
	console.log(that);
	var format = that.type;
	format = format.split('/')[1];
	var blob = new Blob([that], {type: 'blobtype'});
	directory.fs.root.getFile(name+'.'+format, {create: true}, function(fileEntry) {
		fileEntry.createWriter(function(writer) {
		writer.onwrite = function(e) {};
		writer.onerror = function(e) { console.log("error"); console.log(e); };
			var blob = new Blob([that], {type: 'blobtype'});
			writer.write(blob);
			var url = fileEntry.toURL();
			callback(url);
		}, errorHandler);
	}, errorHandler);
}
function save_file_base64(fileurl, name, callback) {
	var that = base64toBlob(fileurl.replace(/.+,/, ''));
	var format = 'jpg';
	var blob = new Blob([that], {type: 'blobtype'});
	directory.fs.root.getFile(name+'.'+format, {create: true}, function(fileEntry) {
		fileEntry.createWriter(function(writer) {
		writer.onwrite = function(e) {};
		writer.onerror = function(e) { console.log("error"); console.log(e); };
			var blob = new Blob([that], {type: 'blobtype'});
			writer.write(blob);
			var url = fileEntry.toURL();
			callback(url);
		}, errorHandler);
	}, errorHandler);
}
function remove_file(fileUrl) {
	if(fileUrl.indexOf('persistent')==-1) {return false;}
	var fileUrl = fileUrl.match(/persistent\/(.+)/)[1];
	directory.fs.root.getFile(fileUrl, {create: false}, function(fileEntry) {
		fileEntry.remove(function() {
			console.log('File removed.');
			delete localStorage.imagesArray; // Ð¾Ñ‡Ð¸ÑÑ‚ÐºÐ° Ñ…Ñ€Ð°Ð½Ð¸Ð»Ð¸Ñ‰Ð° Ñ ÐºÐ°Ñ€Ñ‚Ð¸Ð½ÐºÐ°Ð¼Ð¸
		}, errorHandler);
	}, errorHandler);
}
function errorHandler(e) {console.error('Error: ' + e);}


function base64toBlob(base64Data, contentType) {
	contentType = contentType || '';
	var sliceSize = 1024;
	var byteCharacters = atob(base64Data);
	var bytesLength = byteCharacters.length;
	var slicesCount = Math.ceil(bytesLength / sliceSize);
	var byteArrays = new Array(slicesCount);

	for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
		var begin = sliceIndex * sliceSize;
		var end = Math.min(begin + sliceSize, bytesLength);

		var bytes = new Array(end - begin);
		for (var offset = begin, i = 0 ; offset < end; ++i, ++offset) {
			bytes[i] = byteCharacters[offset].charCodeAt(0);
		}
		byteArrays[sliceIndex] = new Uint8Array(bytes);
	}
	return new Blob(byteArrays, { type: contentType });
}

var imgLoaderHack = {
	startLoad: function () {
		if(localStorage.imagesArray==null) {
			setTimeout(function () {
				imgLoaderHack.createImagesList();
			}, 2000);
			return false;
		}
		var images = JSON.parse(localStorage.imagesArray);
		for (var i = images.length - 1; i >= 0; i--) {
			new Image().src = images[i];
		};
	},


	createImagesList: function () {
		var a = [];
		$('.tab_logo').each(function () {
			a.push($(this).attr('src'));
		});
		$('.tab-with-bg-img a').each(function () {
			var url = this.style.backgroundImage;
			url = url.split('"')[1];
			a.push(url);
		});
		localStorage.imagesArray = JSON.stringify(a);
	}


	/*reloadFile: function (obj) {
		var fileName = obj.src.match(/persistent\/(.+)/)[1],
			reloadUrl = 'https://cdn.speed-dial.net/logos/'+fileName

		obj.src = reloadUrl;
		save_file(reloadUrl, fileName, function () {
			delete localStorage['imagesArray'];
		});
		console.info(fileName);
	}*/
};
imgLoaderHack.startLoad();




var ffb = {
	_data: {bgImages: {}},
	tabStyles: {},


	install: function () {
		$('#add_tab').on('hidden.bs.modal', function (e) {
			chrome.extension.sendRequest('close_hidden_window');
			ffb.refreshForm();
		});


		$('#opt_tab_btn_open').on('click', function () {
			var _val = $('#page_url').val();
			if(!_val) {
				$('#page_url').css('border-color', '#ff8686');
				setTimeout(function () {
					$('#page_url').removeAttr('style');
				}, 1000);
				return false;
			}
			$(this).hide().next().show();
			$('#opt_tab_div').slideDown();
			ffb.showPrev();

			$('#page_url').on('keyup', function () {
				if(_val!=$('#page_url').val()) {
					$(this).off();
					$('#opt_tab_btn_close').hide().prev().show();
					$('#opt_tab_div').slideUp();
					ffb._data = {};
					ffb.tabStyles = {};
				}
			});
		});
		$('#opt_tab_btn_close').on('click', function () {
			$(this).hide().prev().show();
			$('#opt_tab_div').slideUp();
			ffb._data = {};
			ffb.tabStyles = {};
			$('#page_url').off();
			chrome.extension.sendRequest('close_hidden_window');
		});


		$('.color_picker').colorpicker({
			format: 'hex',
			colorSelectors: ['#d33', '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#9e9e9e', '#607d8b', '#222'],
			customClass: 'colorpicker-2x',
			sliders: {
			saturation: {
				maxLeft: 150,
				maxTop: 150
			},
			hue: {
				maxTop: 150
			},
			alpha: {
				maxTop: 150
			}
			}
		}).on('changeColor', function(e) {
			var colorTarget = $(this).data('target');
			var color = e.color.toString('hex');

			if(colorTarget=='ss_bg') {
				$('a', ffb.tab).css('background-color', color);
				ffb.tabStyles['big_logo'].bg = color;
			} else if(colorTarget=='ss_text') {
				$('span.tab_title', ffb.tab).css('color', color);
				ffb.tabStyles['big_logo'].color = color;
			} else if(colorTarget=='min_bg') {
				$('a', ffb.tab).css('background-color', color);
				ffb.tabStyles['minimalizm'].bgColor = color;
			}
		});


		$('.for_style_btns').on('click', '.btn', function () {
			var _d = $(this).data('tabstyle');
			if(_d=='old_style') {
				ffb.showPrevBookmark(_d);
			} else {
				ffb.showPrevBookmark(_d);
			}
		});


		$('.fav_btns').on('click', '> .btn', function () {
			var _a = ffb._data.nowActive,
				_f = ffb._data.favicons[$(this).data('fav')];
			$('.for_prev .favicon').attr('src', _f);
			ffb.tabStyles[_a].favicon = _f;

			if(_a=='minimalizm') {
				$('> img', this).each(function () {
					ffb.saveBg(_.bgForFavicon(this));
				});
			}
		});

		$('.bg_img_btns').on('click', '.btn', function () {
			var _d = ffb._data.bgImages[$(this).data('bgimage')];
			if(_d) {
				$('.for_prev .tab-with-bg-img a').css('background-image', 'url('+_d+')');
				ffb.tabStyles['capture'].bgImage = _d;
			}
		});


		$('.tab_bg > .btn_tab_bg').not(':last-child').on('click', function () {
			ffb.changeBgColor($(this).data('bgcol'));
		});


		$('#title_page').on('keyup', function () {
			if(ffb.tab) $('.tab_title', ffb.tab).html(this.value);
		});


		$('.tab_opt_load_logo').on({
			dragover: function(event) {
				event.preventDefault();
				$(this).addClass('drop_in');
			},
			dragleave: function(event) {
				event.preventDefault();
				$(this).removeClass('drop_in');
			},
			drop: function(event) {
				event.preventDefault();
				$(this).removeClass('drop_in');
				f = event.originalEvent.dataTransfer.files[0];
				var types = ["image/jpeg", "image/gif", "image/png"],
					_a = ffb._data.nowActive;

				if(types.indexOf(f.type) == -1) {
					$(this).addClass('error');
					var _that = this;
					setTimeout(function () {
						$(_that).removeClass('error');
					}, 1000);
					return false;
				}


				var reader = new FileReader();
				reader.onload = function(event) {
					var result = event.target.result;
					if(_a=='big_logo') {
						$('.for_prev img.tab_logo').attr('src', result);
						ffb.tabStyles['big_logo'].logo = result;
						ffb.tabStyles['big_logo'].file = f;
					} else if(_a=='capture') {
						ffb.resizeImg(result, function (data) {
							$('.for_prev a').css('background-image', 'url('+data+')');
							ffb.tabStyles['capture'].bgImage = data;
						});
						// ffb.tabStyles['capture'].file = f;
					}

				};
				reader.onerror = function(event) {
					alert('Loading error.');
				};
				reader.readAsDataURL(f);
			}
		})
	},


	showPrev: function () {
		ffb.tabStyles = {capture: {}};
		ffb._data = {bgImages: {}};
		$('.for_prev').html('').append('<i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i>');
		$('.bg_img_btns').html('');


		var url = $('#page_url').val();
		var newTab = {};
		if(url.indexOf('http') == -1) {url = 'http://' + url;}
		// newTab.hostName = _.getDomain(url);
		ffb._data.favicons = _.getFavicons(url, _.getDomain(url));
		newTab.favicon = ffb._data.favicons[0];
		ffb.tabStyles['minimalizm'] = newTab;
		ffb.tabStyles['capture'].favicon = ffb._data.favicons[0];




		$.ajax({
			url: 'https://speed-dial.net/api/tab_style/',
			data: {
				site: _.getDomain($('#page_url').val()),
				full_link: encodeURIComponent($('#page_url').val())
			},
			dataType: 'json',
			method: 'GET',
			success: function(r) {
				if(!r.error) {
					ffb.tabStyles['big_logo'] = r;
					ffb._data.big_logo_save_data = $.extend(true, {}, r);
					if(!ffb.styleEditor) ffb.showPrevBookmark('big_logo');

					$('#reset_opt_big_logo').show().on('click', function () {
						ffb.tabStyles['big_logo'] = $.extend(true, {}, ffb._data['big_logo_save_data']);
						ffb.showPrevBookmark('big_logo');

						$('.color_picker[data-target="ss_bg"]').val(ffb._data['big_logo_save_data'].bg);
						$('.color_picker[data-target="ss_text"]').val(ffb._data['big_logo_save_data'].color);


						var _that = $('i.fa', this).addClass('fa-spin');
						_.timeout(function () {
							$(_that).removeClass('fa-spin');
						}, 1000);
					});
				} else {
					ffb.tabStyles['big_logo'] = {
						"logo": "../img/default_logo.png",
						"bg": "#f5f5f5",
						"color": "#111"
					};
					if(!ffb.styleEditor) ffb.showPrevBookmark('minimalizm');
				}
			}
		});



		$('.bg_img_btns').append('<span class="btn btn-sm btn-default" data-bgimage="og_img"><i class="fa fa-spinner fa-pulse fa-fw"></i></span> ');
		$.ajax({
			url: 'https://speed-dial.net/api/og_parser/',
			data: {site: $('#page_url').val()},
			dataType: 'json',
			method: 'GET',
			success: function(r) {
				console.log(r);
				if(!r.error) {
					// var _iu = r.og_img;
					if(r.og_img && r.og_img.indexOf('http')!=-1) {
						ffb.resizeImg(r.og_img, function (data) {
							ffb._data.bgImages['og_img'] = data;
							ffb.tabStyles['capture'].bgImage = data;
						});
						// ffb._data.bgImages = {og_img: r.og_img};
						$('.bg_img_btns > [data-bgimage="og_img"]').html('<i class="fa fa-tw fa-picture-o"></i> ');
						// ffb.tabStyles['capture'].bgImage = r.og_img;
					} else {
						$('.bg_img_btns > [data-bgimage="og_img"]').remove();
						// ffb.tabStyles['capture'].favicon = ffb._data.favicons[0];
					}
				} else {
					$('.bg_img_btns > [data-bgimage="og_img"]').remove();
				}
			}
		});


		$('.bg_img_btns').append('<span class="btn btn-sm btn-default" data-bgimage="scrn"><i class="fa fa-spinner fa-pulse fa-fw"></i></span> ');
		$(window).unload(function(){
			chrome.extension.sendRequest('close_hidden_window');
		});

		chrome.extension.sendRequest({captureUrl: url}, function(data) {
			if(data.error) {
				$('.bg_img_btns > [data-bgimage="scrn"]').remove();
			} else {
				ffb.resizeImg(data.capture, function (data) {
					if(ffb._data.bgImages) {
						ffb._data.bgImages['scrn'] = data;
					} else {
						ffb._data.bgImages = {scrn: data};
					}
					$('.bg_img_btns > [data-bgimage="scrn"]').html('<i class="fa fa-tw fa-picture-o"></i> ');
				});
			}
		});
	},


	showPrevBookmark: function (styleActive) {
		var opt = ffb.tabStyles[styleActive];
		ffb.showOpt(styleActive);
		ffb._data.nowActive = styleActive;

		console.log(styleActive)

		if(styleActive=='old_style') {
			styleActive = ffb.tabStyles['old_style'].style;
		}


		if(styleActive=='big_logo') {
			var obj =  '<div class="tab-block tab_big_logo">';
				obj += '	<a href="javascript:return false;" style="background-color: '+opt.bg+';">';
				obj += '		<img class="tab_logo" src="'+opt.logo+'">';
				obj += '		<span class="tab_title" style="color: '+opt.color+';">'+$('#title_page').val()+'</span>';
				obj += '	</a>';
				obj += '</div>';
		} else if(styleActive=='capture') {
			var title = $('#title_page').val() || _.getDomain($('#page_url').val());
			var obj = '<div class="tab-block tab-with-bg-img">';
				obj += '	<a href="javascript:return false;" style="background: url('+opt.bgImage+')">';
				obj += '		<span class="favicon_prev"><img class="favicon" src="'+opt.favicon+'" /> <span class="tab_title">'+title+'</span></span>';
				obj += '	</a>';
				obj += '</div>';
		} else if(styleActive=='minimalizm') {
			var title = $('#title_page').val() || _.getDomain($('#page_url').val());
			var obj = '<div class="tab-block">';
				obj += '	<a href="javascript:return false;" style="background-color: '+opt.bgColor+'">';
				obj += '		<span class="favicon_prev"><img class="favicon" src="'+opt.favicon+'" /> <span class="tab_title">'+title+'</span></span>';
				obj += '	</a>';
				obj += '</div>';
		}
		this.tab = $('.for_prev').html(obj);

		if(styleActive=='minimalizm' && !opt.bgColor) {
			setTimeout(function () {
				$('.favicon', ffb.tab).html(function (el) {
					ffb.saveBg(_.bgForFavicon(this));
					ffb.changeBgColor();
				});
			}, 50);
		}
	},



	loadEditor: function (info) {
		console.log(info)
		$('#page_url').val(info.url);
		$('#title_page').val(info.title);
		$('#group').val(info.category);
		ffb.styleEditor = info;

		$('.btns_edit').show().prev().hide();
		$('#form_type').val('edit');
		$('#add_tab .modal-title').html(_.lang_data('edit_bookmark'));
		ffb.showPrev();
		$('#add_tab').modal('show');
		$('#opt_tab_div').show();

		$('.for_style_btns').append('<span data-tabstyle="old_style" class="btn btn-sm btn-default btn-info">4</span>');
		ffb.tabStyles['old_style'] = info;
		ffb.showPrevBookmark('old_style');
	},



	refreshForm: function (type, deep) {
		ffb.tabStyles = {capture: {}};
		ffb._data = {bgImages: {}};

		$('.btns_edit').hide().prev().show();
		$('#form_type').val('add');
		$('#add_tab .modal-title').html(_.lang_data('add_bookmark_titel'));
		$('#page_url, #title_page').val('');
		$('#group').val(1);
		$('[data-tabstyle="old_style"]').remove();
		$('#opt_tab_btn_close').hide().prev().show();
		$('#opt_tab_div').slideUp();

		$('#page_url').off();
		delete ffb.styleEditor;
	},




	returnOpt: function () {
		if(!ffb._data.nowActive || ffb._data.nowActive=='old_style') return false;
		var opt = ffb.tabStyles[ffb._data.nowActive];
		opt.style = ffb._data.nowActive;
		return opt;
	},
	saveBg: function (colors) {
		ffb._data['bgColor'] = colors;
		$('.tab_bg .btn_tab_bg').each(function (i) {
			$(this).css('background-color', colors[i]);
		});
	},
	changeBgColor: function (num) {
		num = num || 3;
		ffb.tabStyles['minimalizm'].bgColor = ffb._data['bgColor'][num-1];
		$('a', ffb.tab).css('background-color', ffb._data['bgColor'][num-1]);

	},
	showOpt: function (styleActive) {
		$('.for_style_btns .btn').removeClass('btn-info').filter('[data-tabstyle="'+styleActive+'"]').addClass('btn-info');
		$('.tab_opt').hide().filter('.tab_opt_'+styleActive).show();
	},
	resizeImg: function (url, callback) {
		var img = new Image();
		img.src = url;
		img.onload = function () {
			canvas = document.createElement("canvas");

			var _diff = Math.floor(img.width/280);
			if(_diff>=2) {
				if(_diff>=5) _diff = Math.floor(_diff/1.3);
				if(_diff & 1) _diff--;

				var new_w = img.width / _diff;
				var new_h = img.height * (new_w /img.width);

				if(new_h<140) {
					var _r = 140 / new_h;
					new_w = new_w * _r;
					new_h = 140;
				}
			} else {
				var new_w = img.width;
				var new_h = img.height;
			}

			canvas.width = new_w;
			canvas.height = new_h;
			var ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0, new_w, new_h);
			var bg_mini = canvas.toDataURL("image/png");

			callback(bg_mini);
		};
	}
};





var _ = {
	findTabById: function(tabId){
		var result = false;
		$.each(all_tabs, function(i) {
			if(this.id == tabId) {
				result = this;
			}
		});
		return result;
	},
	getLink: function(id) {
		var tab = this.findTabById(id);

		if(tab.refLink) {
			return tab.refLink;
		} else {
			return tab.url;
		}
	},

	getFavicons: function(url, hostName) {
		var favs = ['chrome://favicon/'+url, 'http://www.google.com/s2/favicons?domain='+hostName, 'http://favicon.yandex.net/favicon/'+hostName];
		$('.fav_btns').html('');
		for (var i = 0; i < favs.length; i++) {
			$('.fav_btns').append('<span class="btn btn-sm btn-default" data-fav="'+i+'"><img src="'+favs[i]+'" /></span> ');
		};
		$('.fav_btns > .btn img').each(function (){
			this.onload = function () {
				if(this.width<5) $(this).parent().remove();
			};
		});
		return favs;
	},
	bgForFavicon: function(favicon) {
		return magic(favicon, null, true);
	},
	getDomain: function(link) {
		if(link.indexOf('http') == -1) link = 'http://' + link;
		var p_link = document.createElement('a');
		p_link.href = link;
		var hostName = p_link.hostname;
		if(hostName.indexOf('www.')!=-1) hostName = hostName.replace(/www./, '');
		return hostName;
	},
	lang_data: function(s) {return chrome.i18n.getMessage(s);},
	timeout: function (callback, time) {
		if(typeof(time)=='object') {
			for(var i=0; i<time.length;i++) {
				setTimeout(function () {
					callback();
				}, time[i]);
			}
		} else {
			setTimeout(function () {
				callback();
			}, time);
		}
	},
	rand: function (min, max) {
		min = min || 1;
		max = max || 100;
		return Math.floor((Math.random() * max) + min);
	},
	save: function(a, b, c) {
		if (a) {
			b || (b = "console.json"), "object" == typeof a && (a = JSON.stringify(a, void 0, 4)), c = c ? c : "text/plain";
			var d = new Blob([a], {
					type: c
				}),
				e = document.createEvent("MouseEvents"),
				f = document.createElement("a");
			f.download = b, f.href = window.URL.createObjectURL(d), f.dataset.downloadurl = ["text/json", f.download, f.href].join(":"), e.initMouseEvent("click", !0, !1, window, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null), f.dispatchEvent(e)
		}
	},

	bindKeys: function () {		
		$(window).keydown(function(e){
			if(e.altKey) {
				var key = e.key;
				var $groups = $('.categories_tabs .category_btn');

				if($groups[key-1]) {$groups[key-1].click();}
			}
		});
	},

	alertTest: false,
	alert: function (title, content) {
		$('#custom_alert .modal-title').html(title);
		$('#custom_alert .modal-body').html(content);
		$('#custom_alert').modal('show');

		if(_.alertTest==false) {
			_.alertTest = true;
			$('#custom_alert').on('hidden.bs.modal', function (e) {
				$('#custom_alert .modal-title').html('');
				$('#custom_alert .modal-body').html('');
			});
		}
	}
};




function reloadStyleTabs() {
	console.log('%cSTART RELOADING', 'background-color: green; color: #fff;');
	var tabs = []

	function asynLoadingStyle(link) {
		var _l = document.createElement("a");
		_l.href = link;
		var hostName = _l.hostname;
		if(hostName.indexOf('www.')!=-1) hostName = hostName.replace(/^www\./, '');

		console.log(hostName);

		$.ajax({
			url: 'http://speed-dial.net/api/tab_style/',
			data: {site: hostName},
			method: 'GET',
			success: function(r) {
				console.log(hostName, r);
				// if(r.error) {
				// 	callback('not_find');
				// } else {
				// 	save_file(r.logo, fileName, function (localUrl) {
				// 		callback(false, r, localUrl);
				// 	});
				// }
			}
		});
	}

	getItem('links', function (obj) {
		var links = obj.links;
		$(links).each(function () {
			if(this.style=='minimalizm') {
				asynLoadingStyle(this.url);
			}
		});
	});
}