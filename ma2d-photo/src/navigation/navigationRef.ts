import { createNavigationContainerRef } from '@react-navigation/native';

import { RootStackParamList } from './types';

/**
 * Lets components rendered outside the navigator (e.g. the hamburger side
 * menu, mounted as a sibling of the Stack.Navigator) trigger navigation.
 * Attach via <NavigationContainer ref={navigationRef}> in RootNavigator.
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
