import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Textarea from '../components/ui/Textarea';
import { feedbackService } from '../services/feedbackService';
import useDocumentTitle from '../hooks/useDocumentTitle';

const CATEGORIES = [
  ['BUG', 'Bug Report'],
  ['UX', 'UX'],
  ['FEATURE_REQUEST', 'Feature Request'],
  ['NFC_ATTENDANCE', 'NFC / Attendance'],
  ['OTHER', 'Other'],
];

export default function PublicFeedback() {
  useDocumentTitle('Public Feedback');
  const [category, setCategory] = useState('OTHER');
  const [rating, setRating] = useState(3);
  const [message, setMessage] = useState('');
  const [reproduction, setReproduction] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      await feedbackService.submitPublic({
        category,
        rating,
        message: message.trim(),
        page: window.location.pathname,
        reproduction: reproduction.trim() || null,
      });
      setMessage('');
      setReproduction('');
      setRating(3);
      setCategory('OTHER');
      setSuccess('Thanks — your feedback was submitted.');
    } catch (err) {
      setError(err.status === 429
        ? 'Too many public submissions from this connection. Please try again later.'
        : (err.message || 'Unable to submit feedback right now.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <PageContainer maxWidth="max-w-3xl">
        <PageHeader
          title="Public Feedback"
          description="Report a bug or share product feedback without signing in. Public submissions are rate-limited to reduce abuse."
        />
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} className="mb-5" />}
        {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-5" />}

        <Card className="p-5 sm:p-6">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={`min-h-[40px] rounded-lg border px-3 py-2 text-sm font-medium ${
                      category === value
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`min-h-[40px] min-w-[40px] rounded-lg border text-sm font-bold ${
                      rating === value
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-slate-700 text-slate-500'
                    }`}
                    aria-label={`Rating ${value} of 5`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              label="Feedback"
              rows={6}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              placeholder="What happened, or what would you like TapTrack to improve?"
            />

            <Textarea
              label="Steps to reproduce (optional)"
              rows={4}
              value={reproduction}
              onChange={(e) => setReproduction(e.target.value)}
              maxLength={2000}
              placeholder="For a bug: what did you do, what did you expect, and what happened?"
            />

            <Button type="submit" loading={loading} disabled={loading || !message.trim()} className="w-full sm:w-auto">
              Submit Public Feedback
            </Button>
          </form>
        </Card>
      </PageContainer>
      <Footer />
    </div>
  );
}
