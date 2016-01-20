define(function(require, exports, module) {
	var $ = require("$");
	require("common");
	require('dropdown');
	var Renhe = require("Renhe")
	var i18n = require("i18n");
	require('ajaxRails');
	require("autocomplete");
	require("pagination");
	require("handlebars-helper");
	var databinder = require("databinder");
	var QQSimple = require("./qqencrypt");
	var template = {
		addGroup:require("./addgroup.handlebars"),
		editGroup:require("./editgroup.handlebars"),
		friendList:require("./frienditemlist.handlebars"),
		navbarlist:require("./navbarlist.handlebars"),
		setgroup:require("./setgroup.handlebars"),
		sharefriend:require("./sharefriend.handlebars"),
		afterImportEmail:require("./afterImportEmail.handlebars"),
		invite:require("./invite.handlebars"),
		historylist:require("./historylist.handlebars")
	}
	var gpArr = ["groupId","addressId","industryId","keyword"];
	var Widget = new Renhe.Widget('#renmaiList');
	var databinder = new databinder("renmai");
	var hash = window.location.hash;
	 
	var firendList = Widget.extend({
		Event:{
			'[node-type="addgroup"] click':'addGroup',
			'[node-type="rmEditGroup"] click':"editGroup",
			'[node-type="rmDelGroup"] click':"delGroup",
			'[node-type="batch-manage"] click':'batchManage',
			'[node-type="cancelBatchManage"] click':"cancelBatchManage",
			'[node-type="cancelBatchChoose"] click':"cancelBatchChoose",
			'.manage[node-type="batch-list"] li click':"choosed",
			'[node-type="subbarNav"] [data-gid] click':"barsTabShow",
			'[node-type="searchBtn"] click':"renmaiSearchList",
			'[node-type="addToGroup"] click':"addItemsToGroup",
			'[node-type="removeItemsFromGroup"] click':"removeItemsFromGroup",
			'[node-type="delFriend"] click':"delFriend",
			'[node-type="addOneToGroup"] click':"addOneToGroup",
			'[node-type="shareFriend"] click':"shareFriend",
			'[node-type="email-content"] ajax:success':"emailImport",
			'[node-type="email-content"].qqemailip ajax:params':"beforeEmailImport",
			'[node-type="ss-head"] input click':"CheckAllBox",
			'[node-type="ss-box"] input click':"checkBox",
			'[node-type="afterImportForm"] ajax:params':"sendInvite",
			'[node-type="afterImportForm"] ajax:success':"successInvite",
			'[node-type="support-mail"]>li.checkbox>label click':"supportMail",
			'#EmailAuthImgChange click':"EmailAuthImgChange",
			'#InviteManage click':"InvitePagin",
			'[node-type="invite-fiter"] click':"InvitePagin",
			'[node-type="del-invite"] click':'delInvite',
			'[node-type="sendsmsInvite"] click':"sendsmsInvite",
			'.js-lookhistory-list ajax:success':"showHistroy",
			'.js-lookhistory-list ajax:complete':function(e){
				if (this !== e.target) return;
				$('.js-history-loading').hide();
			},
			'.js-lookhistory-list ajax:send':function(e){
				if (this !== e.target) return;
				$('.js-history-loading').show();
			},
			'[action-type="searchContacts"] change':function(e){
				$('[node-type="searchBtn"]').trigger('click');
			},
			'[node-type="email-content"] ajax:send':function(e){
				if (this !== e.target) return;
				$('.js-email-loading').show();
			},
			'[node-type="email-content"] ajax:complete':function(e){
				if (this !== e.target) return;
				$('.js-email-loading').hide();
			}
		},
		initialize:function(){
			this.groupCid = null;
			this.name = i18n.renmei[4];
			this.chooseNum = 0;
			this.varInit = true;
			this.emailVar = {};
			this.emailVar.checkNum = 0;
			this.gid = '';
			this.emailVar.inviteEmailType = '@163.com';
			this.curPg = 1;
			this.totalNum = 0;
			
		},
		eventBindCb:function(){
			this.pagin();
		},
		delInvite:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var url = IpcUrl.dii;
			Renhe.confirm(false,function(){
				$.ajax({
					url:url,
					dataType:"json",
					data:{inviteId:$this.data('id')},
					success:function(res){
						if(res.successFlag){
							$this.closest('li.inv-card').remove();
						}else{
							Renhe.alert(res.errorMsg)
						}
					}
				})
			})
		},
		sendsmsInvite:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var url = IpcUrl.tss;
			$.ajax({
				url:url,
				dataType:"html",
				data:$this.data('params'),
				success:function(res){
					Renhe.popop(res,{width:400,create:function(){
						$('#sendSmsContentTextarea').keyup(function(){
	        				if($(this).val().length > 150) {
	        					jQuery("#contentErrorMsg").html('<i class="icon-remove-sign"></i>'+i18n.invite[13]);
	        					jQuery("#contentErrorMsg").show();
	        				}else {
	        					jQuery("#contentErrorMsg").html("");
	        					jQuery("#contentErrorMsg").hide();
	        				}
	        			});
					}},function(el){
	        			self.postData($('#reinviteForm'),{
	        				url:IpcUrl.ri,
	        				type:'post'
	        			},function(r){
	        				Renhe.alert(r.msg)
	        			})
	                });
				}
			})
		},
		EmailAuthImgChange:function(e){
			var self = this;
			var username = $("#importEmailName").val();
	        $.ajax({
	            dataType: 'jsonp',
	            url: self.qqImportDomain + "changeQQMailVerifyCode.shtml?qq=" + username + "&code=" + $("#importEmailAuthCode").val(),
	            jsonp: 'jsoncallback',
	            success: function (result) {
	                var checkJson = eval("(" + result + ")");
	                if (checkJson.status == "1") {
	                	$("#importEmailAuthImg").attr("src", checkJson.verifyCodeUrl + "?" + Math.random());
	                    self.emailVar.verifySession = checkJson.verifySession;
	                }
	            }
	        });
		},
		supportMail:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var input = $this.find('input');
			if(input.prop("checked")){
				var suffix = input.data("suffix")
				databinder.set("emailSuffix",suffix);
				self.emailVar.inviteEmailType = suffix;
				if(input.val()=="11"){
					self.selectQQMail(input);
					self.get('email-content').addClass('qqemailip');
				}
			}
		},
		showHistroy:function(e,res){
			var self = this;
			var $this = $(e.currentTarget);
			
			var data = {
				data:res,
				text:i18n.renmei,
				action:IpcUrl.snmbi
			}
			$this.closest('form').replaceWith(template.historylist(data));
		},
		emailImport:function(e,res){
			var self = this;
			var $this = $(e.currentTarget);
			var data = {
				data:res,
				text:i18n.renmei,
				action:IpcUrl.snmbi
			}
			if(res.successFlag){
				data.msg = i18n.implace(i18n.renmei[21],[$this.find('[name="loginName"]').val()]);
				data.numMsg = i18n.implace(i18n.renmei[24],[res.outlookNotBeenMemberList.length]);
			}else{
				data.msg = i18n.renmei[22];
			}
			$this.replaceWith(template.afterImportEmail(data));
		},
		sendInvite:function(e){
			$('#sendEmailUserIds').val(this.getEmailSid(this.get('ss-box')));
			$('#inviteEmailType').val(this.emailVar.inviteEmailType)
		},
		successInvite:function(e,res){	
			$(e.currentTarget).replaceWith('<p class="text-center success"><i class="icon-ok-sign ftc-blue"></i>  '+i18n.renmei[29]+'</p>');
		},
		beforeEmailImport:function(){
			var self = this;
			if(self.qqError) return;
            var pwd = $("#importEmailPassword").val();
            if (self.emailVar.verifyCode && self.emailVar.verifyCode.length > 4) {
            	self.emailVar.verifyCode = $("#importEmailAuthCode").val();
            }
            var encryptionPassword = QQSimple.Encryption.getEncryption(pwd, self.emailVar.salt, self.emailVar.verifyCode, undefined);
            $("#qqpInput").val(encryptionPassword);
            $("#verifySessionInput").val(self.emailVar.verifySession);
		},
		selectQQMail:function(el){
			var self = this;
			var importDomain = el.data('importdomain');
			self.qqImportDomain = importDomain;
			$("#importEmailPassword").focus(function () {
				self.checkQQMail({
					invType:el.val(),
					username:$("#importEmailName").val(),
					importDomain:self.qqImportDomain
				});
		    });
		},
		checkQQMail:function(obj){
	        var invType = obj.invType;
	        var username = obj.username;
	        var importDomain = obj.importDomain;
	        var self = this;
	        
	        if(invType == 11 && username != "" && username != self.emailVar.lastCheckName) {
	        	self.get('email-content').prepend('<input id="qqpInput" type="hidden" name="qqpInput" value=""/><input id="verifySessionInput" type="hidden" name="verifySession" value=""/>');
	        	self.emailVar.invType = invType;
	        	$.ajax({
	                dataType: 'jsonp',
	                url: importDomain + "checkQQMail.shtml?qq=" + username,
	                jsonp: 'jsoncallback',
	                success: function (result) {
	                    var checkJson = eval("(" + result + ")");
	                    if (checkJson.status == "0") {
	                            $("#authCodeInfoDiv").hide();
	                            $("#importEmailAuthCode").val(checkJson.verifyCode);
	                    } else if (checkJson.status == "1") {
	                            $("#importEmailAuthImg").attr("src", checkJson.verifyCodeUrl + "?" + Math.random());
	                            $("#importEmailAuthCode").val("");
	                            $("#authCodeInfoDiv").show();
	                    }
	                    self.emailVar.verifyCode = checkJson.verifyCode;
	                    self.emailVar.salt = checkJson.salt;
	                    self.emailVar.verifySession = checkJson.verifySession;
	                    self.emailVar.lastCheckName = username;
	                },
	                error:function(XMLHttpRequest, textStatus, errorThrown){
	                	self.qqError = true;
	                },
	                statusCode:{
	                	404:function(){
	                		self.qqError = true;
	                	}
	                }
	            });
	        }
	    },
		CheckAllBox:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var boxs = $this.closest('[node-type="select-scoll"]').find('[node-type="ss-box"]').find('[type="checkbox"]');
			var $btn = $('[node-type="afterImportForm"] [type="submit"]');
			
			if($this.prop("checked")){
				boxs.prop("checked",true);
				self.emailVar.checkNum = boxs.length;
				$btn.prop("disabled",false);
			}else{
				boxs.prop("checked",false);
				self.emailVar.checkNum = 0;
				$btn.prop("disabled",true);
			}
			databinder.set('emaiselect-num',self.emailVar.checkNum)
		},
		checkBox:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var $btn = $('[node-type="afterImportForm"] [type="submit"]');
			$this.prop("checked")?self.emailVar.checkNum ++:self.emailVar.checkNum -- ;
			databinder.set('emaiselect-num',self.emailVar.checkNum);
			if(self.emailVar.checkNum > 0){
				$btn.prop("disabled",false);
			}else{
				$btn.prop("disabled",true);
			}
		},
		getEmailSid:function(el){
			var resArr = [];
			el.find('[type="checkbox"]').each(function(index,item){
				if($(item).prop("checked")){
					resArr.push($(item).val())
				}
			})
			return resArr.join(",");
		},
		shareFriend:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var url = IpcUrl.pfss;
			$.ajax({
				url:url,
				data:{sid:$this.data("sid")},
				dataType:"json",
				success:function(res){
					Renhe.popop(template.sharefriend({i18n:i18n.popop,data:res.showMember}),{
						title:i18n.popop[7]
					},function(ele){
						console.log(ele)
					})
				}
			})
		},
		getChoosedId:function(){
			var arrStr = [];
			this.get('batch-list').find('.choosed').each(function(index,item){
				arrStr.push($(item).attr('data-id'))
			});
			return arrStr.join(',')
		},
		delFriend:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var url = IpcUrl.df;
			Renhe.confirm('<span>'+i18n.popop[15]+'</span>',function(){
				$.ajax({url:url,data:{friendId:$this.data('fid')},dataType:"json",type:"post",
					success:function(res){
						if(res.success){
							self.listRender(self.curpg,function(res){
								self.renderGroupNavList(res);
								self.groupList =  res.friendGroupListVo.friendGroupList;
					    	});
							self.totalNum--;
						}else{
							Renhe.alert(res.reason);
						}
					}
				})
			})
		},
		setToGroup:function($this,options,callback){
			var self = this;
			var url = IpcUrl.ecmg;
			Renhe.popop(template.setgroup(options),{
				title:i18n.popop[4]
			},function(ele){
				self.postData($( ele ),{
		    		url:url
		    	},function(res,data){
		    		callback(res,data)
		    	})
			})
		},
		addOneToGroup:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var ids = $this.data("fid");
			this.setToGroup($this,{i18n:i18n.renmei,groupList:this.groupList,ids:ids},function(res){
				//$this.closest('li.choosed').remove();
			})
		},
		addItemsToGroup:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var ids = self.getChoosedId();
			if(ids == "") {
				return Renhe.alert(i18n.popop[14])
			}
			this.setToGroup($this,{i18n:i18n.renmei,groupList:this.groupList,ids:ids},function(res,data){
				
				self.listRender(self.curPg,function(res){
					self.renderGroupNavList(res);
					self.groupList =  res.friendGroupListVo.friendGroupList;
				});
			})
			
		},
		removeItemsFromGroup:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var url = IpcUrl.ecmg;
			var ids = self.getChoosedId();
			if(ids == "") {
				return Renhe.alert(i18n.popop[14])
			}
			Renhe.confirm('<span>'+i18n.popop[13]+'</span>',function(){
				$.ajax({url:url,data:{id:ids},dataType:"json",type:"post",
					success:function(res){						
						
						self.listRender(self.curPg,function(res){
							self.renderGroupNavList(res);
							self.groupList =  res.friendGroupListVo.friendGroupList;
						});
					}
				})
			})
		},
		renderGroupNavList:function(res){
			
			res.i18n = i18n.renmei;
			
			var subbarNav = this.get('subbarNav');
			//subbarNav.html(template.navbarlist(res));
			subbarNav.find('.panel-collapse').on('hidden.bs.collapse', function () {
				subbarNav.find('[href="#'+$(this).attr("id")+'"]').find('span').removeClass('icon-caret-down').addClass('icon-caret-right')
			}).on('shown.bs.collapse',function(){
				subbarNav.find('[href="#'+$(this).attr("id")+'"]').find('span').removeClass('icon-caret-right').addClass('icon-caret-down')
			})
			$('[data-gid="'+this.gid+'"]').addClass('active');
		},
		pagin:function(){
			var self = this;
			
			var pData = {};
			this.get('remai-main').html('<div class="panel renhe-panel" node-type="batch-content"></div><div class="remai-pagin" style="display:none;"><ul node-type="pagin" class="pagination"></ul></div>')
			
			if(this.groupCid){
				pData = {
					contactType:gpArr[self.groupCid[0]],
					contactValue:self.groupCid[1]
				}
			}
			this.PaginContainer = this.get('pagin');
			this.PaginContainer.jqPaginator({
			    totalPages: 100,
			    visiblePages: 10,
			    currentPage: 1,
			    onPageChange: function (num, type) {
			    	if(hash && type == "init"){
			    		$(hash).trigger('click');
			    		return hash = null;
			    	}else{
			    		self.listRender(num,function(res){
				    		if(type == "init" && self.varInit){
								self.renderGroupNavList(res);
								self.groupList =  res.friendGroupListVo.friendGroupList;
								//console.log(self.groupList)
								self.varInit = false;
							}
				    	});
			    	}
			    }
			});
			
		},
		paginDataShow:function(num,option,callback){
			var data = $.extend({},{
				curPage:num,
				pageSize:20
			},option.data)
			$.ajax({
				url:option.url,
				dataType:"json",
				data:data,
				success:function(res){
					res.i18n = i18n.renmei;
					callback && typeof(callback) == "function" && callback(res);
				}
			})
		},
		paginShow:function(totalPage){
			if(totalPage>1){
				this.PaginContainer.parent("div").show();
			}else{
				this.PaginContainer.parent("div").hide();
			}
		},
		barsTabShow:function(e,callback){
			var self = this;
			var $this = $(e.currentTarget);
			this.subTab($this);
		},
		subTab:function($this,callback){
			var gid = $this.attr("data-gid");
			if(!gid) {
				this.gid = false;
				return;
			}
			if(this.gid==gid) return;
			this.gid = gid;
			if(gid != "all"){
				this.groupCid = gid.split(':');
			}else{
				this.groupCid = null;
			}
			this.name = $this.attr("data-name");
			this.num = $this.attr("data-num");
			if(this.get('pagin').length==0){
				this.pagin();
			}
			this.listRender(1,function(res){
				callback && callback(res)
			});
			this.prevGid && $('[data-gid="'+this.prevGid+'"]').removeClass('active');
			$this.addClass('active');
			this.chooseNum = 0;
			this.prevGid = gid;
			$(window).scrollTop(0);
		},
		listRender:function(num,callback){
			var self = this;
			var data = {};
			self.curPg = num;
			
			if(this.groupCid){
				data = {contactType:gpArr[self.groupCid[0]],contactValue:self.groupCid[1]}
			}
			this.paginDataShow(num,{
				url:IpcUrl.gcml,
				data:data
			},function(res){
				self.num = res.spell.contactMemberCount;
				res.i18n = i18n.renmei;
				res.name = self.name;
				res.num = self.num;
				if(!self.groupCid) self.totalNum = res.spell.contactMemberCount;
				res.totalNum = self.totalNum;
				res.type = self.groupCid ? {contact:gpArr[self.groupCid[0]],value:parseInt(self.groupCid[1],10)}:{contact:"all"} 
				callback && typeof(callback) == "function" && callback(res);
				self.get('batch-content').html(template.friendList(res));
				self.PaginContainer.jqPaginator('option', {
				    currentPage: num,
				    totalPages:res.pagination.totalPage
				})
				
				self.paginShow(res.pagination.totalPage)
			})
		},
		renmaiSearchList:function(e){
			var $this = $(e.currentTarget);
			var val = $this.siblings('[name="query"]').val();
			this.groupCid = [3,val];
			this.listRender(1);
		},
		editGroup:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var url = IpcUrl.eg;
			Renhe.popop(template.editGroup({i18n:i18n.popop,gid:this.groupCid[1],gname:this.name}),{
				title:i18n.popop[8]
			},function(ele){
				self.postData($( ele ),{
		    		url:url
		    	},function(res){
		    		
		    		self.listRender(self.curPg,function(res){
						self.renderGroupNavList(res);
						self.groupList =  res.friendGroupListVo.friendGroupList;
					});
		    		//self.get(target).find('li:last').before('<li><a href="javascript:void(0);" data-id="'+res.group.id+'">'+res.group.groupname+'   00</a></li>')
		    	})
			})
		},
		delGroup:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var url = IpcUrl.dg;
			Renhe.confirm('<span>'+i18n.popop[11]+'</span><br><span>'+i18n.popop[12]+'</span>',function(){
				$.ajax({url:url,data:{gid:self.groupCid[1]},dataType:"json",type:"post",
					success:function(res){
						self.subTab($('[data-gid="0:0"]'),function(res){
							self.renderGroupNavList(res);
							self.groupList =  res.friendGroupListVo.friendGroupList;
						})
					}
				})
			})
		},
		choosed:function(e){
			var self = this;
			var $target = $(e.target);
			if($target[0].tagName == "BUTTON" || $target[0].tagName == "A") return;
			var $this = $(e.currentTarget);
			if($this.hasClass('choosed')){
				this.chooseNum--;
				$this.removeClass('choosed');
				databinder.set("chooseNum",this.chooseNum)
			}else{
				this.chooseNum ++;
				$this.addClass('choosed')
				databinder.set("chooseNum",this.chooseNum)	
			}
			
		},
		cancelBatchChoose:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			self.get("batch-list").find('li').removeClass('choosed');
			this.chooseNum = 0;
			databinder.set("chooseNum",this.chooseNum)	
		},
		cancelBatchManage:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			$this.parent('.manageopt').hide().siblings('.manageopt').show().siblings('[node-type="batch-list"]').removeClass("manage").find('.def-card').removeClass('choosed')
		},
		batchManage:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			$this.parent('.manageopt').hide().siblings('.manageopt').show().siblings('[node-type="batch-list"]').addClass("manage")
		},
		addGroup:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var url = IpcUrl.cg;
			var target = $this.data('target');
			Renhe.popop(template.addGroup({i18n:i18n.popop}),{
				title:i18n.popop[3],
				buttons: [
					{
					    text: i18n.popop[0],
					    click: function() {
					    	if($(this).find('[name="gname"]').val().length>8){
					    		$( this ).dialog( "close" );
					    		return Renhe.alert(i18n.popop[1]);
					    	}
					    	self.postData($( this ),{
					    		url:url
					    	},function(res){
					    		self.listRender(self.curPg,function(res){
									self.renderGroupNavList(res);
									self.groupList =  res.friendGroupListVo.friendGroupList;
								});
					    	})
					    	$( this ).dialog( "close" );
					    }
					}
			    ]
			})
		},
		postData:function($form,options,callback){
			var self = this;
			var data = {};
			$form && $form.find('[type!="radio"][name],textarea,[type="radio"][name]:checked').each(function(index,item){
				data[$(item).attr("name")] = $(item).val();
			})
			$.ajax({
				url:options.url,
				dataType:"json",
				type:options.type || "post",
				data:$.extend({},options.data,data),
				success:function(res){
					
					callback && typeof(callback) == "function" && callback(res,data)
				}
			})
		},
		InvitePagin:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var status = $this.data('status');
			var data = {};
			if(!this.inviteUrl){
				this.inviteUrl = $this.data("url");
			}
			if(status){
				data.status = status;
			}
			this.get('remai-main').html('<div class="panel renhe-panel" node-type="batch-content"></div><div class="remai-pagin" style="display:none;"><ul class="pagination" id="invitePagin"></ul></div>')
			var invitePagin = $("#invitePagin");
			invitePagin.jqPaginator({
			    totalPages: 100,
			    visiblePages: 10,
			    currentPage: 1,
			    onPageChange: function (num, type) {
			    	self.curPg = num;
			    	self.paginDataShow(num,{
			    		url:self.inviteUrl,
			    		data:data
			    	},function(res){
			    		res.invI18n = i18n.invite;
			    		res.staticDomain = staticDomain || '';
			    		self.get('batch-content').html(template.invite(res));
			    		invitePagin.jqPaginator('option', {
						    totalPages:res.pagination.totalPage
						})
						
			    		if(res.pagination.totalPage>1){
			    			invitePagin.parent('div').show();
			    		}
			    	})
			    }
			});
		},
		searchContacts:function(ele){
			var self = this;
			var sourceUrl = IpcUrl.gmc;
			ele.autocomplete({
		        source:function(query,process){
		            var matchCount = this.options.items;
		            if($.trim(query) == "") return;
		            $.ajax({url:sourceUrl,type:'get',data:{"name":$.trim(query)},dataType:'json',success:function(respData){
		            		if(!respData) return process([]);
		            		return process(respData);
		            	}
		            })
		        },
		        formatItem:function(item){
		            return item["name"]+"("+item["company"]+")";
		        },
		        setValue:function(item){
		            return {'data-value':item["name"],'real-value':item["sid"],'data-company':item["company"]};
		        }
		    })
		}
	})
	var FirendList = firendList.init();
})
