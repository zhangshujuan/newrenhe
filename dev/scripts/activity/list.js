define(function(require, exports, module){
	var $ = require("$");
	var i18n = require("i18n");
	var Renhe = require('Renhe');
	
	var activityListWidget = new Renhe.Widget('#J_activityListMain');
	var listTemp = require("./list-temp.handlebars");
	require('owlcarousel');
	var owlcs = $("#carousel-rhbanner");
	require('datarangepicker');
	require("autocomplete");
	var Dropdown = require('dropdown');
  	
  	owlcs.owlCarousel({
		autoPlay: 6000,
		navigation : true, // Show next and prev buttons
	    slideSpeed : 300,
	    paginationSpeed : 400,
	    singleItem:true,
	    navigation:false,
	    autoHeight: true,
	    lazyLoad : true,
	    baseClass:"renhe-banner-carousel",
	    stopOnHover : true	 
	});
  	$('.js-banner-next').click(function(){
		owlcs.trigger('owl.next');
	})
	$('.js-banner-prev').click(function(){
		owlcs.trigger('owl.prev');
	})
	
	$("ul.dropdown-menu").on("click", "[data-stopPropagation]", function(e) {
	    e.stopPropagation();
	});
  	activityListWidget.extend({
  		Event:{
  			'[data-cfg] click':"doSearch",
  			'.js-more-list click':"moreSeach"
  		},
  		initialize:function(){
  			var self = this;
  			
  			this.searchData = {query:8,start:1,city:$("#myCityVal").val(),type:"",selectDayType:""};
  			this.page = 1;
  			this.keyft = {type:"",selectDayType:"",city:"",date:""};
  			$('#chooseTime').daterangepicker({
  				singleDatePicker:true,
  				timePickerIncrement: 1,
  				format: 'YYYY-MM-DD'
  			},function(start, end, label) {
  				self.keyft["selectDayType"] = start.format('YYYY-MM-DD');
  				self.searchData["selectDayType"] = 3;
  				this.element.closest('li').find('a').removeClass('active');
  				location.href=$('#chooseTime').data('url')+self.keyft["selectDayType"];
  				//$(".js-show-date").html('<a href="javascript:void(0);" class="active" data-cfg="date='+self.keyft["selectDayType"]+'">'+self.keyft["selectDayType"]+'</a>').find('a').trigger('click');
  			})
  			this.searchCity($('#JsearchCity'))
  		},
  		setKey:function(el){
  			var kst = el.data("cfg").split("=");
  			this.searchData[kst[0]] = kst[1]
  		},
  		moreSeach:function(e){
  			this.page++;
  			this.searchData["start"] = this.page;
  			this.search($(e.currentTarget).parent("li"));
  		},
  		doSearch:function(e){
  			var $this = $(e.currentTarget);
  			$this.closest('ul').find('[data-cfg]').removeClass("active")
  			$this.addClass('active');
  			var kst = $this.data("cfg").split("=");
  			this.searchData[kst[0]] = kst[1];
  			this.keyft[kst[0]] = $this.attr('title');
  			this.targetKey = kst[0];
  			this.page = 1;
  			this.searchData["start"] = this.page;
  			this.search();
  		},
  		hasNoEvents:function(res){
  			var self = this;
  			$(".js-nolist").html("").hide();
  			if(this.page>1 || res.eventsList.length>0) return;
  			var isemp = this.searchData["type"]=="" && this.searchData["selectDayType"]=="";
  			if(this.targetKey == "city" || isemp){
  				$(".js-nolist").html(i18n.events[7].replace('{0}',this.keyft["city"]).replace('{1}',self.searchData.city)).show();
  			}else{
  				$(".js-nolist").html(this.keyft["type"]+"  "+this.keyft["selectDayType"]+"  "+i18n.events[9]).show();
  			}
  		},
  		search:function(con){
  			var self = this;
  			var url = "/events/changelist.xhtml";
  			$.ajax({
  				url:url,
  				dataType:"json",
  				data:this.searchData,
  				beforeSend:function(){
  					$('.js-more-list').html('<i class="icon-refresh icon-spin"></i> loading...')
  					//<i class="icon-refresh icon-spin"></i>
  				},
  				success:function(res){
  					res.i18n = i18n.events;
  					res.moreUrl = url;
  					self.hasNoEvents(res);
  					if(con){
  						con.replaceWith(listTemp(res));
  					}else{
  						$("#eventListContent ul").html(listTemp(res));
  					}
  				}
  			})
  		},
  		searchCity:function(ele){
			var self = this;
			var sourceUrl = "/events/getCityLib.xhtml";
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
		            return item["address_name"];
		        },
		        //item: '<li><a href="'+ele.data('url')+'"></a></li>',
		        setValue:function(item){
		            return {'data-value':item["address_name"],'real-value':item["id"],'data-name':item["address_name"]};
		        },
		        callback:function(el,val,relval){
		        	window.location.href = el.data('url')+relval;
		        }
		    })
		}
  	}).init()
})