function shareButton(){
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
}

/* Hamburger menu code*/


document.addEventListener("DOMContentLoaded", function () {

    const menuIcon = document.querySelector('.menu_icon');
    if (menuIcon) {
        const burgerMenu = document.querySelector('.burger_menu_window');
        const closeIcon = document.querySelector('.close_icon');

        menuIcon.addEventListener('click', function () {
            // Change translate position of menu icon
            menuIcon.style.transform = 'translateX(-200%)';
            // Show burger menu
            burgerMenu.style.transform = 'translateX(0)';
            // Hide menu icon
            menuIcon.hidden = true;
        });

        closeIcon.addEventListener('click', function () {
            // Change translate position of menu icon back to default
            menuIcon.style.transform = 'translateX(0)';
            // Hide burger menu
            burgerMenu.style.transform = 'translateX(-200%)';
            // Show menu icon
            menuIcon.hidden = false;
        });

    }
});