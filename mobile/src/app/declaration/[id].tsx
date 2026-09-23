import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useDeclarations } from '@/hooks/useDeclarations';
import { useAttachments } from '@/hooks/useAttachments';
import { AttachmentCategorySection } from '@/components/AttachmentCategorySection';
import { ImageViewerModal } from '@/components/ImageViewerModal';
import { Colors, ColorTheme, Spacing } from '@/constants/theme';
import type { Attachment, Declaration } from '@/types';

function formatDate(iso?: string) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch {
    return null;
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sec.wrap}>
      <Text style={sec.title}>{title}</Text>
      {children}
    </View>
  );
}
const sec = StyleSheet.create({
  wrap:  { gap: Spacing.two },
  title: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: '#1a56db', marginBottom: 2 },
});

function Row({
  label,
  value,
  colors,
}: {
  label: string;
  value: string | undefined | null;
  colors: ColorTheme;
}) {
  const displayValue = value && value.trim().length > 0 ? value : 'Not provided';
  const isPlaceholder = displayValue === 'Not provided';

  return (
    <View style={row.wrap}>
      <Text style={[row.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text
        style={[
          row.value,
          { color: isPlaceholder ? colors.textSecondary : colors.text },
          isPlaceholder && row.placeholder,
        ]}
      >
        {displayValue}
      </Text>
    </View>
  );
}
const row = StyleSheet.create({
  wrap:  { gap: 2 },
  label: { fontSize: 12 },
  value: { fontSize: 15, fontWeight: '500' },
  placeholder: { fontStyle: 'italic', fontSize: 14 },
});

export default function DeclarationDetailScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const router   = useRouter();
  const scheme   = useColorScheme();
  const colors   = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { getDeclarationById, deleteDeclaration } = useDeclarations();
  const [declaration, setDeclaration] = useState<Declaration | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [deleting,    setDeleting]    = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Attachments hook for this declaration
  const {
    uploadedGrouped,
    totalAttachments,
    pendingFiles,
    uploadingCategory,
    categoryErrors,
    categorySuccess,
    pickFromCamera,
    pickFromGallery,
    removePendingFile,
    uploadCategoryFiles,
    deleteAttachment,
  } = useAttachments(id || '');

  // Full-screen viewer state
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);

  const fetchDeclaration = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const d = await getDeclarationById(id);
      setDeclaration(d);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || 'Failed to load declaration.');
    } finally {
      setLoading(false);
    }
  }, [id, getDeclarationById]);

  useEffect(() => {
    fetchDeclaration();
  }, [fetchDeclaration]);

  // Handle Delete Declaration
  const handleDeleteDeclaration = () => {
    if (!id) return;

    Alert.alert(
      'Delete Declaration',
      'Are you sure you want to delete this declaration? This action cannot be undone and will remove all associated attachments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const success = await deleteDeclaration(id);
              if (success) {
                Alert.alert(
                  'Declaration Deleted',
                  'The declaration has been successfully removed.',
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              }
            } catch (err: unknown) {
              const e = err as Error;
              Alert.alert('Delete Failed', e.message || 'Could not delete declaration.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
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

  if (error || !declaration) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={styles.errorText}>{error ?? 'Declaration not found.'}</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const d = declaration;
  const createdDate  = formatDate(d.createdAt);
  const declaredDate = formatDate(d.date);

  // Shop info
  const shopObj = typeof d.shopId === 'object' && d.shopId !== null ? d.shopId : null;
  const shopName = shopObj ? shopObj.name : 'Your Shop';
  const shopCode = shopObj ? shopObj.code : '';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Title block ──────────────────────── */}
        <View style={[styles.titleCard, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.titleTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.titleName, { color: colors.text }]}>{d.customerName}</Text>
              {createdDate && (
                <Text style={[styles.titleDate, { color: colors.textSecondary }]}>
                  Submitted {createdDate}
                </Text>
              )}
            </View>
            <Text style={[styles.shortId, { color: colors.textSecondary }]}>
              #{d._id.slice(-6).toUpperCase()}
            </Text>
          </View>

          <View style={[styles.legalBadge, { backgroundColor: d.legalOwnerConfirmed ? '#dcfce7' : '#fee2e2' }]}>
            <Text style={[styles.legalBadgeText, { color: d.legalOwnerConfirmed ? '#166534' : '#991b1b' }]}>
              {d.legalOwnerConfirmed ? '✓ Legal Owner Confirmed' : '✗ Legal Owner Not Confirmed'}
            </Text>
          </View>

          {/* Action buttons (Edit / Delete) */}
          <View style={styles.cardActionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.editBtn,
                { opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={() => router.push(`/edit-declaration/${d._id}` as any)}
            >
              <Text style={styles.editBtnText}>✏️ Edit Declaration</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.deleteDeclBtn,
                { opacity: pressed || deleting ? 0.7 : 1 },
              ]}
              onPress={handleDeleteDeclaration}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#dc2626" />
              ) : (
                <Text style={styles.deleteDeclText}>🗑 Delete</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* ── Section 1: Customer Information ──── */}
        <Section title="Section 1 — Customer Information">
          <Row label="Full Name"              value={d.customerName}       colors={colors} />
          <Row label="Date"                   value={declaredDate}         colors={colors} />
          <Row label="Address"                value={d.address}            colors={colors} />
          <Row label="Phone"                  value={d.phone}              colors={colors} />
          <Row label="Mobile"                 value={d.mobile}             colors={colors} />
          <Row label="Email"                  value={d.email}              colors={colors} />
          <Row label="Postcode"               value={d.postcode}           colors={colors} />
          <Row label="Cash Purchase Page No." value={d.cashPurchasePageNo} colors={colors} />
          <Row label="Customer Signature"     value={d.signature}          colors={colors} />
          <Row label="Seller Signature"       value={d.sellerSignature}    colors={colors} />
        </Section>

        {/* ── Section 2: Bicycle Information ───── */}
        <Section title="Section 2 — Bicycle Information">
          <Row label="Make"                    value={d.bicycleMake}             colors={colors} />
          <Row label="Model"                   value={d.bicycleModel}            colors={colors} />
          <Row label="Colour"                  value={d.bicycleColour}           colors={colors} />
          <Row label="Frame Number"            value={d.frameNumber}             colors={colors} />
          <Row label="Distinguishing Markings" value={d.distinguishingMarkings}  colors={colors} />
          <Row label="Where did you get bike?" value={d.bicycleSource}           colors={colors} />
          <Row label="How long had bicycle?"   value={d.ownershipDuration}       colors={colors} />
          <Row label="How much did it cost?"   value={d.bicycleCost ? `£${d.bicycleCost}` : undefined} colors={colors} />
          <Row label="Faults / Damage"         value={d.bicycleFault}            colors={colors} />
        </Section>

        {/* ── Section 3: Legal Owner Confirmation ─ */}
        <Section title="Section 3 — Legal Owner Confirmation">
          <View style={[styles.declBox, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.declStatus, { color: d.legalOwnerConfirmed ? '#166534' : '#991b1b' }]}>
              Status: {d.legalOwnerConfirmed ? 'Confirmed' : 'Not Confirmed'}
            </Text>
            <Text style={[styles.declText, { color: colors.text }]}>
              {d.legalOwnerConfirmed
                ? 'The customer declared and confirmed they are the legal owner of this bicycle and had the legal right to transfer or sell it.'
                : 'The customer did not confirm legal ownership on this declaration form.'}
            </Text>
          </View>
        </Section>

        {/* ── Section 4: Shop Information ──────── */}
        <Section title="Section 4 — Shop Information">
          <View style={[styles.shopBox, { backgroundColor: colors.backgroundElement }]}>
            <View style={styles.shopRow}>
              <Text style={[styles.shopLabel, { color: colors.textSecondary }]}>Shop Name</Text>
              <Text style={[styles.shopValue, { color: colors.text }]}>{shopName}</Text>
            </View>
            {shopCode ? (
              <View style={styles.shopRow}>
                <Text style={[styles.shopLabel, { color: colors.textSecondary }]}>Shop Code</Text>
                <Text style={[styles.shopValue, { color: colors.text }]}>{shopCode}</Text>
              </View>
            ) : null}
            <Text style={[styles.shopNotice, { color: colors.textSecondary }]}>
              🔒 This record is strictly isolated and managed under {shopName}.
            </Text>
          </View>
        </Section>

        {/* ── Section 5: Photo & Document Attachments ─── */}
        <Section title={`Section 5 — Attachments (${totalAttachments})`}>
          {totalAttachments === 0 && (
            <View style={[styles.noAttachmentsBox, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[styles.noAttachmentsText, { color: colors.textSecondary }]}>
                No attachments uploaded for this declaration yet. Use the categories below to take or select photos.
              </Text>
            </View>
          )}

          {/* Bicycle Photos */}
          <AttachmentCategorySection
            category="BICYCLE"
            title="Bicycle Photos"
            subtitle="Front, side, rear, frame number, and distinguishing marks"
            uploadedAttachments={uploadedGrouped.BICYCLE}
            pendingFiles={pendingFiles.BICYCLE}
            isUploading={uploadingCategory === 'BICYCLE'}
            uploadError={categoryErrors.BICYCLE}
            uploadSuccess={categorySuccess.BICYCLE}
            colors={colors}
            onPickCamera={() => pickFromCamera('BICYCLE')}
            onPickGallery={() => pickFromGallery('BICYCLE')}
            onRemovePending={(idx) => removePendingFile('BICYCLE', idx)}
            onUploadPending={() => uploadCategoryFiles('BICYCLE')}
            onViewUploaded={(att) => setViewingAttachment(att)}
            onDeleteUploaded={(att) => deleteAttachment(att)}
          />

          {/* Customer Photos */}
          <AttachmentCategorySection
            category="CUSTOMER"
            title="Customer Photos"
            subtitle="Customer photograph at the time of transaction"
            uploadedAttachments={uploadedGrouped.CUSTOMER}
            pendingFiles={pendingFiles.CUSTOMER}
            isUploading={uploadingCategory === 'CUSTOMER'}
            uploadError={categoryErrors.CUSTOMER}
            uploadSuccess={categorySuccess.CUSTOMER}
            colors={colors}
            onPickCamera={() => pickFromCamera('CUSTOMER')}
            onPickGallery={() => pickFromGallery('CUSTOMER')}
            onRemovePending={(idx) => removePendingFile('CUSTOMER', idx)}
            onUploadPending={() => uploadCategoryFiles('CUSTOMER')}
            onViewUploaded={(att) => setViewingAttachment(att)}
            onDeleteUploaded={(att) => deleteAttachment(att)}
          />

          {/* ID Photos */}
          <AttachmentCategorySection
            category="ID"
            title="ID Photos"
            subtitle="Driving licence, passport, proof of address"
            uploadedAttachments={uploadedGrouped.ID}
            pendingFiles={pendingFiles.ID}
            isUploading={uploadingCategory === 'ID'}
            uploadError={categoryErrors.ID}
            uploadSuccess={categorySuccess.ID}
            colors={colors}
            onPickCamera={() => pickFromCamera('ID')}
            onPickGallery={() => pickFromGallery('ID')}
            onRemovePending={(idx) => removePendingFile('ID', idx)}
            onUploadPending={() => uploadCategoryFiles('ID')}
            onViewUploaded={(att) => setViewingAttachment(att)}
            onDeleteUploaded={(att) => deleteAttachment(att)}
          />

          {/* Additional Documents / Photos */}
          <AttachmentCategorySection
            category="ADDITIONAL"
            title="Additional Photos / Documents"
            subtitle="Receipts, purchase agreements, service documents"
            uploadedAttachments={uploadedGrouped.ADDITIONAL}
            pendingFiles={pendingFiles.ADDITIONAL}
            isUploading={uploadingCategory === 'ADDITIONAL'}
            uploadError={categoryErrors.ADDITIONAL}
            uploadSuccess={categorySuccess.ADDITIONAL}
            colors={colors}
            onPickCamera={() => pickFromCamera('ADDITIONAL')}
            onPickGallery={() => pickFromGallery('ADDITIONAL')}
            onRemovePending={(idx) => removePendingFile('ADDITIONAL', idx)}
            onUploadPending={() => uploadCategoryFiles('ADDITIONAL')}
            onViewUploaded={(att) => setViewingAttachment(att)}
            onDeleteUploaded={(att) => deleteAttachment(att)}
          />
        </Section>

        <View style={{ height: Spacing.five }} />
      </ScrollView>

      {/* ── Fullscreen Image Modal ───────────── */}
      <ImageViewerModal
        visible={viewingAttachment !== null}
        attachment={viewingAttachment}
        onClose={() => setViewingAttachment(null)}
        onDelete={(att) => {
          setViewingAttachment(null);
          deleteAttachment(att);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.two },
  centerText: { fontSize: 15 },
  scroll: { padding: Spacing.three, gap: Spacing.four },

  // Title card
  titleCard: { borderRadius: 14, padding: Spacing.three, gap: Spacing.two },
  titleTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleName: { fontSize: 22, fontWeight: '800', lineHeight: 28 },
  titleDate: { fontSize: 13, marginTop: 2 },
  shortId: { fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
  legalBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  legalBadgeText: { fontSize: 13, fontWeight: '600' },

  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#1a56db',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteDeclBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteDeclText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },

  // Declaration box
  declBox:  { borderRadius: 10, padding: Spacing.three, gap: 4 },
  declStatus: { fontSize: 14, fontWeight: '700' },
  declText: { fontSize: 13, lineHeight: 19 },

  // Shop box
  shopBox: { borderRadius: 10, padding: Spacing.three, gap: 6 },
  shopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shopLabel: { fontSize: 13 },
  shopValue: { fontSize: 14, fontWeight: '600' },
  shopNotice: { fontSize: 11, fontStyle: 'italic', marginTop: 4 },

  // No attachments
  noAttachmentsBox: {
    borderRadius: 10,
    padding: Spacing.three,
    alignItems: 'center',
  },
  noAttachmentsText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Error
  errorText:   { color: '#dc2626', fontSize: 15, textAlign: 'center' },
  backBtn:     { borderRadius: 8, borderWidth: 1, borderColor: '#1a56db', paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { color: '#1a56db', fontWeight: '600' },
});
