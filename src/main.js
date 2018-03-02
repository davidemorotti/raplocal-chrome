function toggleHighlighter() {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function(tabs) {
        const authResult = JSON.parse(localStorage.authResult || '{}');
        if (authResult.access_token) {
            chrome.tabs.sendMessage(tabs[0].id, {
                authenticated: true
            });
        } else {
            chrome.tabs.sendMessage(tabs[0].id, {
                authenticated: false
            });
        }
    });
}

chrome.tabs.onUpdated.addListener(function() {
    toggleHighlighter();
});

function fetchHighlights(url, sender) {
    $.post({
        url: 'https://api.graph.cool/simple/v1/cje9pkgu83esi0129prhhxc94',
        data: JSON.stringify({
            "query": " { allHighlights(filter: { sourceUrl: \"" + url + "\" }) { sourceUrl text } } "
        }),
        contentType: 'application/json'
    }).done(function(response) {
        console.log('Highlights:', response.data.allHighlights);
        chrome.tabs.sendMessage(sender.tab.id, {
            highlights: response.data.allHighlights
        });
    });
}

function createHighlight(text, url, reaction) {
    $.post({
        url: 'https://api.graph.cool/simple/v1/cje9pkgu83esi0129prhhxc94',
        data: JSON.stringify({
            "query": "mutation { createHighlight( text: \"" + text + "\" sourceUrl: \"" + url + "\" reactions: " + reaction + ") { id text sourceUrl reactions } } "
        }),
        contentType: 'application/json'
    }).done(function(response) {
        console.log('Created new Highlight:', response.data.createHighlight);
    });
}

chrome.runtime.onMessage.addListener(function(event, sender, sendResponse) {
    if (event.type === 'question') {
        console.log('question: ', event.text);
        createHighlight(event.text, event.url, 0);
    }

    if(event.type === 'fetchHighlights') {
        fetchHighlights(event.url, sender);
    }

    if (event.type === 'exclamation') {
        console.log('exclamation: ', event.text);
        createHighlight(event.text, event.url, 1);
    }

    if (event.type === 'toggleHighlighter') {
        toggleHighlighter();
    }

    if (event.type === 'authenticate') {

        // scope
        //  - openid if you want an id_token returned
        //  - offline_access if you want a refresh_token returned
        // device
        //  - required if requesting the offline_access scope.
        let options = {
            scope: 'openid offline_access profile',
            device: 'chrome-extension'
        };

        new Auth0Chrome(env.AUTH0_DOMAIN, env.AUTH0_CLIENT_ID)
            .authenticate(options)
            .then(function(authResult) {
                localStorage.authResult = JSON.stringify(authResult);
                toggleHighlighter();

                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon128.png',
                    title: 'Login Successful',
                    message: 'You can use the app now'
                });
            }).catch(function(err) {
                toggleHighlighter();

                chrome.notifications.create({
                    type: 'basic',
                    title: 'Login Failed',
                    message: err.message,
                    iconUrl: 'icons/icon128.png'
                });
            });
    }
});
