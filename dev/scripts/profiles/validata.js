define(function(require, exports, module) {
	var i18n = require("i18n");
	require('metadata');
    require('jquery-validate');
    
    $.metadata.setType("attr", "validate");
    $.validator.setDefaults({
       debug: true
    })
    $.validator.addMethod("srequired", function(value) {
    	var reg = /0|\s/;
        return reg.test(value);
    });
    var validateFn = {
    	validate:function(element,options){
			var filter = ['[name][type!="file"][type!="hidden"][validate]:enabled'];
			var validatas = {};
			if(options && options.filter) {
				filter = options.filter
			}
			$(element).each(function(idx,form){
				var messages = {};
				$(form).find(filter.join(',')).each(function(index,item){
					messages[$(item).attr("name")] = $(item).metadata().messages
				})
				var setting = $.extend({},{
					meta: "validate",
					messages:messages
				},options.setting);
				validatas[idx] = $(element).validate(setting);
			})
			return validatas;
		}
    }

})