package com.aboutone;
import android.os.Bundle;
import com.tapjoy.TapjoyConnect;
import org.apache.cordova.*;

public class MainActivity extends DroidGap {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        TapjoyConnect.requestTapjoyConnect(this, "2b78af6e-55cf-4cc1-8e04-74539260adea", "rzMx1YALlGRnjVEhCpfZ");
        super.loadUrl("file:///android_asset/www/index.html");
    }
}