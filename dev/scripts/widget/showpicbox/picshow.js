define(function(require, exports, module) {
	var jQuery = require("$");
	var i18n = require("i18n");
	var loadImg = '<img src="http://s2.renhe.cn/images/renhe_loadding_32x32.gif" class="load-img">';
	var etag = false;
	jQuery.fn.extend({
		rotate: function(angle,whence) {  
		    var p = this.get(0);
		    // we store the angle inside the image tag for persistence  
		    if (!whence) {  
		        p.angle = ((p.angle==undefined?0:p.angle) + angle) % 360;  
		    } else {  
		        p.angle = angle;  
		    }  
		  
		    if (p.angle >= 0) {  
		        var rotation = Math.PI * p.angle / 180;  
		    } else {  
		        var rotation = Math.PI * (360+p.angle) / 180;  
		    }  
		    var costheta = Math.round(Math.cos(rotation) * 1000) / 1000;  
		    var sintheta = Math.round(Math.sin(rotation) * 1000) / 1000;  
		    //alert(costheta+","+sintheta);  
		   
		    if (document.all && !window.opera) {  
		        var canvas = document.createElement('img');  
		  
		        canvas.src = p.src;  
		        canvas.height = p.height;  
		        canvas.width = p.width;  
		  
		        canvas.style.filter = "progid:DXImageTransform.Microsoft.Matrix(M11="+costheta+",M12="+(-sintheta)+",M21="+sintheta+",M22="+costheta+",SizingMethod='auto expand')";  
		    } else {  
		        var canvas = document.createElement('canvas');  
		        if (!p.oImage) {  
		            canvas.oImage = new Image();  
		            canvas.oImage.src = p.src;  
		        } else {  
		            canvas.oImage = p.oImage;  
		        }  
		  
		        canvas.style.width = canvas.width = Math.abs(costheta*canvas.oImage.width) + Math.abs(sintheta*canvas.oImage.height);  
		        canvas.style.height = canvas.height = Math.abs(costheta*canvas.oImage.height) + Math.abs(sintheta*canvas.oImage.width);  
		  
		        var context = canvas.getContext('2d');  
		        context.save();  
		        if (rotation <= Math.PI/2) {  
		            context.translate(sintheta*canvas.oImage.height,0);  
		        } else if (rotation <= Math.PI) {  
		            context.translate(canvas.width,-costheta*canvas.oImage.height);  
		        } else if (rotation <= 1.5*Math.PI) {  
		            context.translate(-costheta*canvas.oImage.width,canvas.height);  
		        } else {  
		            context.translate(0,-sintheta*canvas.oImage.width);  
		        }  
		        context.rotate(rotation);  
		        context.drawImage(canvas.oImage, 0, 0, canvas.oImage.width, canvas.oImage.height);  
		        context.restore();  
		    }  
		    canvas.id = p.id;  
		    canvas.angle = p.angle;  
		    p.parentNode.replaceChild(canvas, p);  
		},
		rotateRight:function(angle) {  
		    this.rotate(angle==undefined?90:angle);  
		},
		rotateLeft:function(angle) {  
		    this.rotate(angle==undefined?-90:-angle);  
		}
	});
	(function($){
		var template = require('./showtemp.handlebars');
		var picShowFn = function(element, useroptions){
	        var obj = this;
		    useroptions = (useroptions === undefined) ? {} : useroptions;
		    var options = $.extend({
	           element: element
	        }, useroptions);
	        obj.Enode = $(options.element).closest('[node-type="feed_list_media_prev"]');
	        obj.showPicBox = obj.Enode.siblings('[node-type="showPicBox"]');
	        obj.isShowArr = [];
	        obj.showPicBox.css("width",obj.showPicBox.width()).hide();
	        obj.lgimgId = "showImg_"+new Date().getTime();
	        obj.arginit = function(){
	            obj.Direction = 'smallcursor';
	            obj.len = 0;
	            obj.xy = {x:0,y:0};
	            options.data=[];
	            obj.Enode.find("img[picurl]").each(function(index,item){
	            	var imgSrc = $(item).attr("src");
	            	options.data.push({
	            		tiny:imgSrc,
	            		big:$(item).attr("picurl")
	            	})
	            })
	            obj.len = options.data.length;
	        }
	        obj.init = function(el) {
	        	var objlis = obj.Enode.find('a');
	        	obj.index = objlis.index(el);
	    		obj.toBig();
	        }
	        obj.tosmall = function(){
	        	obj.showPicBox.empty();
	        	obj.Enode.show();
	        }
	        obj.loadImage = function(url, callback, before){
	            before && typeof(before) == "function" && before(url);
	        	var img = new Image();
	        	img.src = url;
	        	img.onload = function(){
	        		callback && typeof(callback) == "function" && callback(img);
	        	}
	        }
	        obj.toBig = function(){
	        	obj.arginit();
	        	obj.Enode.hide();
	        	obj.showPicBox.html(template({data:options.data,optxt:i18n.showpic}));
	            obj.showPicBox.find('[action-type="tosmall"]').click(function(){obj.tosmall()});   
	        	
	            obj.eventInit();
	            obj.mouseInit(obj.showPicBox.find('[node-type="picShow"]'));
	            obj.imgbox = obj.showPicBox.find('[node-type="picShow"] li');
	            if(obj.len>1){
	            	obj.carouselInit();
	            	obj.showPicBox.find('[node-type="mediaShowImg"]').find("[data-index]").click(function(){
	                    obj.directionIndex($(this).data('index'));
	                });
	            }else{
	            	obj.isShowArr[0] = true;
	                obj.showBigPic(options.data[0].big)
	                return;
	            }
	            obj.directionIndex(obj.index);
	        }
	
	        obj.toLeft = function(){
	        	var index;
	        	if(obj.index > 0) {
	        		index = obj.index-1
	        	}else{
	        		return;
	        	}
	            obj.directionIndex(index);
	        }
	        obj.toRight = function(){
	        	var index;
	        	if( obj.index<(obj.len-1)) {
	        		index = obj.index+1
	        	}else{
	        		return;
	        	}
	            obj.directionIndex(index);
	        }
	        obj.eventInit = function(){
	            var angle = 0;   
	            var smlis = obj.showPicBox.find('[node-type="mediaShowImg"] .owl-item a');
	            obj.showPicBox.find('[action-type="trunLeft"]').click(function(){
	                angle+=90;
	                $("#"+obj.lgimgId).rotateLeft();
	            })
	            obj.showPicBox.find('[action-type="trunRight"]').click(function(){
	                angle-=90;
	                $("#"+obj.lgimgId).rotateRight();
	            })
	        }
	        obj.carouselInit = function(){
	        	var self = this;
	        	this.owlpicshow = obj.showPicBox.find('[node-type="mediaShowImg"]');
	        	this.owlpicshow.owlCarousel({
					items : 9,
					itemsDesktop : [1199,6],
					itemsDesktopSmall : [990,9],
					pagination:false
				});
	        	obj.showPicBox.find('[action-type="picshowNext"]').click(function(){
					self.owlpicshow.trigger('owl.next');
				})
				obj.showPicBox.find('[action-type="picshowPrev"]').click(function(){
					self.owlpicshow.trigger('owl.prev');
				})
	        }
	        obj.showBigPic = function(_src){
	        	var nloadshowPIC = function(img){
	        		if(etag) etag.find(".load-img").remove();
	                obj.showPicBox.show();
	                img = $(img).attr("id",obj.lgimgId);
	                obj.imgbox.fadeOut("fast",function(){
	                    obj.imgbox.empty().append(img).fadeIn("fast");
	                })
	                obj.showPicBox.find('[action-type="seeBigPic"]').attr('href',_src);
	        	}
	        	if(obj.isShowArr[obj.index]){
	        		return nloadshowPIC('<img src="'+_src+'"/>');
	        	}
	            obj.loadImage(_src,function(img){
	            	obj.isShowArr[obj.index] = true;
	            	nloadshowPIC(img)
	            },function(){
	            	obj.imgbox.append(loadImg);
	            })
	        }
	        obj.directionIndex = function(index,callback){
	        	var owl = this.owlpicshow.data('owlCarousel');
	        	var node_alis = obj.showPicBox.find('[node-type="mediaShowImg"] .owl-item a');
	        	var _src = $(node_alis[index]).data("action-src");
	        	owl.jumpTo(Math.floor(index/owl.orignalItems));
	        	$(node_alis[obj.index]).removeClass("select");
	        	$(node_alis[index]).addClass('select');
	            obj.showBigPic(_src);
	            obj.index = index;
	            callback && typeof(callback) == "function" && callback(index);
	        }
	        obj.mouseInit = function(el){
	        	if(obj.len<=1) {
	        		obj.Direction = 'smallcursor';
	        	}else{
	        		el.on("mousemove",function(e){
	            		if((e.pageX-el.offset().left)<Math.floor(el.width()/3)){
	            			el.removeClass('smallcursor').removeClass('rightcursor').addClass('leftcursor');
	            			obj.Direction = 'leftcursor';
	            		}else if((e.pageX-el.offset().left)>Math.floor(el.width()*2/3)){
	            			el.removeClass('leftcursor').removeClass('smallcursor').addClass('rightcursor');
	            			obj.Direction = 'rightcursor';
	            		}else{ 
	            			el.removeClass('leftcursor').removeClass('rightcursor').addClass('smallcursor');
	            			obj.Direction = 'smallcursor';
	            		}
	            	})
	        	}
	        	el.click(function(e){
	                switch(obj.Direction){
	                    case 'rightcursor':
	                        obj.toRight();
	                    break;
	                    case 'leftcursor':
	                        obj.toLeft();
	                    break;
	                    default:
	                        obj.tosmall();
	                    break;
	                }
	            })
	        }
	    }
	    $.fn.picShow = function(options){
	        return this.each(function(){
	            var element = $(this);
	            var options = {};
	            // Return early if this element already has a plugin instance
	            if (element.data('picShow')) {
	            	return element.data('picShow').init(this);
	            }
	            // Pass options and element to the plugin constructer
	            var picShow = new picShowFn(this, options);
	            picShow.init(this);
	            // Store the plugin object in this element's data
	            element.data('picShow', picShow);
	        });
	    }
	    $(document).delegate('[node-type="feed_list_media_prev"] a',"click",function(){
	        etag = $(this).append(loadImg);
	    	$(this).picShow()
	    })
	})(jQuery);
})