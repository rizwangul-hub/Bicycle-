import { Modal, Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Attachment } from '@/types';

interface ImageViewerModalProps {
  visible: boolean;
  attachment: Attachment | null;
  onClose: () => void;
  onDelete: (attachment: Attachment) => void;
}

function formatBytes(bytes?: number) {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function ImageViewerModal({
  visible,
  attachment,
  onClose,
  onDelete,
}: ImageViewerModalProps) {
  if (!attachment) return null;

  const dateStr = formatDate(attachment.createdAt);
  const sizeStr = formatBytes(attachment.fileSize);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.backdrop}>
        {/* ── Top Bar ───────────────────────── */}
        <View style={styles.topBar}>
          <View style={styles.info}>
            <View style={styles.badgeRow}>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryText}>{attachment.category}</Text>
              </View>
              {attachment.fileType && (
                <View style={styles.typePill}>
                  <Text style={styles.typeText}>{attachment.fileType.toUpperCase()}</Text>
                </View>
              )}
            </View>
            <Text style={styles.fileName} numberOfLines={1}>
              {attachment.originalFileName}
            </Text>
            {(dateStr || sizeStr) && (
              <Text style={styles.metaText}>
                {[dateStr, sizeStr].filter(Boolean).join(' • ')}
              </Text>
            )}
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* ── Image Display ─────────────────── */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: attachment.storageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* ── Bottom Action Bar ─────────────── */}
        <View style={styles.bottomBar}>
          <Pressable
            style={styles.deleteBtn}
            onPress={() => {
              onClose();
              onDelete(attachment);
            }}
          >
            <Text style={styles.deleteBtnText}>🗑 Delete Attachment</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  info: {
    flex: 1,
    gap: 4,
    marginRight: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a56db',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  typePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  typeText: {
    color: '#e5e7eb',
    fontSize: 10,
    fontWeight: '600',
  },
  fileName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  metaText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
