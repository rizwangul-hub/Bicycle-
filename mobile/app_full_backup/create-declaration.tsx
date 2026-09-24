import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import * as ImagePicker from 'expo-image-picker';

import { useDeclarations } from '@/hooks/useDeclarations';
import { useAuth } from '@/context/AuthContext';
import uploadService, { LocalPickedFile } from '@/services/upload.service';
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
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'decimal-pad';
  placeholder?: string;
  colors: ColorTheme;
}

function Field({
  label,
  value,
  onChange,
  required,
  multiline,
  keyboardType = 'default',
  placeholder,
  colors,
}: FieldProps) {
  return (
    <View style={f.wrap}>
      <Text style={[f.label, { color: colors.text }]}>
        {label}
        {required && <Text style={f.req}> *</Text>}
      </Text>
      <TextInput
        style={[
          f.input,
          multiline && f.multiline,
          {
            backgroundColor: colors.backgroundElement,
            color: colors.text,
            borderColor: colors.backgroundSelected,
            borderWidth: 1,
          },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
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
  const { token } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // ── 6 Mandatory Fields State ─────────────────
  const [customerName,    setCustomerName]    = useState('');
  const [phone,           setPhone]           = useState('');
  const [bicycleMake,     setBicycleMake]     = useState('');
  const [bicycleModel,    setBicycleModel]    = useState('');
  const [customerIdPhoto, setCustomerIdPhoto] = useState<LocalPickedFile | null>(null);
  const [cyclePrice,      setCyclePrice]      = useState('');

  // ── Bicycle & Additional Photos State ────────
  const [bicyclePhotos,   setBicyclePhotos]   = useState<LocalPickedFile[]>([]);
  const [receiptPhotos,   setReceiptPhotos]   = useState<LocalPickedFile[]>([]);

  // ── Optional Fields State ────────────────────
  const [date,                   setDate]                   = useState('');
  const [address,                setAddress]                = useState('');
  const [cashPurchasePageNo,     setCashPurchasePageNo]     = useState('');
  const [email,                  setEmail]                  = useState('');
  const [mobile,                 setMobile]                 = useState('');
  const [postcode,               setPostcode]               = useState('');
  const [bicycleColour,          setBicycleColour]          = useState('');
  const [frameNumber,            setFrameNumber]            = useState('');
  const [distinguishingMarkings, setDistinguishingMarkings] = useState('');
  const [bicycleSource,          setBicycleSource]          = useState('');
  const [ownershipDuration,      setOwnershipDuration]      = useState('');
  const [bicycleFault,           setBicycleFault]           = useState('');
  const [legalOwnerConfirmed,    setLegalOwnerConfirmed]    = useState(false);

  // ── Pick Customer ID Photo (Camera or Gallery) ──
  const pickIdPhoto = async (source: 'camera' | 'gallery') => {
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Camera Permission Required',
            'Camera access is required to photograph the customer ID document.'
          );
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setCustomerIdPhoto({
            uri: asset.uri,
            name: asset.fileName || `id_${Date.now()}.jpg`,
            mimeType: asset.mimeType || 'image/jpeg',
            size: asset.fileSize,
          });
        }
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Gallery Permission Required',
            'Photo library access is required to select the customer ID picture.'
          );
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsMultipleSelection: false,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setCustomerIdPhoto({
            uri: asset.uri,
            name: asset.fileName || `id_${Date.now()}.jpg`,
            mimeType: asset.mimeType || 'image/jpeg',
            size: asset.fileSize,
          });
        }
      }
    } catch {
      Alert.alert('Error', 'Could not open camera or gallery. Please try again.');
    }
  };

  // ── Pick Bicycle Photos (Camera or Gallery) ───
  const pickBicyclePhoto = async (source: 'camera' | 'gallery') => {
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Camera Permission Required', 'Camera access is required to photograph the bicycle.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setBicyclePhotos(prev => [
            ...prev,
            {
              uri: asset.uri,
              name: asset.fileName || `bike_${Date.now()}.jpg`,
              mimeType: asset.mimeType || 'image/jpeg',
              size: asset.fileSize,
            },
          ]);
        }
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Gallery Permission Required', 'Photo library access is required to select bicycle photos.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsMultipleSelection: true,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const newFiles: LocalPickedFile[] = result.assets.map((asset, i) => ({
            uri: asset.uri,
            name: asset.fileName || `bike_${Date.now()}_${i}.jpg`,
            mimeType: asset.mimeType || 'image/jpeg',
            size: asset.fileSize,
          }));
          setBicyclePhotos(prev => [...prev, ...newFiles]);
        }
      }
    } catch {
      Alert.alert('Error', 'Could not open camera or gallery. Please try again.');
    }
  };

  // ── Pick Receipt Photos (Camera or Gallery) ───
  const pickReceiptPhoto = async (source: 'camera' | 'gallery') => {
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Camera Permission Required', 'Camera access is required to photograph receipts.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setReceiptPhotos(prev => [
            ...prev,
            {
              uri: asset.uri,
              name: asset.fileName || `receipt_${Date.now()}.jpg`,
              mimeType: asset.mimeType || 'image/jpeg',
              size: asset.fileSize,
            },
          ]);
        }
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Gallery Permission Required', 'Photo library access is required to select receipts.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsMultipleSelection: true,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const newFiles: LocalPickedFile[] = result.assets.map((asset, i) => ({
            uri: asset.uri,
            name: asset.fileName || `receipt_${Date.now()}_${i}.jpg`,
            mimeType: asset.mimeType || 'image/jpeg',
            size: asset.fileSize,
          }));
          setReceiptPhotos(prev => [...prev, ...newFiles]);
        }
      }
    } catch {
      Alert.alert('Error', 'Could not open camera or gallery. Please try again.');
    }
  };

  // ── Validation & submit ─────────────────────
  const handleSubmit = async () => {
    const name  = customerName.trim();
    const ph    = phone.trim();
    const make  = bicycleMake.trim();
    const model = bicycleModel.trim();
    const price = cyclePrice.trim();

    // 1) Mandatory Customer Name
    if (!name) {
      Alert.alert('Missing Mandatory Field', '1) Customer Name is required.');
      return;
    }
    // 2) Mandatory Phone Number
    if (!ph) {
      Alert.alert('Missing Mandatory Field', '2) Phone Number is required.');
      return;
    }
    // 3) Mandatory Cycle Make
    if (!make) {
      Alert.alert('Missing Mandatory Field', '3) Cycle Make is required.');
      return;
    }
    // 4) Mandatory Model
    if (!model) {
      Alert.alert('Missing Mandatory Field', '4) Model is required.');
      return;
    }
    // 5) Mandatory Customer ID picture
    if (!customerIdPhoto) {
      Alert.alert(
        'Missing Mandatory Field',
        '5) Customer ID picture is required. Please capture with camera or select from gallery.'
      );
      return;
    }
    // 6) Mandatory Cycle Price
    if (!price) {
      Alert.alert('Missing Mandatory Field', '6) Cycle Price is required.');
      return;
    }

    const input: CreateDeclarationInput = {
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
      const created = await createDeclaration(input);
      if (!created?._id) {
        throw new Error('Declaration creation failed.');
      }

      // 1) Upload mandatory Customer ID photo
      if (token && customerIdPhoto) {
        try {
          await uploadService.uploadAttachments(created._id, 'ID', [customerIdPhoto], token);
        } catch (uploadErr) {
          console.warn('ID photo upload warning:', uploadErr);
        }
      }

      // 2) Upload Bicycle photos if attached
      if (token && bicyclePhotos.length > 0) {
        try {
          await uploadService.uploadAttachments(created._id, 'BICYCLE', bicyclePhotos, token);
        } catch (uploadErr) {
          console.warn('Bicycle photos upload warning:', uploadErr);
        }
      }

      // 3) Upload Receipt photos if attached
      if (token && receiptPhotos.length > 0) {
        try {
          await uploadService.uploadAttachments(created._id, 'ADDITIONAL', receiptPhotos, token);
        } catch (uploadErr) {
          console.warn('Receipt upload warning:', uploadErr);
        }
      }

      Alert.alert(
        'Declaration Saved',
        'Declaration and all attached photos have been successfully recorded.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/declarations'),
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
          {/* ── Mandatory Summary Banner ──────────── */}
          <View style={[styles.mandBanner, { backgroundColor: colors.backgroundElement }]}>
            <Text style={styles.mandBannerTitle}>📌 6 Mandatory Fields</Text>
            <Text style={[styles.mandBannerText, { color: colors.textSecondary }]}>
              Customer Name, Phone Number, Cycle Make, Model, Customer ID Picture, and Cycle Price are required.
            </Text>
          </View>

          {/* ── Section 1: Customer Information ──── */}
          <SectionHeader label="Section 1 — Customer Information" colors={colors} />
          <Field
            label="Customer Name"
            value={customerName}
            onChange={setCustomerName}
            required
            colors={colors}
            placeholder="e.g. John Smith"
          />
          <Field
            label="Phone Number"
            value={phone}
            onChange={setPhone}
            required
            keyboardType="phone-pad"
            colors={colors}
            placeholder="e.g. 07123456789"
          />

          {/* ── Mandatory Customer ID Photo Picker ─ */}
          <View style={styles.idPhotoContainer}>
            <View style={styles.idPhotoHeader}>
              <Text style={[styles.idPhotoTitle, { color: colors.text }]}>
                Customer ID Picture <Text style={{ color: '#dc2626' }}>*</Text>
              </Text>
              <View style={styles.mandBadge}>
                <Text style={styles.mandBadgeText}>Mandatory</Text>
              </View>
            </View>
            <Text style={[styles.idPhotoSub, { color: colors.textSecondary }]}>
              Capture or upload driving licence, passport, or national ID.
            </Text>

            {customerIdPhoto ? (
              <View style={[styles.idPreviewBox, { backgroundColor: colors.backgroundElement }]}>
                <Image source={{ uri: customerIdPhoto.uri }} style={styles.idPreviewImage} />
                <View style={styles.idPreviewDetails}>
                  <Text style={[styles.idFileName, { color: colors.text }]} numberOfLines={1}>
                    {customerIdPhoto.name || 'customer_id.jpg'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#16a34a', fontWeight: '700' }}>
                    ✓ Customer ID Photo Attached
                  </Text>
                  <View style={styles.idActionRow}>
                    <Pressable
                      style={styles.retakeBtn}
                      onPress={() => pickIdPhoto('camera')}
                    >
                      <Text style={styles.retakeText}>📷 Retake</Text>
                    </Pressable>
                    <Pressable
                      style={styles.retakeBtn}
                      onPress={() => pickIdPhoto('gallery')}
                    >
                      <Text style={styles.retakeText}>🖼️ Change</Text>
                    </Pressable>
                    <Pressable
                      style={styles.removeBtn}
                      onPress={() => setCustomerIdPhoto(null)}
                    >
                      <Text style={styles.removeText}>🗑 Remove</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.idEmptyBox, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.idEmptyText, { color: colors.textSecondary }]}>
                  ⚠️ Customer ID picture required. Please take a photo or choose from gallery.
                </Text>
                <View style={styles.idPickButtonsRow}>
                  <Pressable
                    style={[styles.pickBtn, { backgroundColor: '#1a56db' }]}
                    onPress={() => pickIdPhoto('camera')}
                  >
                    <Text style={styles.pickBtnText}>📷 Open Camera</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.pickBtn, { backgroundColor: '#475569' }]}
                    onPress={() => pickIdPhoto('gallery')}
                  >
                    <Text style={styles.pickBtnText}>🖼️ Choose Gallery</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          <Field label="Date" value={date} onChange={setDate} colors={colors} placeholder="DD/MM/YYYY" />
          <Field label="Address" value={address} onChange={setAddress} multiline colors={colors} />
          <Field label="Mobile" value={mobile} onChange={setMobile} keyboardType="phone-pad" colors={colors} />
          <Field label="Email" value={email} onChange={setEmail} keyboardType="email-address" colors={colors} />
          <Field label="Postcode" value={postcode} onChange={setPostcode} colors={colors} />
          <Field label="Cash Purchase Page No." value={cashPurchasePageNo} onChange={setCashPurchasePageNo} colors={colors} />

          {/* ── Section 2: Bicycle Information ──── */}
          <SectionHeader label="Section 2 — Bicycle Information" colors={colors} />
          <Field
            label="Cycle Make"
            value={bicycleMake}
            onChange={setBicycleMake}
            required
            colors={colors}
            placeholder="e.g. Trek, Giant, Specialized"
          />
          <Field
            label="Model"
            value={bicycleModel}
            onChange={setBicycleModel}
            required
            colors={colors}
            placeholder="e.g. FX3 Disc"
          />
          <Field
            label="Cycle Price (£)"
            value={cyclePrice}
            onChange={setCyclePrice}
            required
            keyboardType="decimal-pad"
            colors={colors}
            placeholder="e.g. 350.00"
          />

          {/* ── Bicycle Photos Picker ────────────── */}
          <View style={styles.photoBlock}>
            <View style={styles.photoBlockHeader}>
              <Text style={[styles.photoBlockTitle, { color: colors.text }]}>
                Bicycle Photos (Frame, Serial, Angles)
              </Text>
              <View style={[styles.optBadge, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.optBadgeText, { color: colors.textSecondary }]}>Optional</Text>
              </View>
            </View>
            <Text style={[styles.photoBlockSub, { color: colors.textSecondary }]}>
              Attach photos of the complete bicycle, frame number, or markings.
            </Text>

            {bicyclePhotos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbScroll}>
                {bicyclePhotos.map((photo, idx) => (
                  <View key={idx} style={[styles.thumbCard, { backgroundColor: colors.backgroundElement }]}>
                    <Image source={{ uri: photo.uri }} style={styles.thumbImg} />
                    <Pressable
                      style={styles.thumbDeleteBtn}
                      onPress={() => setBicyclePhotos(prev => prev.filter((_, i) => i !== idx))}
                      hitSlop={8}
                    >
                      <Text style={styles.thumbDeleteText}>✕</Text>
                    </Pressable>
                    <Text style={[styles.thumbName, { color: colors.text }]} numberOfLines={1}>
                      {photo.name || `Photo ${idx + 1}`}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.pickButtonsRow}>
              <Pressable
                style={[styles.pickBtn, { backgroundColor: '#1a56db' }]}
                onPress={() => pickBicyclePhoto('camera')}
              >
                <Text style={styles.pickBtnText}>📷 Take Bike Photo</Text>
              </Pressable>
              <Pressable
                style={[styles.pickBtn, { backgroundColor: '#475569' }]}
                onPress={() => pickBicyclePhoto('gallery')}
              >
                <Text style={styles.pickBtnText}>🖼️ Choose Gallery</Text>
              </Pressable>
            </View>
          </View>

          <Field label="Colour" value={bicycleColour} onChange={setBicycleColour} colors={colors} />
          <Field label="Frame Number" value={frameNumber} onChange={setFrameNumber} colors={colors} />
          <Field label="Distinguishing Markings" value={distinguishingMarkings} onChange={setDistinguishingMarkings} multiline colors={colors} />
          <Field label="Where did you get the bicycle?" value={bicycleSource} onChange={setBicycleSource} multiline colors={colors} />
          <Field label="How long have you had the bicycle?" value={ownershipDuration} onChange={setOwnershipDuration} colors={colors} placeholder="e.g. 2 years" />
          <Field label="Any fault with the bike?" value={bicycleFault} onChange={setBicycleFault} multiline colors={colors} />

          {/* ── Section 3: Receipts & Purchase Proof ─ */}
          <SectionHeader label="Section 3 — Receipts & Purchase Proof" colors={colors} />
          <View style={styles.photoBlock}>
            <View style={styles.photoBlockHeader}>
              <Text style={[styles.photoBlockTitle, { color: colors.text }]}>
                Receipts / Invoices / Purchase Evidence
              </Text>
              <View style={[styles.optBadge, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.optBadgeText, { color: colors.textSecondary }]}>Optional</Text>
              </View>
            </View>
            <Text style={[styles.photoBlockSub, { color: colors.textSecondary }]}>
              Attach store invoice, cash payment note, or other purchase records.
            </Text>

            {receiptPhotos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbScroll}>
                {receiptPhotos.map((photo, idx) => (
                  <View key={idx} style={[styles.thumbCard, { backgroundColor: colors.backgroundElement }]}>
                    <Image source={{ uri: photo.uri }} style={styles.thumbImg} />
                    <Pressable
                      style={styles.thumbDeleteBtn}
                      onPress={() => setReceiptPhotos(prev => prev.filter((_, i) => i !== idx))}
                      hitSlop={8}
                    >
                      <Text style={styles.thumbDeleteText}>✕</Text>
                    </Pressable>
                    <Text style={[styles.thumbName, { color: colors.text }]} numberOfLines={1}>
                      {photo.name || `Receipt ${idx + 1}`}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.pickButtonsRow}>
              <Pressable
                style={[styles.pickBtn, { backgroundColor: '#1a56db' }]}
                onPress={() => pickReceiptPhoto('camera')}
              >
                <Text style={styles.pickBtnText}>📷 Take Receipt Photo</Text>
              </Pressable>
              <Pressable
                style={[styles.pickBtn, { backgroundColor: '#475569' }]}
                onPress={() => pickReceiptPhoto('gallery')}
              >
                <Text style={styles.pickBtnText}>🖼️ Choose Gallery</Text>
              </Pressable>
            </View>
          </View>

          {/* ── Section 4: Owner Declaration ────── */}
          <SectionHeader label="Section 4 — Owner's Declaration" colors={colors} />
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.submitText}>Saving Declaration & Photos...</Text>
              </View>
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

  // Mandatory banner
  mandBanner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
    padding: 12,
    marginBottom: 4,
    gap: 4,
  },
  mandBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a56db',
  },
  mandBannerText: {
    fontSize: 12,
    lineHeight: 17,
  },

  // Customer ID Photo Picker
  idPhotoContainer: {
    marginTop: 6,
    marginBottom: 6,
    gap: 6,
  },
  idPhotoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  idPhotoTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  idPhotoSub: {
    fontSize: 12,
  },
  mandBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mandBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
    textTransform: 'uppercase',
  },
  idPreviewBox: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 10,
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  idPreviewImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  idPreviewDetails: {
    flex: 1,
    gap: 4,
  },
  idFileName: {
    fontSize: 13,
    fontWeight: '600',
  },
  idActionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  retakeBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  retakeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  removeBtn: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  removeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#dc2626',
  },
  idEmptyBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f87171',
    borderStyle: 'dashed',
    padding: 14,
    alignItems: 'center',
    gap: 10,
  },
  idEmptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  idPickButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  pickBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Additional Photo Blocks (Bicycle & Receipts)
  photoBlock: {
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  photoBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoBlockTitle: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  photoBlockSub: {
    fontSize: 12,
  },
  optBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  optBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  thumbScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  thumbCard: {
    width: 88,
    borderRadius: 10,
    padding: 6,
    position: 'relative',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  thumbImg: {
    width: 76,
    height: 76,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
  thumbDeleteBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#dc2626',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  thumbDeleteText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 12,
  },
  thumbName: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  pickButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },

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
