import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { Button, Card, Screen, Stepper, text } from '@/components/ui';
import { DEFAULT_SETTINGS, useStore, type Script } from '@/lib/store';
import { colors, fonts, radius } from '@/theme';

const SCRIPTS: { value: Script; title: string; detail: string; available: boolean }[] = [
  { value: 'uthmani', title: 'Uthmani', detail: 'Madani Mushaf, 15 lines a page', available: true },
  { value: 'indopak', title: 'Indopak', detail: '13-line South Asian Mushaf · coming soon', available: false },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { finishOnboarding } = useStore();
  const [name, setName] = useState('');
  const [script, setScript] = useState<Script>('uthmani');
  const [versesPerDay, setVersesPerDay] = useState(DEFAULT_SETTINGS.versesPerDay);
  const [readsArabic, setReadsArabic] = useState(false);

  const start = () => {
    finishOnboarding({ ...DEFAULT_SETTINGS, name: name.trim(), script, versesPerDay });
    router.replace('/');
  };

  return (
    <Screen>
      <View style={{ gap: 8, paddingTop: 32, paddingBottom: 20 }}>
        <Text style={text.label}>WELCOME</Text>
        <Text style={text.title}>Let's set up your memorisation</Text>
        <Text style={text.body}>You can change your name and daily amount later. Your script stays fixed, because you memorise the look of the page too.</Text>
      </View>

      <Card style={{ gap: 18 }}>
        <View style={{ gap: 8 }}>
          <Text style={styles.fieldLabel} nativeID="nameLabel">Your name (optional)</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="For your greeting"
            placeholderTextColor="#7C8A85"
            style={styles.input}
            accessibilityLabelledBy="nameLabel"
            autoComplete="given-name"
          />
        </View>

        <View style={{ gap: 8 }} accessibilityRole="radiogroup">
          <Text style={styles.fieldLabel}>Your Mushaf script</Text>
          {SCRIPTS.map((s) => {
            const selected = script === s.value;
            return (
              <Pressable
                key={s.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected, disabled: !s.available }}
                disabled={!s.available}
                onPress={() => setScript(s.value)}
                style={[styles.option, selected && styles.optionSelected, !s.available && { opacity: 0.55 }]}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{s.title}</Text>
                  <Text style={text.small}>{s.detail}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Stepper label="New verses each day" value={versesPerDay} min={1} max={10} onChange={setVersesPerDay} />

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: readsArabic }}
          onPress={() => setReadsArabic((v) => !v)}
          style={styles.checkRow}
        >
          <View style={[styles.checkbox, readsArabic && styles.checkboxOn]}>
            {readsArabic ? <CheckIcon color="#FFFFFF" size={16} /> : null}
          </View>
          <Text style={[text.body, { flex: 1 }]}>I can read the Quran in Arabic. This course teaches memorisation, not reading.</Text>
        </Pressable>
      </Card>

      <Button label="Start with Juz 30" onPress={start} disabled={!readsArabic} style={{ marginTop: 20 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.surface,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.item - 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: { borderColor: colors.accent, backgroundColor: colors.teal },
  optionTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
});
