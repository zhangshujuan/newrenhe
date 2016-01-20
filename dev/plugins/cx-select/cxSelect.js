define(function(require, exports, module) {
	var $ = require("$");
	$.cxSelect = function(settings){
		var obj;
		var settings;
		var cxSelect = {
			dom: {},
			api: {}
		};

		// ����Ƿ�Ϊ DOM Ԫ��
		var isElement = function(o){
			if(o && (typeof HTMLElement === 'function' || typeof HTMLElement === 'object') && o instanceof HTMLElement) {
				return true;
			} else {
				return (o && o.nodeType && o.nodeType === 1) ? true : false;
			};
		};

		// ����Ƿ�Ϊ jQuery ����
		var isJquery = function(o){
			return (o && o.length && (typeof jQuery === 'function' || typeof jQuery === 'object') && o instanceof jQuery) ? true : false;
		};

		// ����Ƿ�Ϊ����
		var isArray = function(o){
			if(!Array.isArray) {
				return Object.prototype.toString.call(o) === "[object Array]";
			} else {
				return Array.isArray(o);
			};
		};

		// �������
		for (var i = 0, l = arguments.length; i < l; i++) {
			if (isJquery(arguments[i])) {
				obj = arguments[i];
			} else if (isElement(arguments[i])) {
				obj = $(arguments[i]);
			} else if (typeof arguments[i] === 'object') {
				settings = arguments[i];
			};
		};

		if (obj.length < 1) {return};

		cxSelect.init = function(){
			var _this = this;

			_this.dom.box = obj;

			_this.settings = $.extend({}, $.cxSelect.defaults, settings, {
				url: _this.dom.box.data('url'),
				nodata: _this.dom.box.data('nodata'),
				required: _this.dom.box.data('required'),
				firstTitle: _this.dom.box.data('firstTitle'),
				firstValue: _this.dom.box.data('firstValue')
			});

			// δ����ѡ������
			if (!_this.settings.selects.length) {return};

			_this.selectArray = [];
			_this.selectSum = _this.settings.selects.length;

			for (var i = 0; i < _this.selectSum; i++) {
				if (!_this.dom.box.find('select.' + _this.settings.selects[i])) {break};

				_this.selectArray.push(_this.dom.box.find('select.' + _this.settings.selects[i]));
			};

			_this.selectSum = _this.selectArray.length;

			// ���õ�ѡ�����鲻����
			if (!_this.selectSum) {return};

			// ���� URL��ͨ�� Ajax ��ȡ����
			if (typeof _this.settings.url === 'string') {
				$.getJSON(_this.settings.url, function(json){
					_this.dataJson = json;
					_this.buildContent();
				});

			// �����Զ�������
			} else if (typeof _this.settings.url === 'object') {
				_this.dataJson = _this.settings.url;
				_this.buildContent();
			};
		};

		cxSelect.getIndex = function(n){
			return (this.settings.required) ? n : n - 1;
		};

		// ��ȡ����������
		cxSelect.getNewOptions = function(elemJquery, data){
			if (!elemJquery) {return};
			
			var _title = this.settings.firstTitle;
			var _value = this.settings.firstValue;
			var _dataTitle = elemJquery.data('firstTitle');
			var _dataValue = elemJquery.data('firstValue');
			var _html = '';

			if (typeof _dataTitle === 'string' || typeof _dataTitle === 'number' || typeof _dataTitle === 'boolean') {
				_title = _dataTitle.toString();
			};

			if (typeof _dataValue === 'string' || typeof _dataValue === 'number' || typeof _dataValue === 'boolean') {
				_value = _dataValue.toString();
			};

			if (!this.settings.required) {
				_html='<option value="' + _value + '">' + _title + '</option>';
			};

			$.each(data, function(i, v){
				if (typeof(v.v) === 'string' || typeof(v.v) === 'number' || typeof(v.v) === 'boolean') {
					_html += '<option value="'+v.v+'">' + v.n + '</option>';
				} else {
					_html += '<option value="'+v.n+'">' + v.n + '</option>';
				};
			});

			return _html;
		};

		// ����ѡ������
		cxSelect.buildContent = function(){
			var _this = this;
			
			_this.dom.box.on('change', 'select', function(){
				_this.selectChange(this.className);
			});

			var _html = _this.getNewOptions(_this.selectArray[0], _this.dataJson);
			_this.selectArray[0].html(_html).prop('disabled', false).trigger('change');

			_this.setDefaultValue();
		};

		// ����Ĭ��ֵ
		cxSelect.setDefaultValue = function(n){
			n = n || 0;

			var _this = this;
			var _value;

			if (n >= _this.selectSum || !_this.selectArray[n]) {return};

			_value = _this.selectArray[n].data('value');

			if (typeof _value === 'string' || typeof _value === 'number' || typeof _value === 'boolean') {
				_value = _value.toString();

				setTimeout(function(){
					_this.selectArray[n].val(_value).trigger('change');
					n++;
					_this.setDefaultValue(n);
				}, 1);
			};
		};

		// �ı�ѡ��ʱ�Ĵ���
		cxSelect.selectChange = function(name){
			name = name.replace(/ /g,',');
			name = ',' + name + ',';

			var selectValues=[];
			var selectIndex;
			var selectNext;
			var selectData;
			var _html;

			// ��ȡ��ǰ select λ�á�ѡ��ֵ������պ���� select
			for (var i = 0; i < this.selectSum; i++) {
				selectValues.push(this.getIndex(this.selectArray[i].get(0).selectedIndex));

				if (typeof selectIndex === 'number' && i > selectIndex) {
					this.selectArray[i].empty().prop('disabled', true);

					if (this.settings.nodata === 'none') {
						this.selectArray[i].css('display', 'none');
					} else if(this.settings.nodata === 'hidden') {
						this.selectArray[i].css('visibility', 'hidden');
					};
				};

				if (name.indexOf(',' + this.settings.selects[i] + ',') > -1) {
					selectIndex = i;
				};
			};

			// ��ȡ�¼����б�����
			selectNext = selectIndex + 1;
			selectData = this.dataJson;
			this.settings.nextData && this.settings.nextData(selectData,selectValues,this.dom.box)
			for (var i = 0; i < selectNext; i++){
				
				if (typeof selectData[selectValues[i]]  === 'undefined' || isArray(selectData[selectValues[i]].s) === false || !selectData[selectValues[i]].s.length) {
					return;
				};
				selectData = selectData[selectValues[i]].s;
			};
			// ��������д������ѡ��
			if (this.selectArray[selectNext]) {
				_html = this.getNewOptions(this.selectArray[selectNext], selectData);
				this.selectArray[selectNext].html(_html).prop('disabled', false).css({'display':'', 'visibility':''}).trigger('change');
			};
		};
		
		cxSelect.init();

		return this;
	};

	// Ĭ��ֵ
	$.cxSelect.defaults = {
		selects: [],			// ����ѡ����
		url: null,				// �б������ļ�·��������Ϊ����
		nodata: null,			// ������״̬
		required: false,		// �Ƿ�Ϊ��ѡ
		firstTitle: '��ѡ��',	// ��һ��ѡ��ѡ��ı���
		firstValue: '0'			// ��һ��ѡ���ֵ
	};

	$.fn.cxSelect = function(settings, callback){
		this.each(function(i){
			$.cxSelect(this, settings, callback);
		});
		return this;
	};
})