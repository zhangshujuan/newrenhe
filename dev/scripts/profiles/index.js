define(function(require, exports, module) {
	var $ = require("$");
	var i18n = require("i18n");
	var Aid = require("aid");
	var Uploader = require("uploader")
	window.Aid = Aid;
	require("handlebars-helper");
	require('jquery.ui');
	require('tab');
	require("common");
	require('dropdown');
	require('cropit');
	
	require('cxselect');
	require('metadata');
    require('jquery-validate');
    $.validator.setDefaults({
	    debug: true
	 });
    $.validator.addMethod("cnowYear", function(value, element, param) {
    	var now = new Date();
    	var nowDate = {
    		year:now.getFullYear(),
    		month:now.getMonth()+1
    	}
    	var flag = (nowDate.year>=parseInt(value,10));
    	return flag;
    });
    $.validator.addMethod("cnowMonth", function(value, element, param) {
    	var now = new Date();
    	var v = parseInt(value,10);
    	var nowDate = {
    		year:now.getFullYear(),
    		month:now.getMonth()+1
    	}
    	var yearVal = parseInt($(element).siblings(param).val());    	
    	if(nowDate.year>=yearVal){
    		if(nowDate.year==yearVal){
        		return (nowDate.month>=v?true:false)
        	}
    		return true;
    	}else{
    		return false;
    	}
    	
    });
    $.validator.addMethod("compareDate", function(value, element, param) {
    	var now = new Date();
    	var v = parseInt(value,10);
    	var nowDate = {
    		year:now.getFullYear(),
    		month:now.getMonth()+1
    	}
    	var endYear = parseInt($(element).siblings('[name=endYear]').val());
    	var endMonth = parseInt(value);
    	var startYear = parseInt($(element).siblings('[name=startYear]').val());
    	var startMonth = parseInt($(element).siblings('[name=startMonth]').val());
    	if(startYear<endYear){
    		return true;
    	}
    	if(startYear>endYear){
    		return false;
    	}
    	if(startYear==endYear){
    		if(startMonth<=endMonth){
    			return true;
    		}else{
    			return false
    		}
    	}
    })
    
	var template = {
    	base:{
    		list:require('./basefinishlisttmp.handlebars'),
    		edit:require('./basefinishedittmp.handlebars'),
    	},
		work:{
			list:require('./workfinishlisttmp.handlebars'),
			edit:require('./workfinishedittmp.handlebars')
		},
		project:{
			list:require("./projectfinishlisttmp.handlebars"),
			edit:require("./projectfinishedittmp.handlebars")
		},
		educations:{
			list:require("./edufinishlisttmp.handlebars"),
			edit:require("./edufinishedittmp.handlebars")
		},
		other:{
			list:require("./othertmp.handlebars")
		},
		setGroup:require("./set-group-tmp.handlebars")
	}
	var Renhe = require('Renhe');
	var dataBinder = require('databinder');
	var Widget = new Renhe.Widget('#profilesMain');
	var schoolList = {};
	var jubao = function(element,options){
		var self = this;
		this.popop = false;
		this.initEv = function(){
			this.$rElement = $(element);
			if(this.$rElement.length==0) return;
			self.$rElement.find('input[type="radio"]').on("click",function(){
				var $this = $(this);
				if($this.prop('checked')){
					self.$rElement.find('.rep-level').not($this[0]).addClass('hide-level');
					$this.closest('label').siblings('.rep-level').removeClass('hide-level').parents('.rep-level').removeClass('hide-level');
				}
			})
			self.$rElement.find('input[type="checkbox"]').on("click",function(){
				var $this = $(this);
				var resultArr = [];
				$this.closest('.rep-level-2').find('input[type="checkbox"]:checked').each(function(){
					resultArr.push($(this).val())
				})
				self.$rElement.find('[name="level2"]').val(resultArr.join(','))
			})
			self.$rElement.find('.custom-spam').on("click",function(){
				var $this = $(this);
				var $textarea = $this.closest('label').siblings('textarea');
				if($this.prop('checked')){
					$textarea.show()
				}else{
					$textarea.hide()
				}
			})
		}
		if(options && options.trigger){
			$(document).delegate(options.trigger,"click",function(){
				var rep_url = $(this).data("url");
				if(this.popop){
					self.popop.show();
				}else{
					var title= $(options.trigger).attr("title")
					self.popop = Renhe.popop(options.tmp,{title:title,width:360},function(r){
						var data = {};
						$(r).find('input[name]:checked,input[name][type="hidden"],textarea:visible').each(function(){
							data[$(this).attr("name")] = $(this).val();
						})
						$.ajax({
							url:rep_url,
							data:data,
							type:"post",
							dataType:"json",
							success:function(res){
								Renhe.alert(res.msg)
							}
						})
					});
					self.initEv()
				}
				
			})
		}else{
			self.initEv();
		}
	}
	var profilesMain = Widget.extend({
		Event:{
			'.js-profiles-edit click':'profilesEdit',
			'.js-profiles-cancel click':'profilesCancel',
			'.js-profiles-finish click':'profilesFinish',
			'.js-add-panel click':'addPanel',
			'.js-remove-panel click':'removePanel',
			'.js-cropit-saveuserimg click':'cropitSaveUserImg',
			'.js-textlimit keyup':'limitTextNum',
			'[name="school_school"] change':'schoolChange',
			'[name="now"] click':'nowDataCheck',
			'[node-type="delFriend"] click':"delFriend",
			'[node-type="sendsmsInvite"] click':"sendsmsInvite",
			'[node-type="nologinSendsmsInvite"] click':"nologinSendsmsInvite",
			'.js-set-group click':"setGroup",
			'.js-todynamic click':function(e){
				$('[href="#boardNotice"]').tab("show");
				$(window).scrollTop($('.renmai-nav').offset().top-76);
			}
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
		Data:{
			base:new dataBinder("base"),
			work:new dataBinder("work"),
			project:new dataBinder("project"),
			contact:new dataBinder("contact"),
			other:new dataBinder("other"),
			cropit:new dataBinder("cropit")
		},
		initialize:function(){
			var self = this;
			this.addPanelTmp = {};
			this.evInit(this.element);
			this.errorText = false;
			if($('#upload:visible').length>0){
				self.uploadImg();
			}
			$('#profiles').validate()
			this.cropper = $('#image-cropper').cropit({
				imageBackground: true,
				imageState: {
	                src: "#",
	                offset: {
	                    x: 0,
	                    y: 0
	                }
	            },
	            onZoomChange:function(zoon){
	            	self.Data.cropit.set('zoom',zoon)
				},
				onOffsetChange:function(offset){
					self.Data.cropit.set('squarex',-offset.x);
					self.Data.cropit.set('squarey',-offset.y)
				}
			})
			$('.js-textlimit').each(function(){
				self.textNum($(this));
			})
			$.metadata.setType("attr", "validate");
			$('.js-validate').each(function(){
				self.validate($(this),{
					setting:{
						submitHandler:function(form){
							
						},
						errorPlacement:function(error, element){
							self.errorText = error.html();
						}
					}
				})
			})
			new jubao('#reportPanel',{trigger:"#J_profileReport",tmp:$("#reportPanelTemplate").html()})
		},
		setGroup:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var id = $this.data('id');
			var ggl = IpcUrl.ggl;
			var ecmg = IpcUrl.ecmg;
			$.ajax({url:ggl,dataType:"json",data:{id:id},success:function(res){
					res.ids = id;
					Renhe.popop(template.setGroup(res),{title:$this.text()},function(el){
						$.ajax({
							url:ecmg,
							dataType:"json",
							type:"post",
							data:self.getFormData($(el)),
							success:function(res){
								if(res.success) Renhe.alert($this.text()+i18n.success);
							}
						})
						
					})
				}
			})
		},
		delFriend:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var url = IpcUrl.df;
			Renhe.confirm('<span>'+i18n.popop[15]+'</span>',function(){
				$.ajax({url:url,data:{friendId:$this.data('fid')},dataType:"json",type:"post",
					success:function(res){
						if(res.success){
							$this.closest('.btn-group').hide().siblings('a.btn').show();
						}else{
							Renhe.alert(res.reason);
						}
					}
				})
			})
		},
		nowDataCheck:function(e){
			var $this = $(e.currentTarget);
			if($this.prop("checked")){
				$this.parents('.checkbox').siblings('[name="endMonth"]').prop('disabled',true).siblings('[name="endYear"]').prop('disabled',true);
			}else{
				$this.parents('.checkbox').siblings('[name="endMonth"]').prop('disabled',false).siblings('[name="endYear"]').prop('disabled',false)
			}
		},
		limitTextNum:function(e){
			this.textNum($(e.currentTarget));
		},
		textNum:function($target){
			var $this = $target;
			var limit = $this.data("limit");
			var $target = $this.siblings().find('.js-num');
			var len = $.trim($this.val()).length;
			$target.text(parseInt(limit,10)-len);
		},
		schoolChange:function(e){
			var $this = $(e.currentTarget);
			var sch = $this.closest('.school_school_Show');
			if($this.val()=="0"){
				this.showSchoolSelect(sch,3)
			}else{
				this.showSchoolSelect(sch,4)
			}
		},
		cropitSaveUserImg:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var url = $this.data("url");
			var formEl = $($this.data("form-target"));
			$.ajax({
				url:url,
				dataType: 'json',
				type:'post',
				data:this.getFormData(formEl),
				success:function(res){
					if(res.success){
						$('.js-edit-userimg').attr('src',res.newFaceImg);
					}
				}
			})
		},
		uploadImg:function(){
			var self = this;
			var uploader_2 = new Uploader({
			    trigger: '#myImgUpload',
			    accept: 'image/*',
			    error: function(file) {
			        console.log(file)
			    },
			    success: function(response) {
			    	$('#myImgUploadSubmit').siblings("span").text("")
			    	var db = $.parseJSON(response);
			    	var trigger = $(this.settings.trigger);
			    	self.Data.cropit.set('dir',db.dir);
			    	self.cropper.cropit('imageSrc', db.showMinImg).show();
			    },
			    progress: function(event, position, total, percent, files) {
			    	$('#myImgUploadSubmit').siblings("span").text(percent+"%")
			    }
			}).change(function(files) {
				var str = '';
				var _this = this;
				$("#myImgUploadName").text(files[0].name);
	        	$('#myImgUploadSubmit').unbind("click").bind("click",function () {
                    //$(this).siblings("span").text('loading...');
                    _this.submit();
                });
			});
			uploader_2._uploaders[0].input.css('height',"auto");
			setInterval(function(){
				$("#eventPhoto").trigger('mouseover');
				$("#posterUploadImage").trigger('mouseover');
			},500)
		},
		getFormData:function(fm){
			var data = {};
			var fterArr = [
			    '[type="hidden"][name]',
			    'select[name]:enabled',
			    '[type="text"][name]:enabled',
			    'textarea',
			    '[type="radio"][name]:checked',
			    '[type="checkbox"][name]:checked'
			]
			fm && fm.find(fterArr.join(',')).each(function(index,item){
				var nm = $(item).attr("name");
				var v = $(item).val();
				if(data[nm]){
					if(!$.isArray(data[nm])){
						data[nm] = [data[nm]];
					};
					data[nm].push(v);
				}else{
					data[nm] = v;
				}
			})
			return data;
		},
		getformHorizontal:function(ele){
			var content = [];
			var fterArr = [
			    '[type="hidden"][name]',
			    'select[name]:enabled',
			    '[type="text"][name]:enabled',
			    'textarea',
			    '[type="radio"][name]:checked',
			    '[type="checkbox"][name]:checked'
			]
			ele.find('.form-horizontal').each(function(index,item){
				var data = {};
				$(item).find(fterArr.join(',')).each(function(idx,it){
					var k = $(it).attr("name");
					var v = $(it).val();
					if(data[k]){
						if(!$.isArray(data[k])){
							data[k] = [data[k]];
						};
						data[k].push(v);
					}else{
						data[k] = v;
					}
				})
				content.push(data);
			})
			return {content:JSON.stringify(content)};
		},
		sendsmsInvite:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var url = $this.data("url");
			var formurl = $this.data("formurl");
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
							url:formurl,
							type:'post'
						},function(r){
							Renhe.alert(r.msg)
						})
					});
				}
			})
		},
		nologinSendsmsInvite:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var url = $this.data("url");
			var formurl = $this.data("formurl");
			$.ajax({
				url:url,
				dataType:"html",
				data:$this.data('params'),
				success:function(res){
					Renhe.popop("<div>" + res + "</div>",{width:500,create:function(){
						$('#rmkdContentInput').keyup(function(){
							if($(this).val().length > 150) {
								jQuery("#contentErrorMsg").html('<i class="icon-remove-sign"></i>'+i18n.invite[13]);
								jQuery("#contentErrorMsg").show();
							}else {
								jQuery("#contentErrorMsg").html("");
								jQuery("#contentErrorMsg").hide();
							}
						});
					}},function(el){
						var name = $("#rmkdForm input[name='name']").val();
						var company = $("#rmkdForm input[name='company']").val();
						var title = $("#rmkdForm input[name='title']").val();
						var mobile = $("#rmkdForm input[name='mobile']").val();
						var content = $("#rmkdForm textarea[name='content']").val();

						if(name == "") {
							Renhe.alert("请填写姓名")
							$("#contentErrorMsg").show();
							return false;
						}
						//if(company == "") {
						//	Renhe.alert("请填写公司");
						//	$("#contentErrorMsg").show();
						//	return false;
						//}
						//if(title == "") {
						//	$("#contentErrorMsg").show();
						//	return false;
						//}
						if(mobile == "") {
							Renhe.alert("请填写手机号码");
							$("#contentErrorMsg").show();
							return false;
						}
						//if(content == "") {
						//	$("#contentErrorMsg").html("请填写留言");
						//	$("#contentErrorMsg").show();
						//	return false;
						//}
						var tomemberid = $("#rmkdForm input[name='tomemberid']").val();
						$.ajax({
							url:url,
							dataType:"html",
							data: {name: name, company: company, title:title,
								mobile:mobile, content:content, tomemberid:tomemberid, cmd: 1},
							success:function(res){
								Renhe.popop("<div>" + res + "</div>",{width:500,buttons:[],create:function(){
									var timer;
									$("#submitButton").click(function() {
										$("#pay_form").submit();
										$(this).attr("disabled", true);
										$("#payMsgDiv").show();
										// 每隔10秒确认是否已经付款
										timer = window.setInterval(function(){
											jQuery.ajax({
												url: "/ajax/memberrmkdflag.html",
												dataType: "script",
												data: {  rmkdSId : $("#rmkdSIdInput").val() },
												success: function(script){
													if(sent) {
														if(timer){
															window.clearInterval(timer);
														}
														Renhe.alert("短信已经发送成功了，请耐心等待对方的回复吧。");
													}
												},
												error: function(){
													$("#errorMsgDiv").show();
												}
											});
										}, 1000*10);
									});
								}},function(el){
								});
							},
							error: function(){
								$("#contentErrorMsg").show();
								$("#contentErrorMsg").html("发送人脉快递发生异常，请稍后重试或与人和网客服联系。");
							}
						});
					});
				}
			})
		},
		getSchoolSelect:function(el,ct,p){
			var self = this;
			if(schoolList[ct+"|"+p]){
				return self.showSchoolSelect(el,1,schoolList[ct+"|"+p]);
			}
			if(p=="0"){
				return self.showSchoolSelect(el,2);
			}
			$.ajax({
				url:'/profile/ajax/schoolList.xhtml',
				data:{
					country:ct,
					prov:p
				},
				dataType:"json",
				success:function(res){
					//el.css("width","auto")
					schoolList[ct+"|"+p] = res.schoolList;
					self.showSchoolSelect(el,1,res.schoolList);
				}
			})
		},
		showSchoolSelect:function(el,t,school){
			var self = this;
			var sch = el.find('.school_school');
			var otherTxt = el.find('.school_school_Text')
			switch(t){
				case 1:
					var dataValue = sch.data("value");
					sch.html(self.buildSchoolSelect(school,dataValue));
					
					el.show();
					otherTxt.hide().prop('disabled', true);
					break
				case 2:
					sch.html(self.buildSchoolSelect());
					el.show();
					otherTxt.show().prop('disabled', false);
					break
				case 3:
					otherTxt.show().prop('disabled', false);
					break
				case 4:
					otherTxt.hide().prop('disabled', true);
					break
				case 5:
					el.hide();
					otherTxt.hide().prop('disabled', true);
					break
				default:break;
			}
		},
		buildSchoolSelect:function(res,dataValue){
			var lsStr = '<option value="0">'+i18n.profiles.text[16]+'</option>'
			if(!res) return lsStr;
			var str = '<option value="">'+i18n.select+'</option>';
			$.each(res,function(index,item){
				if(dataValue && dataValue == item.id){
					str+='<option value="'+item.id+'" selected>'+item.name+'</option>';
				}else{
					str+='<option value="'+item.id+'">'+item.name+'</option>';
				}
			});
			str+=lsStr;
			return str;
		},
		evInit:function(el){
			var self = this;
			var flag = 0;
			el.find('.js-area-dist').cxSelect({ 
			  url: Aid.address,
			  selects: ['province', 'city', 'area'], 
			  nodata: 'none',
			  firstTitle:i18n.select,
			  firstValue:""
			});
			el.find('.js-area-industry').cxSelect({
			  url: Aid.industry,
			  selects: ['primary', 'secondary'], 
			  nodata: 'none',
			  firstTitle:i18n.select,
			  firstValue:""
			});
			el.find('.js-school-dist').cxSelect({ 
				url: Aid.address,
				selects: ['school_country', 'school_prov'], 
				nodata: 'none',
				firstTitle:i18n.select,
				firstValue:"",
				nextData:function(database,indexArr,box){
					var schoolSelect = box.closest('.form-horizontal').find('.school_school_Show')
					if(indexArr[0]>=0 && database[indexArr[0]] && !database[indexArr[0]].s){
						
						self.getSchoolSelect(schoolSelect,database[indexArr[0]].v,0);
					}else if(indexArr[1]>=0 && database[indexArr[1]] && database[indexArr[0]].s){
						
						self.getSchoolSelect(schoolSelect,database[indexArr[0]].v,database[indexArr[0]].s[indexArr[1]].v);
					}else{
						self.showSchoolSelect(schoolSelect,5)
					}				
				}
			});
		},
		
		addPanel:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var _key = $this.data("template");
			var fm = $(_key).find('.form-horizontal').clone();
			$this.closest('.js-add-opts').after(fm);
			this.evInit(fm);
			self.validate($(fm),{
				setting:{
					errorPlacement:function(error, element){
						self.errorText = error.html();
					}
				}
			})
		},
		removePanel:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			$this.closest('.form-horizontal').remove();
		},
		profilesEdit:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			this.showDetial($this.parents('.panel'),"edit")
		},
		profilesCancel:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			this.showDetial($this.parents('.panel'))
		},
		profilesSubmit:function(el,dt){
			var self = this;
			var $this = el;
			var parent = $this.parents(".panel");
			var Panel = parent.data("target").split(',');
			var $editPanel = parent.find(Panel[0]);
			var url = $editPanel.data("url");
			var getDataType = $editPanel.data("gettype")
			if(dt){
				var data = dt;
			}else{
				var data = this[getDataType]($editPanel);
			}
			var dbType = $this.data("dbtype");
			
			$.ajax({
				url:url,
				data:data,
				dataType:"json",
				type:"post",
				traditional : true,
				success:function(res){
					if(dbType=="base"){
						var baseData = {data:res,i18n:i18n.profiles};
						$(Panel[1]).find('.js-media-main').html(template[dbType].list(baseData))
						//$(Panel[1]).find('.media-left').html(template[dbType].list(baseData));
						//$(Panel[1]).find('.media-right-top').html(template[dbType].edit(baseData));
					}
					if(dbType=="project" || dbType=="work" || dbType=="educations"){
						parent.find(Panel[1]).html(template[dbType].list({data:res,i18n:i18n.profiles}));
						$editPanel.html(template[dbType].edit({data:res,i18n:i18n.profiles}));
						self.evInit($editPanel)
						self.textNum($editPanel.find('.js-textlimit'));
						$editPanel.find('form').each(function(){
							self.validate($(this),{
								setting:{
									errorPlacement:function(error, element){
										self.errorText = error.html();
									}
								}
							})
						});
						if(!$.isArray(res.experienceVoList)) return;
						if(res.experienceVoList.length>0){
							parent.find('.js-profiles-edit').text(i18n.profiles.text[19])
						}else{
							parent.find('.js-profiles-edit').text(i18n.profiles.text[18])
						}
					}
					if(dbType=="contact" || dbType=="other" || dbType=="cropit"){
						self.setData(self.Data[dbType],data);
						parent.find(Panel[1]).html(template["other"].list({type:dbType,data:res,i18n:i18n.profiles}));
					}
					self.showDetial(parent);
				}
			})
		},
		profilesFinish:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var parent = $this.parents(".panel");
			var ivalite = false;
			var $forms = parent.find('form');
			$forms.each(function(){
				ivalite = $(this).valid();
				if(!ivalite) return false;
			});
			if($forms.length==0){
				self.profilesSubmit($this,{content:""});
			}
			if(ivalite){
				self.profilesSubmit($this);
			}else{
				Renhe.alert(self.errorText);
			}
		},
		setData:function(objBinder,data){
			return $.each(data,function(index,item){
				if($.isArray(item)){
					$.each(item,function(idx,it){
						objBinder.set(index+"-"+idx,it);
					})
				}else{
					objBinder.set(index,item);
				}
			})
		},
		showDetial:function($panel,type){
			var self = this;
			var $target = $panel.data('target').split(',');
			var d1='.js-detail-1',
				d2='.js-detail-2',
				e1=$target[0],
				e2=$target[1];
			if(type && type=="edit"){
				d1 = '.js-detail-2';
				d2 = '.js-detail-1';
				e1 = $target[1],
				e2 = $target[0];
			}
			if($panel.find('.js-profiles-finish').data('dbtype')=="base"){
				if(type && type=="edit"){
					self.uploadImg();
				}else{
					$('form[target*="iframe-uploader"]').remove();
				}
			}
			if($panel.find(d2).length>0){
				$panel.find(d2).fadeOut("fast",function(){
					$panel.find(d1).fadeIn();
				})
			}
			$panel.find(e1).fadeOut("fast",function(){
				$panel.find(e2).fadeIn();
			});
		},
		validate:function(element,options){
			var filter = ['[name][type!="file"][type!="hidden"][validate]'];
			if(options && options.filter) {
				filter = options.filter
			}
			var messages = {};
			element.find(filter.join(',')).each(function(index,item){
				messages[$(item).attr("name")] = $(item).metadata().messages;
				//rule[$(item).attr("name")] = $(item).metadata().validate
			})
			var setting = $.extend({},{
				meta: "validate",
				messages:messages
			},options.setting);
			return element.validate(setting);
		}
	})
	profilesMain.init();
})