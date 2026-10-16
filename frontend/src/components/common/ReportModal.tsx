import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { WarningCircle, CheckCircle } from '@phosphor-icons/react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'EXPERIENCE' | 'COMMENT' | 'COMPANY' | 'OPPORTUNITY';
  targetId: string;
  targetTitle?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('INACCURATE');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.reports.submit({
        target_type: targetType,
        target_id: targetId,
        reason,
        details,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDetails('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Report ${targetType.toLowerCase()}`}
      maxWidth="md"
    >
      {submitted ? (
        <div className="text-center py-6 space-y-3">
          <CheckCircle size={40} weight="fill" className="text-[#16a34a] mx-auto" />
          <h4 className="font-semibold text-base text-[#0a0a0a]">Report Submitted</h4>
          <p className="text-xs text-[#525252]">
            Thank you for helping keep InternScope trustworthy. Our moderation team will review this shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {targetTitle && (
            <div className="p-3 bg-[#f5f5f5] border border-[#e5e5e5] text-xs text-[#525252] rounded-[2px]">
              Flagging: <strong className="text-[#0a0a0a]">{targetTitle}</strong>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-[#991b1b] flex items-center gap-2">
              <WarningCircle size={16} weight="fill" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
              Reason for Reporting
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] focus:outline-none"
            >
              <option value="INACCURATE">Inaccurate or misleading information</option>
              <option value="EXPIRED_OR_CLOSED">Expired or closed internship</option>
              <option value="CONFIDENTIAL_DATA">Contains confidential workplace data or NDA violation</option>
              <option value="SPAM">Spam, harassment, or promotional content</option>
              <option value="OTHER">Other issue</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
              Additional Details (Optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="Provide specific context to assist moderators..."
              className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] focus:outline-none placeholder:text-[#a3a3a3]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f5f5f5]">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="blood" size="sm" isLoading={submitting}>
              Submit Report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
