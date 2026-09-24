import { useEffect, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useDeclarations } from '@/hooks/useDeclarations';
import { Colors, ColorTheme, Spacing } from '@/constants/theme';
import type { CreateDeclarationInput } from '@/services/declaration.service';

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

export default function EditDeclarationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { getDeclarationById, updateDeclaration } = useDeclarations();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
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
  const [cyclePrice,             setCyclePrice]             = useState('');
  const [bicycleFault,           setBicycleFault]           = useState('');
  const [legalOwnerConfirmed,    setLegalOwnerConfirmed]    = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);

    getDeclarationById(id)
      .then((d) => {
        if (cancelled || !d) return;
        setCustomerName(d.customerName || '');
        setDate(d.date || '');
        setAddress(d.address || '');
        setPhone(d.phone || '');
        setCashPurchasePageNo(d.cashPurchasePageNo || '');
        setEmail(d.email || '');
        setMobile(d.mobile || '');
        setPostcode(d.postcode || '');
        setBicycleMake(d.bicycleMake || '');
        setBicycleModel(d.bicycleModel || '');
        setBicycleColour(d.bicycleColour || '');
        setFrameNumber(d.frameNumber || '');
        setDistinguishingMarkings(d.distinguishingMarkings || '');
        setBicycleSource(d.bicycleSource || '');
        setOwnershipDuration(d.ownershipDuration || '');
        setBicycleCost(d.bicycleCost || '');
        setCyclePrice(d.cyclePrice || d.bicycleCost || '');
        setBicycleFault(d.bicycleFault || '');
        setLegalOwnerConfirmed(Boolean(d.legalOwnerConfirmed));
      })
      .catch((err: Error) => {
        Alert.alert('Error', err.message || 'Could not load declaration for editing.');
        router.back();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, getDeclarationById, router]);

  const handleUpdate = async () => {
    const name  = customerName.trim();
    const ph    = phone.trim();
    const make  = bicycleMake.trim();
    const model = bicycleModel.trim();
    const price = cyclePrice.trim();

    if (!name) {
      Alert.alert('Missing Mandatory Field', '1) Customer Name is required.');
      return;
    }
    if (!ph) {
      Alert.alert('Missing Mandatory Field', '2) Phone Number is required.');
      return;
    }
    if (!make) {
      Alert.alert('Missing Mandatory Field', '3) Cycle Make is required.');
      return;
    }
    if (!model) {
      Alert.alert('Missing Mandatory Field', '4) Model is required.');
      return;
    }
    if (!price) {
      Alert.alert('Missing Mandatory Field', '5) Cycle Price is required.');
      return;
    }
    if (!id) return;

    const input: Partial<CreateDeclarationInput> = {
      customerName:           name,
      phone:                  ph,
      bicycleMake:            make,
      bicycleModel:           model,
      bicycleCost:            price,
      cyclePrice:             price,
      date:                   date.trim()                   || undefined,
      address:                address.trim()                || undefined,
      cashPurchasePageNo:     cashPurchasePageNo.trim()     || undefined,
      email:                  email.trim()                  || undefined,
      mobile:                 mobile.trim()                 || undefined,
      postcode:               postcode.trim()               || undefined,
      bicycleColour:          bicycleColour.trim()          || undefined,
      frameNumber:            frameNumber.trim()            || undefined,
      distinguishingMarkings: distinguishingMarkings.trim() || undefined,
      bicycleSource:          bicycleSource.trim()          || undefined,
      ownershipDuration:      ownershipDuration.trim()      || undefined,
      bicycleFault:           bicycleFault.trim()           || undefined,
      legalOwnerConfirmed,
    };

    setSubmitting(true);
    try {
      await updateDeclaration(id, input);
      Alert.alert(
        'Declaration Updated',
        'The declaration has been updated successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: unknown) {
      const e = err as Error;
      Alert.alert('Update Failed', e.message || 'Could not update declaration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#1a56db" />
        <Text style={[styles.centerText, { color: colors.textSecondary }]}>
          Loading declaration...
        </Text>
      </View>
    );
  }

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
          {/* ── Section 1: Customer Information ──── */}
          <SectionHeader label="Section 1 — Customer Information" colors={colors} />
          <Field label="Customer Name" value={customerName} onChange={setCustomerName} required colors={colors} />
          <Field label="Phone Number" value={phone} onChange={setPhone} required keyboardType="phone-pad" colors={colors} placeholder="e.g. 07123456789" />
          <Field label="Date" value={date} onChange={setDate} colors={colors} placeholder="DD/MM/YYYY" />
          <Field label="Address" value={address} onChange={setAddress} multiline colors={colors} />
          <Field label="Mobile" value={mobile} onChange={setMobile} keyboardType="phone-pad" colors={colors} />
          <Field label="Email" value={email} onChange={setEmail} keyboardType="email-address" colors={colors} />
          <Field label="Postcode" value={postcode} onChange={setPostcode} colors={colors} />
          <Field label="Cash Purchase Page No." value={cashPurchasePageNo} onChange={setCashPurchasePageNo} colors={colors} />

          {/* ── Section 2: Bicycle Information ──── */}
          <SectionHeader label="Section 2 — Bicycle Information" colors={colors} />
          <Field label="Cycle Make" value={bicycleMake} onChange={setBicycleMake} required colors={colors} placeholder="e.g. Trek, Giant, Specialized" />
          <Field label="Model" value={bicycleModel} onChange={setBicycleModel} required colors={colors} placeholder="e.g. FX3 Disc" />
          <Field label="Cycle Price (£)" value={cyclePrice} onChange={setCyclePrice} required keyboardType="decimal-pad" colors={colors} placeholder="e.g. 350.00" />
          <Field label="Colour" value={bicycleColour} onChange={setBicycleColour} colors={colors} />
          <Field label="Frame Number" value={frameNumber} onChange={setFrameNumber} colors={colors} />
          <Field label="Distinguishing Markings" value={distinguishingMarkings} onChange={setDistinguishingMarkings} multiline colors={colors} />
          <Field label="Where did you get the bicycle?" value={bicycleSource} onChange={setBicycleSource} multiline colors={colors} />
          <Field label="How long have you had the bicycle?" value={ownershipDuration} onChange={setOwnershipDuration} colors={colors} />
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
            </Text>
          </Pressable>

          {/* ── Save Changes Button ─────────────── */}
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              { opacity: pressed || submitting ? 0.8 : 1 },
            ]}
            onPress={handleUpdate}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Save Changes</Text>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.four },
  centerText: { fontSize: 15 },

  legalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  legalText: { flex: 1, fontSize: 14, lineHeight: 20 },

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
