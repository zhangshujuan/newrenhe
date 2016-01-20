define(function(require, exports, module){
	var $ = require("$");
	var i18n = require("i18n");
	var Aid = require("aid");
	var moment = require("moment");
	var Uploader = require("uploader")
	require('datarangepicker');
	require('cxselect');
	require('metadata');
	require('dropdown');
    require('jquery-validate');
    require('ajaxRails');
	$.metadata.setType("attr", "validate");
	var Renhe = require('Renhe');
	var fileNum = $('li[class*="fileid-"]').length;
	var u_index= $('li[class*="fileid-"]').length;
	var mapIsShow = $("#checkMap").prop("checked");
	var BaiduMap = {
		point:{
			lng:$("#lngValue").val(),
			lat:$("#latValue").val()
		},
		init:function(element){
			BaiduMap.map = new BMap.Map("baiduMapContainer");
	   		BaiduMap.map.centerAndZoom("杭州",15);
			//var point = new BMap.Point(BaiduMap.point.lng,BaiduMap.point.lat );
	   		//BaiduMap.map.centerAndZoom(point, 15);
	   		// 缩放控件
			BaiduMap.map.addControl(new BMap.NavigationControl());
			//地图类型
			BaiduMap.map.addControl(new BMap.MapTypeControl({mapTypes: [BMAP_NORMAL_MAP,BMAP_HYBRID_MAP]}));
			BaiduMap.map.addEventListener("load", function(e){ 
			    var marker = new BMap.Marker(e.point);
			    BaiduMap.map.addOverlay(marker);              // 将标注添加到地图中
			    marker.enableDragging();
			});
			BaiduMap.localSearch = new BMap.LocalSearch(BaiduMap.map, {
		    	renderOptions: {
		    	     pageCapacity: 8,    
		    	     autoViewport: true,    
		    	    selectFirstResult: false    
		    	}    
		 	});
		},
		getPointByDragend:function(point) {
			BaiduMap.map.clearOverlays();
		    var marker = new BMap.Marker(point);
			// 将标注添加到地图中
		    BaiduMap.map.addOverlay(marker);
		    marker.enableDragging();
			marker.addEventListener("dragend", function(e){ 
		    	var lngValue = e.point.lng;
		    	var latValue = e.point.lat;
				BaiduMap.setValue(lngValue,latValue)
				BaiduMap.point = {
		    		lng:lngValue,
		    		lat:latValue
		    	}
			});
	    },
	    setValue:function(lng,lat){
	    	$("#lngValue").length>0 && $("#lngValue").val(lng);
			$("#latValue").length>0 && $("#latValue").val(lat);
	    },
		doSearch:function(city){//根据城市搜索
			BaiduMap.localSearch.setSearchCompleteCallback(function(searchResult){  
    	        var poi = searchResult.getPoi(0);  
    	        BaiduMap.map.centerAndZoom(poi.point, 16);
    	        BaiduMap.setValue(poi.point.lng,poi.point.lat)
    	        BaiduMap.getPointByDragend(poi.point);
    	        BaiduMap.point = poi.point;
    	    });  
    	    BaiduMap.localSearch.search(city);  
		},
		search:function(firstCity,keyword){//根据地址查找
	    	var myGeo = new BMap.Geocoder();
	    	myGeo.getPoint(keyword, function(point){
	    	   if (point) {
	    	     BaiduMap.map.centerAndZoom(point, 18);
	    	     BaiduMap.setValue(point.lng,point.lat);
	    		 BaiduMap.getPointByDragend(point);
	    		 BaiduMap.point = point;
	    	   } else {
	    		   BaiduMap.doSearch(firstCity);
	    	   }
	    	}, firstCity);
		}
	}
	BaiduMap.init();
	var mapCity = "";
	var activityFormWidget = new Renhe.Widget('#J_activityFormMain');
	$.validator.addMethod("nocgtotal", function(value, element, param) {
		var pv = ($(param).val() == ''?0:$('[name="'+param+'"]').val());
		
    	return parseInt(value,10)<=parseInt(pv,10)
    });
	$.validator.addMethod("nototal", function(value, element, param) {
		var pv = ($(param).val() == ''?0:$('[name="'+param+'"]').val());
		
    	return parseInt(value,10)>=parseInt(pv,10)
    });
	$.validator.addMethod("compareDate", function(value, element, param) {
		var c = param.split('|');
		var oneX = moment(value.split(i18n.events[1])[0]).format('X');
		if(/\~/.test(c[1])){
			var ttr = c[1].split('~');
			var twoX = moment($(ttr[0]).val()).format('X');
			var treeX = moment($(ttr[1]).val()).format('X');
		}else{
			var twoX = moment($(c[1]).val()).format('X');
		}
		if(c[0]=="lt"){
			return oneX<=twoX;
		}
		if(c[0]=="gt"){
			return oneX>=twoX;
		}
		if(c[0]=="gt~lt"){
			return (oneX>=twoX && oneX<=treeX);
		}
    });
	$.validator.addMethod("mobile", function(value, element, param) {
        var reg = /(^(0|86|17951)?(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$)/;
        return reg.test(value);
    });
	window.setvalue = function(ids, names){
		var divValue = $("#shareToDiv").html();
		var arrid = ids.split(",");
		var arrname = names.split(",");
    	for(var i = 0; i < arrid.length; i++){
    		if(divValue.indexOf(arrid[i]) == -1){
    			
    			$("#shareToDiv").append("<span class='label label-default mr5' id='"+arrid[i]+"'><input name='mids' type='hidden' value='"+arrid[i]+"'/><span class='contact-name'>" + arrname[i] + "<a href='javascript:void(0)' class='red' onclick='jQuery(this).parent().parent().remove();'>×</a></span></span>");
    		}
    	}
	}
	window.authWeiboCallback = function() {
    	$('body').undelegate("#weiboShareCheckbox","click")
    	$("#weiboShareCheckbox").prop("checked", true);
    	Renhe.alert(i18n.sinaWeibo.bindSuccess);
    }
	var isCityChange = false;
	var activityForm = activityFormWidget.extend({
		Event:{
			"#J_city change":function(e){
				
				var $this = $(e.currentTarget);
				var val = $this.val();
				if(val=="") {
					return $('#locationId').hide()
				}else{
					$('#locationId').show()
				}
				mapCity = $this.find('option:selected').text();
				BaiduMap.doSearch(mapCity);
				
			},
			"#locationId blur":function(e){
				var $this = $(e.currentTarget);
				var val = $this.val();
				if(val=="") return;
				BaiduMap.search(mapCity,val);
			},
			'#checkMap click':function(e){
				var $this = $(e.currentTarget);
				if($this.prop('checked')){
					$("#baiduMapContainer").show();
					mapIsShow = true;
					BaiduMap.setValue(BaiduMap.point.lng,BaiduMap.point.lat);
					setTimeout(function(){
						mapIsShow && BaiduMap.search($('#J_city option:selected').text(),$("#locationId").val());
					},500)
				}else{
					$("#baiduMapContainer").hide();
					mapIsShow = false;
					BaiduMap.setValue("0.0","0.0");
				}
			},
			'.js-readonly focusin':function(){
				$(this).prop('readonly', true);
			},
			'.js-readonly focusout':function(){
				$(this).prop('readonly', false);
			},
			'input[name*="ticketType_"],input[name*="ticketAmount_"],input[name*="ticketPrice_"] keyup':function(e){
				$(this).siblings('input[name]').val($(this).val());
			},
			'.js-invite-friends click':'inviteFriends',
			'.js-activity-cost label click':"activityCost",
			'.js-addtickettypes click':"addtickettypes",
			'.js-cost-delete click':"costDelete",
			'.js-cost-description click':'addCostDescription',
			'#J_activityForm ajax:params':function(){
				$('[name="ticketDescription"]:enabled').each(function(){
					if($(this).val()==""){
						$(this).val("none");
					}
				})
			},
			'#J_activityForm ajax:success':'activityback',
			'#weiboShareCheckbox click':'weiboShare',
			'.js-remove-file click':'removeFile'
		},
		initialize:function(){
			var self = this;
			this.upload_index = 0;
			this.eventPhotos = this.getInitPhotos();
			this.ticketsNum = 0;
			$('#activityAddress').cxSelect({ 
			  url: Aid.address,
			  selects: ['country','province', 'city'], 
			  nodata: 'none',
			  required:false,
			  firstTitle:i18n.select,
			  firstValue:""
			});
			if($('#reservationtime').val()==""){
				$('#reservationtime').val(moment().subtract('days', -1).format('YYYY-MM-DD HH')+":00" + i18n.events[1]+ moment().subtract('days', -7).format('YYYY-MM-DD HH')+":00")
				$('[name="startTimeEx"]').val(moment().subtract('days', -1).format('YYYY-MM-DD HH')+":00");
				$('[name="endTimeEx"]').val(moment().subtract('days', -7).format('YYYY-MM-DD HH')+":00")
			}
			$('#todayMoment').val(moment().format('YYYY-MM-DD HH')+":00")
			$('#reservationtime').daterangepicker({
			    timePicker: true,
			    timePickerIncrement: 1,
			    startDate: moment().subtract('days', -1),
			    endDate: moment().subtract('days', -7),
			    format: 'YYYY-MM-DD HH:mm',
			    separator: i18n.events[1]
			}, function(start, end, label) {
				var startT=start.format('YYYY-MM-DD HH:mm');
				var endT = end.format('YYYY-MM-DD HH:mm');
				$('[name="startTimeEx"]').val(startT);
				$('[name="endTimeEx"]').val(endT);
				//$('#reservationtime').val(startT + i18n.events[1]+ endT)
			});
			
			$('#reservationEndtime').daterangepicker({
				timePicker: true,
				singleDatePicker:true,
				timePickerIncrement: 1,
				format: 'YYYY-MM-DD HH:mm'
			}, function(start, end, label) {})
			
			setTimeout(function(){
				self.initValidata();
			},500)
			this.uploadImg();
			setTimeout(function(){
				mapIsShow && BaiduMap.search($('#J_city option:selected').text(),$("#locationId").val());
			},800)
		},
		weiboShare:function(e){
			var _this = e.currentTarget;
			var weiboBind = Boolean($(_this).attr('weiboBind'));
			var sender = $(_this).attr('sender');
			var domainName = $(_this).attr('domainName');
			if(!weiboBind) {
				window.open('/weibo/authCall.xhtml?sender=' + sender + '&domainName=' + domainName + '&requestSuffix=.shtml','','toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=600,height=400,left=400,top=200');
	        	return false;
			}
			return true;
		},
		activityback:function(e,res){
			var self = this;
			var _this = $(e.currentTarget);
			if(!res.successFlag){
				Renhe.alert(res.errorMsg)
			}else{
				window.location.href='/events/uplist/owner.xhtml';
			}
		},
		inviteFriends:function(){
			this.openwin("/find/findfriend.html?bk=msgcompose&value=getvalue&action=setvalue",700,520,"choose Friends","no");
			return false;
		},
		openwin:function(url,x_width,y_width,title,scroll){
			var left=(screen.width-x_width)/2;
			var top=(screen.height-y_width)/2;
			if(scroll==undefined){scroll="yes";}
			window.open(url,title,"top="+top+",left="+left+",alwaysRaised=yes,statusbar=no,menubar=no,toolbar=no,scrollbars="+scroll+",resizable=no,width=" + x_width + ",height=" + y_width);
		},
		initValidata:function(){
			this.validate($('#J_activityForm'),{
				setting:{
					ignore:"",
					errorPlacement:function(error, element){
						if(element.data('error-target')){
							$(element.data('error-target')).html(error)
						}else{
							element.parent().append(error);
						}
					}
				}
			})
		},
		getInitPhotos:function(){
			var result = {};
			var es = $('#eventPhotoUir').val();
			if(es=="") return {};
			$.each(es.split(','),function(index,item){
				result[index] = {savePath:item};
			})
			return result;
		},
		setPhotosUrl:function(){
			var uirArr = [];
			$.each(this.eventPhotos,function(index,item){
				item.savePath && uirArr.push(item.savePath)
	    	})
	    	$('#eventPhotoUir').val(uirArr.join(","))
		},
		uploadImg:function(){
			var self = this;
			var uploader_1 = new Uploader({
			    trigger: '#posterUploadImage',
			    accept: 'image/*',
			    error: function(file) {
			    	console.log(file)
			    },
			    success: function(response) {
			    	var res = $.parseJSON(response);
			    	console.log($(this.settings.trigger))
			    	$('#posterUploadImageuir').val(res.savePath)
			    	$('#posterPreview').attr('src',res.picUrl)
			    },
			    progress: function(event, position, total, percent, files) {
			        console.log(percent);
			    }
			});
			var uploader_2 = new Uploader({
			    trigger: '#eventPhoto',
			    accept: 'image/*',
			    error: function(file) {
			        
			        console.log(file)
			    },
			    success: function(response) {
			    	var res = $.parseJSON(response);
			    	var trigger = $(this.settings.trigger);
			    	var uirArr = []
			    	var _li = trigger.closest('li').siblings('li.fileid-'+(u_index-1));
			    	if(!res.success){
			    		_li.remove();
			    		return;
			    	}
			    	_li.html('<div><a href="javascript:void(0);" class="delimg icon-remove js-remove-file" data-id="'+(u_index-1)+'"></a><img src="'+res.picUrl+'"/></div>')
			    	self.eventPhotos[u_index-1] = res;
			    	fileNum +=1;
			    	if(fileNum == 9){
			    		$('a.fileinput-button').hide();
			    	}
			    	self.setPhotosUrl();
			    },
			    progress: function(event, position, total, percent, files) {
			        $(this.trigger).closest('li').siblings('li.fileid-'+(u_index-1)).find(".js-progress").text(percent+"%")
			    }
			}).change(function(files) {
				
				var str = '';
	        	if(files.length>1){
        			return;
        		}
	        	str+='<li class="file-item fileid-' + u_index + '"><p class="text-center"><i class="icon-spinner icon-spin"></i><span class="js-progress"></span></p><p class="text-overflow">'+files[0].name+'</p></li>';
	        	$(this.settings.trigger).closest('li').before(str);
	        	u_index++;
			    // Default behavior of change is
			    this.submit();
			});
			setInterval(function(){
				$("#eventPhoto").trigger('mouseover');
				$("#posterUploadImage").trigger('mouseover');
			},500)
		},
		removeFile:function(e){
			var self = this;
			var _this = $(e.currentTarget);
			var idx = _this.data('id');
			delete self.eventPhotos[idx];
			if(--fileNum < 9){
				$('a.fileinput-button').show();
			}
			_this.closest('li').remove();
			self.setPhotosUrl();
			return false;
		},
		activityCost:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var _target = $this.data("target");
			var $target = $(_target);
			$this.removeClass('btn-black').addClass('btn-info').siblings('label').removeClass('btn-info').addClass('btn-black');
			$('.js-cost').not($target).slideUp("fast").find('input[name],textarea[name]').prop('disabled',true);;
			$target.slideDown("fast").find('input[name],textarea[name]').prop('disabled',false);
			var types = $target.is(':visible')?"add":"remove";
			if(_target==".js-cost-num"){
				this.updateValid($target,['input[name="money"]'],types)
			}
			if(_target==".js-cost-charge"){
				this.updateValid($target,['input[name*="ticketType_"]','input[name*="ticketAmount_"]','input[name*="ticketPrice_"]'],types)
			}
		},
		addValidata:function(fm){
			var arr = ['ticketType','ticketAmount','ticketPrice'];
			$.each(arr,function(index,item){
				fm.find('input[name*="'+item+'_"]').each(function(idx,its){
					var jsons = eval("(" + $(its).attr('validate') + ")");
					jsons.validate.messages = jsons.messages;
				    $(its).rules("add", jsons.validate);   
				});
			})
		},
		updateValid:function(fm,arr,type){
			$.each(arr,function(index,item){
				fm.find(item).each(function(idx,its){
					var jsons = eval("(" + $(its).attr('validate') + ")");
					jsons.validate.messages = jsons.messages;
				    $(its).rules(type, jsons.validate);   
				});
			})
		},
		addtickettypes:function(e){
			var $this = $(e.currentTarget);
			this.ticketsNum = this.ticketsNum+1;
			var $addEle = $($($this.data("tmp")).html().replace(/\{\{index\}\}/g,this.ticketsNum));
			$this.closest('.cost-charge').find('.cost-con').last().after($addEle);
			this.addValidata($addEle)
		},
		costDelete: function(e){
			var $this = $(e.currentTarget);
			$this.closest('.cost-con').remove();
		},
		addCostDescription:function(e){
			var $this = $(e.currentTarget);
			var $discr = $this.closest('.cost-con').find('.js-description-table');
			//if($discr.is(':visible')){
				//$discr.find('textarea').prop("disabled",true)
			//}else{
				//$discr.find('textarea').prop("disabled",false)
			//}8
			$discr.toggle();
		},
		validate:function(element,options){
			var filter = ['[name][type!="file"][validate]:enabled','select[name]:enabled'];
			if(options && options.filter) {
				filter = options.filter
			}
			var messages = {};
			var rule = {}
			element.find(filter.join(',')).each(function(index,item){
				messages[$(item).attr("name")] = $(item).metadata().messages;
				rule[$(item).attr("name")] = $(item).metadata().validate
			})
			var setting = $.extend({},{
				meta: "validate",
				messages:messages,
				rules:rule
			},options.setting);
			return element.validate(setting);
		}
	})
	activityForm.init();	
})