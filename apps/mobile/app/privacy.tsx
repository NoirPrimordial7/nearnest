import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { Screen } from '../components/Screen';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

const EFFECTIVE_DATE = '2026-04-26';

export default function PrivacyScreen() {
  return (
    <Screen
      eyebrow="Legal"
      title="Medifind Privacy Policy"
      description={`Effective ${EFFECTIVE_DATE}. Plain-English summary for the MVP.`}
      footer={
        <ActionButton
          label="Back"
          variant="secondary"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))}
        />
      }
    >
      <View style={styles.body}>
        <Section title="1. What we collect">
          <P>When you use Medifind, we collect:</P>
          <Bullet>Your display name and email address (required for sign-up).</Bullet>
          <Bullet>Your phone number, only if you choose to add one.</Bullet>
          <Bullet>
            Your approximate location, only if you grant location permission. You can revoke this
            at any time from your phone settings.
          </Bullet>
          <Bullet>
            Your search history and saved areas, so the app can personalise discovery for you.
          </Bullet>
          <Bullet>
            Basic device and usage information (e.g. crashes) to keep the app working.
          </Bullet>
        </Section>

        <Section title="2. What we do NOT collect">
          <Bullet>We do not collect your medical history.</Bullet>
          <Bullet>We do not collect prescription images. (This may change later; we will tell you and ask first.)</Bullet>
          <Bullet>We do not collect payment card details — Medifind has no checkout.</Bullet>
          <Bullet>We do not buy or sell your personal data.</Bullet>
        </Section>

        <Section title="3. How we use your data">
          <P>
            Your data is used to sign you in, show you nearby pharmacies relevant to your area,
            and let pharmacy staff respond if you contact them through Medifind. We do not sell
            your data to advertisers and do not run third-party ads inside the app.
          </P>
        </Section>

        <Section title="4. Where your data lives">
          <P>
            Authentication is provided by Firebase Authentication (a Google service). Your
            profile and search preferences are stored in Firebase Firestore. These services may
            store data outside your country of residence. Firebase is responsible for the
            security of its infrastructure; we are responsible for what we ask it to store.
          </P>
        </Section>

        <Disclaimer
          title="Medical disclaimer"
          body="Medifind is a discovery tool. It does not give medical advice, diagnosis, dosage guidance, or emergency help. In an emergency, call your local emergency number immediately."
        />

        <Section title="5. Your choices">
          <Bullet>You can sign out at any time from the profile screen.</Bullet>
          <Bullet>You can revoke location permission from your phone settings.</Bullet>
          <Bullet>
            You can ask us to delete your account by contacting [TBD by team]. Account deletion
            removes your profile, saved areas, and search history.
          </Bullet>
        </Section>

        <Section title="6. Children">
          <P>
            Medifind is not designed for children under 13. We do not knowingly collect data from
            children under 13. If you are a parent or guardian and believe your child has signed
            up, please contact [TBD by team] and we will remove the account.
          </P>
        </Section>

        <Section title="7. Changes to this policy">
          <P>
            We may update this policy. The effective date at the top will change, and we will
            notify you inside the app when material changes take effect.
          </P>
        </Section>

        <Section title="8. Contact">
          <P>
            For questions about this Privacy Policy, contact: [TBD by team]. For local privacy
            law applicable to your jurisdiction, please consult a qualified lawyer. [LEGAL REVIEW
            NEEDED]
          </P>
        </Section>
      </View>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <Text style={styles.p}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function Disclaimer({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.disclaimer}>
      <Text style={styles.disclaimerTitle}>{title}</Text>
      <Text style={styles.disclaimerBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '600',
    lineHeight: 24,
  },
  p: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bulletDot: {
    color: colors.primary600,
    fontSize: typography.body,
    lineHeight: 22,
    width: 14,
    textAlign: 'center',
  },
  bulletText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  disclaimer: {
    borderWidth: 1,
    borderColor: colors.rxBorder,
    backgroundColor: colors.rxBg,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  disclaimerTitle: {
    color: colors.rxText,
    fontSize: typography.bodySm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  disclaimerBody: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
