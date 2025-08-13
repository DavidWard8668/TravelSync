package com.secondchancemobile;

import android.app.Application;
import android.content.Context;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;
import java.lang.reflect.InvocationTargetException;
import java.util.List;

/**
 * Main Application class for Second Chance Mobile App
 * Initializes React Native and registers custom packages
 */
public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          
          // Add our custom Second Chance package
          packages.add(new SecondChancePackage());
          
          return packages;
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    
    // Initialize Second Chance services
    initializeSecondChanceServices();
  }

  /**
   * Initialize Second Chance specific services
   */
  private void initializeSecondChanceServices() {
    try {
      // Start background monitoring service if device admin is enabled
      android.app.admin.DevicePolicyManager dpm = (android.app.admin.DevicePolicyManager) 
          getSystemService(Context.DEVICE_POLICY_SERVICE);
      android.content.ComponentName deviceAdminComponent = 
          new android.content.ComponentName(this, SecondChanceDeviceAdminReceiver.class);
      
      if (dpm != null && dpm.isAdminActive(deviceAdminComponent)) {
        android.content.Intent serviceIntent = 
            new android.content.Intent(this, BackgroundMonitoringService.class);
        startForegroundService(serviceIntent);
        
        android.util.Log.i("SecondChance", "Background monitoring service started");
      }
      
    } catch (Exception e) {
      android.util.Log.e("SecondChance", "Failed to initialize services", e);
    }
  }

  /**
   * Loads Flipper in React Native templates. Call this in the onCreate method with something like
   * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
   */
  private static void initializeFlipper(
      Context context, ReactInstanceManager reactInstanceManager) {
    if (BuildConfig.DEBUG) {
      try {
        /*
         We use reflection here to pick up the class that initializes Flipper,
        since Flipper library is not available in release mode
        */
        Class<?> aClass = Class.forName("com.secondchancemobile.ReactNativeFlipper");
        aClass
            .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
            .invoke(null, context, reactInstanceManager);
      } catch (ClassNotFoundException e) {
        e.printStackTrace();
      } catch (NoSuchMethodException e) {
        e.printStackTrace();
      } catch (IllegalAccessException e) {
        e.printStackTrace();
      } catch (InvocationTargetException e) {
        e.printStackTrace();
      }
    }
  }
}