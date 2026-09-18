import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabBar } from '../components/navigation/TabBar';
import { TodayScreen } from '../screens/main-v2/01_TodayScreen';
import { MilkScreen } from '../screens/main-v2/02_MilkScreen';
import { AnalyticsScreen } from '../screens/main-v2/03_AnalyticsScreen';
import { TipsScreen } from '../screens/main-v2/04_TipsScreen';
import { CareScreen } from '../screens/main-v2/05_CareScreen';
import { FAMILY_TABS } from './tabs';

const Tab = createBottomTabNavigator();

export function MainTabs({ onLogSleep, onLogFeed, onLogPump, onLogDiaper, onOpenLog, onOpenEvent, onOpenSettings, onEnterNightMode, onOpenQuickActions, onOpenMorning, onOpenPlan, onOpenCloseNight, onOpenTreatment, onOpenMeds, onEditMeds, onMedsChanged, episode, prescriptions, doses, refreshKey }) {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <TabBar
          items={FAMILY_TABS}
          active={state.routeNames[state.index]}
          onSelect={(item) => {
            if (item.action === 'nightMode') { onEnterNightMode && onEnterNightMode(); return; }
            if (item.action === 'quickActions') { onOpenQuickActions && onOpenQuickActions(); return; }
            navigation.navigate(item.id);
          }}
        />
      )}
    >
      <Tab.Screen name="hoy">
        {() => (
          <TodayScreen
            refreshKey={refreshKey} onOpenLog={onOpenLog}
            episode={episode} prescriptions={prescriptions} doses={doses} onOpenMeds={onOpenMeds}
            onLogDiaper={onLogDiaper}
            onOpenSettings={onOpenSettings} onOpenMorning={onOpenMorning}
            onOpenPlan={onOpenPlan} onOpenCloseNight={onOpenCloseNight}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="leche">
        {() => <MilkScreen refreshKey={refreshKey} onNewFeed={onLogFeed} onNewPump={onLogPump} onOpenEvent={onOpenEvent} />}
      </Tab.Screen>
      <Tab.Screen name="patrones">
        {() => <AnalyticsScreen refreshKey={refreshKey} />}
      </Tab.Screen>
      <Tab.Screen name="guia">
        {({ navigation }) => <TipsScreen onGoTeam={() => navigation.navigate('equipo')} />}
      </Tab.Screen>
      <Tab.Screen name="equipo">
        {() => <CareScreen refreshKey={refreshKey} onOpenSettings={onOpenSettings} onEditMeds={onEditMeds} onMedsChanged={onMedsChanged} onOpenTreatment={onOpenTreatment} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
export default MainTabs;
