import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ColorTheme, Spacing } from '@/constants/theme';
import type { Attachment, AttachmentCategory } from '@/types';
import type { LocalPickedFile } from '@/services/upload.service';

interface Props {
  category: AttachmentCategory;
  title: string;
  subtitle?: string;
  uploadedAttachments: Attachment[];
  pendingFiles: LocalPickedFile[];
  isUploading: boolean;
  uploadError: string | null;
  uploadSuccess: string | null;
  colors: ColorTheme;
  onPickCamera: () => void;
  onPickGallery: () => void;
  onRemovePending: (index: number) => void;
  onUploadPending: () => void;
  onViewUploaded: (attachment: Attachment) => void;
  onDeleteUploaded: (attachment: Attachment) => void;
}

export function AttachmentCategorySection({
  title,
  subtitle,
  uploadedAttachments,
  pendingFiles,
  isUploading,
  uploadError,
  uploadSuccess,
  colors,
  onPickCamera,
  onPickGallery,
  onRemovePending,
  onUploadPending,
  onViewUploaded,
  onDeleteUploaded,
}: Props) {
  const hasPending = pendingFiles.length > 0;
  const hasUploaded = uploadedAttachments.length > 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
      {/* ── Category Header ───────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {hasUploaded && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{uploadedAttachments.length} uploaded</Text>
            </View>
          )}
        </View>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>

      {/* ── Uploaded attachments list ─────── */}
      {hasUploaded && (
        <View style={styles.sectionBlock}>
          <Text style={[styles.blockLabel, { color: colors.textSecondary }]}>
            Uploaded Photos (Tap to open)
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbScroll}
          >
            {uploadedAttachments.map((att) => (
              <View key={att._id} style={styles.uploadedThumbWrap}>
                <Pressable
                  style={({ pressed }) => [
                    styles.thumbPressable,
                    { opacity: pressed ? 0.75 : 1 },
                  ]}
                  onPress={() => onViewUploaded(att)}
                >
                  <Image source={{ uri: att.storageUrl }} style={styles.thumbImage} />
                </Pressable>
                <Pressable
                  style={styles.deleteThumbBtn}
                  onPress={() => onDeleteUploaded(att)}
                  hitSlop={8}
                >
                  <Text style={styles.deleteThumbText}>✕</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Pending photos preview ────────── */}
      {hasPending && (
        <View style={styles.sectionBlock}>
          <View style={styles.pendingHeaderRow}>
            <Text style={[styles.blockLabel, { color: '#d97706' }]}>
              Pending Upload ({pendingFiles.length} photo{pendingFiles.length !== 1 ? 's' : ''})
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbScroll}
          >
            {pendingFiles.map((file, idx) => (
              <View key={`${file.uri}_${idx}`} style={styles.pendingThumbWrap}>
                <Image source={{ uri: file.uri }} style={styles.pendingThumbImage} />
                <Pressable
                  style={styles.removePendingBtn}
                  onPress={() => onRemovePending(idx)}
                  hitSlop={8}
                  disabled={isUploading}
                >
                  <Text style={styles.removePendingText}>✕</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>

          {/* Upload Button */}
          <Pressable
            style={({ pressed }) => [
              styles.uploadBtn,
              { opacity: pressed || isUploading ? 0.75 : 1 },
            ]}
            onPress={onUploadPending}
            disabled={isUploading}
          >
            {isUploading ? (
              <View style={styles.uploadingRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.uploadBtnText}>Uploading...</Text>
              </View>
            ) : (
              <Text style={styles.uploadBtnText}>
                Upload {pendingFiles.length} {title}
              </Text>
            )}
          </Pressable>
        </View>
      )}

      {/* ── Action buttons (Take Photo / Gallery) ── */}
      <View style={styles.btnRow}>
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            styles.cameraBtn,
            { opacity: pressed || isUploading ? 0.75 : 1 },
          ]}
          onPress={onPickCamera}
          disabled={isUploading}
        >
          <Text style={styles.actionBtnIcon}>📷</Text>
          <Text style={styles.cameraBtnText}>Take Photo</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            styles.galleryBtn,
            { opacity: pressed || isUploading ? 0.75 : 1 },
          ]}
          onPress={onPickGallery}
          disabled={isUploading}
        >
          <Text style={styles.actionBtnIcon}>🖼</Text>
          <Text style={styles.galleryBtnText}>From Gallery</Text>
        </Pressable>
      </View>

      {/* ── Status Feedback (Success / Error) ── */}
      {uploadSuccess ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{uploadSuccess}</Text>
        </View>
      ) : null}

      {uploadError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{uploadError}</Text>
          <Pressable
            style={styles.retryBtn}
            onPress={onUploadPending}
            disabled={isUploading || !hasPending}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    gap: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionBlock: {
    gap: 8,
  },
  blockLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pendingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thumbScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  uploadedThumbWrap: {
    position: 'relative',
  },
  thumbPressable: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  thumbImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  deleteThumbBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#dc2626',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteThumbText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  pendingThumbWrap: {
    position: 'relative',
  },
  pendingThumbImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d97706',
    backgroundColor: '#fef3c7',
  },
  removePendingBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#374151',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePendingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  uploadBtn: {
    backgroundColor: '#1a56db',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  cameraBtn: {
    backgroundColor: '#1a56db',
  },
  cameraBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  galleryBtn: {
    backgroundColor: 'rgba(26, 86, 219, 0.12)',
    borderWidth: 1,
    borderColor: '#1a56db',
  },
  galleryBtnText: {
    color: '#1a56db',
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtnIcon: {
    fontSize: 16,
  },
  successBanner: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  successText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 13,
    flex: 1,
  },
  retryBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
