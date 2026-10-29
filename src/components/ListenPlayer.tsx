import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HeadphonesIcon } from '@/components/icons';
import { Button } from '@/components/ui';
import { RECITER, tracksFor } from '@/lib/audio';
import { startsWithBasmala } from '@/lib/quran';
import { colors, fonts, radius } from '@/theme';

/**
 * Plays the verses on screen one after another, then again, until the learner
 * has heard them `target` times. Reports which verse is playing so the screen
 * can highlight it.
 */
export function ListenPlayer({
  surah,
  verses,
  target,
  onVerse,
}: {
  surah: number;
  verses: number[];
  target: number;
  onVerse: (verse: number | null) => void;
}) {
  const tracks = tracksFor(surah, verses, startsWithBasmala(surah));
  const key = tracks.map((t) => t.url).join('|');
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [index, setIndex] = useState(0);
  const [active, setActive] = useState(false);
  const [listens, setListens] = useState(0);
  const finished = useRef(false);

  // A new set of verses starts from the top.
  useEffect(() => {
    player.pause();
    setActive(false);
    setIndex(0);
    setListens(0);
    onVerse(null);
  }, [key]);

  useEffect(() => {
    if (!active) return;
    finished.current = false;
    player.replace({ uri: tracks[index].url });
    player.play();
    onVerse(tracks[index].verse ?? tracks[index + 1]?.verse ?? null);
  }, [active, index, key]);

  useEffect(() => {
    if (!active || !status.didJustFinish || finished.current) return;
    finished.current = true;
    if (index + 1 < tracks.length) {
      setIndex(index + 1);
      return;
    }
    setListens(listens + 1);
    if (listens + 1 < target) {
      setIndex(0);
      if (index === 0) {
        // Only one clip: replay it directly, since the index does not change.
        finished.current = false;
        player.seekTo(0).then(() => player.play());
      }
    } else {
      setActive(false);
      setIndex(0);
      onVerse(null);
    }
  }, [status.didJustFinish]);

  const playing = active && status.playing;
  const toggle = () => {
    if (playing) {
      player.pause();
    } else if (active) {
      player.play();
    } else {
      if (listens >= target) setListens(0);
      setActive(true);
    }
  };

  const current = tracks[index];
  const nowLabel = !active
    ? `Plays the ${verses.length === 1 ? 'verse' : `${verses.length} verses`} on screen, ${target} times in all`
    : current.verse === null
      ? 'Bismillah'
      : `Verse ${current.verse}`;

  return (
    <View style={styles.player}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <HeadphonesIcon color={colors.goldSoft} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.title}>{RECITER}</Text>
          <Text style={styles.sub}>{status.error ? 'The recitation could not be loaded. Check your connection and try again.' : nowLabel}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <Text style={styles.title} accessibilityLiveRegion="polite">
          Listened {listens} of {target}
        </Text>
        <Button label={playing ? 'Pause' : listens >= target ? 'Play again' : active ? 'Resume' : listens > 0 ? 'Continue' : 'Play'} kind="onDeep" onPress={toggle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  player: { marginTop: 12, backgroundColor: colors.deep, borderRadius: radius.card, padding: 18, gap: 14 },
  title: { fontFamily: fonts.semibold, fontSize: 14, color: colors.onDeep },
  sub: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.onDeepMuted },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
});
