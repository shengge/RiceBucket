/**
 * Created by Daniel on 2017-03-02.
 */

var JaxxInitializer = function() {

}

JaxxInitializer.prototype.initialize = function(){

}

JaxxInitializer.prototype.startJaxx = function(){
    g_JaxxApp.getUI().showApplicationLoadingScreen(); // splash
    this.startJaxxWithReleaseNotesPage();
}

JaxxInitializer.prototype.startJaxxWithReleaseNotesPage = function() {
    // Consider
    g_JaxxApp.getUI().getReleaseBulletin(function() {
        //g_JaxxApp.getUI().hideApplicationLoadingScreen(); // splash
        g_JaxxApp.getUI().displayJaxxReleaseBulletinIfUnseen();
    });
    
    // 
    setTimeout(function(){
        g_JaxxApp.getUI().startJaxxIfNoReleaseNotesAreShown();
    }, 500);
}

JaxxInitializer.prototype.startJaxxWithTermsOfServicePage = function() {
    // This is run when the user clicks 'Continue' on release notes.
    g_JaxxApp.getUser().setupWithWallet(null);
    if (getStoredData('hasShownTermsOfService')){
        initializeJaxx(function() {
            g_JaxxApp.getUI().hideApplicationLoadingScreen(); // splash
        });
    } else {
        g_JaxxApp.getUI().hideApplicationLoadingScreen(); // splash
        g_JaxxApp.getUI().getIntro().startJaxxFromTermsOfServicePage();
    }
}