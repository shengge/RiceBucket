package com.ricebucket;

import com.ricebucket.R;
import android.content.Intent;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.Point;
import android.os.Build;
import android.os.Build.VERSION;
import android.os.Bundle;
import android.os.Handler;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentTransaction;
import android.support.v7.app.AppCompatActivity;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Display;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.OnTouchListener;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebSettings.RenderPriority;
import android.webkit.WebSettings.TextSize;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import com.google.zxing.integration.android.IntentIntegrator;
import com.google.zxing.integration.android.IntentResult;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;

public class MainActivity extends AppCompatActivity {
    static String uriFromLoad = "";
    long SPLASH_DISPLAY_LENGTH = 2000L;
    boolean _canSwitchToLandscape = true;
    boolean loadingFinished = false;
    float m_downX = 0.0F;
    boolean redirect = false;
//    WebAppInterfaceJaxx webAppInterfaceJaxx = null;
    WebView webViewJaxx = null;

    private void processURIFromLoad(String paramString)
    {
        if (0 != 0)
        {
            Log.d("JaxxAppWeb", "opening url :: " + null + " :: " + this.webViewJaxx);
            this.webViewJaxx.evaluateJavascript("(function() { $(window).trigger('openurl', ['" + null + "']);})()", null);
        }
    }

    private String readTextFromResource(int paramInt)
    {
        InputStream localInputStream = getResources().openRawResource(paramInt);
        ByteArrayOutputStream localByteArrayOutputStream = new ByteArrayOutputStream();
        try
        {
            for (paramInt = localInputStream.read(); paramInt != -1; paramInt = localInputStream.read()) {
                localByteArrayOutputStream.write(paramInt);
            }
            localInputStream.close();
        }
        catch (IOException localIOException)
        {
                localIOException.printStackTrace();
        }
        return localByteArrayOutputStream.toString();
    }

    public void backButtonExitApplication()
    {
        Log.d("JaxxWeb", "MainActivity :: backButtonExitApplication :: Exiting application.");
        super.onBackPressed();
    }

    public void onActivityResult(int paramInt1, int paramInt2, Intent paramIntent)
    {
        Log.d("JaxxAppWeb", "activity returned");
//        paramIntent = IntentIntegrator.parseActivityResult(paramInt1, paramInt2, paramIntent);
//        String str = paramIntent.getFormatName();
//        if (str == null) {}
//        while (!str.equals("QR_CODE")) {
//            return;
//        }
//        paramIntent = paramIntent.getContents();
        this.webViewJaxx.loadUrl("javascript:native_gotScan(\"" + paramIntent + "\")");
    }

    public void onBackPressed()
    {
        Log.d("JaxxAppAndroid", "Back button pressed.");
        Log.d("JaxxWeb", "Back button pressed.");
        this.webViewJaxx.loadUrl("javascript:native_runBackButtonBusinessLogicInJavascript()");
    }

    public void onConfigurationChanged(Configuration paramConfiguration)
    {
        super.onConfigurationChanged(paramConfiguration);
        if (this._canSwitchToLandscape)
        {
            if (paramConfiguration.orientation != 2) {
                this.webViewJaxx.loadUrl("javascript:native.setProfileMode(0);");
            }else if(paramConfiguration.orientation != 1){
                Log.d("JaxxAppAndroid", "Landscape Mode");
                if (this.webViewJaxx != null) {
                    this.webViewJaxx.loadUrl("javascript:native.setProfileMode(1);");
                }
            }

        }

    }

    protected void onCreate(Bundle paramBundle)
    {
        super.onCreate(paramBundle);
        setContentView(R.layout.activity_main);
        Object localObject = getResources().getDisplayMetrics();
        float f1 = ((DisplayMetrics)localObject).heightPixels / ((DisplayMetrics)localObject).density;
        float f2 = ((DisplayMetrics)localObject).widthPixels / ((DisplayMetrics)localObject).density;
        if (f1 > f2)
        {
            if (f1 <= f2) {
                showDebugDisplayInfo();
                localObject = getIntent();
                ((Intent)localObject).getData();
                uriFromLoad = ((Intent)localObject).getDataString();
                if (paramBundle == null) {
                    //TODO:XXX
                   // getSupportFragmentManager().beginTransaction().add(com.ricebucket.R.layout.fragment_main, new PlaceholderFragment()).commit();
                }
            }
            if (f1 <= 700.0F) {
                this._canSwitchToLandscape = false;
                //TODO:XXX
               // setRequestedOrientation(1);
            }else {
                this._canSwitchToLandscape = true;
            }

        }
        this.webViewJaxx.getSettings().setRenderPriority(WebSettings.RenderPriority.HIGH);
        if (Build.VERSION.SDK_INT >= 19)
        {
            localObject = this.webViewJaxx;
            WebView.setWebContentsDebuggingEnabled(true);
        }
        localObject = this.webViewJaxx.getSettings();
        ((WebSettings)localObject).setJavaScriptEnabled(true);
        ((WebSettings)localObject).setDomStorageEnabled(true);
        ((WebSettings)localObject).setDatabaseEnabled(true);
        ((WebSettings)localObject).setAllowFileAccessFromFileURLs(true);
        ((WebSettings)localObject).setTextSize(WebSettings.TextSize.NORMAL);
//        this.webAppInterfaceJaxx = new WebAppInterfaceJaxx(this, this);
//        this.webViewJaxx.addJavascriptInterface(this.webAppInterfaceJaxx, "JaxxAndroid");
        localObject = this.webViewJaxx.getSettings().getUserAgentString();

        try
    {
        String str = URLEncoder.encode((String)localObject, "UTF-8");
        localObject = str;
         localObject = "?userAgent=" + (String)localObject;
        localObject = "file:///android_asset/index.html" + (String)localObject;
        this.webViewJaxx.loadUrl((String)localObject);

    } catch (UnsupportedEncodingException localUnsupportedEncodingException)
    {
        localUnsupportedEncodingException.printStackTrace();

    }



    }

