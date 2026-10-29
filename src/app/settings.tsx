import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { BackIcon } from '@/components/icons';
import { Button, Card, IconButton, Screen, Stepper, text } from '@/components/ui';
import { RECITER } from '@/lib/audio';
import { SOURCES } from '@/lib/quran';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { state, updateSettings, resetProgress } = useStore();
  const { settings } = state;
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <BackIcon color={colors.ink} />
        </IconButton>
        <Text style={text.heading}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <Card style={{ gap: 14 }}>
        <View style={{ gap: 8 }}>
          <Text style={styles.fieldLabel} nativeID="settingsName">Your name</Text>
          <TextInput
            value={settings.name}
            onChangeText={(name) => updateSettings({ name })}
            style={styles.input}
            accessibilityLabelledBy="settingsName"
          />
        </View>
        <Stepper label="New verses each day" value={settings.versesPerDay} min={1} max={10} onChange={(versesPerDay) => updateSettings({ versesPerDay })} />
        <Stepper label="Verses on screen" value={settings.versesPerScreen} min={1} max={10} onChange={(versesPerScreen) => updateSettings({ versesPerScreen })} />
        <Stepper label="Daily time" value={settings.dailyMinutes} min={5} max={120} unit="min" onChange={(dailyMinutes) => updateSettings({ dailyMinutes })} />
        <View style={styles.row}>
          <Text style={styles.fieldLabel}>Script</Text>
          <Text style={text.body}>{settings.script === 'uthmani' ? 'Uthmani' : 'Indopak'}</Text>
        </View>
      </Card>

      <Card style={{ gap: 10, marginTop: 16 }}>
        <Text style={styles.fieldLabel}>Sources</Text>
        <Text style={text.small}>Quran text: {settings.script === 'uthmani' ? SOURCES.arabic : SOURCES.indopak}.</Text>
        {settings.script === 'indopak' ? (
          <Text style={text.small}>Indopak font: DigitalKhatt IndoPak by Amine Anane and Tarteel, SIL Open Font License.</Text>
        ) : null}
        <Text style={text.small}>{SOURCES.english}.</Text>
        <Text style={text.small}>Recitation: {RECITER}, verse by verse, from EveryAyah.com.</Text>
      </Card>

      <Card style={{ gap: 12, marginTop: 16 }}>
        <Text style={styles.fieldLabel}>Start again</Text>
        <Text style={text.small}>Clears your lessons and revision history on this device. Your settings stay.</Text>
        {confirmReset ? (
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <Button
              label="Yes, clear my progress"
              onPress={() => {
                resetProgress();
                setConfirmReset(false);
              }}
            />
            <Button label="Cancel" kind="secondary" onPress={() => setConfirmReset(false)} />
          </View>
        ) : (
          <Button label="Clear progress" kind="secondary" onPress={() => setConfirmReset(true)} />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, paddingBottom: 16 },
  fieldLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
});
