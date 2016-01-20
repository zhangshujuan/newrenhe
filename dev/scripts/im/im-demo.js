define(function(require, exports, module) {
	var LoginModel = require("scripts/im/modules/login");
	$(document).on("click",function(){
    	if(window.kickout){
    		LoginModel.getLoginInfo(function(res){
				LoginModel.authLogin(res.imSignModel,true);
			})
    	}
    })
	LoginModel.getLoginInfo(function(res){
		LoginModel.authLogin(res.imSignModel);
	})
})
