(function() {
    var root = this;
    var assetsPath = "";
    var config = {
        base: typeof process === "undefined" ? window.HEALTH.assetsPath : null,
		vars: {
		    'locale': 'zh_cn',
		    'moment_locale':'moment_zh_cn',
		    'jQ-1.8.3':'jquery-1-8-3',
		    'jQ-1.7.1':'jquery-1-7-1-min',
		    'moment':'moment/moment',
		    'face':'facepic',
		    'wkim':'wkim-3-2-53',
		    'AIDB':'address_industry_data'
		},
        alias: {
            // lib
            "$": 'lib/jquery/{jQ-1.8.3}',
            "jQuery": 'lib/jquery/{jQ-1.8.3}',
            "jquery": 'lib/jquery/{jQ-1.8.3}',
            // plugins
            "handlebars": 'plugins/handlebars/handlebars',
            "handlebars-helper":'plugins/handlebars/handlebars-helper',
            "metadata": 'plugins/jquery-metadata/jquery-metadata',
            'jquery-validate':'plugins/jquery-validate/jquery-validate',
            "tab":'plugins/bootstrap/tab',
            "collapse":'plugins/bootstrap/collapse',
            "dropdown":'plugins/bootstrap/dropdown',
            "alert":'plugins/bootstrap/alert',
            "carousel":'plugins/bootstrap/carousel',
            "owlcarousel":'plugins/owl-carousel/carousel',
            "transition":'plugins/bootstrap/transition',
            "jquery.ui":'plugins/jqueryui/jqueryui',
            "jquery.fileupload":'plugins/fileupload/jqueryfileupload',
            "jquery.iframe-transport":'plugins/fileupload/jquery-iframe-transport',
            "uploader":'plugins/uploader/index',
            "ajaxRails":'plugins/jquery-ujs/jquery-rails',
            "sticky":'plugins/renhe-uk/sticky',
            "popover":'plugins/bootstrap/popover',
            "moment":'plugins/{moment}',
            "cxselect":'plugins/cx-select/cxSelect',
            "cropit":'plugins/cropit/cropit',
            'datarangepicker':'plugins/datePicker/datarangepicker',
            "cookie":'plugins/cookie/jquery-cookie',
            //original
            "momentlocale":'original/i18n/{moment_locale}',
            "WKim":'original/im/{wkim}',
            "i18n":"original/i18n/{locale}",
            "face":"original/i18n/{face}",
            "aid":"original/i18n/{AIDB}",
            //widget
            "Renhe":'scripts/widget/renhe/renhe',
            "databinder":'scripts/widget/data-bind/databinder',
            "facePic":'scripts/widget/facepic/facepic',
            "autocomplete":'scripts/widget/autocomplete/autocomplete',
            "text-autocomplete":'scripts/widget/autocomplete/text-autocomplete',
            "pagination":'scripts/widget/paginator/paginator',
            
            //utilsPath
            "common":"utilsPath/common/common",
            "tooltip":'plugins/bootstrap/tooltip'
        },
        paths: {
            utilsPath: 'scripts/utils'
        },
        comboSyntax: ["??", ","],
        comboMaxLength: 500,
//        preload: [
//            'common'
//        ],
        map: [],
        charset: 'gbk',
        timeout: 20000,
        debug: true
    };
    if (root.seajs) {
        root.seajs.config(config);
    }

    return config;
}).call(this);
