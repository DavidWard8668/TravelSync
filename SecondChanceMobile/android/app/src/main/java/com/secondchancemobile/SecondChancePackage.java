package com.secondchancemobile;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * React Native Package for Second Chance Native Modules
 * Registers all native modules with React Native
 */
public class SecondChancePackage implements ReactPackage {

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        
        // Register our main native module
        modules.add(new ReactNativeModule(reactContext));
        
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        // No custom view managers for now
        return Collections.emptyList();
    }
}