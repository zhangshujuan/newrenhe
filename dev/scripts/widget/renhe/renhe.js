define(function(require, exports, module) {
	var $ = require("$");
	var i18n = require("i18n");
	var default_settings = {
		title:"",
		draggable: false,
		resizable: false,
		width:386,
		closeOnEscape: false,
		position: { my: "left top+8", at: "left bottom",collision:'none'},
		dialogClass: "renhe-dialog-popover",
		show:{ effect: "fadeIn", duration: 400 }
	}
	require('jquery.ui');
	Renhe = {};
	Renhe.alert = function(tips,callback){
		$('<p>'+tips+'</p>').dialog({
	      title: i18n.title.tip,
	      width: 250,
	      modal: true,
	      buttons: [
	        {
	          text: i18n.btn.confirm,
	          click: function() {
	        	  callback && typeof(callback) && callback(this)
	            $( this ).dialog( "close" );
	          }
	        }
	      ],
	      show:{ effect: "fadeIn", duration: 400 },
	      dialogClass: "renhe-dialog"
	    });
	}
	Renhe.popop = function(html,options,callback){
		var settings = $.extend({
	      title: i18n.title.tip,
	      width: 330,
	      modal: true,
	      close: function( event, ui ) {
	    	  $(this).remove();
	      },
	      buttons: [
			{
			    text: i18n.btn.confirm,
			    click: function() {
			    	var cb = false;
			    	if(callback && typeof(callback)=="function"){
			    		cb = callback(this)
			    	}
			    	if(cb=="open") return;
			  		$( this ).dialog( "close" );
			    }
			},
	        {
	          text: i18n.btn.cancel,
	          click: function() {
	            $( this ).dialog( "close" );
	          }
	        }
	      ],
	      show:{ effect: "fadeIn", duration: 400 },
	      dialogClass: "renhe-dialog"
	    },options);
		return $(html).dialog(settings);
	}
	Renhe.confirm = function(tips,callback){
		$('<p>'+(tips?tips:i18n.delConfirm)+'</p>').dialog({
	      title: i18n.title.tip,
	      width: 250,
	      buttons: [
	        {
	          text: i18n.btn.confirm,
	          click: function() {
	        	  callback && typeof(callback) && callback(this)
	            $( this ).dialog( "close" );
	          }
	        },
	        {
	          text: i18n.btn.cancel,
	          click: function() {
	        	  $( this ).dialog( "close" );
	          }
	        }
	      ],
	      show:{ effect: "fadeIn", duration: 400 },
	      dialogClass: "renhe-dialog"
	    });
	}
	
	Renhe.Widget = function(element){
		var self = this;
		this.element = $(element);
		this.Event = {
			'button[type!="submit"]':function(e){
				self.stopDefault(e);
			}
		};
		this.stopDefault = function(e){
			if ( e && e.preventDefault ){
				e.preventDefault();
			}else{
				window.event.returnValue = false
			}
			return false;
		}
		this.get = function(str,parent){
			var $parent = this.element;
			if(parent) $parent = parent;
			return $parent.find('[node-type="'+str+'"]');
		}
		this.init=function(element){
			self.initialize && this.initialize();
			self.eventBind($.proxy(self,"eventBindCb"));
			self.actionTypebind();
		}
		this.actionTypebind=function(){
			self.element.find('[action-type]').each(function(index,item){
				var $this = $(this);
				var actionName = $this.attr("action-type");
				self[actionName] && self[actionName]($this);
			})
		}
		this.eventBind=function(callback){
			$.each(this.Event,function(index,itemFn){
				var nbs = index.split(' ');
				var evtName = nbs.pop();
				self.element.delegate(nbs.join(' '),evtName,(typeof(itemFn) == 'function')?itemFn:$.proxy(self,itemFn));
			});
			callback && callback();
		}
		this.extend = function(options){
			$.each(options,function(index,item){
				self[index] = item;
			})
			return self;
		}
	}
	return Renhe;
})