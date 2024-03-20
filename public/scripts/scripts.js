const shareButton = document.getElementById('shareButton');

shareButton.addEventListener('click', function(event) {
    
    // Check if the share API is supported by the browser
    if (navigator.share) {
        navigator.share({
            url: currentUrl
        }).then(() => {
            console.log('Link shared successfully');
        }).catch((error) => {
            console.error('Error sharing link:', error);
        });
    } else {
        console.error('Sharing not supported');
        // Fallback behavior if sharing is not supported
        // For example, you can open a dialog box with the link for manual sharing
    }
});
