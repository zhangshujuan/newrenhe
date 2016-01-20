define(function(require, exports, module) {
	var $ = require("$");
	require("common");
	require('dropdown');
	var Renhe = require("Renhe")
	var i18n = require("i18n");
	var Aid = require("aid");
	require("tab");
	require('ajaxRails');
	require('cxselect');
	require("pagination");
	require("handlebars-helper");
	var databinder = require("databinder");
	var Widget = new Renhe.Widget('#renmaiSearch');
	var dataBinder = new databinder("renmai");
	var template = require("./search-list.handlebars");
	function urldecode(str, charset, callback) {
	    window._urlDecodeFn_ = callback;
	    var script = document.createElement('script');
	    script.id = '_urlDecodeFn_';
	    var src = 'data:text/javascript;charset=' + charset + ',_urlDecodeFn_("' + str + '");'
	    src += 'document.getElementById("_urlDecodeFn_").parentNode.removeChild(document.getElementById("_urlDecodeFn_"));';
	    script.src = src;
	    document.body.appendChild(script);
	}
	var renmaiSearch = Widget.extend({
		Event:{
			'#searchRenMai click':'searchRenMai',
			'[node-type="filter-area"] input[type="text"][name]:enabled keyup':function(event){
				if(event.keyCode == 13){
		            $('#searchRenMai').trigger('click');
		        }
			},
			'#searchNavSort [data-toggle="tab"] shown.bs.tab':"searchRenMaiSort"
		},
		initialize:function(){
			var self = this;
			this.$content = this.get('content',this.element);
			this.$main = this.get('main',this.element);
			this.$filter = this.get('filter-area',this.element);
			this.$doMoreFilter = this.get('do-more-filter',this.$filter);
			this.$MoreFilter = this.$filter.find('.more-filter');
			this.morefilter = false;
			this.$main.after('<div class="remai-pagin" style="display:none;"><ul node-type="pagin" class="pagination"></ul></div>')
			this.$pagin = this.get('pagin',this.element);
			this.searchSort = {name:"searchSort",value:""};
			this.GetRequest(function(searchKey){
				self.searchKey = searchKey;
				if(!$.isEmptyObject(self.searchKey)){
//					$.each(self.searchKey,function(index,item){
//						$('[name="'+index+'"]').val(item)
//					})
					$("html,body").animate({
			    		scrollTop:self.$main.offset().top-92
			    	},500)
				};
				//self.searchKey = self.getFormData(self.$filter);
				self.$pagin.jqPaginator({
				    totalPages: 100,
				    visiblePages: 10,
				    currentPage: 1,
				    onPageChange: function (num, type) {
				    	self.searchKey.pageNo = num;
				    	self.search(self.searchKey,function(res){
				    		self.$pagin.jqPaginator('option', {
				    			currentPage: num,
				    			totalPages:res.data.pagination.totalPage
				    		});
				    		dataBinder.set('find-num',res.data.count);
				    		if(type=="init"){
					    		self.$pagin.parent('div').show();
					    		self.$filter.find('[name="query"]').val(res.keyword);
					    		self.$filter.find('[name="company"]').val(res.company);
					    		self.$filter.find('[name="title"]').val(res.title);
					    		self.$filter.find('[name="edu"]').val(res.edu);
					    	}
				    	})
				    	
				    }
				});
			});
			this.$doMoreFilter.on("click",function(e){
				var $this = $(e.currentTarget);
				self.$MoreFilter.slideToggle("fast");
				self.morefilter = !self.$MoreFilter.has(':hidden');
				$this.find('span').toggle();
				$this.siblings('span').toggle();
			})
			$('#elementAreaDist').cxSelect({ 
			  url: Aid.address,
			  selects: ['province', 'city', 'area'], 
			  nodata: 'none',
			  firstTitle:i18n.select
			});
			$('#elementAreaIndustry').cxSelect({ 
			  url: Aid.industry,
			  selects: ['primary', 'secondary'], 
			  nodata: 'none',
			  firstTitle:i18n.select
			});
		},
		searchRenMai:function(e){
			var self = this;
			self.searchKey = this.getFormData(this.$filter);
			self.searchKey[self.searchSort.name] = self.searchSort.value;
			self.searchKey.pageNo = 1;
			self.search(self.searchKey,function(res){
	    		self.$pagin.jqPaginator('option', {
	    			currentPage: 1,
	    			totalPages:res.data.pagination.totalPage
	    		})
	    		dataBinder.set('find-num',res.data.count);
	    	})
	    	$("html,body").animate({
	    		scrollTop:this.$main.offset().top-92
	    	},500)
		},
		searchRenMaiSort:function(e){
			var self = this;
			var keyArr = $(e.target).data("params").split("=");
			self.searchSort = {name:keyArr[0],value:keyArr[1]};
			self.searchKey[self.searchSort.name] = self.searchSort.value;
			self.search(self.searchKey,function(res){
	    		self.$pagin.jqPaginator('option', {
	    			currentPage: 1,
	    			totalPages:res.data.pagination.totalPage
	    		})
	    		dataBinder.set('find-num',res.data.count);
	    	})
	    	$("html,body").animate({
	    		scrollTop:this.$main.offset().top-92
	    	},500)
		},
		getFormData:function(fm){
			var data = {};
			var fterArr = [
			    '[type="hidden"][name]',
			    'select[name]',
			    '[type="text"][name]:enabled',
			    'textarea',
			    '[type="radio"][name]:checked'
			]
			fm && fm.find(fterArr.join(',')).each(function(index,item){
				data[$(item).attr("name")] = $(item).val();
			})
			return data;
		},
		GetQueryString:function(name){
		     var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
		     var r = window.location.search.substr(1).match(reg);
		     if(r!=null)return  unescape(r[2]);
		     return null;
		},
		GetRequest:function(callback){
			var url = window.location.search;
		    var theRequest = {};
		    var index = 0;
		    if (url.indexOf("?") != -1) {
		        var str = url.substr(1);
		        strs = str.split("&");
		        for(var i = 0; i < strs.length; i ++) {
		        	var st = strs[i].split("=");
		        	theRequest[st[0]] = st[1];
	        		index++;
//		        	urldecode(st[1],"gbk",function(sts){
//		        		theRequest[st[0]] = decodeURI(sts);
//		        		index++;
//		        	})
		        }
		        setInterval(function(){
		        	if(index>=strs.length){
		        		callback && callback(theRequest);
		        		index = 0;
		        	}
		        },300)
		    }else{
		    	callback && callback({});
		    }
		},
		search:function(data,callback){
			var self = this;
			this.ajax({
				url:IpcUrl.search,
				data:data
			},function(res){
				res.i18n = i18n.searchRenmai;
				self.$content.html(template(res));
				if(res.data.pagination.totalPage>1){
					self.$pagin.closest('.remai-pagin').show();
				}else{
					self.$pagin.closest('.remai-pagin').hide();
				}
				callback && typeof(callback) == "function" && callback(res)
			})
		},
		ajax:function(options,callback){
			var config = $.extend({},{
				dataType:"json",
				type:"get",
				success:function(res){
					callback && typeof(callback) == "function" && callback(res)
				}
			},options)
			$.ajax(config);
		}
	})
	renmaiSearch.init();
})