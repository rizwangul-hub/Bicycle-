import { useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useDeclarations } from '@/hooks/useDeclarations';
import { Colors, ColorTheme, Spacing } from '@/constants/theme';
import type { CreateDeclarationInput } from '@/services/declaration.service';

// ─── Tiny reusable components ────────────────────────────

function SectionHeader({ label, colors }: { label: string; colors: ColorTheme }) {
  return (
    <View style={[sh.wrap, { borderBottomColor: colors.backgroundElement }]}>
      <Text style={[sh.text, { color: '#1a56db' }]}>{label}</Text>
    </View>
  );
}
const sh = StyleSheet.create({
  wrap: { borderBottomWidth: 1, paddingBottom: 6, marginTop: Spacing.three },
  text: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
});

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: TextInput['props']['keyboardType'];
  colors: ColorTheme;
}
function Field({
  label, value, onChange, required, placeholder, multiline, keyboardType, colors,
}: FieldProps) {
  return (
    <View style={f.wrap}>
      <Text style={[f.label, { color: colors.textSecondary }]}>
        {label}{required && <Text style={f.req}> *</Text>}
      </Text>
      <TextInput
        style={[
          f.input,
          { backgroundColor: colors.backgroundElement, color: colors.text },
          multiline && f.multiline,
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        autoCorrect={false}
        returnKeyType={multiline ? 'default' : 'next'}
      />
    </View>
  );
}
const f = StyleSheet.create({
  wrap:      { gap: 4 },
  label:     { fontSize: 13, fontWeight: '500' },
  req:       { color: '#dc2626' },
  input:     { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 46 },
  multiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
});

// ─── Create Declaration Screen ───────────────────────────

export default function CreateDeclarationScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { createDeclaration } = useDeclarations();
  const [submitting, setSubmitting] = useState(false);

  // ── Form state ──────────────────────────────
  const [customerName,           setCustomerName]           = useState('');
  const [date,                   setDate]                   = useState('');
  const [address,                setAddress]                = useState('');
  const [phone,                  setPhone]                  = useState('');
  const [cashPurchasePageNo,     setCashPurchasePageNo]     = useState('');
  const [email,                  setEmail]                  = useState('');
  const [mobile,                 setMobile]                 = useState('');
  const [postcode,               setPostcode]               = useState('');
  const [bicycleMake,            setBicycleMake]            = useState('');
  const [bicycleModel,           setBicycleModel]           = useState('');
  const [bicycleColour,          setBicycleColour]          = useState('');
  const [frameNumber,            setFrameNumber]            = useState('');
  const [distinguishingMarkings, setDistinguishingMarkings] = useState('');
  const [bicycleSource,          setBicycleSource]          = useState('');
  const [ownershipDuration,      setOwnershipDuration]      = useState('');
  const [bicycleCost,            setBicycleCost]            = useState('');
  const [bicycleFault,           setBicycleFault]           = useState('');
  const [legalOwnerConfirmed,    setLegalOwnerConfirmed]    = useState(false);

  // ── Validation & submit ─────────────────────
  const handleSubmit = async () => {
    const name  = customerName.trim();
    const model = bicycleModel.trim();

    if (!name) {
      Alert.alert('Missing Field', 'Customer name is required.');
      return;
    }
    if (!model) {
      Alert.alert('Missing Field', 'Bicycle model is required.');
      return;
    }

    const input: CreateDeclarationInput = {
      customerName: name,
      bicycleModel: model,
      date:                   date.trim()                   || undefined,
      address:                address.trim()                || undefined,
      phone:                  phone.trim()                  || undefined,
      cashPurchasePageNo:     cashPurchasePageNo.trim()     || undefined,
      email:                  email.trim()                  || undefined,
      mobile:                 mobile.trim()                 || undefined,
      postcode:               postcode.trim()               || undefined,
      bicycleMake:            bicycleMake.trim()            || undefined,
      bicycleColour:          bicycleColour.trim()          || undefined,
      frameNumber:            frameNumber.trim()            || undefined,
      distinguishingMarkings: distinguishingMarkings.trim() || undefined,
      bicycleSource:          bicycleSource.trim()          || undefined,
      ownershipDuration:      ownershipDuration.trim()      || undefined,
      bicycleCost:            bicycleCost.trim()            || undefined,
      bicycleFault:           bicycleFault.trim()           || undefined,
      legalOwnerConfirmed,
    };

    setSubmitting(true);
    try {
      const created = await createDeclaration(input);
      Alert.alert(
        'Declaration Saved',
        'The bicycle owner\'s declaration has been recorded successfully. Would you like to attach photos now?',
        [
          {
            text: 'Finish',
            style: 'cancel',
            onPress: () => router.back(),
          },
          {
            text: 'Add Photos',
            onPress: () => {
              if (created?._id) {
                router.replace(`/declaration/${created._id}` as any);
              } else {
                router.back();
              }
            },
          },
        ]
      );
    } catch (err) {
      const e = err as Error;
      Alert.alert('Error', e.message || 'Could not save the declaration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Section 1: Customer ─────────────── */}
          <SectionHeader label="Section 1 — Customer Information" colors={colors} />
          <Field label="Full Name" value={customerName} onChange={setCustomerName} required colors={colors} placeholder="e.g. John Smith" />
          <Field label="Date" value={date} onChange={setDate} colors={colors} placeholder="DD/MM/YYYY" />
          <Field label="Address" value={address} onChange={setAddress} multiline colors={colors} />
          <Field label="Phone" value={phone} onChange={setPhone} keyboardType="phone-pad" colors={colors} />
          <Field label="Mobile" value={mobile} onChange={setMobile} keyboardType="phone-pad" colors={colors} />
          <Field label="Email" value={email} onChange={setEmail} keyboardType="email-address" colors={colors} />
          <Field label="Postcode" value={postcode} onChange={setPostcode} colors={colors} />
          <Field label="Cash Purchase Page No." value={cashPurchasePageNo} onChange={setCashPurchasePageNo} colors={colors} />

          {/* ── Section 2: Bicycle ──────────────── */}
          <SectionHeader label="Section 2 — Bicycle Information" colors={colors} />
          <Field label="Bicycle Make" value={bicycleMake} onChange={setBicycleMake} colors={colors} placeholder="e.g. Trek" />
          <Field label="Bicycle Model" value={bicycleModel} onChange={setBicycleModel} required colors={colors} placeholder="e.g. FX3 Disc" />
          <Field label="Colour" value={bicycleColour} onChange={setBicycleColour} colors={colors} />
          <Field label="Frame Number" value={frameNumber} onChange={setFrameNumber} colors={colors} />
          <Field label="Distinguishing Markings" value={distinguishingMarkings} onChange={setDistinguishingMarkings} multiline colors={colors} />
          <Field label="Where did you get the bicycle?" value={bicycleSource} onChange={setBicycleSource} multiline colors={colors} />
          <Field label="How long have you had the bicycle?" value={ownershipDuration} onChange={setOwnershipDuration} colors={colors} placeholder="e.g. 2 years" />
          <Field label="How much did the bicycle cost you?" value={bicycleCost} onChange={setBicycleCost} keyboardType="decimal-pad" colors={colors} placeholder="e.g. 350.00" />
          <Field label="Any fault with the bike?" value={bicycleFault} onChange={setBicycleFault} multiline colors={colors} />

          {/* ── Section 3: Owner Declaration ────── */}
          <SectionHeader label="Section 3 — Owner's Declaration" colors={colors} />
          <Pressable
            style={[styles.legalRow, { backgroundColor: colors.backgroundElement }]}
            onPress={() => setLegalOwnerConfirmed(v => !v)}
          >
            <Switch
              value={legalOwnerConfirmed}
              onValueChange={setLegalOwnerConfirmed}
              trackColor={{ true: '#1a56db' }}
              thumbColor="#fff"
            />
            <Text style={[styles.legalText, { color: colors.text }]}>
              I confirm that I am the legal owner of this bicycle and have the right to sell it.
              I declare the information provided above is true and accurate.
            </Text>
          </Pressable>

          {/* ── Submit ───────────────────────────── */}
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              { opacity: pressed || submitting ? 0.8 : 1 },
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Save Declaration</Text>
            )}
          </Pressable>

          <View style={{ height: Spacing.five }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: Spacing.three, gap: Spacing.two },

  // Legal
  legalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  legalText: { flex: 1, fontSize: 14, lineHeight: 20 },

  // Submit
  submitBtn: {
    backgroundColor: '#1a56db',
    borderRadius: 14,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
    minHeight: 52,
  },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
