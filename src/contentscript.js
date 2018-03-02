console.log('Highlight Text Initialized');

var highlightedText;
var highlights;
var authenticated = false;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.authenticated) {
        init();
        authenticated = true;
    }

    if (!authenticated) {
        if (document.querySelector('#highlight_menu')) {
            document.querySelector('#highlight_menu').parentNode.removeChild(document.querySelector('#highlight_menu'));
        }
    }

    if (request.highlights) {
        highlights = request.highlights;
        selectHighlights(highlights);
    }
});

function selectHighlights(highlights) {
    highlights.forEach(function(highlight) {
        markText($('*:contains(' + highlight.text + ')'), highlight.text);
    });
}

function getSelectionText() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}

function getSelectedNode() {
    if (document.selection)
        return document.selection.createRange().parentElement();
    else {
        var selection = window.getSelection();
        if (selection.rangeCount > 0)
            return selection.getRangeAt(0).startContainer.parentNode;
    }
}

function markText(element, text) {
    $(element).mark(text, {
        className: 'rapHighlighted',
        separateWordSearch: false
    });
}

function init() {

    chrome.runtime.sendMessage({
        type: "fetchHighlights",
        url: window.location.href
    });

    $highlight_menu = $('<div>', {
        id: 'highlight_menu',
        css: {
            display: 'none'
        },
        appendTo: 'body'
    });

    $highlight_menu_ul = $('<ul>', {
        class: 'side-by-side',
        appendTo: $highlight_menu
    });

    $highlight_menu_question = $('<li>', {
        appendTo: $highlight_menu_ul
    });

    $highlight_menu_question_link = $('<a>', {
        class: 'highlightLink questionHighlightLink',
        text: '?',
        appendTo: $highlight_menu_question
    });

    $highlight_menu_exclamation = $('<li>', {
        appendTo: $highlight_menu_ul
    });

    $highlight_menu_exclamation_link = $('<a>', {
        class: 'highlightLink exclamationHighlightLink',
        text: '!',
        appendTo: $highlight_menu_exclamation
    });

    $highlight_menu_caret = $('<div>', {
        class: 'highlightCaret',
        appendTo: $highlight_menu
    });

    $highlight_menu_question_link.on('click', function() {
        chrome.runtime.sendMessage({
            type: "question",
            text: highlightedText,
            url: window.location.href
        });

        markText(getSelectedNode(), highlightedText);
    });

    $highlight_menu_exclamation_link.on('click', function() {
        chrome.runtime.sendMessage({
            type: "exclamation",
            text: highlightedText,
            url: window.location.href
        });

        markText(getSelectedNode(), highlightedText);
    });

    var highlighted = false;

    $(document.body).on('mouseup', function(evt) {
        highlightedText = getSelectionText();
        highlighted = true;

        $highlight_menu.animate({
            opacity: 0
        }, function() {
            $highlight_menu.hide().removeClass('highlight_menu_animate');

            var s = document.getSelection(),
                r = s.getRangeAt(0);
            if (r && s.toString()) {
                var p = r.getBoundingClientRect();
                if (p.left || p.top) {
                    $highlight_menu.css({
                            left: (p.left + (p.width / 2)) - ($highlight_menu.width() / 2),
                            top: ((p.top + $(document).scrollTop()) - $highlight_menu.height() - 10),
                            display: 'block',
                            opacity: 0
                        })
                        .animate({
                            opacity: 1
                        }, 300);

                    setTimeout(function() {
                        $highlight_menu.addClass('highlight_menu_animate');
                    }, 10);
                    return;
                }
            }
        });
    });
}
