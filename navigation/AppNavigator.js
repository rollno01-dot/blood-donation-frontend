import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from '../screens/LoginScreen';
import SimpleRegisterScreen from '../screens/SimpleRegisterScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import DonorListScreen from '../screens/DonorListScreen';
import DonorDetailsScreen from '../screens/DonorDetailsScreen';
import FundScreen from '../screens/FundScreen';
import DonateScreen from '../screens/DonateScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'SEVAI' }} />
      <Stack.Screen name="DonorDetails" component={DonorDetailsScreen} options={{ title: 'Donor Details' }} />
    </Stack.Navigator>
  );
}

function DonorStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DonorList" component={DonorListScreen} options={{ title: 'Find Donors' }} />
      <Stack.Screen name="DonorDetails" component={DonorDetailsScreen} options={{ title: 'Donor Details' }} />
    </Stack.Navigator>
  );
}

function FundStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="FundMain" component={FundScreen} options={{ title: 'Community Fund' }} />
      <Stack.Screen name="Donate" component={DonateScreen} options={{ title: 'Make Contribution' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'My Profile' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Donors') iconName = 'people';
          else if (route.name === 'Fund') iconName = 'volunteer-activism';
          else if (route.name === 'Profile') iconName = 'person';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray500,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Donors" component={DonorStack} />
      <Tab.Screen name="Fund" component={FundStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isDonor, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SimpleRegister" component={SimpleRegisterScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : !isDonor ? (
          <Stack.Screen name="Register" component={RegisterScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}