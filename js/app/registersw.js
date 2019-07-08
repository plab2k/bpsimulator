;
(function() {
    const showRefreshUI = (registration) => {
        app.snackbar.show("A new version is available", "Refresh", app.options.types.messageType.info, function() {
            //registration.waiting.postMessage({action:'force-activate'});
            window.location.reload();
        });
    };

    const onNewServiceWorker = (registration, callback) => {
        if (registration.waiting) {
            // SW is waiting to activate. Can occur if multiple clients open and
            // one of the clients is refreshed.
            return callback();
        }

        const listenInstalledStateChange = () => {
            registration.installing.addEventListener('statechange', () => {
                if (event.target.state === 'installed') {
                    // A new service worker is available, inform the user
                    callback();
                }
            });
        };

        if (registration.installing) {
            return listenInstalledStateChange();
        }

        // We are currently controlled so a new SW may be found...
        // Add a listener in case a new SW is found,
        registration.addEventListener('updatefound', listenInstalledStateChange);
    }

    window.addEventListener('load', () => {
        // When the user asks to refresh the UI, we'll need to reload the window
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (!event.data) {
                return;
            }

            switch (event.data) {
                case 'reload-window':
                    window.location.reload();
                    break;
                default:
                    // NOOP
                    break;
            }
        });

        navigator.serviceWorker.register('/run/sw.js', { scope: '/run/' })
            .then(function(registration) {
                // Track updates to the Service Worker.
                if (!navigator.serviceWorker.controller) {
                    // The window client isn't currently controlled so it's a new service
                    // worker that will activate immediately
                    return;
                }

                onNewServiceWorker(registration, () => {
                    showRefreshUI(registration);
                });
            }).catch(function(err) {
                console.log(err)
            });
    });

}());