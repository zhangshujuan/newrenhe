define(function(require, exports, module) {
	var WKim = require("WKim");
	var Myim = require("./myim");
	function getLoginInfo(callback) {
		$.ajax({
		    url: "/im/ajax/getImSignModel.xhtml",
		    dataType: "json",
		    success: function(res) {
		        callback(res);
		    }
		});
	}
	function authLogin(authInfo,type){
		if(type) WKim.auth.logout()
	    WKim.auth.login(authInfo).then(function(token) {
	    	window.kickout = false;
	    	if(type) return;
	        new Myim();
	    },function(){
	    	console.log("login fail")
	    });
	}
	WKim.authListener.on("logout",function(){
		window.logout = true;
    	console.log("login fail")
    });
	module.exports = {
	    authLogin:authLogin,
	    getLoginInfo:getLoginInfo
	}
})
