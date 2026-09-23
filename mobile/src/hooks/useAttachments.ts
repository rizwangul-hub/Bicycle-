import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '@/context/AuthContext';
import uploadService, { LocalPickedFile } from '@/services/upload.service';
import type { Attachment, AttachmentCategory, GroupedAttachments } from '@/types';

export function useAttachments(declarationId: string) {
  const { token, logout } = useAuth();

  const [uploadedGrouped, setUploadedGrouped] = useState<GroupedAttachments>({
    BICYCLE: [],
    CUSTOMER: [],
    ID: [],
    ADDITIONAL: [],
  });
  const [totalAttachments, setTotalAttachments] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Pending files per category (chosen by user, not yet uploaded)
  const [pendingFiles, setPendingFiles] = useState<Record<AttachmentCategory, LocalPickedFile[]>>({
    BICYCLE: [],
    CUSTOMER: [],
    ID: [],
    ADDITIONAL: [],
  });

  // Upload state
  const [uploadingCategory, setUploadingCategory] = useState<AttachmentCategory | null>(null);
  const [categoryErrors, setCategoryErrors] = useState<Record<AttachmentCategory, string | null>>({
    BICYCLE: null,
    CUSTOMER: null,
    ID: null,
    ADDITIONAL: null,
  });
  const [categorySuccess, setCategorySuccess] = useState<Record<AttachmentCategory, string | null>>({
    BICYCLE: null,
    CUSTOMER: null,
    ID: null,
    ADDITIONAL: null,
  });

  // Handle auth expiration
  const handleAuthError = useCallback(
    (err: unknown) => {
      const e = err as { statusCode?: number; message?: string };
      if (e?.statusCode === 401 || e?.message?.includes('401') || e?.message?.includes('Unauthorized')) {
        logout();
        return true;
      }
      return false;
    },
    [logout]
  );

  // Fetch uploaded attachments
  const fetchAttachments = useCallback(async () => {
    if (!token || !declarationId) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await uploadService.getAttachments(declarationId, token);
      setUploadedGrouped(res.grouped || {
        BICYCLE: [],
        CUSTOMER: [],
        ID: [],
        ADDITIONAL: [],
      });
      setTotalAttachments(res.totalAttachments || 0);
    } catch (err) {
      if (!handleAuthError(err)) {
        const e = err as Error;
        setFetchError(e.message || 'Failed to load attachments.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [declarationId, token, handleAuthError]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  // Camera capture
  const pickFromCamera = useCallback(async (category: AttachmentCategory) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Camera access is needed to photograph the bicycle and customer documentation. Please enable camera access in your device settings.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        cameraType: ImagePicker.CameraType.back,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const picked: LocalPickedFile[] = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `camera_${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
          size: asset.fileSize,
        }));

        setPendingFiles((prev) => ({
          ...prev,
          [category]: [...prev[category], ...picked],
        }));

        // Reset previous errors/success on new pick
        setCategoryErrors((prev) => ({ ...prev, [category]: null }));
        setCategorySuccess((prev) => ({ ...prev, [category]: null }));
      }
    } catch {
      Alert.alert('Camera Error', 'Could not open camera. Please try again.');
    }
  }, []);

  // Gallery picker (multiple selection supported)
  const pickFromGallery = useCallback(async (category: AttachmentCategory) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo Library Permission Required',
          'Photo library access is needed to select evidence images. Please enable access in your device settings.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const picked: LocalPickedFile[] = result.assets.map((asset, idx) => ({
          uri: asset.uri,
          name: asset.fileName || `gallery_${Date.now()}_${idx}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
          size: asset.fileSize,
        }));

        setPendingFiles((prev) => ({
          ...prev,
          [category]: [...prev[category], ...picked],
        }));

        // Reset previous errors/success on new pick
        setCategoryErrors((prev) => ({ ...prev, [category]: null }));
        setCategorySuccess((prev) => ({ ...prev, [category]: null }));
      }
    } catch {
      Alert.alert('Gallery Error', 'Could not open photo library. Please try again.');
    }
  }, []);

  // Remove pending file before upload
  const removePendingFile = useCallback((category: AttachmentCategory, index: number) => {
    setPendingFiles((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  }, []);

  // Clear all pending files for a category
  const clearPendingCategory = useCallback((category: AttachmentCategory) => {
    setPendingFiles((prev) => ({
      ...prev,
      [category]: [],
    }));
  }, []);

  // Upload pending files for a category
  const uploadCategoryFiles = useCallback(
    async (category: AttachmentCategory) => {
      const filesToUpload = pendingFiles[category];
      if (!filesToUpload || filesToUpload.length === 0) {
        Alert.alert('No Photos Selected', 'Please take or select photos before uploading.');
        return;
      }
      if (!token) return;

      setUploadingCategory(category);
      setCategoryErrors((prev) => ({ ...prev, [category]: null }));
      setCategorySuccess((prev) => ({ ...prev, [category]: null }));

      try {
        const uploaded = await uploadService.uploadAttachments(
          declarationId,
          category,
          filesToUpload,
          token
        );

        // Success: clear pending, show success message, refresh
        setPendingFiles((prev) => ({ ...prev, [category]: [] }));
        setCategorySuccess((prev) => ({
          ...prev,
          [category]: `✓ ${uploaded.length} photo(s) uploaded successfully`,
        }));

        await fetchAttachments();
      } catch (err: unknown) {
        if (!handleAuthError(err)) {
          const e = err as Error;
          const msg = e.message || 'Upload failed. Please check your connection and retry.';
          setCategoryErrors((prev) => ({ ...prev, [category]: msg }));
          Alert.alert('Upload Failed', msg);
        }
      } finally {
        setUploadingCategory(null);
      }
    },
    [declarationId, pendingFiles, token, fetchAttachments, handleAuthError]
  );

  // Delete uploaded attachment with confirmation
  const deleteAttachment = useCallback(
    async (attachment: Attachment): Promise<boolean> => {
      if (!token) return false;

      return new Promise<boolean>((resolve) => {
        Alert.alert(
          'Delete Attachment',
          'Are you sure you want to permanently delete this photo?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await uploadService.deleteAttachment(attachment._id, token);
                  await fetchAttachments();
                  resolve(true);
                } catch (err: unknown) {
                  if (!handleAuthError(err)) {
                    const e = err as Error;
                    Alert.alert('Error', e.message || 'Could not delete attachment.');
                  }
                  resolve(false);
                }
              },
            },
          ]
        );
      });
    },
    [token, fetchAttachments, handleAuthError]
  );

  return {
    uploadedGrouped,
    totalAttachments,
    isLoading,
    fetchError,
    pendingFiles,
    uploadingCategory,
    categoryErrors,
    categorySuccess,
    pickFromCamera,
    pickFromGallery,
    removePendingFile,
    clearPendingCategory,
    uploadCategoryFiles,
    deleteAttachment,
    refreshAttachments: fetchAttachments,
  };
}
