package com.kevinmulkins.colorbookgenerator;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.browser.customtabs.CustomTabsIntent;

public class MainActivity extends Activity {
    private static final Uri APP_URL = Uri.parse("https://colorbookgenerator.cloud.run/");

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        layout.setBackgroundColor(Color.rgb(38, 29, 62));
        int side = dp(22);
        layout.setPadding(side, side, side, side);

        TextView icon = new TextView(this);
        icon.setText("✦  📖  ✦");
        icon.setTextSize(36);
        icon.setTextColor(Color.rgb(255, 222, 129));
        icon.setGravity(Gravity.CENTER);
        layout.addView(icon, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(68)));

        TextView title = new TextView(this);
        title.setText("Color Book Generator");
        title.setTextSize(26);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        title.setTextColor(Color.WHITE);
        title.setGravity(Gravity.CENTER);
        layout.addView(title, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(52)));

        TextView subtitle = new TextView(this);
        subtitle.setText("Your coloring book studio on Android");
        subtitle.setTextSize(16);
        subtitle.setTextColor(Color.rgb(224, 217, 241));
        subtitle.setGravity(Gravity.CENTER);
        layout.addView(subtitle, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(70)));

        Button openButton = new Button(this);
        openButton.setText("Open Book Generator");
        openButton.setTextSize(17);
        openButton.setAllCaps(false);
        openButton.setOnClickListener(v -> openWebsite());
        layout.addView(openButton, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(60)));

        TextView note = new TextView(this);
        note.setText("Uses your existing website and account.\nAn internet connection is required.");
        note.setTextSize(14);
        note.setTextColor(Color.rgb(224, 217, 241));
        note.setGravity(Gravity.CENTER);
        note.setPadding(0, dp(25), 0, 0);
        layout.addView(note, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(100)));

        setContentView(layout);
    }

    private int dp(int value) {
        return Math.round(getResources().getDisplayMetrics().density * value);
    }

    private void openWebsite() {
        try {
            CustomTabsIntent tab = new CustomTabsIntent.Builder()
                    .setShowTitle(true)
                    .build();
            tab.launchUrl(this, APP_URL);
        } catch (RuntimeException customTabFailure) {
            try {
                Intent browser = new Intent(Intent.ACTION_VIEW, APP_URL);
                startActivity(browser);
            } catch (ActivityNotFoundException noBrowser) {
                Toast.makeText(this, "Please install or enable a browser such as Chrome.", Toast.LENGTH_LONG).show();
            }
        }
    }
}
