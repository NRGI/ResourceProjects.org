$(document).ready(function () {
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q || []).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
    ga('create', 'UA-59246536-4', 'resourceprojects.org');
    ga('send', 'pageview');

    setTimeout(function () {
        $('.typeahead').typeahead({
            source: function (query, process) {
                $('.typeahead').addClass('wait');
                return $.get('/api/search', {query: query.toString()}, function (data) {
                    $('.typeahead').removeClass('wait');
                    return process(data);
                }, 'json');
            },
            afterSelect: function (obj) {
                $('.typeahead').attr('disabled', true);
                if (obj.type == 'country') {
                    window.location = '/' + obj.type + '/' + obj.iso2;
                }
                else if (obj.type == 'companygroup') {
                    window.location = '/group/' + obj._id;
                } else if (obj.type == 'commodity') {
                    window.location = '/commodity/' + obj.commodity_id;
                } else {
                    window.location = '/' + obj.type + '/' + obj._id;
                }
            },
            displayText: function (item) {
                return item.name;
            }
        });
    }, 400)
    var row = $('table > tbody > tr:first');
    var table = $('table > tbody');
    for (i=0; i<100; i++) {
        table.append(row.clone());
    }
    var oldURL = "";
    function checkURLchange(currentURL) {
        if (currentURL != oldURL) {
            oldURL = currentURL;
        }
    }
    oldURL = window.location.href;
    setInterval(function () {
        $('.table-fixed-header').fixedHeader();
        checkURLchange(window.location.href);
    }, 1000);
});
(function ($) {
    $(document).on('click', '.dropdown', function (e) {
        e.stopPropagation();
    });
    $.fn.fixedHeader = function (options) {
        var config = {
            topOffset: 50
        };
        if (options) {
            $.extend(config, options);
        }
        return this.each(function () {
            var o = $(this);
            var $win = $(window);
            var $head = $('thead.header', o);
            var isFixed = 0;
            var headTop = $head.length && $head.offset().top - config.topOffset;

            function processScroll() {
                if (!o.is(':visible')) {
                    return;
                }
                if ($('thead.header-copy').size()) {
                    $('thead.header-copy').width($('thead.header').width());
                }
                var i;
                var scrollTop = $win.scrollTop();
                var t = $head.length && $head.offset().top - config.topOffset;
                if (!isFixed && headTop !== t) {
                    headTop = t;
                }
                if (scrollTop >= headTop && !isFixed) {
                    isFixed = 1;
                } else if (scrollTop <= headTop && isFixed) {
                    isFixed = 0;
                }
                isFixed ? $('thead.header-copy', o).offset({
                }).removeClass('hide') : $('thead.header-copy', o).addClass('hide');
            }
            $win.on('scroll', processScroll);
            $head.on('click', function () {
                if (!isFixed) {
                    setTimeout(function () {
                        $win.scrollTop($win.scrollTop() - 47);
                    }, 10);
                }
            });
            $('.header-copy').removeClass('header').addClass('header-copy table-header-fixed').appendTo(o);
            var header_width = $head.width();
            o.find('thead.header-copy').width(header_width);
            o.find('thead.header > tr:first > th').each(function (i, h) {
                var w = $(h).width();
                o.find('thead.header-copy> tr > th:eq(' + i + ')').width(w);
            });
            $head.css({
                margin: '0 auto',
                width: o.width()
            });
            processScroll();
        });
    };
})(jQuery);