import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { PhotoUploader } from '../components/PhotoUploader';
import { declarationService } from '../services/declaration.service';
import { uploadService } from '../services/upload.service';

export const CreateDeclaration = () => {
  const navigate = useNavigate();

  // ── Form State ─────────────────────────────────────────────
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [postcode, setPostcode] = useState('');
  const [cashPurchasePageNo, setCashPurchasePageNo] = useState('');

  const [bicycleMake, setBicycleMake] = useState('');
  const [bicycleModel, setBicycleModel] = useState('');
  const [cyclePrice, setCyclePrice] = useState('');
  const [bicycleColour, setBicycleColour] = useState('');
  const [frameNumber, setFrameNumber] = useState('');
  const [distinguishingMarkings, setDistinguishingMarkings] = useState('');
  const [bicycleSource, setBicycleSource] = useState('');
  const [ownershipDuration, setOwnershipDuration] = useState('');
  const [bicycleFault, setBicycleFault] = useState('');
  const [legalOwnerConfirmed, setLegalOwnerConfirmed] = useState(false);

  // ── 4 Photo Categories State ──────────────────────────────
  const [idPhotos, setIdPhotos] = useState([]);
  const [customerPhotos, setCustomerPhotos] = useState([]);
  const [bicyclePhotos, setBicyclePhotos] = useState([]);
  const [additionalPhotos, setAdditionalPhotos] = useState([]);

  // ── Progress & Error State ────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── Validation: Customer Name & Bicycle Model ───────────
    if (!customerName.trim()) {
      setErrorMessage('Customer Name is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!bicycleModel.trim()) {
      setErrorMessage('Bicycle Model is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    setSubmitStep('Saving declaration...');

    try {
      // 1) Save Declaration data
      const inputData = {
        customerName: customerName.trim(),
        bicycleModel: bicycleModel.trim(),
        date: date || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        mobile: mobile.trim() || undefined,
        email: email.trim() || undefined,
        postcode: postcode.trim().toUpperCase() || undefined,
        cashPurchasePageNo: cashPurchasePageNo.trim() || undefined,
        bicycleMake: bicycleMake.trim() || undefined,
        bicycleColour: bicycleColour.trim() || undefined,
        frameNumber: frameNumber.trim() || undefined,
        distinguishingMarkings: distinguishingMarkings.trim() || undefined,
        bicycleSource: bicycleSource.trim() || undefined,
        ownershipDuration: ownershipDuration.trim() || undefined,
        bicycleCost: cyclePrice.trim() || undefined,
        cyclePrice: cyclePrice.trim() || undefined,
        bicycleFault: bicycleFault.trim() || undefined,
        legalOwnerConfirmed,
      };

      const created = await declarationService.create(inputData);
      const declarationId = created._id;

      // 2) Upload ID Photos if attached
      if (idPhotos.length > 0) {
        setSubmitStep('Uploading ID Photo...');
        try {
          const files = idPhotos.map((item) => item.file);
          await uploadService.uploadAttachments(declarationId, 'ID', files);
        } catch (uploadErr) {
          console.warn('ID upload warning:', uploadErr.message);
        }
      }

      // 3) Upload Customer Photos if attached
      if (customerPhotos.length > 0) {
        setSubmitStep('Uploading Customer Photo...');
        try {
          const files = customerPhotos.map((item) => item.file);
          await uploadService.uploadAttachments(declarationId, 'CUSTOMER', files);
        } catch (uploadErr) {
          console.warn('Customer photo upload warning:', uploadErr.message);
        }
      }

      // 4) Upload Bicycle Photos if attached
      if (bicyclePhotos.length > 0) {
        setSubmitStep('Uploading Bicycle Photos...');
        try {
          const files = bicyclePhotos.map((item) => item.file);
          await uploadService.uploadAttachments(declarationId, 'BICYCLE', files);
        } catch (uploadErr) {
          console.warn('Bicycle photos upload warning:', uploadErr.message);
        }
      }

      // 5) Upload Additional Photos / Documents if attached
      if (additionalPhotos.length > 0) {
        setSubmitStep('Uploading Other Documents...');
        try {
          const files = additionalPhotos.map((item) => item.file);
          await uploadService.uploadAttachments(declarationId, 'ADDITIONAL', files);
        } catch (uploadErr) {
          console.warn('Additional photos upload warning:', uploadErr.message);
        }
      }

      // Redirect to full declaration view
      navigate(`/declarations/${declarationId}`);
    } catch (err) {
      setErrorMessage(err.message || 'Could not save the declaration. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
      setSubmitStep('');
    }
  };

  return (
    <MobileLayout title="New Declaration" showBack>
      <form onSubmit={handleSubmit} style={styles.formContainer}>
        {errorMessage && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ── Section 1: Customer Information ─────────────── */}
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionIcon}>👤</span>
            <h2 style={styles.sectionTitle}>Section 1 — Customer Information</h2>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Customer Name <span style={styles.star}>*</span>
            </label>
            <input
              type="text"
              style={styles.input}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. John Smith"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Phone Number</label>
            <input
              type="tel"
              style={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 07123456789"
            />
          </div>

          {/* 1) ID Photo Picker */}
          <PhotoUploader
            title="Customer ID Picture"
            subtitle="Capture or upload driving licence, passport, or national ID."
            takeBtnText="Take ID Photo"
            chooseBtnText="Choose from Gallery"
            single={true}
            cameraFacing="environment"
            files={idPhotos}
            onChange={setIdPhotos}
          />

          {/* 2) Customer Photo Picker */}
          <PhotoUploader
            title="Customer Picture"
            subtitle="Capture customer photograph at the time of transaction."
            takeBtnText="Take Customer Photo"
            chooseBtnText="Choose from Gallery"
            single={true}
            cameraFacing="environment"
            files={customerPhotos}
            onChange={setCustomerPhotos}
          />

          <div style={styles.field}>
            <label style={styles.label}>Date</label>
            <input
              type="date"
              style={styles.input}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Address</label>
            <textarea
              style={styles.textarea}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address..."
              rows={2}
            />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Mobile</label>
              <input
                type="tel"
                style={styles.input}
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Mobile number"
              />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Postcode</label>
              <input
                type="text"
                style={styles.input}
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="e.g. NW1 7AA"
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Cash Purchase Page No.</label>
            <input
              type="text"
              style={styles.input}
              value={cashPurchasePageNo}
              onChange={(e) => setCashPurchasePageNo(e.target.value)}
              placeholder="For shop use only"
            />
          </div>
        </div>

        {/* ── Section 2: Bicycle Information ──────────────── */}
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionIcon}>🚲</span>
            <h2 style={styles.sectionTitle}>Section 2 — Bicycle Information</h2>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Cycle Make</label>
            <input
              type="text"
              style={styles.input}
              value={bicycleMake}
              onChange={(e) => setBicycleMake(e.target.value)}
              placeholder="e.g. Trek, Specialized, Giant, Brompton"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Bicycle Model <span style={styles.star}>*</span>
            </label>
            <input
              type="text"
              style={styles.input}
              value={bicycleModel}
              onChange={(e) => setBicycleModel(e.target.value)}
              placeholder="e.g. FX3 Disc, Sirrus, Allez"
              required
            />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Cycle Price (£)</label>
              <input
                type="text"
                style={styles.input}
                value={cyclePrice}
                onChange={(e) => setCyclePrice(e.target.value)}
                placeholder="e.g. 350.00"
              />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Colour</label>
              <input
                type="text"
                style={styles.input}
                value={bicycleColour}
                onChange={(e) => setBicycleColour(e.target.value)}
                placeholder="e.g. Matte Black"
              />
            </div>
          </div>

          {/* 3) Bicycle Photos Picker */}
          <PhotoUploader
            title="Bicycle Pictures"
            subtitle="Attach photos of the complete bicycle, frame number, serial, or markings."
            takeBtnText="Take Bicycle Photo"
            chooseBtnText="Choose from Gallery"
            single={false}
            cameraFacing="environment"
            files={bicyclePhotos}
            onChange={setBicyclePhotos}
          />

          <div style={styles.field}>
            <label style={styles.label}>Frame Number</label>
            <input
              type="text"
              style={styles.input}
              value={frameNumber}
              onChange={(e) => setFrameNumber(e.target.value)}
              placeholder="e.g. WTU12345678A"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Distinguishing Markings</label>
            <textarea
              style={styles.textarea}
              value={distinguishingMarkings}
              onChange={(e) => setDistinguishingMarkings(e.target.value)}
              placeholder="Scratches, custom stickers, aftermarket pedals, saddle..."
              rows={2}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Where did you get the bicycle?</label>
            <textarea
              style={styles.textarea}
              value={bicycleSource}
              onChange={(e) => setBicycleSource(e.target.value)}
              placeholder="e.g. Bought second-hand from Gumtree / Evans Cycles"
              rows={2}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>How long have you had the bicycle?</label>
            <input
              type="text"
              style={styles.input}
              value={ownershipDuration}
              onChange={(e) => setOwnershipDuration(e.target.value)}
              placeholder="e.g. 2 years"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Any fault with the bike?</label>
            <textarea
              style={styles.textarea}
              value={bicycleFault}
              onChange={(e) => setBicycleFault(e.target.value)}
              placeholder="Gears slipping, brake pads worn, true wheel..."
              rows={2}
            />
          </div>
        </div>

        {/* ── Section 3: Other Document Pictures ──────────── */}
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionIcon}>📄</span>
            <h2 style={styles.sectionTitle}>Section 3 — Other Document Pictures</h2>
          </div>

          {/* 4) Additional Photos Picker */}
          <PhotoUploader
            title="Other Document Pictures"
            subtitle="Attach store invoices, cash purchase notes, or other ownership proof."
            takeBtnText="Add Additional Photo"
            chooseBtnText="Choose from Gallery"
            single={false}
            cameraFacing="environment"
            files={additionalPhotos}
            onChange={setAdditionalPhotos}
          />
        </div>

        {/* ── Section 4: Owner's Declaration ──────────────── */}
        <div style={styles.sectionCard}>
          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              style={styles.checkbox}
              checked={legalOwnerConfirmed}
              onChange={(e) => setLegalOwnerConfirmed(e.target.checked)}
            />
            <span style={styles.checkboxText}>
              I confirm that I am the legal owner of this bicycle and have the right to sell it.
              I declare the information provided above is true and accurate.
            </span>
          </label>
        </div>

        {/* ── Submit Action ───────────────────────────────── */}
        <div style={styles.submitWrapper}>
          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              opacity: isSubmitting ? 0.75 : 1,
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span style={styles.submittingContent}>
                <span style={styles.spinIcon}>⏳</span>
                <span>{submitStep || 'Saving Declaration...'}</span>
              </span>
            ) : (
              'Save Declaration'
            )}
          </button>
        </div>
      </form>
    </MobileLayout>
  );
};

const styles = {
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingBottom: '20px',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '12px 14px',
    color: '#b91c1c',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  errorIcon: {
    fontSize: '18px',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    padding: '18px 16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '10px',
  },
  sectionIcon: {
    fontSize: '18px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.2px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '14px',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
  },
  star: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    height: '46px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    padding: '0 14px',
    fontSize: '16px', // Prevents iOS Safari auto-zoom
    color: '#0f172a',
    boxSizing: 'border-box',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    padding: '12px 14px',
    fontSize: '16px',
    color: '#0f172a',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
  checkbox: {
    width: '22px',
    height: '22px',
    marginTop: '2px',
    accentColor: '#1a56db',
    flexShrink: 0,
    cursor: 'pointer',
  },
  checkboxText: {
    fontSize: '13px',
    lineHeight: '1.45',
    color: '#334155',
  },
  submitWrapper: {
    marginTop: '6px',
  },
  submitBtn: {
    width: '100%',
    height: '52px',
    borderRadius: '14px',
    backgroundColor: '#1a56db',
    color: '#ffffff',
    fontSize: '17px',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(26, 86, 219, 0.35)',
    touchAction: 'manipulation',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submittingContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  spinIcon: {
    fontSize: '18px',
  },
};
