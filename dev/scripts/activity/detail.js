define(function(require, exports, module){
	var $ = require("$");
	var Renhe = require('Renhe');
	require("owlcarousel");
	var dataBinder = require('databinder');
	var i18n = require("i18n");
	require('scripts/widget/showpicbox/picshow')
	require('metadata');
    require('jquery-validate');
    require('ajaxRails');
    require('dropdown');
    require('tab');
    $.metadata.setType("attr", "validate");
    $.validator.setDefaults({
	    debug: true
	 });
    $.validator.addMethod("mobile", function(value, element, param) {
        var reg = /(^(0|86|17951)?(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$)/;
        return reg.test(value);
    });
	var Widget = new Renhe.Widget('#J_activity_detial');
	Widget.extend({
		Event:{
			'.js-index-box span click':"changeIndex",
			'.js-index-box input keyup':"keyupIndex",
			'.js-index-box input blur':"blurIndex",
			'.js-iwantjoin click':"iWantJoin",
			'[name="tickets"] click':'checkTickets',
			'#payEventsJoinForm button[type="submit"] click':"payEventsJoin",
			'#isInvoice click':function(e){
				var $this = $(e.currentTarget);
				if($this.prop("checked")){
					$('#invoiceInfo').show();
				}else{
					$('#invoiceInfo').hide();
				}
			}
		},
		initialize:function(){
			var self = this;
			this.flag = false;
			this.arrorText = i18n.events[10];
			this.charge = new dataBinder("charge");
			self.charge.set("total","0.00");
			$('.js-index-box input').each(function(index){
				self.charge.set("price"+(index+1),"0.00")
				self.charge.set("num"+(index+1),"0");
			})
			this.validate($('#payEventsJoinForm'));
			$(document).delegate('select[name="linkway"]','change',function(e){
				self.linkwayChange(e)
			})
			$(document).delegate('[name="linktype"]','click',function(e){
				if($('[name="linktype"]:checked').val()=="1"){
					$('select[name="linkway"]').trigger('change');
				}else{
					$('[name="linkvalue"]').rules("remove");
				}
			})
		},
		linkwayChange:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var linkvalueInput = $('[name="linkvalue"]');
			var json = eval("(" + linkvalueInput.data('validate-messages') + ")");
			if(this.iwtlinkVjson){
				linkvalueInput.rules("remove");
			}
			linkvalueInput.rules("add", json[$this.val()]);
			this.iwtlinkVjson = json[$this.val()];
		},
		checkTickets:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var total = this.charge.get("total")*1;
			var price = this.charge.get("price"+$this.closest('tr').find('[data-idx]').data("idx"))*1;
			if($this.prop("checked")){
				this.charge.set("total",(total+price).toFixed(2))
			}else{
				this.charge.set("total",(total-price).toFixed(2))
			}
		},
		payEventsJoin:function(e){
			var self = this;
			var _total = this.charge.get("total")*1;
			var $this = $(e.currentTarget);
			if(_total==0){
				this.arrorText = i18n.events[10];
			}else{
				this.arrorText = false;
			}
			$this.closest('form').find('[name="tickets"]:checked').each(function(){
				if($(this).closest('tr').find('[name="ticketsNum"]').data('overNumber')){
					return e.preventDefault();
				}
			})
			if(this.arrorText){
				Renhe.alert(this.arrorText);
				return e.preventDefault();
			}
			//$(e.currentTarget).closest('form').submit();
		},
		iWantJoin:function(e){
			var self = this;
			var $this = $(e.currentTarget);
			var role = $this.data("role");
			var dgs = Renhe.popop($("#"+role).html(),{
				width:492,
				title:i18n.events[11],
				create:function(event, ui){
					self.validate($(event.target));
				}
			},function(el){
				var $form = $(el);
				if(!$form.valid()){
					return "open";
				}
				$.ajax({
					url:$form.attr('action'),
					type:$form.attr("method"),
					data:self.getFormData($form),
					dataType:"json",
					success:function(res){
						if(res.successFlag){
							doRefresh();
						}else{
							Renhe.alert(res.errorMsg);
						}
					}
				})
			})
		},
		getFormData:function($form){
			var result = {};
			$form.find("[name]:enabled").each(function(index,item){
				if($(item).attr("type")=="radio" && !$(item).prop("checked")){
					return;
				}
				if($(item).attr("type")=="checkbox" && !$(item).prop("checked")){
					return;
				}
				result[$(item).attr('name')] = $(item).val();
			})
			return result;
		},
		setCharge:function(el){
			var self = this;
			var $parent = el.parent(),
				index = $parent.data('idx'),
				price = $parent.data("price")*1;
			var v = el.val();
			var	tpr = this.charge.get("price"+index)*1,
				total = this.charge.get("total")*1,
				_num=v*1,
				_tpr = (price*_num).toFixed(2)
				_total = total+(_tpr-tpr);
			this.setLimit(el);
			this.charge.set("num"+index,_num)
			this.charge.set("price"+index,_tpr);
			if(el.closest('tr').find('[name="tickets"]').prop('checked')){
				this.charge.set("total",_total.toFixed(2))
			}
		},
		
		setLimit:function($this){
			var v = $this.val()*1;
			var limit = $this.data('limit');
			var surplus = $('#surplusTicket'+$this.data('id'));
			if(v>limit){
				surplus.show();
				$this.data("overNumber",true);
			}else{
				surplus.hide();
				$this.data("overNumber",false);
			}
		},
		blurIndex:function(e){
			var $this = $(e.currentTarget);
			var v = $this.val();
			if(v=="") {
				$this.val(0);
			}else{
				return;
			}
			this.setCharge($this)
		},
		keyupIndex:function(e){
			var $this = $(e.currentTarget);
			$this.val($this.val().replace(/[^0-9]/g,''));
			var val = $this.val();
			if(val=="") return;
			this.setCharge($this)
		},
		changeIndex:function(e){
			var $this = $(e.currentTarget);
			var type = $this.data("role");
			var $el = $this.siblings('input')
			var num = $el.val();
			num = num==""?0:num*1;
			if(type == "add"){
				num = num+1;
			}else{
				num = num==0?0:num-1;
			}
			$el.val(num)
			this.setCharge($this.siblings('input'))
		},
		validate:function(element){
			var filter = ['[name][type!="file"][validate]:enabled','select[name]:enabled'];
			var messages = {};
			var rule = {}
			element.find(filter.join(',')).each(function(index,item){
				messages[$(item).attr("name")] = $(item).metadata().messages;
				rule[$(item).attr("name")] = $(item).metadata().validate
			})
			var setting = {
				meta: "validate",
				messages:messages,
				rules:rule,
				submitHandler:function(form){
		            form.submit();
		        },   
				errorPlacement:function(error, element){
					if(element.data('error-target')){
						$(element.data('error-target')).html(error.html())
					}else{
						element.parent().append(error);
					}
				}
			};
			return element.validate(setting);
		}
	}).init()
})
