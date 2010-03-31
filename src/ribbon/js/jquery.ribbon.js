/*
Copyright (c) 2009 Mikael Söderström.
Contact: vimpyboy@msn.com

Feel free to use this script as long as you don't remove this comment.
*/

(function($) {
    var isLoaded;
    var isClosed;

    $.fn.Ribbon = function(ribbonSettings) {
        var settings = $.extend({ theme: 'windows7', backStage: false }, ribbonSettings || {});

        $('.ribbon a').each(function() {
            if ($(this).attr('accesskey')) {
                $(this).append('<div rel="accesskeyhelper" style="display: none; position: absolute; background-image: url(images/accessbg.png); background-repeat: none; width: 16px; padding: 0px; text-align: center; height: 17px; line-height: 17px; top: ' + $(this).offset().top + 'px; left: ' + ($(this).offset().left + $(this).width() - 15) + 'px;">' + $(this).attr('accesskey') + '</div>');
            }
        });

        $('head').append('<link href="/stylesheets/compiled/jquery.ui/ribbon.' + settings.theme + '.css" rel="stylesheet" type="text/css" />" />');

        if (!isLoaded) {
            SetupMenu(settings);
        }

        $(document).keydown(function(e) { ShowAccessKeys(e); });
        $(document).keyup(function(e) { HideAccessKeys(e); });

        function SetupMenu(settings) {
            $('.menu li a:first').addClass('active');
            $('.menu li ul').hide();
            $('.menu li a:first').parent().children('ul:first').show();
            $('.menu li a:first').parent().children('ul:first').addClass('submenu');
            $('.menu li > a').click(function() { ShowSubMenu(this); });
            $('.orbButton').click(function() { ShowMenu(settings.backStage); });
            $('.orb ul').hide();
            $('.orb ul ul').hide();
            $('.orb li ul li ul').show();
            $('.orb li li ul').each(function() { $(this).prepend('<div style="background-color: #EBF2F7; height: 25px; line-height: 25px; width: 292px; padding-left: 9px; border-bottom: 1px solid #CFDBEB;">' + $(this).parent().children('a:first').text() + '</div>'); });
            $('.orb li li a').each(function() { if ($(this).parent().children('ul').length > 0) { $(this).addClass('arrow'); }});
            $('.orb .ribbon-backstage a').live('click', function() { $('.orb ul').fadeOut('fast'); });

            //$('.ribbon-list div').each(function() { $(this).parent().width($(this).parent().width()); });

            $('.ribbon-list div').click(function(e) {
                var elwidth = $(this).parent().width();
                var insideX = e.pageX > $(this).offset().left && e.pageX < $(this).offset().left + $(this).width();
                var insideY = e.pageY > $(this).offset().top && e.pageY < $(this).offset().top + $(this).height();

                $('.ribbon-list div ul').fadeOut('fast');

                if (insideX && insideY) {
                    $(this).attr('style', 'background-image: ' + $(this).css('background-image'));

                    $(this).parent().width(elwidth);

                    $(this).children('ul').width(elwidth - 4);
                    $(this).children('ul').fadeIn('fast');
                }
            });

            $('.ribbon-list div').parents().click(function(e) {
            	$('.ribbon-list div ul:visible').each(function() {
            		var outsideX = e.pageX < $('.ribbon-list div ul:visible').parent().offset().left || e.pageX > $('.ribbon-list div ul:visible').parent().offset().left + $('.ribbon-list div ul:visible').parent().width();
            		var outsideY = e.pageY < $('.ribbon-list div ul:visible').parent().offset().top || e.pageY > $('.ribbon-list div ul:visible').parent().offset().top + $('.ribbon-list div ul:visible').parent().height();
	                if (outsideX || outsideY) {
	                    $('.ribbon-list div ul:visible').each(function() {
	                        $(this).fadeOut('fast');
	                    });
	                    $('.ribbon-list div').css('background-image', '');
	                }
               	});
           	});
			
            $('.orb li li a').mouseover(function() { ShowOrbChildren(this); });

            $('.menu li > a').dblclick(function() {
                $('ul .submenu').animate({ height: "hide" });
                $('body').animate({ paddingTop: $(this).parent().parent().parent().parent().height() });
                isClosed = true;
            });
        }

        $('.ribbon').parents().click(function(e) {
            var outsideX = e.pageX < $('.orb ul:first').offset().left || e.pageX > $('.orb ul:first').offset().left + $('.orb ul:first').width();
            var outsideY = e.pageY < $('.orb ul:first img:first').offset().top || e.pageY > $('.orb ul:first').offset().top + $('.orb ul:first').height();

            if ((outsideX || outsideY) && !settings.backStage) {
                $('.orb ul').fadeOut('fast');
            }
        });

        if (isLoaded) {
            $('.orb li:first ul:first img:first').remove();
            $('.orb li:first ul:first img:last').remove();
            $('.ribbon-list div img[src*="/arrow_down.png"]').remove();
        }

        if (!settings.backStage) {
            $('.orb li:first ul:first').append('<img src="/images/jquery.ui/ribbon.' + settings.theme + '/menu_bottom.png" style="margin-left: -10px; margin-bottom: -22px;" />');
            $('.orb li:first ul:first').prepend('<img src="/images/jquery.ui/ribbon.' + settings.theme + '/menu_top.png" style="margin-left: -10px; margin-top: -22px;" />');
        }

        $('.ribbon-list div').each(function() {
			if ($(this).children('ul').length > 0) { 
				$(this).append('<img src="/images/jquery.ui/ribbon.' + settings.theme + '/arrow_down.png" style="float: right; margin-top: 5px;" />')
			}
		});

        //Hack for IE 7.
        if (navigator.appVersion.indexOf('MSIE 6.0') > -1 || navigator.appVersion.indexOf('MSIE 7.0') > -1) {
            $('ul.menu li li div').css('width', '90px');
            $('ul.menu').css('width', '500px');
            $('ul.menu').css('float', 'left');
            $('ul.menu .submenu li div.ribbon-list').css('width', '100px');
            $('ul.menu .submenu li div.ribbon-list div').css('width', '100px');
        }

        $('a[href=' + window.location.hash + ']').click();

        //Add backstage class
        if (settings.backStage) {
            $('ul.ribbon .orb > li > ul').addClass('ribbon-backstage');
            $('ul.ribbon-backstage').width('3000px');
            $('ul.ribbon-backstage').height($(document).height());

            $('ul.ribbon-backstage > li').width('130px');
            $('ul.ribbon-backstage > li > a').width('125px');

            $('ul.ribbon-backstage > li').addClass('ribbon-backstage-firstLevel');

            $('ul.ribbon-backstage .ribbon-backstage-firstLevel > ul').addClass('ribbon-backstage-subMenu');

            $('ul.ribbon-backstage .ribbon-backstage-firstLevel .ribbon-backstage-subMenu > div').addClass('ribbon-backstage-subMenu-header');
        }

        $('.ribbon-backstage-rightColumnWide').hide();
        $('.ribbon-backstage-rightColumnSmall').hide();

        isLoaded = true;

        function ResetSubMenu() {
            $('.menu li a').removeClass('active');
            $('.menu ul').removeClass('submenu');
            $('.menu li ul').hide();
        }

        function ShowSubMenu(e) {
            $('.orb ul').fadeOut('fast');

            var isActive = $(e).next().css('display') == 'block';
            ResetSubMenu();

            $(e).addClass('active');
            $(e).parent().children('ul:first').addClass('submenu');

            $(e).parent().children('ul:first').show();
            $('body').css('padding-top', '120px');

            isClosed = false;
        }

        function ShowOrbChildren(e, init) {
            if (!settings.backStage) {
                if (($(e).parent().children('ul').css('display') == 'none' || $(e).parent().children('ul').length == 0) && $(e).parent().parent().parent().parent().hasClass('orb')) {
                    $('.orb li li ul').fadeOut('fast');

                    if ($(e).parent().children('ul').length > 0)
                        $(e).parent().children('ul').fadeIn('fast');
                }
            }

            if (settings.backStage) {
                if ($(e).parent().children('ul').length == 0 && $('ul.ribbon-backstage .ribbon-backstage-firstLevel .ribbon-backstage-subMenu:first:hidden').length > 0 && $(e).parent().parent().parent().parent().hasClass('orb')) {
                    $('.orb li li ul').fadeOut('fast');
                    $('.orb li li > div').fadeOut('fast');
                    $('ul.ribbon-backstage .ribbon-backstage-firstLevel:first .ribbon-backstage-subMenu:first').fadeIn('fast');
                    $('ul.ribbon-backstage .ribbon-backstage-firstLevel:first div').fadeIn('fast');
                }

                if ($(e).parent().children('ul').css('display') == 'none' && $(e).parent().children('ul').length > 0 && $(e).parent().parent().parent().parent().hasClass('orb')) {
                    $('.orb li li ul').fadeOut('fast');
                    $('.orb li li > div').fadeOut('fast');
                    $(e).parent().children('ul').fadeIn('fast');
                    $(e).parent().children('div').fadeIn('fast');
                }

                if (init) {
                    $('.orb li li ul').hide();
                    $('.orb li li > div').hide();
                    $(e).parent().children('ul').fadeIn('fast');
                    $(e).parent().children('div').fadeIn('fast');
                }
            }
        }

        function ShowMenu(backStage) {
            //Show standard menu
            if (!backStage) {
                $('.orb ul').animate({ opacity: 'toggle' }, 'fast');
                return;
            }

            //Show backstage
            $('ul.ribbon-backstage .ribbon-backstage-firstLevel .ribbon-backstage-subMenu').height($(window).height() * 0.90);
            $('ul.ribbon-backstage .ribbon-backstage-firstLevel div.ribbon-backstage-rightColumnWide').height($(window).height() * 0.90).width($(window).width());
            $('ul.ribbon-backstage .ribbon-backstage-firstLevel div.ribbon-backstage-rightColumnSmall').parent().children('ul').width($(window).width()).addClass('ribbon-backstage-leftColumnWide');
            $('ul.ribbon-backstage .ribbon-backstage-firstLevel div.ribbon-backstage-rightColumnSmall').height($(window).height() * 0.90).width('200px');
            $('ul.ribbon-backstage .ribbon-backstage-firstLevel div.ribbon-backstage-rightColumnSmall').css('left', ($(window).width() - 200)).css('line-height', '17px');

            $('.orb ul').animate({ opacity: 'toggle' }, 'fast');
            ShowOrbChildren($('.orb li li a:first'), true);
        }

        function ShowAccessKeys(e) {
            if (e.altKey) {
                $('div[rel="accesskeyhelper"]').each(function() { $(this).css('top', $(this).parent().offset().top).css('left', $(this).parent().offset().left - 20 + $(this).parent().width()); $(this).show(); });
            }
        }

        function HideAccessKeys(e) {
            $('div[rel="accesskeyhelper"]').hide();
        }
    }
})(jQuery);