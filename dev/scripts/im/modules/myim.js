define(function(require,module,exports){
	var WKim = require("WKim");
	var $ = require("$");
	var i18n = require("i18n");
	var messageFacePic = require("facePic");
	var Renhe = require("Renhe");
	var databinder = require("databinder");

	var nowTime = new Date().getTime();
	var autocomplete = require("autocomplete");
	require("text-autocomplete");
	var Setting = {
		element:$('#messagePages'),
		chatOpenId:false,
		listConversation:{
			dom:'[node-type="records"]>div',
			template:require("./conversationList.handlebars"),
			data:{
				list:[]
			}
		},
		chat:{
			trigger:'[action-type="show-chat"]',
			nodes:{},
			data:{
				"list":[]
			},
			template:{
				dialog:require("./chat.handlebars"),
				msg:require("./msg.handlebars"),
				msgtext:require("./msgtext.handlebars")
			}
		},
		Msg:{
			data:{}
		},
		noReadPoint:0,
		createConversation:{
			data:{
				openIds:[]
			}
		},
		data:{
			modules:{
				listConversation:true,
				chat:true,
				atMembers:true
			},
			users:{}
		},
		helper:{
			trigger:'[action-type="show-helper"]',
			date:nowTime,
			pxDate:nowTime,
			template:{
				item:require("./helperitem.handlebars"),
				msg:require("./helpermsg.handlebars")
			}
		}
	};
	var imHint = {};
	var chartDialog = {};
	var conversation = WKim.conversation;
	var message = WKim.message;
	var upload = WKim.upload;
	var user = WKim.user;
	var convListener = WKim.conversationListener;
	var msgListener = WKim.messageListener;
	//var dialog = renh.dialog;
	var lastMsgBind = new databinder("lastmsg");
	if(!window.noReadNum){
		window.noReadNum = new databinder("noreadpoint");
		window.noReadNum.set("num",0);
	}

	var chart_dialog_cfg = {
		dialogClass: "no-close",
		dialogClass: "renhe-chat-dialog",
		resizable :'n,s,w,e,sw,nw,se,ne',
		minHeight:320,
		minWidth:400,
		maxWidth:800,
		maxHeight:800,
		//resize: function( event, ui ) {},
		position: { my: "right bottom", at: "right bottom"}
	}
	new messageFacePic('[action-type="addChatFacePic"]',{
    	dialogClass:"renhe-dialog-popover chatface"
    });
    function setNoReadNum(num){
    	window.noReadNum.set('num',num);
    	if(num>=100){
    		$('[node-type="notify-num"]').text(99+"+")
    	}
    	if(num==0){
    		$('[node-type="notify-num"]').hide();
    	}else{
    		$('[node-type="notify-num"]').show();
    	}
    }
    function imgLoad(callback){
    	var immsgimg = Setting.chat.nodes.msgCon.find('.im-msgimg[data-loaded!=true]');
    	var len = immsgimg.length;
    	if(!len) {
    		return callback && callback();
    	}
    	immsgimg.load(function(){
    		len--;
    		$(this).attr("data-loaded",true);
    		if(!len) {
    			callback && callback();
    		}
    	})
    }
    function scrollToBottom(){
    	imgLoad(function(){
    		Setting.chat.nodes.msgBox.scrollTop(99999);
    	})
    }
    function holdScroll(){
    	var pgLastmsg = Setting.chat.nodes.msgCon.find("li").eq(0);
    	imgLoad(function(){
    		Setting.chat.nodes.msgBox.scrollTop(Setting.chat.nodes.pgLastmsg.offset().top-pgLastmsg.offset().top);
    		Setting.chat.nodes.pgLastmsg = pgLastmsg;
    	})
    }
    function mediaAudioInit(){
		var hasMedia = false;
		var addEmbed = function(Tag,mid,d,msgId,time){
			Tag.addClass('do');
			hasMedia = true;
			Tag.closest('li').find('.im-audio-status').remove();
			conv.getMsgById(msgId).updateAudioMsgToRead()
			$("body").append('<embed autoplay="true" class="imEmbed" id="imEmbed'+mid+'" src="'+d+'" style="width:0;height:0;visibility: hidden;"/>')
			setTimeout(function(){
				Tag.removeClass('do');
				hasMedia = false;
			},time)
		}
		$(document).delegate(".im-audio[data-media-id]","click",function(e){
			var Tag = $(this);
			var mediaId = $(this).data("media-id");
			var mid = mediaId.replace("@",'').replace(".mp3","");
			var msgId = $(this).data("msg-id");
			if(hasMedia) {
				if(Tag.hasClass("do")){
					hasMedia = false;
					Tag.removeClass('do');
					return $("#imEmbed"+mid).remove();
				}
				return;
			}
			var time = $(this).data("media-time");
			if($('.imEmbed').length>0) {
				$('.imEmbed').remove();
			}
			if(mediaId.indexOf("@")==0){
				upload.trans(mediaId).then(function(d){
					addEmbed(Tag,mid,d,msgId,time)
				})
			}else{
				addEmbed(Tag,mid,mediaId,msgId,time)
			}
		})
	}
    function chatScroll(scr,msgcon){
    	var self = this;
    	//var siajax = false;
		scr.scroll(function(e){
			var nmm = msgcon.innerHeight()-scr.scrollTop()-scr.height()
			if(nmm<=10){
				Setting.chat.scrollToBt = true;
				scr.siblings('.msgtext').hide();
			}else{
				Setting.chat.scrollToBt = false;
			}
			// if(scr.scrollTop()==0 && !siajax){
			// 	Setting.chat.nodes.msgMoreBtn.triggerHandler("click");
			// 	siajax = true;
			// }
		})
    }
    function uploadImg(el,e){
			var self = this;
			var file = el.files[0];
			//var objUrl = window.URL.createObjectURL(file) ;
			conv.sendImg(file)
			/*upload.uploadImgByFile(file).then(function(res){
				//return console.log(res)
				conv.sendImg(res.uri, file.size)
			})*/
	}
	function updatelistConversationItem(res,data,callback){
		data.data = [res];
	    data.type = 1;
	    var lastmsgDom = Setting.element.find('[data-cid="'+res.cid+'"]');
    	var ulDom = $(Setting.listConversation.dom).find('ul');
    	if(lastmsgDom.length>0){
    		data.msgtype = 1;
    		lastMsgBind.set(res.cid,Setting.listConversation.template(data));
    		lastmsgDom.prependTo(ulDom);
    	}else{
    		data.msgtype = 2;
    		ulDom.prepend(Setting.listConversation.template(data));
    		lastmsgDom = Setting.element.find('[data-cid="'+res.cid+'"]');
    	}
    	callback && callback(lastmsgDom)
	}
	function getAtMember(){
		var matchArr = Setting.chat.nodes.enterValue.val().match(/\@\S+/g);
		var atMembers = {};
		//var repeatAt
		//console.log(matchArr)
		$.isArray(matchArr) && $.each(matchArr,function(_idex,str){
			$.each(Setting.chat.allMembers,function(index,item){
				if(item.nick == str.substring(1)) {
					atMembers[item.openId] = item.nick;
				}
			})
		})
		return atMembers;
	}
	function atMembersComplete(element,data){
		Setting.chat.allMembers = data;
		return element.textcomplete([
		    { // html
		        mentions:  data,
		        match: /\B@(\S*)$/,
		        search: function (term, callback) {
		        	Setting.chat.isAtShow = true;
		            callback($.map(this.mentions, function (mention) {
		                return mention.nick.indexOf(term) === 0 ? mention : null;
		            }));
		        },
		        maxCount:10,
		        placement:"top",
		        index: 1,
		        template:function(value){
		        	return '<span data-id="'+value.openId+'"><img class="media-object cmu-img pull-left" src="'+value.avatar+'">'+value.nick+'</span>'
		        },
		        replace: function (mention) {
		            return '@' + mention.nick + ' ';
		        }
		    }
		], { appendTo: "body",zIndex:1080});

	}
	function setHasMsgui(cid){
		if($('[node-type="fold"]').is('div:visible')) return;
		var tanli = $('[node-type="records"]').find('li[data-cid="'+cid+'"]');
		if(imHint[cid]) clearInterval(imHint[cid].tm);
		imHint[cid] = {};
		imHint[cid].index = 0;
		imHint[cid].tm = setInterval(function(){
			tanli.hasClass('ys')?tanli.removeClass('ys'):tanli.addClass('ys');
			imHint[cid].index++;
			if(imHint[cid].index == 7){
				clearInterval(imHint[cid].tm);
				tanli.removeClass('ys');
			}
		},500);
	}
	 function uploadInit(container){
    	container.delegate('[action-type="chatUploader"]',"change",function(e){
			uploadImg(this)
		})
    }
	 function paixuCid(str){
		var arr = str.split(':');
		if(arr.length!=2) return str;
		if(parseInt(arr[0],10)>parseInt(arr[1],10)){
			str = arr[1]+ ":" + arr[0];
		}
		return str;
	}
   	function chat_dialog(options,isHelper){
   		var data = {
   			i18n:i18n.chat,
   			id:Setting.chat.cid.replace(":","-"),
   			type:isHelper?"helper":"chat"
   		}
   		$('[id*=chartMian-]').dialog("close");
	    if(chartDialog[Setting.chat.cid]) {
	    	return chartDialog[Setting.chat.cid].dialog("open");
	    }
   		return $(Setting.chat.template["dialog"](data)).dialog({
   			dialogClass: "no-close",
			dialogClass: "renhe-chat-dialog",
			resizable :'n,s,w,e,sw,nw,se,ne',
			minHeight:320,
			minWidth:400,
			maxWidth:800,
			maxHeight:800,
			position: { my: "right bottom", at: "right bottom"},
			title:options.title,
			//height:472,
			create: function( event, ui ) {
				var ppid = Setting.chat.cid.replace(':','-');
				Setting.chat.nodes.dg = $('#chartMian-'+ppid);
				uploadInit(Setting.chat.nodes.dg);
				Setting.chat.nodes.dg.delegate('[action-type="sendmsg"]','click',function(){
					var msgInput = $(this).closest('[node-type="chat-option"]').find('textarea');
					Setting.chat.nodes.enterValue = msgInput;
					Setting.chat.data["enterValue"] = $.trim(msgInput.val());
					if(Setting.chat.data["enterValue"] =="") {
						return Renhe.alert(i18n.chat.error.Empty,function(){
							msgInput.val("");
						});
					}
					options.sendMsg(Setting.chat.data["enterValue"])
					//self.sendMsg(msgInput.val(),self.listProfile[self.myIM.im.openId].nick)
				})
				Setting.chat.nodes.dg.delegate('#messageChartContentInput'+ppid,'keydown',function(evt){

					if(evt.keyCode == 13){
						if(evt.ctrlKey){
							$(this).val($(this).val()+'\n')
						}else{
							if(Setting.chat.isAtShow) {
								Setting.chat.isAtShow = false;
								return;
							}
							Setting.chat.nodes.dg.find('[action-type="sendmsg"]').trigger('click');
							$(this).trigger('focus');
							$(this).val('');
						}
					}
	
				})
				if(!isHelper){
					Setting.chat.nodes.dg.delegate('#messageChartContentInput'+ppid,'keyup',function(evt){
						conv.sendTyping(0);
					})
					Setting.chat.nodes.dg.delegate('#messageChartContentInput'+ppid,'blur',function(evt){
						conv.sendTyping(1);
					})
				}
				Setting.chat.nodes.msgBox = Setting.chat.nodes.dg.find('.chatmsgs-content');
				Setting.chat.nodes.msgCon = Setting.chat.nodes.dg.find('.chart-content')
				chatScroll(Setting.chat.nodes.msgBox,Setting.chat.nodes.msgCon)
				options.createCallback && options.createCallback();
			},
			open:function(event, ui){
				Setting.chatOpenId = Setting.chat.cid;
				Setting.chat.nodes.dg = $('#chartMian-'+Setting.chat.cid.replace(':','-'));
				Setting.chat.nodes.msgBox = Setting.chat.nodes.dg.find('.chatmsgs-content');
				Setting.chat.nodes.msgCon = Setting.chat.nodes.dg.find('.chart-content');
				Setting.chat.nodes.enterValue = Setting.chat.nodes.dg.find('textarea');
				Setting.chat.nodes.msgText = Setting.chat.nodes.dg.find('.msgtext');
				Setting.chat.nodes.msgMoreBtn = Setting.chat.nodes.msgBox.find('[node-type="more-msgs"]');
				Setting.chat.nodes.chatOption = Setting.chat.nodes.dg.find('[node-type="chat-option"]');
				options.callback && options.callback();
			},
			close:function(){
				Setting.chatOpenId = false;
				// conv.hide().then(function(res){
				// 	console.log(res)
				// });
			},
			resize: function( event, ui ) {
				Setting.chat.nodes.msgBox.height(ui.size.height-151);
			}
   		})
   	}
   	mediaAudioInit();
	function myim() {
	    var self = this;
	    this.openId = WKim.auth.getOpenId();
	    if (Setting.data.modules.listConversation) {
	        this.listConversation()
	    }
	    if (Setting.data.modules.createConversation) {
	        this.createConversation([])
	    }
	    if (Setting.data.modules.userProfile) {
	        this.userProfile()
	    }
	    if (Setting.data.modules.detail) {
	        this.detail()
	    }
	    WKim.authListener.on("kickout",function(res){
	    	window.kickout = true;
	        console.log(res)
	    });
	
	    this.users = {};
	    this.getProfiles([this.openId],function(){
	    	WKim.config.nickName = self.users[self.openId].nick;
	    })
	}
	myim.prototype.genProfile = function(dom) {
	    var self = this;
	    $(dom).find("[data-nick]").each(function() {
	        var id = $(this).attr("data-nick");
	        var el = $(this);
	        self.getProfiles([id], function(res) {
	            if (res && res[0] && res[0].nick) {
	                el.text(res[0].nick);
	                el.removeAttr("data-nick")
	            }
	        })
	    });
	    $(dom).find("[data-avatar]").each(function() {
	        var id = $(this).attr("data-avatar");
	        var el = $(this);
	        self.getProfiles([id], function(res) {
	            if (res && res[0] && res[0].avatar) {
	            	el.attr("src",res[0].avatar)
	                //el.html("<img src='" + res[0].avatar + "'  />");
	                el.removeAttr("data-avatar")
	            }
	        })
	    });
	}
	myim.prototype.getProfiles = function(openIds, callback) {
	    var self = this;
	    var result = [];
	    WKim.user.getProfiles(openIds).then(function(users) {
	        users.forEach(function(item) {
	           self.users[item.openId] = item;
	        });
	        callback(users)
	    })
	}
	myim.prototype.createConversation = function(param,callback) {
	    var self = this;
	    var createConversation = Setting.createConversation;
	    var openIds = null;
        if (param) {
            openIds = [param];
            createConversation.data.openIds.push(param);
        } else {
            openIds = createConversation.data.openIds.split(",")
        }
        //openIds = openIds.map(function(item) {
            //item = item.replace(/\s/g, "");
            //return parseInt(item)
        //});
        conversation.create({
            openIds: openIds
        }).then(function(conv) {
        	window.conv = conv;
        	callback && callback(conv);
        })
	};
	myim.prototype.userProfile = function() {}
	myim.prototype.listConversation = function() {
	    var self = this;
	    var listConversation = Setting.listConversation;
	    var chat = Setting.chat;
	    var hprander = false;
	    var data = {
    		openId:self.openId,
    		i18n:i18n.chat.msgType
    	}
	    $(document).delegate(chat.trigger,"click",function(){
	    	var param = $(this).data("cid");
	    	var create = $(this).data("create");
	    	if(create){
	    		return self.createConversation(param,function(conv){
	    			conv.clearUnreadPoint();
	    			self.getProfiles([conv.peerId()],function(){
	    				if (Setting.data.modules.chat) {
				            self.chat(conv)
				        }
	    			});
	    		});
	    	}else{
	    		var conv = conversation.getConvByCache(param);
		    	window.conv = conv;
		    	conv.clearUnreadPoint();
		    	if (Setting.data.modules.chat) {
		            self.chat(conv)
		        }
	    	}
	        /*if (Setting.data.modules.detail) {
	            self.detail(conv)
	        }*/
	    })
	    $(document).delegate(Setting.helper.trigger,"click",function(){
	    	Setting.chat.cid = $(this).data("cid");
	    	self.helperChat();
	    	$(this).find(".msg-status").remove();
	        /*if (Setting.data.modules.detail) {
	            self.detail(conv)
	        }*/
	    })
	    var dom = listConversation.dom;
	    Setting.notifyCount = window.noReadNum.get("num");
	    conversation.getTotalUnreadCount().then(function(num){
	    	Setting.noReadPoint = num;
	    	setNoReadNum(num+Setting.notifyCount)
	    });
	    conversation.list(0, 1000).then(function(res) {
	    	
	    	data.data = res;
	    	// $.map(res,function(item){
	    	// 	listConversation.data.list[item.cid] = item;
	    	// })
	    	$(dom).html(listConversation.template(data));
	    	//helper rander
	    	self.helperItems({maxId:null,size:1},function(r){
	    		if((!$.isArray(res) || res.length==0) && !r) {
		    		$(dom).html('<div class="im-nodata"></div>');
		    		return;
		    	}
		    	if(!r) return;
	    		$.map(res,function(item){
	    			if(!$.isArray(item.lastMessages) || item.lastMessages.length==0 ) return;
	    			if(r.messages[0].createdDate>item.lastMessages[0].baseMessage.createdAt && Setting.helper.date>r.messages[0].createdDate){
	    				Setting.helper.pxDate = item.lastMessages[0].baseMessage.createdAt;
	    			}
		    		listConversation.data.list[item.cid] = item;
		    		Setting.helper.date = item.lastMessages[0].baseMessage.createdAt;
		    	})
		    	r["i18n"] = i18n.chat;
		    	var pxDDom = $(dom).find('[data-t="'+Setting.helper.pxDate+'"]');
	    		if(pxDDom.length>0){
		    		pxDDom.before(Setting.helper.template.item(r));
		    	}else{
		    		$(dom).html('<ul>'+Setting.helper.template.item(r)+'</ul>');
		    	}
	    	})
	        self.genProfile(dom);
	    });
	    convListener.on("convAdd", function(res) {
	        console.log("convAdd")
	    });
	    convListener.on("convToFirst", function(cid) {
	    	if(cid == chat.cid){
	    		return;
	    	}
	    	setHasMsgui(cid);
	    });
	    convListener.on("convSetTop", function(res) {
	       console.log("convSetTop")
	    });
	    convListener.on("convUnreadPointChange", function(res, value) {
	        var pot =  Setting.element.find('[data-cid="'+res.cid+'"]').find('.msg-status');
	        if(value==0){
	        	pot.remove()
	        }else{
	        	pot.text(value);
	        }
	        conversation.getTotalUnreadCount().then(function(num){
		    	Setting.noReadPoint = num;
	    		setNoReadNum(num+Setting.notifyCount);
		    });
	    });
	    convListener.on("convLastMessageChange", function(res, msg) {
	    	updatelistConversationItem(res,data,function(lastmsgDom){
	    		self.genProfile(lastmsgDom);
	    	})
	    });
	    convListener.on("convRemove", function(res) {
	        console.log("convRemove")
	    })
	}
	myim.prototype.chat = function(conv) {
	    var self = this;
	    var chat = Setting.chat;
	    var title = conv.getTitle();
	    chat.nextMsg = null;
	    chat.prevMsg = null;
	    var pageSize = 20;
	    var data = {
			i18n:i18n.chat,
			openId:self.openId,
			conv:conv
		}
	    if (conv.isSingleChat) {
	        title = self.users[conv.peerId()] && self.users[conv.peerId()].nick
	    }
	    chat.cid = conv.cid;
	    msgListener.removeEvent();
	    msgListener.on("msgReceive", function(res) {
	        if (res.getConvId() !== chat.cid) {
	            return
	        }
	        if(chartDialog[chat.cid].dialog('isOpen') && !res.isMe()){
	        	//res.updateToRead();
	        	conv.clearUnreadPoint()
	        }
	        if(Setting.Msg.data[res.getId()]){
	        	return;
	        }
	        Setting.Msg.data[res.getId()] = true;
	        var lastMsg = chat.data.list && chat.data.list[chat.data.list.length - 1];
	        
	        if (lastMsg && (res.baseMessage.createdAt - lastMsg.baseMessage.createdAt < 15 * 1000 * 60)) {
	            res.hideTime = true
	        }
	        data.data = [res];
	       	chat.nodes.msgCon.append(chat.template["msg"](data))
	       	if(!chat.scrollToBt){
	        	chat.nodes.msgText.html(chat.template["msgtext"]({data:res,i18n:i18n.chat})).show().find("p").click(function(){
					chat.nodes.msgText.hide();
					chat.nodes.msgBox.scrollTop(99999);
				});
				self.genProfile(chat.nodes.msgText);
	        }else{
	        	scrollToBottom();
	        }
	        self.genProfile(chat.nodes.msgBox);
	    });
	    msgListener.on("sendSuccess", function(res) {
	    	 if(Setting.Msg.data[res.getId()]){
	        	return;
	        }
	        Setting.Msg.data[res.getId()] = true;
	        var lastMsg = chat.data.list && chat.data.list[chat.data.list.length - 1];
	        
	        if (lastMsg && (res.baseMessage.createdAt - lastMsg.baseMessage.createdAt < 15 * 1000 * 60)) {
	            res.hideTime = true
	        }
	       	chat.data["list"].push(res);
	       	data.data = [res];
	       	chat.nodes.msgCon.append(chat.template["msg"](data))
	        scrollToBottom();
	        self.genProfile(chat.nodes.msgBox);
	        //update myConversation send
	        var _dd = conv;
	        _dd["lastMessages"] = [res];
	        updatelistConversationItem(_dd,{
	        	openId:self.openId,
    			i18n:i18n.chat.msgType
	        },function(el){
	        	self.genProfile(el);
	        })
	        Setting.chat.nodes.enterValue.val("");
	    });
	    msgListener.on("msgStatusChange", function(res) {
	        $.map(chat.data["list"],function(item) {
	            if (item.getId() === res.getId()) {
	                res.hideTime = item.hideTime;
	                return res
	            }
	        });
	    });
	    msgListener.on("sendFail", function(res) {
	        console.log(res)
	    });
	    chat.next = function(msg, num, callback) {
	        conv.listNextMessages(msg, num || 5).then(function(res) {

	            if (res.length == 0) {
	                return callback && callback(res)
	            }
	           	Setting.chat.nextMsg = res[0];
	            //Setting.chat.nextMsg = conv.getMsgById(conv.msgIds[0]);
	            Setting.chat.prevMsg = res[res.length - 1];
	            var baseTime = new Date().getTime();
	            $.map(res,function(item) {
		            if (item.baseMessage.createdAt-baseTime < 15 * 1000 * 60) {
		                item.hideTime = true;
		            }
		            baseTime = item.baseMessage.createdAt;
		            return item;
		        });
	            callback && callback(res)
	        })
	    }
	    chat.prev = function(msg, num, callback) {
	        conv.listPreviousMessages(msg, num || 5).then(function(res) {
	            Setting.chat.nextMsg = res[0];
	            Setting.chat.prevMsg = res[res.length - 1];
	            callback && callback(res)
	        })
	    }
	    chartDialog[chat.cid] = chat_dialog({
	    	title:title,
	    	sendMsg:function(value){
	    		var msgOpt = {
				    content:{
			            contentType:1,
			            textContent:{
			                text:String(value)
			            }
			        }
			    }
			    if(Setting.data.modules.atMembers){
					Setting.chat.atMembers = getAtMember();
				    if(!$.isEmptyObject(Setting.chat.atMembers)){
				    	msgOpt.content.atOpenIds = Setting.chat.atMembers;
				    }
				}
	    		conv.sendMsg(msgOpt).then(function(res) {
	    			//console.log(res)
	    		});
        		chat.nodes.enterValue.val("");
	    	},
	    	callback:function(){
	    		chat.next(null, pageSize, function(res) {
	    			data.data = res;
	    			chat.data["list"]=res;
	    			chat.nodes.msgCon.html(chat.template["msg"](data))
			        conv.read(conv.msgIds);
			        self.genProfile(chat.nodes.msgBox)
			        scrollToBottom();
			        if (res.length >= pageSize) {
			            chat.nodes.msgBox.find('[node-type="more-msgs"]').show()
			        } else {
			            chat.nodes.msgBox.find('[node-type="more-msgs"]').hide()
			        }
			    });
	    	},
	    	createCallback:function(){
	    		if(!conv.isSingleChat && Setting.data.modules.atMembers) {
					conv.getMembers().then(function(res) {
						//console.log(res)
						var memberOpenIds = [];
						Setting.allMembers = {};
				        res = res.map(function(item) {
				        	memberOpenIds.push(item.openIdEx.openId)
				            if (item.openIdEx.openId === self.openId || conv.baseConversation.ownerId !== self.openId) {
				                item.isClose = false
				            } else {
				                item.isClose = true
				            }
				            return item
				        });
				        //console.log(memberOpenIds)
				        self.getProfiles(memberOpenIds,function(resuse){
				        	//console.log(resuse)
				        	atMembersComplete(chat.nodes.enterValue,resuse)
				        	// Setting.chat.nodes.enterValue.on("textcomplete:show",function(){
				        	// 	console.log("show")
				        	// }).on("textcomplete:hide",function(){
				        	// 	console.log("hide")
				        	// })
				        })
				    });
	    		}
	    		chat.nodes.msgBox.delegate('[node-type="more-msgs"]',"click",function(e){
			    	var moreMIcon = $(this).find('i');
			    	moreMIcon.attr("class","icon-spinner icon-spin");
			    	Setting.chat.nodes.pgLastmsg = Setting.chat.nodes.msgCon.find("li").eq(0);
			    	chat.next(Setting.chat.nextMsg, pageSize, function(res) {
			            if (res.length < pageSize) {
			                chat.nodes.msgBox.find('[node-type="more-msgs"]').hide()
			            }else{
			            	chat.nodes.msgBox.find('[node-type="more-msgs"]').show()
			            }
			            data.data = res;
		    			chat.data["list"].concat(res);
			            chat.nodes.msgCon.prepend(chat.template["msg"](data));
			            holdScroll();
			            self.genProfile(chat.nodes.msgBox);
			            moreMIcon.attr("class","icon-time");

			        });
			    })
	    	}
	    });
	}
	//myim.prototype.at
	myim.prototype.helperItems = function(data,callback){
		$.ajax({
			url:'/systemMessage/ajax/list.xhtml',
			dataType:"json",
			data:data,
			success:function(res){
				var baseTime = new Date().getTime();
	            $.map(res.messages,function(item) {
		            if (item.createdDate-baseTime < 15 * 1000 * 60) {
		                item.hideTime = true;
		            }
		            baseTime = item.createdDate;
		            return item;
		        });
				callback && callback(res)
			}
		})
	}
	myim.prototype.helperChat = function(){
		var helper = Setting.helper;
		var chat = Setting.chat;
		var self = this;
		var pageSize = 20;
		helper.maxId = null;
		chartDialog[chat.cid] = chat_dialog({
	    	title:i18n.chat.helper[0],
	    	sendMsg:function(value){
	    			
        		$.ajax({
        			url:'/systemMessage/ajax/add.xhtml',
        			data:{
        				content:value
        			},
        			type:"post",
        			dataType:"json",
        			success:function(db){
        				db["i18n"] = i18n.chat;
	    				db["openId"] = self.openId;
	    				db["msgtype"] = 1;
        				var lastmsgDom = Setting.element.find('[data-cid="'+chat.cid+'"]');
				    	var ulDom = $(Setting.listConversation.dom).find('ul');
				    	lastMsgBind.set(chat.cid,Setting.helper.template.item(db));
				    	lastmsgDom.prependTo(ulDom);

				    	chat.nodes.msgCon.append(helper.template["msg"](db));
				    	scrollToBottom();
				    	chat.nodes.enterValue.val("");
        			}
        		})
        		chat.nodes.enterValue.val("");
	    	},
	    	callback:function(){
	    		self.helperItems({maxId:null,size:pageSize,read:true},function(res){
	    			res["i18n"] = i18n.chat;
	    			res["openId"] = self.openId;
	    			chat.nodes.msgCon.html(helper.template["msg"](res))
			        scrollToBottom();
			        if (res.messages.length >= pageSize) {
			            chat.nodes.msgBox.find('[node-type="more-msgs"]').show()
			        } else {
			            chat.nodes.msgBox.find('[node-type="more-msgs"]').hide()
			        }
			        self.genProfile(chat.nodes.msgBox);
			        helper.maxId = res.minId;
	    		})
	    	},
	    	createCallback:function(){
	    		chat.nodes.msgBox.delegate('[node-type="more-msgs"]',"click",function(e){
			    	var moreMIcon = $(this).find('i');
			    	moreMIcon.attr("class","icon-spinner icon-spin");
			    	self.helperItems({maxId:helper.maxId,size:pageSize},function(res){
			    		if (res.messages.length < pageSize) {
			                chat.nodes.msgBox.find('[node-type="more-msgs"]').hide()
			            }else{
			            	chat.nodes.msgBox.find('[node-type="more-msgs"]').show()
			            }
			            res["i18n"] = i18n.chat;
		    			res["openId"] = self.openId;
			            chat.nodes.msgCon.prepend(helper.template["msg"](res));
			            self.genProfile(chat.nodes.msgBox);
			            moreMIcon.attr("class","icon-time");
			            helper.maxId = res.minId
			    	})
			    })
	    	}
	    },true);
	}
	return myim;
})