    public boolean onCreateOptionsMenu(Menu paramMenu)
    {
        getMenuInflater().inflate(R.menu.main, paramMenu);
        return true;
    }

    public boolean onOptionsItemSelected(MenuItem paramMenuItem)
    {

      return super.onOptionsItemSelected(paramMenuItem);

    }

    public boolean onPrepareOptionsMenu(Menu paramMenu)
    {
        super.onPrepareOptionsMenu(paramMenu);
        return true;
    }

    protected void onRestoreInstanceState(Bundle paramBundle)
    {
        super.onRestoreInstanceState(paramBundle);
        if (this.webViewJaxx != null) {
            this.webViewJaxx.restoreState(paramBundle);
        }
    }

    protected void onSaveInstanceState(Bundle paramBundle)
    {
        super.onSaveInstanceState(paramBundle);
        if (this.webViewJaxx != null) {
            this.webViewJaxx.saveState(paramBundle);
        }
    }

    protected void onStart()
    {
        super.onStart();
        new Handler().postDelayed(new Runnable()
        {
            public void run()
            {
                MainActivity.this.setupWebView();
            }
        }, this.SPLASH_DISPLAY_LENGTH);
    }

    public void setLoadingFinished(boolean paramBoolean)
    {
        this.loadingFinished = paramBoolean;
    }

    protected void setupWebView()
    {
        if (this.webViewJaxx == null) {
            this.webViewJaxx = ((WebView) findViewById(R.id.webviewJaxx));
            this.webViewJaxx.setBackgroundColor(0);
            this.webViewJaxx.clearCache(true);
            this.webViewJaxx.setWebViewClient(new WebViewClient() {
                public void onPageFinished(WebView paramAnonymousWebView, String paramAnonymousString) {
                    try {
                        MainActivity.this.webViewJaxx.setAlpha(1.0F);
                        if (!MainActivity.this.redirect) {
                            MainActivity.this.loadingFinished = true;
                        }
                        if ((MainActivity.this.loadingFinished) && (MainActivity.uriFromLoad != null) && (MainActivity.uriFromLoad != "")) {
                            MainActivity.this.processURIFromLoad(MainActivity.uriFromLoad);
                            MainActivity.uriFromLoad = "";
                        }
                        return;
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }

                public void onPageStarted(WebView paramAnonymousWebView, String paramAnonymousString, Bitmap paramAnonymousBitmap) {
                    MainActivity.this.loadingFinished = false;
                }

                public void onReceivedError(WebView paramAnonymousWebView, int paramAnonymousInt, String paramAnonymousString1, String paramAnonymousString2) {
                    Toast.makeText(MainActivity.this.getApplicationContext(), "Error code is " + paramAnonymousInt, Toast.LENGTH_SHORT).show();
                    paramAnonymousWebView.loadData("<h1 style=\"color:red;\">There seems to be a problem with your Internet connection. Please try later</h1>", "text/html", "UTF-8");
                }

                public boolean shouldOverrideUrlLoading(WebView paramAnonymousWebView, String paramAnonymousString) {
                    if (!MainActivity.this.loadingFinished) {
                        MainActivity.this.redirect = true;
                    }
                    MainActivity.this.loadingFinished = false;
                    paramAnonymousWebView.loadUrl(paramAnonymousString);
                    return true;
                }
            });
            this.webViewJaxx.setHorizontalScrollBarEnabled(false);
            this.webViewJaxx.setOnTouchListener(new View.OnTouchListener() {
                public boolean onTouch(View paramAnonymousView, MotionEvent paramAnonymousMotionEvent) {
                    Log.d("JaxxAppAndroid", "Touch Event Occurred.");
                    //  paramAnonymousView = MainActivity.this.getWindowManager().getDefaultDisplay();
                    int i = paramAnonymousView.getHeight();
                    paramAnonymousView.getWidth();
                    if (paramAnonymousMotionEvent.getY() < i * 0.08D) {
                        if (paramAnonymousMotionEvent.getPointerCount() > 1) {
                            MainActivity.this.m_downX = paramAnonymousMotionEvent.getX();
                            return true;
                        }

                    } else {
                        paramAnonymousMotionEvent.setLocation(MainActivity.this.m_downX, paramAnonymousMotionEvent.getY());
                    }
                    return false;

                }
            });


        }
    }

    protected void showDebugDisplayInfo()
    {
        Object localObject = ((WindowManager)getSystemService("window")).getDefaultDisplay();
        Point localPoint = new Point();
        ((Display)localObject).getSize(localPoint);
        Log.d("JaxxAppAndroid", "size :: " + localPoint);
        localObject = getResources().getDisplayMetrics();
        float f2 = ((DisplayMetrics)localObject).heightPixels / ((DisplayMetrics)localObject).density;
        float f3 = ((DisplayMetrics)localObject).widthPixels / ((DisplayMetrics)localObject).density;
        if (f2 > f3) {}
        for (float f1 = f2;; f1 = f3)
        {
            Log.d("JaxxAppAndroid", "dpsize :: " + f2 + " :: " + f3 + " :: highestDPDim :: " + f1);
            return;
        }
    }

    public static class PlaceholderFragment
            extends Fragment
    {
        public View onCreateView(LayoutInflater paramLayoutInflater, ViewGroup paramViewGroup, Bundle paramBundle)
        {
            return paramLayoutInflater.inflate(R.layout.fragment_main, paramViewGroup, false);
        }
    }
}
