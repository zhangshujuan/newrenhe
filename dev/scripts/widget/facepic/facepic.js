define(function(require, exports, module) {
	var $ = require("$");
	var face = require("face");
	var i18n = require("i18n");
	var template = require("./facepictmp.handlebars");
	var default_settings = {
		title: i18n.chooseFace.title,
		width:296,
		height:250,
		draggable: false,
		resizable: false,
		closeOnEscape: false,
		position: {
			my: "left-70 top",
			at: "left bottom",
			collision:'none'
		},
		open: function( event, ui ) {
			//Renhe.innerFace( event, ui , AddFaceEle ,afterFn);
		},
		close:function(event, ui){
			//AddFaceEle.trigger("focus");
		},
		dialogClass: "renhe-dialog-popover",
		show:{ effect: "fadeIn", duration: 400 }
	}
	//require("jqueryUi")
	var messageFacePic = function(element,options,callback){
		this.default_settings = default_settings;
		this.settings = options || {};
		this.element = element;
		this.trigger = $(element);
		this.target = null;
		this.dgElement = null;
		this.face = face;
		this.addfacepicid = null;
		this.inputArea = null;
		this.callback = callback;
		this.init();
	}
	messageFacePic.prototype = {
		init:function(){
			var self = this;
			this.fg_one = false;
			$(document).delegate(this.element,"click",function(){
				var target = $(this);
				self.target = target;
				self.addfacepicid = target.attr("addfacepicid");
				var myatArr = ["left-70 bottom","left top"];
				var myat = target.data("myat");
				myat && (myatArr=myat.split('|'));
				self.inputArea = $('#'+self.addfacepicid);
				self.dgOpts = $.extend(self.default_settings,{
					hide:true,
					position: {
						my: myatArr[0],
						at: myatArr[1],
						of: this,
						collision:'none'
					}
				},self.settings)
				if(self.dgElement) {
					self.dgElement.dialog("option",self.dgOpts)
					self.dgElement.dialog("open");
					//self.dgElement.dialog("option",self.dgOpts)
					//self.dgElement.dialog("isOpen")?self.dgElement.dialog("close"):self.dgElement.dialog("open");
					return;
				}
				if(self.fg_one) return;
				self.dgElement = $( template({
					data:self.face.name_new,
					domain:self.face.domain
				}) ).dialog(self.dgOpts);
				self.dgElement.delegate('li',"click",function(){
					var liEl = $(this).find('img');
					var fnm = liEl.attr("addfacespic");
					self.inputArea.val(self.inputArea.val()+fnm);
					self.callback && self.callback(self.inputArea,fnm)
					self.dgElement.dialog('close');
				})
				$(document).bind('click',function(e){
					if(!(e.target == self.dgElement[0] || $.contains(self.dgElement[0], e.target) || e.target == self.target[0] || $.contains(self.target[0], e.target))) {
						self.dgElement.dialog("close");
					}
				})
				self.fg_one = true;
			})
		}
	}
	return messageFacePic;
})