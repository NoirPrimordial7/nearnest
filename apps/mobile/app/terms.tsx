import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { Screen } from '../components/Screen';
import { colors, radius, spacing, type as typography } from '../theme/tokens';

const EFFECTIVE_DATE = '2026-04-26';

export default function TermsScreen() {
  return (
    <Screen
      eyebrow="Legal"
      title="Medifind Terms of Use"
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
        <Section title="1. What Medifind is">
          <P>
            Medifind helps you discover medicines and find nearby pharmacies. It shows pharmacy
            information, store hours, public contact details, and an indication of whether a
            medicine is currently stocked, based on data shared by the pharmacy.
          </P>
        </Section>

        <Section title="2. What Medifind is not">
          <P>
            Medifind does NOT provide medical advice, diagnosis, dosage guidance, prescriptions,
            medicine delivery, or emergency services. Medifind is not a replacement for a doctor,
            pharmacist, or any qualified healthcare professional.
          </P>
        </Section>

        <Disclaimer
          title="Emergencies"
          body="In a medical emergency, call your local emergency number immediately. Do not rely on this app to get urgent help."
        />

        <Section title="3. Pharmacy listings & stock information">
          <P>
            Pharmacy listings, stock availability, and store hours are provided as a convenience
            and may be outdated, inaccurate, or unavailable. You agree to call the pharmacy to
            confirm availability before travelling.
          </P>
          <P>
            Pharmacies are independent businesses. Medifind does not own, operate, or control
            them, and is not responsible for the products they sell or the prices they charge.
          </P>
        </Section>

        <Section title="4. Prescription medicines">
          <P>
            Some medicines require a valid prescription under local law. Medifind does not verify
            prescriptions. The pharmacy you visit is responsible for following the law on
            dispensing prescription medicines. Always carry a valid prescription when buying a
            medicine that requires one.
          </P>
        </Section>

        <Section title="5. Your account">
          <P>
            You are responsible for keeping your sign-in credentials safe. You agree not to share
            your account, impersonate others, or use Medifind to harm anyone or break the law.
            We may suspend or remove an account that violates these Terms.
          </P>
        </Section>

        <Section title="6. Limitation of liability">
          <P>
            Medifind is provided on an "as is" basis. To the maximum extent allowed by law, we
            are not liable for indirect or consequential losses arising from your use of the app,
            including any decision you make based on information shown in the app. [LEGAL REVIEW
            NEEDED]
          </P>
        </Section>

        <Section title="7. Changes to these Terms">
          <P>
            We may update these Terms over time. The effective date at the top of this page will
            change, and we will let you know inside the app when material changes take effect.
          </P>
        </Section>

        <Section title="8. Contact">
          <P>
            For questions about these Terms, contact: [TBD by team]. For local legal compliance
            applicable to your jurisdiction, please consult a qualified lawyer. [LEGAL REVIEW
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
