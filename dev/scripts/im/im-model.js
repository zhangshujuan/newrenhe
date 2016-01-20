define(function(require, exports, module) {
	var WKim = require("WKim");
	var recordTemp = require("./records.handlebars");
	var chatTemp = require("./chat.handlebars");
	var chatmsg = require("./msg.handlebars");
	var chatmsgText = require("./msgtext.handlebars");
	var recordItemTmp = require("./record-item.handlebars");
	var i18n = require("i18n");
	var messageFacePic = require("facePic");
	var Renhe = require("Renhe");
	var databinder = require("databinder");
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
	var peerId = function(conversationId,myopenId){
		var self = this;
		if(!conversationId){
			throw "need conversationId";
		}
		if(conversationId.indexOf(":")==-1){
			return conversationId;
		}
		var id = "";
		conversationId.split(":").forEach(function(item){
			if(item != myopenId){
				id = item;
			}
		});
		return id;
	}
	function myim(im,authInfo){
		var self = this;
		var conversation = im.conversation;
		var message = im.message;
		var user = im.user;
		this.im = im;
		this.timeLine = null;
		this.userInfo = function(){
			userProfile.init();
		}
		this.listConversation = function(options){
			conversation.list([0,1000],function(res){
				res.body = res.body.slice(0,100);
				options.listConversation && options.listConversation(res)
			});
	
			conversation.on("conversationCreated",function(res,i){
				options.conversationCreated && options.conversationCreated(res,i)
			});
	
			conversation.on("conversationChanged",function(type,res,i){
				options.conversationChanged && options.conversationChanged(res,i)		
			});
			
		}
		
		this.chat = function(conversationId,options,type){
			var conv_get = function(conv){
				options.currentConv(conv) && options.currentConv(conv)
				
	            conv.on("msgCreated",function(res){
	            	options.msgCreated && options.msgCreated(res)
	            });
	            conv.on("msgChanged",function(type,res){
	            	options.msgChanged && options.msgChanged(res)
	               
	            });
	        	var title = conv.getTitle();
				//self.detail(conv);
				conv.listMessages(self.timeLine,20,function(res){
					options.listMessages && options.listMessages(res);
				});
			}
			if(type){
				conversation.create({openIds:[peerId(conversationId,self.im.openId)]},function(res){
					conversation.get(conversationId,function(res){	
						var conv = this;
						conv_get(conv)
					});
				})
			}else{
				conversation.get(conversationId,function(res){	
					var conv = this;
					conv_get(conv)
				});
			}
		}
		this.detail = function(conv){
			
			conv.listMembers(0,20,function(res){
				if(res.success){
					detail.data.update("members",res.body);
				}
			});
		}
//		this.init = function(){
//			//this.userInfo();
//			this.listConversation();
//			//this.chat("3039:3086");
//		}
//		this.init();
		this.im.on("kickout",function(res){
			console.log(res)
			/*Renhe.alert(i18n.chat.error.login,function(){
				login(imCallback)
			});*/
		})
	}
	function login(callback){
		$.ajax({
		    url: "/im/ajax/getImSignModel.xhtml",
		    dataType: "json",
		    success: function(res) {
		        callback(res);
		    }
		});
	}
	var reset = false;
	var imCallback = function(res){
		var authInfo = res.imSignModel;
		new WKim({
			appKey:authInfo.appKey,
			env:"online"
		},function(){
			var im = this;
			var auth = im.auth;
			auth.login(authInfo,function(res){
				if(res.success){
					if(!reset){
						window.myIM = new myim(im,authInfo);
						window.myIMUi = new IMui('#messagePages',window.myIM);	
						reset = true;
					}else{
						window.myIM.im = im;
						window.myIMUi.myIM.im = im;
					}
				}
			});
		});
	}
	login(imCallback)
	window.IMui = function(element,myIM){
		this.element = $(element);
		this.myIM = myIM;
		this.listProfile = {};
		this.listGroup = {};
		this.chatConversationId = null;
		this.chatType = "Single";
		this.ConvEle = this.element.find('[node-type="records"] [node-type="ctr-pgbox"]');
		this.openCid = null;
		this.noReadNum = 0;
		this.noRead = {};
		this.imHint = {};
		this.lastmsgTime = null;
		this.Cids = [];
		this.peerId = peerId;
		this.hasMsg = false;
		this.init();
		//this.myIM = window.myIM
	}
	window.IMui.prototype = {
		dialog:{},
		init:function(){
			var self = this;
			this.getProfile(this.myIM.im.openId,function(res){
				self.listProfile[self.myIM.im.openId] = res.body[0];
			})
			this.myIM.listConversation({
				listConversation:function(res){
					self.listConversations(res,recordTemp);
				},
				conversationCreated:function(res){
					self.updateConversations(res);
					self.hasMsg = true;
				},
				conversationChanged:function(res){
					self.updateConversations(res);
					self.hasMsg = true;
				}
			});
			self.bindEv();
			self.mediaAudioInit();
		},
		getProfile:function(openId,callback){
			var self = this;
			if(self.listProfile[openId]){
				callback && typeof(callback) == "function" && callback(self.listProfile[openId])
			}else{
				this.myIM.im.user.getProfile(openId,function(res){
					self.listProfile[openId] = res.body[0];
					callback && typeof(callback) == "function" && callback(res)
				})
			}
		},
		getOtherProfiles:function(element,callback){
			var self = this;
			element.find('[action-type="show-chat"]').each(function(index,item){
				var uid = $(this).attr("data-cid");
				self.Cids.push(uid);
				//var type = (uid.indexOf(":")==-1)?"Single":"Group";
				var openId;
				var type;
				if(uid.indexOf(":")!=-1){
					openId = self.peerId(uid,self.myIM.im.openId);
					type = 1
				}else{
					openId = $(this).find("[data-mid]").data("mid");
					type = 2
				}
				if(openId){
					self.getProfile(openId,function(res){
						callback && typeof(callback) == "function" && callback(res,item,type)
					})
				}
			})
		},
		uploadInit:function(container){
			var self = this;
			container.delegate('[action-type="chatUploader"]',"change",function(e){
				self.uploadImg(this)
			})
		},
		get:function(str,eqs){
			eqs = eqs?eqs:'=';
			return this.element.find('[node-type'+eqs+'"'+str+'"]');
		},
		paixuCId:function(str){
			var arr = str.split(':');
			if(arr.length!=2) return str;
			if(parseInt(arr[0],10)>parseInt(arr[1],10)){
				str = arr[1]+ ":" + arr[0];
			}
			return str;
		},
		bindEv:function(element){
			var self = this;
			$(document).delegate('[action-type="show-chat"]',"click",function(){
				self.myIM.timeLine = null;
				var target = $(this);
				var cid = target.attr('data-cid');
				var cidType = target.attr('data-create');
				self.trigger = target;
				if(self.noRead[cid]){
					self.noReadNum--;
					self.noRead[cid] = false;
					self.setNum();
				}
				if(cid.indexOf(":")==-1){
					self.chatConversationId = cid;
					self.chatType = "Group";
					self.mychat(cidType);
				}else{
					self.chatType = "Single";
					self.chatConversationId = self.paixuCId(cid);
					self.chatOpenId = self.peerId(self.chatConversationId,self.myIM.im.openId);
					if(!self.listProfile[self.chatOpenId]){
						self.getProfile(self.chatOpenId,function(res){
							self.mychat(cidType);
						})
					}else{
						self.mychat(cidType);
					}
				}
			});
			this.updataMoreMsg();
		},
		updataMoreMsg:function(){
			var self = this;
			$(document).delegate('[node-type="more-msgs"]','click',function(){
				var target = $(this);
				target.before('<i class="icon-spinner icon-spin"></i>');		
				self.Conv.listMessages(self.myIM.timeLine,20,function(res){
					if(self.myIM.timeLine == res.body[0].baseMessage.createdAt){
						return target.parent('li').remove();
					}
					self.groupProList(res.body,function(){
						self.msgHtmlUpdate(res.body,function(html){
							target.parent('li').replaceWith(html);
						},function(){
							self.chatMain.find(".chatmsgs-content").scrollTop(0)
						})
					});
				});
			})
		},
		mychat:function(type){
			var self = this;
			this.myIM.chat(self.chatConversationId,{
				listMessages:function(res){
					self.chatInit(res);
				},
				currentConv:function(conv){
					self.Conv = conv;
				},
				msgChanged:function(res){
					//self.updateMsg([res])
				},
				msgCreated:function(res){
					self.updateMsg([res])
				}
			},type)
		},
		getNoReadNum:function(res,type){
			var _type = type || "update"
			var self = this;
			$.each(res,function(index,item){
				var cid = item.baseConversation.conversationId;
				if(self.dialog[cid] && self.dialog[cid].dialog( "isOpen" )){
					return;
				}
				if(_type =='update'){
					self.noReadNum++;
					self.noRead[cid] = true;
				}else{
					if(item.lastMessages[0] && item.lastMessages[0].receiverMessageStatus.readStatus != 2){
						self.noReadNum++;
						self.noRead[cid] = true;
					}
				}
			});
			this.setNum();
		},
		setNum:function(){
			var self = this;
			var nodifyNum = self.get("notify-num");
			var num = parseInt(nodifyNum.data("num"),10);
			self.noReadNum = num+self.noReadNum;
			if(self.noReadNum<=0){
				self.get("notify-num").hide();
			}else{
				nodifyNum.text(self.noReadNum).show();
			}
		},
		listConversations:function(res,teplate){
			var self = this;
			this.getNoReadNum(res.body,"init");
			if(res.body.length==0){
				return this.ConvEle.html('<div class="im-nodata"></div>');
			}
			this.ConvEle.html(recordTemp({data:res.body,i18n:i18n.chat.msgType}));
			this.getOtherProfiles(this.element,function(res,item,type){
				var d = res.body ? res.body[0]:res;
				if(type==1){
					$(item).find('[model="img|nick"]').attr('src',d.avatar);
					$(item).find('[model="nick"]').text(d.nick);
				}
				if(type==2){
					$(item).find("[data-mid]").text(d.nick);
				}
			});
		},
		updateConversations:function(res){
			var self = this;
			var isOpen = false;
			var cid = res.baseConversation.conversationId;
			var getFilesOpenId;
			var noRead = true;
			if(this.dialog[cid] && this.dialog[cid].dialog('isOpen')){
				isOpen = true;
			}
			if(!this.noRead[cid]){
				this.getNoReadNum([res],"update");
			}
			if(isOpen || self.myIM.im.openId==res.lastMessages[0].baseMessage.openIdEx.openId){
				noRead = false;
			}
			var data = {
				i18n:i18n.chat.msgType,
				data:res,
				noRead:noRead,
				listProfile:self.listProfile
			}
			if($.inArray(cid,this.Cids)==-1){
				if(cid.indexOf(":")==-1){
					getFilesOpenId = res.lastMessages[0].baseMessage.openIdEx.openId;
				}else{
					data.openId = self.peerId(cid,self.myIM.im.openId);
					getFilesOpenId = data.openId;
				}
				this.getProfile(getFilesOpenId,function(res){
					data.type = "new";
					data.listProfile = self.listProfile;
					self.ConvEle.find('ul').prepend(recordItemTmp(data));
				})
			}else{
				var msgLaster = new databinder("lastmsg");
				if(cid.indexOf(":")==-1){
					getFilesOpenId = res.lastMessages[0].baseMessage.openIdEx.openId;
					
				}else{
					data.openId = self.peerId(cid,self.myIM.im.openId);
					getFilesOpenId = data.openId;
				}
				this.getProfile(getFilesOpenId,function(res){
					data.listProfile = self.listProfile;
					msgLaster.set(cid,recordItemTmp(data));
					self.ConvEle.find('[data-bind-lastmsg="'+cid+'"]').prependTo(self.ConvEle.find('ul'))
				})
			}
			this.Cids.push(cid);
			if(noRead){
				this.setHasMsgui(cid);
			}
		},
		setStatus:function(Status){
			if(Status == 2){
				this.trigger.find('.msg-status').hide()
			}else{
				this.trigger.find('.msg-status').show()
			}
		},
		setHasMsgui:function(cid){
			var self = this;
			if(self.get('nofold').is('div:visible')) return;
			var tanli = this.get("records").find('li[data-cid="'+cid+'"]');
			if(this.imHint[cid]) clearInterval(this.imHint[cid].tm);
			this.imHint[cid] = {};
			this.imHint[cid].index = 0;
			this.imHint[cid].tm = setInterval(function(){
				tanli.hasClass('ys')?tanli.removeClass('ys'):tanli.addClass('ys');
				self.imHint[cid].index++;
				if(self.imHint[cid].index == 7){
					clearInterval(self.imHint[cid].tm);
					tanli.removeClass('ys');
				}
			},500);
		},
		clearHasMsgui:function(cid){
			var tanli = this.get("records").find('li[data-cid="'+cid+'"]');
			this.imHint[cid] && clearInterval(this.imHint[cid].tm);
			tanli.removeClass('ys');
		},
		readMsg:function(res){
			var ids = [];
            res.forEach(function(item){
            	if(item.baseMessage.content.contentType != 3 && item.baseMessage.openIdEx.openId!=self.myIM.im.openId){
            		ids.push(item.baseMessage.messageId);
            	}
            });
            this.myIM.im.message.read(ids);   
		},
		uploadImg:function(el,e){
			var self = this;
			var file = el.files[0];
			var objUrl = window.URL.createObjectURL(file) ;
			
			if(!file.type.match(/image/)){
				//dialog.info("«Î—°‘ÒÕº∆¨∏Ò Ω jpg°¢gif°¢png ");
				return;
			}	
			if (objUrl) {
				var reader = new FileReader();   
		        reader.readAsDataURL(file);   
		        reader.onload = function(e){   
		        	var base64 = this.result.replace(/[^,]*,/,"");
		        	self.myIM.im.upload.uploadImg(base64,function(res){
		        		var imgTpl = self.myIM.im.message.buildImageMessage({mediaId:res.body.uri, photoSize:file.size.toString()});    
		        		imgTpl.nickName = self.listProfile[self.myIM.im.openId].nick;
		        		self.Conv.sendMsg(imgTpl,function(r){
		        			var mediaId = r.body.baseMessage.content.photoContent.mediaId;
		        			r.body.baseMessage.content.photoContent.mediaId = self.myIM.im.mediaId(mediaId);
		        			// self.updateMsg([r.body])
		        		});
		        	});
		        }
		    }
		},
		updateMsgHtml:function(res){
			var self = this;
			var data = {
				i18n:i18n.chat,
				data:res,
				myOpenId:self.myIM.im.openId,
				profile:self.listProfile,
				lastmsgTime:self.lastmsgTime
			}
			self.msgContent.append(chatmsg(data));
			var srcal = self.chatMain.find(".chatmsgs-content");
			if(!self.msgConBt && res[0].baseMessage.openIdEx.openId!=self.myIM.im.openId){
				srcal.siblings('.msgtext').html(chatmsgText(data)).show().find("p").click(function(){
					srcal.siblings('.msgtext').hide();
					srcal.scrollTop(self.msgContent.innerHeight()-srcal.height());
				});
			}else{
				srcal.scrollTop(self.msgContent.innerHeight()-srcal.height());
			}
			if(self.dialog[self.chatConversationId] && this.dialog[self.chatConversationId].dialog('isOpen')){
				self.setStatus(2);
				self.readMsg(res);
			}else{
				self.setStatus(1)
			}
		},
		chatScroll:function(scr,msgcon){
			var self = this;
			scr.scroll(function(e){
				var nmm = self.msgContent.innerHeight()-scr.scrollTop()-scr.height()
				if(nmm<=10){
					self.msgConBt = true;
					scr.siblings('.msgtext').hide();
				}else{
					self.msgConBt = false;
				}
			})
		},
		updateMsg:function(res){
			var self = this;
			if(res[0].baseMessage.conversationId!=self.chatConversationId){
				return;
			}
			if(self.chatType=="Group"){
				self.groupProList(res,function(){
					self.updateMsgHtml(res)
				});
			}else{
				self.updateMsgHtml(res)
			}
			self.lastmsgTime = res[res.length-1].baseMessage.createdAt;
		},
		sendMsg:function(msg,nick){
			var self = this;
			var messageTpl = this.myIM.im.message.buildTextMessage(msg);
			messageTpl.nickName = nick;
			this.Conv.sendMsg(messageTpl,function(res){
				if(res.code == 200){	
					//self.updateMsg([res.body]);
					self.inputChat.val('');
				}
			});
		},
		groupProList:function(res,callback){
			var self = this;
			var len = res.length;
			var ren = false;
			$.each(res,function(index,item){
				var openId =  item.baseMessage.openIdEx.openId;
				if(!self.listProfile[openId]){
					ren = false
					self.getProfile(openId,function(res){
						ren = true;
					})
				}else{
					if(index == len-1) ren = true
				}
			})
			var tm = setInterval(function(){
				if(ren){
					callback && typeof(callback) == "function" && callback();
					clearInterval(tm)
				}
			},300)
		},
		msgHtmlUpdate:function(res,acFn,callback){
			var self = this;
			var data2 = {
				i18n:i18n.chat,
				data:res,
				myOpenId:self.myIM.im.openId,
				profile:self.listProfile,
				type:"more"
			}
			acFn && acFn(chatmsg(data2));
			self.myIM.timeLine = res[0].baseMessage.createdAt;
			self.readMsg(res);
			callback && callback();
		},
		mediaAudioInit:function(){
			var self = this;
			var hasMedia = false;
			$(document).delegate(".im-audio[data-media-id]","click",function(e){
				var Tag = $(this);
				var mediaId = $(this).data("media-id");
				var mid = mediaId.replace("@",'');
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
				self.myIM.im.upload.trans(mediaId,function(d){
					Tag.addClass('do');
					hasMedia = true;
					Tag.closest('li').find('.im-audio-status').remove();
					self.myIM.im.message.read([msgId]); 
					$("body").append('<embed autoplay="true" class="imEmbed" id="imEmbed'+mid+'" src="'+self.myIM.im.mediaId(d.body.url)+'" style="width:0;height:0;visibility: hidden;"/>')
					setTimeout(function(){
						Tag.removeClass('do');
						hasMedia = false;
					},time)
				})
			})
		},
		chatInit:function(res){
			var settings = {};
			var self = this;
			var title="";
			//this.myIM.im.upload.trans(res.body[18].baseMessage.content.audioContent.mediaId,function(d){
				//self.myIM.im.mediaId(d.body.url)
				//console.log(self.myIM.im.mediaId(d.body.url))
			//})
			//console.log(res)
			if(self.chatType=="Group"){
				title = this.Conv.conversation.baseConversation.title;
			}else{
				title = self.listProfile[self.chatOpenId].nick
			}
			this.clearHasMsgui(self.chatConversationId);
			this.setStatus(2);
			settings = $.extend({},chart_dialog_cfg,{
				title:title,
				height:460,
				create: function( event, ui ) {
					var ppid = self.chatConversationId.replace(':','-');
					self.chatMain = $('#chartMian-'+ppid);
					self.uploadInit(self.chatMain);
					self.chatMain.delegate('[action-type="sendmsg"]','click',function(){
						var msgInput = $(this).closest('[node-type="chat-option"]').find('textarea');
						if($.trim(msgInput.val()) =="") {
							return Renhe.alert(i18n.chat.error.Empty,function(){
								msgInput.val("");
							});
						}
						self.sendMsg(msgInput.val(),self.listProfile[self.myIM.im.openId].nick)
					})
					self.chatMain.delegate('#messageChartContentInput'+ppid,'keydown',function(evt){
						if(evt.keyCode == 13){
							evt.ctrlKey?$(this).val($(this).val()+'\n'):self.chatMain.find('[action-type="sendmsg"]').trigger('click');
						}
		
					})
					self.chatScroll(self.chatMain.find('.chatmsgs-content'),self.chatMain.find('.chart-content'))
				},
				open:function(event, ui){
					self.chatMain = $('#chartMian-'+self.chatConversationId.replace(':','-'));
					self.msgContent = self.chatMain.find('.chart-content');
					self.inputChat = self.chatMain.find('textarea');
				},
				resize: function( event, ui ) {
					$(event.target).find('.chatmsgs-content').height(ui.size.height-151);
				}
			})
			var data1 = {
				i18n:i18n.chat,
				data:res.body,
				id:self.chatConversationId.replace(':','-')
			}
			
			if(this.openCid!=self.chatConversationId){
				this.dialog[this.openCid] && this.dialog[this.openCid].dialog( "close" );
			}
			if(this.dialog[self.chatConversationId]){
				this.dialog[self.chatConversationId].dialog( "open" );
				this.chatMain.find(".chatmsgs-content").scrollTop(this.msgContent.height())
			}else{
				this.dialog[self.chatConversationId] = $(chatTemp(data1)).dialog(settings).height(420);
				this.dialog[self.chatConversationId].find('.chatmsgs-content').height(309)
			}
			if(res.body.length==0) return;
			if(self.chatType=="Group"){
				self.groupProList(res.body,function(){
					self.msgHtmlUpdate(res.body,function(html){
						self.msgContent.html(html);
					},function(){
						self.chatMain.find(".chatmsgs-content").scrollTop(self.msgContent.height())
					})
				});
			}else{
				self.msgHtmlUpdate(res.body,function(html){
					self.msgContent.html(html);
				},function(){
					self.chatMain.find(".chatmsgs-content").scrollTop(self.msgContent.height())
				})
			}
			self.lastmsgTime = res.body[res.body.length-1].baseMessage.createdAt;
			this.openCid = self.chatConversationId;
		}
	}
	return IMui;
})
